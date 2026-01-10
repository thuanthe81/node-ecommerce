/**
 * Build Incremental Cache
 *
 * Implements incremental build caching that caches compiled components and dependencies,
 * tracks dependency changes for cache invalidation, and manages build artifact versioning.
 */

import { promises as fs } from 'fs';
import { join, relative, resolve } from 'path';
import { createHash } from 'crypto';
import { getBuildCacheManager, BuildCacheManager } from './build-cache-manager';

export interface IncrementalCacheConfig {
  enabled: boolean;
  cacheDirectory: string;
  dependencyTrackingEnabled: boolean;
  artifactVersioning: boolean;
  maxArtifactVersions: number;
  excludePatterns: string[];
  includePatterns: string[];
  hashAlgorithm: 'md5' | 'sha1' | 'sha256';
}

export interface BuildArtifact {
  id: string;
  type: 'component' | 'page' | 'dependency' | 'asset';
  path: string;
  hash: string;
  dependencies: string[];
  timestamp: number;
  version: number;
  size: number;
  metadata: Record<string, any>;
}

export interface DependencyGraph {
  [filePath: string]: {
    hash: string;
    dependencies: string[];
    dependents: string[];
    lastModified: number;
  };
}

export interface BuildManifest {
  version: string;
  timestamp: number;
  artifacts: Record<string, BuildArtifact>;
  dependencyGraph: DependencyGraph;
  buildId: string;
  environment: string;
}

export interface IncrementalBuildResult {
  needsRebuild: boolean;
  changedFiles: string[];
  affectedArtifacts: string[];
  cacheHits: number;
  cacheMisses: number;
}

export class BuildIncrementalCache {
  private cacheManager: BuildCacheManager;
  private config: IncrementalCacheConfig;
  private manifest: BuildManifest;
  private projectRoot: string;

  constructor(config: Partial<IncrementalCacheConfig> = {}) {
    this.cacheManager = getBuildCacheManager();
    this.projectRoot = process.cwd();

    this.config = {
      enabled: true,
      cacheDirectory: join(this.projectRoot, '.next', 'incremental-cache'),
      dependencyTrackingEnabled: true,
      artifactVersioning: true,
      maxArtifactVersions: 5,
      excludePatterns: [
        'node_modules/**',
        '.next/**',
        '.git/**',
        '**/*.log',
        '**/coverage/**',
        '**/dist/**',
      ],
      includePatterns: [
        'app/**/*.{ts,tsx,js,jsx}',
        'components/**/*.{ts,tsx,js,jsx}',
        'lib/**/*.{ts,tsx,js,jsx}',
        'pages/**/*.{ts,tsx,js,jsx}',
        'styles/**/*.{css,scss,sass}',
        'public/**/*',
      ],
      hashAlgorithm: 'sha256',
      ...config,
    };

    this.manifest = this.createEmptyManifest();
    this.ensureCacheDirectory();
  }

  /**
   * Initialize incremental cache
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[INCREMENTAL CACHE] Incremental caching disabled');
      return;
    }

    console.log('[INCREMENTAL CACHE] Initializing incremental build cache');

    try {
      // Load existing manifest
      await this.loadManifest();

      // Update dependency graph
      if (this.config.dependencyTrackingEnabled) {
        await this.updateDependencyGraph();
      }

      console.log('[INCREMENTAL CACHE] Incremental cache initialized successfully');
    } catch (error) {
      console.warn('[INCREMENTAL CACHE] Failed to initialize:', error);
      this.manifest = this.createEmptyManifest();
    }
  }

  /**
   * Check if files need rebuilding based on changes
   */
  async checkForChanges(): Promise<IncrementalBuildResult> {
    if (!this.config.enabled) {
      return {
        needsRebuild: true,
        changedFiles: [],
        affectedArtifacts: [],
        cacheHits: 0,
        cacheMisses: 0,
      };
    }

    console.log('[INCREMENTAL CACHE] Checking for file changes');

    const changedFiles: string[] = [];
    const affectedArtifacts: string[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    try {
      // Get all tracked files
      const trackedFiles = Object.keys(this.manifest.dependencyGraph);

      for (const filePath of trackedFiles) {
        const currentHash = await this.calculateFileHash(filePath);
        const cachedInfo = this.manifest.dependencyGraph[filePath];

        if (!cachedInfo || cachedInfo.hash !== currentHash) {
          changedFiles.push(filePath);
          cacheMisses++;

          // Find affected artifacts
          const affected = await this.findAffectedArtifacts(filePath);
          affectedArtifacts.push(...affected);
        } else {
          cacheHits++;
        }
      }

      // Check for new files
      const currentFiles = await this.scanProjectFiles();
      const newFiles = currentFiles.filter(file => !trackedFiles.includes(file));

      if (newFiles.length > 0) {
        changedFiles.push(...newFiles);
        cacheMisses += newFiles.length;
      }

      const needsRebuild = changedFiles.length > 0;

      console.log(`[INCREMENTAL CACHE] Change detection complete: ${changedFiles.length} changed files, ${affectedArtifacts.length} affected artifacts`);

      return {
        needsRebuild,
        changedFiles: Array.from(new Set(changedFiles)),
        affectedArtifacts: Array.from(new Set(affectedArtifacts)),
        cacheHits,
        cacheMisses,
      };

    } catch (error) {
      console.error('[INCREMENTAL CACHE] Error checking for changes:', error);
      return {
        needsRebuild: true,
        changedFiles: [],
        affectedArtifacts: [],
        cacheHits: 0,
        cacheMisses: 0,
      };
    }
  }

  /**
   * Cache build artifact
   */
  async cacheArtifact(artifact: Omit<BuildArtifact, 'id' | 'timestamp' | 'version'>): Promise<string> {
    if (!this.config.enabled) {
      return '';
    }

    const artifactId = this.generateArtifactId(artifact.path, artifact.type);
    const existingArtifact = this.manifest.artifacts[artifactId];

    const fullArtifact: BuildArtifact = {
      ...artifact,
      id: artifactId,
      timestamp: Date.now(),
      version: existingArtifact ? existingArtifact.version + 1 : 1,
    };

    // Store artifact in cache
    const cacheKey = `artifact_${artifactId}_v${fullArtifact.version}`;
    await this.cacheManager.set(cacheKey, fullArtifact, 86400); // 24 hours TTL

    // Update manifest
    this.manifest.artifacts[artifactId] = fullArtifact;

    // Clean up old versions if versioning is enabled
    if (this.config.artifactVersioning) {
      await this.cleanupOldVersions(artifactId, fullArtifact.version);
    }

    console.log(`[INCREMENTAL CACHE] Cached artifact: ${artifact.path} (v${fullArtifact.version})`);
    return artifactId;
  }

  /**
   * Get cached artifact
   */
  async getCachedArtifact(artifactId: string, version?: number): Promise<BuildArtifact | null> {
    if (!this.config.enabled) {
      return null;
    }

    const artifact = this.manifest.artifacts[artifactId];
    if (!artifact) {
      return null;
    }

    const targetVersion = version || artifact.version;
    const cacheKey = `artifact_${artifactId}_v${targetVersion}`;

    try {
      return await this.cacheManager.get<BuildArtifact>(cacheKey);
    } catch (error) {
      console.warn(`[INCREMENTAL CACHE] Failed to get cached artifact ${artifactId}:`, error);
      return null;
    }
  }

  /**
   * Invalidate artifacts by pattern
   */
  async invalidateArtifacts(pattern: string | RegExp): Promise<void> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const invalidatedIds: string[] = [];

    for (const [artifactId, artifact] of Object.entries(this.manifest.artifacts)) {
      if (regex.test(artifact.path)) {
        delete this.manifest.artifacts[artifactId];
        invalidatedIds.push(artifactId);
      }
    }

    // Remove from cache
    await this.cacheManager.invalidate(new RegExp(`artifact_(${invalidatedIds.join('|')})_`));

    console.log(`[INCREMENTAL CACHE] Invalidated ${invalidatedIds.length} artifacts matching pattern: ${pattern}`);
  }

  /**
   * Update dependency tracking for a file
   */
  async updateDependencyTracking(filePath: string, dependencies: string[] = []): Promise<void> {
    if (!this.config.dependencyTrackingEnabled) {
      return;
    }

    const relativePath = relative(this.projectRoot, filePath);
    const hash = await this.calculateFileHash(filePath);
    const stats = await fs.stat(filePath);

    // Update dependency graph
    const existingEntry = this.manifest.dependencyGraph[relativePath];

    this.manifest.dependencyGraph[relativePath] = {
      hash,
      dependencies: dependencies.map(dep => relative(this.projectRoot, dep)),
      dependents: existingEntry?.dependents || [],
      lastModified: stats.mtime.getTime(),
    };

    // Update reverse dependencies (dependents)
    for (const dep of dependencies) {
      const depPath = relative(this.projectRoot, dep);
      if (this.manifest.dependencyGraph[depPath]) {
        const dependents = this.manifest.dependencyGraph[depPath].dependents;
        if (!dependents.includes(relativePath)) {
          dependents.push(relativePath);
        }
      }
    }
  }

  /**
   * Save manifest to disk
   */
  async saveManifest(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const manifestPath = join(this.config.cacheDirectory, 'build-manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(this.manifest, null, 2), 'utf8');
      console.log('[INCREMENTAL CACHE] Build manifest saved');
    } catch (error) {
      console.error('[INCREMENTAL CACHE] Failed to save manifest:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    artifactCount: number;
    trackedFiles: number;
    cacheSize: number;
    oldestArtifact: Date | null;
    newestArtifact: Date | null;
  } {
    const artifacts = Object.values(this.manifest.artifacts);
    const timestamps = artifacts.map(a => a.timestamp);

    return {
      artifactCount: artifacts.length,
      trackedFiles: Object.keys(this.manifest.dependencyGraph).length,
      cacheSize: artifacts.reduce((sum, a) => sum + a.size, 0),
      oldestArtifact: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
      newestArtifact: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null,
    };
  }

  /**
   * Clear incremental cache
   */
  async clearCache(): Promise<void> {
    this.manifest = this.createEmptyManifest();
    await this.cacheManager.clear();

    try {
      const manifestPath = join(this.config.cacheDirectory, 'build-manifest.json');
      await fs.unlink(manifestPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }

    console.log('[INCREMENTAL CACHE] Incremental cache cleared');
  }

  /**
   * Load manifest from disk
   */
  private async loadManifest(): Promise<void> {
    try {
      const manifestPath = join(this.config.cacheDirectory, 'build-manifest.json');
      const content = await fs.readFile(manifestPath, 'utf8');
      this.manifest = JSON.parse(content);
      console.log('[INCREMENTAL CACHE] Loaded existing build manifest');
    } catch (error) {
      console.log('[INCREMENTAL CACHE] No existing manifest found, creating new one');
      this.manifest = this.createEmptyManifest();
    }
  }

  /**
   * Create empty manifest
   */
  private createEmptyManifest(): BuildManifest {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      artifacts: {},
      dependencyGraph: {},
      buildId: this.generateBuildId(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Update dependency graph by scanning files
   */
  private async updateDependencyGraph(): Promise<void> {
    console.log('[INCREMENTAL CACHE] Updating dependency graph');

    const files = await this.scanProjectFiles();

    for (const filePath of files) {
      try {
        const hash = await this.calculateFileHash(filePath);
        const stats = await fs.stat(filePath);
        const relativePath = relative(this.projectRoot, filePath);

        if (!this.manifest.dependencyGraph[relativePath] ||
            this.manifest.dependencyGraph[relativePath].hash !== hash) {

          // Parse dependencies (simplified - in real implementation, use AST parsing)
          const dependencies = await this.extractDependencies(filePath);

          this.manifest.dependencyGraph[relativePath] = {
            hash,
            dependencies,
            dependents: this.manifest.dependencyGraph[relativePath]?.dependents || [],
            lastModified: stats.mtime.getTime(),
          };
        }
      } catch (error) {
        console.warn(`[INCREMENTAL CACHE] Failed to process ${filePath}:`, error);
      }
    }
  }

  /**
   * Scan project files based on include/exclude patterns
   */
  private async scanProjectFiles(): Promise<string[]> {
    const files: string[] = [];

    // This is a simplified implementation
    // In a real implementation, use a proper glob library like 'fast-glob'
    const scanDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          const relativePath = relative(this.projectRoot, fullPath);

          // Check exclude patterns
          if (this.config.excludePatterns.some(pattern =>
            relativePath.match(new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))))) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile()) {
            // Check include patterns
            if (this.config.includePatterns.some(pattern =>
              relativePath.match(new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))))) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore directories we can't read
      }
    };

    await scanDir(this.projectRoot);
    return files;
  }

  /**
   * Calculate file hash
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return createHash(this.config.hashAlgorithm).update(content).digest('hex');
    } catch (error) {
      return '';
    }
  }

  /**
   * Extract dependencies from file (simplified implementation)
   */
  private async extractDependencies(filePath: string): Promise<string[]> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const dependencies: string[] = [];

      // Simple regex-based dependency extraction
      // In a real implementation, use proper AST parsing
      const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
      const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const dep = match[1];
        if (dep.startsWith('.')) {
          // Resolve relative imports
          const resolvedPath = resolve(join(filePath, '..', dep));
          dependencies.push(relative(this.projectRoot, resolvedPath));
        }
      }

      while ((match = requireRegex.exec(content)) !== null) {
        const dep = match[1];
        if (dep.startsWith('.')) {
          const resolvedPath = resolve(join(filePath, '..', dep));
          dependencies.push(relative(this.projectRoot, resolvedPath));
        }
      }

      return dependencies;
    } catch (error) {
      return [];
    }
  }

  /**
   * Find artifacts affected by file change
   */
  private async findAffectedArtifacts(filePath: string): Promise<string[]> {
    const affected: string[] = [];
    const visited = new Set<string>();

    const findDependents = (path: string): void => {
      if (visited.has(path)) return;
      visited.add(path);

      const entry = this.manifest.dependencyGraph[path];
      if (entry) {
        for (const dependent of entry.dependents) {
          affected.push(dependent);
          findDependents(dependent);
        }
      }
    };

    findDependents(relative(this.projectRoot, filePath));
    return affected;
  }

  /**
   * Generate artifact ID
   */
  private generateArtifactId(path: string, type: string): string {
    const relativePath = relative(this.projectRoot, path);
    return createHash('md5').update(`${type}:${relativePath}`).digest('hex');
  }

  /**
   * Generate build ID
   */
  private generateBuildId(): string {
    return createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex');
  }

  /**
   * Clean up old artifact versions
   */
  private async cleanupOldVersions(artifactId: string, currentVersion: number): Promise<void> {
    if (currentVersion <= this.config.maxArtifactVersions) {
      return;
    }

    const versionsToDelete = [];
    for (let v = 1; v <= currentVersion - this.config.maxArtifactVersions; v++) {
      versionsToDelete.push(v);
    }

    for (const version of versionsToDelete) {
      const cacheKey = `artifact_${artifactId}_v${version}`;
      await this.cacheManager.invalidate(new RegExp(`^${cacheKey}$`));
    }

    console.log(`[INCREMENTAL CACHE] Cleaned up ${versionsToDelete.length} old versions for artifact ${artifactId}`);
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.cacheDirectory, { recursive: true });
    } catch (error) {
      console.warn('[INCREMENTAL CACHE] Failed to create cache directory:', error);
    }
  }
}

/**
 * Create singleton incremental cache instance
 */
let incrementalCache: BuildIncrementalCache | null = null;

export function createIncrementalCache(config?: Partial<IncrementalCacheConfig>): BuildIncrementalCache {
  if (!incrementalCache) {
    incrementalCache = new BuildIncrementalCache(config);
  }
  return incrementalCache;
}

/**
 * Get singleton incremental cache instance
 */
export function getIncrementalCache(): BuildIncrementalCache {
  if (!incrementalCache) {
    incrementalCache = new BuildIncrementalCache();
  }
  return incrementalCache;
}

/**
 * Default incremental cache configuration
 */
export function getDefaultIncrementalCacheConfig(): IncrementalCacheConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    enabled: !isDevelopment, // Disable in development for faster iteration
    cacheDirectory: join(process.cwd(), '.next', 'incremental-cache'),
    dependencyTrackingEnabled: true,
    artifactVersioning: true,
    maxArtifactVersions: isDevelopment ? 2 : 5,
    excludePatterns: [
      'node_modules/**',
      '.next/**',
      '.git/**',
      '**/*.log',
      '**/coverage/**',
      '**/dist/**',
      '**/.DS_Store',
    ],
    includePatterns: [
      'app/**/*.{ts,tsx,js,jsx}',
      'components/**/*.{ts,tsx,js,jsx}',
      'lib/**/*.{ts,tsx,js,jsx}',
      'pages/**/*.{ts,tsx,js,jsx}',
      'styles/**/*.{css,scss,sass}',
      'public/**/*',
      'locales/**/*.json',
    ],
    hashAlgorithm: 'sha256',
  };
}