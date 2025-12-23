import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ICSSInjector, CSSInjectorConfig, CSSLoadError, CSSValidationError } from '../interfaces/css-injector.interface';
import { MODERN_EMAIL_STYLES, MODERN_BUTTON_STYLES, STATUS_BADGE_STYLES, DARK_MODE_COLORS, ACCESSIBILITY_STANDARDS } from './email-design-tokens';

/**
 * CSS Injector Service
 *
 * Handles loading CSS design files, preprocessing with design tokens, and injecting into templates.
 * Supports caching, hot-reloading in development, and fallback to default styles.
 *
 * Requirements: 1.3, 1.6, 4.1, 4.2, 7.2, 8.2, 8.3, 8.5, 8.6
 */
@Injectable()
export class CSSInjectorService implements ICSSInjector, OnModuleDestroy {
  private readonly logger = new Logger(CSSInjectorService.name);

  private readonly cssCache = new Map<string, string>();
  private readonly config: CSSInjectorConfig;
  private fileWatchers: Map<string, any> = new Map();

  constructor(
    @Inject('CSSInjectorConfig') config: Partial<CSSInjectorConfig> = {}
  ) {
    this.config = {
      stylesPath: 'src/notifications/styles',
      isDevelopment: process.env.NODE_ENV === 'development',
      minifyCSS: process.env.NODE_ENV === 'production',
      includeFallbacks: true,
      defaultCSS: this.getDefaultCSS(),
      ...config
    };

    this.logger.log(`CSS Injector initialized with styles path: ${this.config.stylesPath}`);

    if (this.config.isDevelopment) {
      this.logger.log('Development mode enabled - CSS hot reloading available');
    }
  }

  /**
   * Clean up file watchers on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    for (const [filePath, watcher] of this.fileWatchers) {
      try {
        if (watcher && typeof watcher.close === 'function') {
          await watcher.close();
        }
      } catch (error) {
        this.logger.warn(`Failed to close file watcher for ${filePath}: ${error.message}`);
      }
    }
    this.fileWatchers.clear();
  }

  /**
   * Load CSS file and inject it into the provided template
   * @param templateName - Name of the template (used to find corresponding CSS file)
   * @param template - HTML template content
   * @returns Template with injected CSS
   */
  async loadAndInjectCSS(templateName: string, template: string): Promise<string> {
    try {
      // Convert template name to CSS file name
      const cssFileName = this.templateNameToCSSFileName(templateName);

      // Load CSS content
      const cssContent = await this.loadCSSFile(cssFileName);

      // Inject CSS into template
      return this.injectCSSIntoTemplate(template, cssContent);
    } catch (error) {
      if (error instanceof CSSLoadError && this.config.includeFallbacks) {
        this.logger.warn(`CSS file not found for template '${templateName}', using default styles: ${error.message}`);
        return this.injectCSSIntoTemplate(template, this.config.defaultCSS || '');
      }
      throw error;
    }
  }

  /**
   * Load a CSS file from the file system
   * @param cssFileName - Name of the CSS file to load
   * @returns CSS content as string
   */
  async loadCSSFile(cssFileName: string): Promise<string> {
    // Check cache first
    if (this.cssCache.has(cssFileName)) {
      this.logger.debug(`CSS file '${cssFileName}' loaded from cache`);
      return this.cssCache.get(cssFileName)!;
    }

    const filePath = this.getCSSFilePath(cssFileName);

    try {
      // Check if file exists
      if (!this.cssFileExists(cssFileName)) {
        throw new CSSLoadError(cssFileName, filePath, new Error('File does not exist'));
      }

      // Read file content
      const cssContent = await fs.readFile(filePath, 'utf-8');

      // Validate CSS content
      this.validateCSSContent(cssFileName, cssContent);

      // Cache the content
      this.cssCache.set(cssFileName, cssContent);

      // Set up file watcher in development mode
      if (this.config.isDevelopment) {
        this.setupFileWatcher(cssFileName, filePath);
      }

      this.logger.debug(`CSS file '${cssFileName}' loaded successfully`);
      return cssContent;
    } catch (error) {
      if (error instanceof CSSLoadError || error instanceof CSSValidationError) {
        throw error;
      }

      this.logger.error(`Failed to load CSS file '${cssFileName}': ${error.message}`);
      throw new CSSLoadError(cssFileName, filePath, error);
    }
  }

  /**
   * Preprocess CSS content by replacing design token placeholders with actual values
   * @param cssContent - Raw CSS content
   * @param designTokens - Design token values to inject
   * @returns Processed CSS content
   */
  preprocessCSS(cssContent: string, designTokens?: any): string {
    // Use default design tokens if none provided
    const tokens = designTokens || this.getDefaultDesignTokens();

    let processedCSS = cssContent;

    try {
      // Replace design token placeholders with actual values
      processedCSS = this.replaceDesignTokens(processedCSS, tokens);

      // Generate CSS variables from design tokens
      processedCSS = this.injectCSSVariables(processedCSS, tokens);

      // Validate processed CSS
      this.validateProcessedCSS(processedCSS);

      // Minify CSS if in production mode
      if (this.config.minifyCSS) {
        processedCSS = this.minifyCSS(processedCSS);
      }

      this.logger.debug('CSS preprocessing completed successfully');
      return processedCSS;
    } catch (error) {
      this.logger.error(`CSS preprocessing failed: ${error.message}`);
      // Return original CSS if preprocessing fails
      return cssContent;
    }
  }

  /**
   * Reload all CSS files (useful for development)
   */
  async reloadCSS(): Promise<void> {
    this.logger.log('Reloading all CSS files...');

    // Clear cache
    this.cssCache.clear();

    // Close existing file watchers
    for (const [filePath, watcher] of this.fileWatchers) {
      try {
        if (watcher && typeof watcher.close === 'function') {
          await watcher.close();
        }
      } catch (error) {
        this.logger.warn(`Failed to close file watcher for ${filePath}: ${error.message}`);
      }
    }
    this.fileWatchers.clear();

    this.logger.log('CSS cache cleared and file watchers reset');
  }

  /**
   * Check if a CSS file exists
   * @param cssFileName - Name of the CSS file to check
   * @returns True if file exists, false otherwise
   */
  cssFileExists(cssFileName: string): boolean {
    try {
      const filePath = this.getCSSFilePath(cssFileName);
      require('fs').accessSync(filePath, require('fs').constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the full path to a CSS file
   * @param cssFileName - Name of the CSS file
   * @returns Full file system path
   */
  getCSSFilePath(cssFileName: string): string {
    return path.resolve(process.cwd(), this.config.stylesPath, cssFileName);
  }

  /**
   * Convert template name to CSS file name
   * @param templateName - Template name (e.g., 'order-confirmation' or 'orders/order-confirmation')
   * @returns CSS file name (e.g., 'styles-order-confirmation.css')
   */
  private templateNameToCSSFileName(templateName: string): string {
    // Remove 'template-' prefix if present and add 'styles-' prefix
    const baseName = templateName.replace(/^template-/, '');

    // Handle subdirectory structure
    const parts = baseName.split('/');
    const fileName = parts[parts.length - 1];
    const directory = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';

    return `${directory}styles-${fileName}.css`;
  }

  /**
   * Inject CSS content into HTML template with email client compatibility
   * @param template - HTML template content
   * @param cssContent - CSS content to inject
   * @returns Template with injected CSS
   */
  private injectCSSIntoTemplate(template: string, cssContent: string): string {
    // Preprocess CSS for email client compatibility
    const emailCompatibleCSS = this.makeEmailClientCompatible(cssContent);

    // Look for CSS injection placeholder first
    const cssPlaceholder = '{{{injectedCSS}}}';

    if (template.includes(cssPlaceholder)) {
      return template.replace(cssPlaceholder, emailCompatibleCSS);
    }

    // If no placeholder found, inject into head section with proper email client attributes
    const headEndTag = '</head>';
    if (template.includes(headEndTag)) {
      const styleTag = this.createEmailCompatibleStyleTag(emailCompatibleCSS);
      return template.replace(headEndTag, `${styleTag}${headEndTag}`);
    }

    // If no head section found, try to inject after opening body tag as fallback
    const bodyStartTag = '<body';
    if (template.includes(bodyStartTag)) {
      const bodyTagEnd = template.indexOf('>', template.indexOf(bodyStartTag)) + 1;
      const beforeBody = template.substring(0, bodyTagEnd);
      const afterBody = template.substring(bodyTagEnd);
      const styleTag = this.createEmailCompatibleStyleTag(emailCompatibleCSS);

      this.logger.warn('No head section found, injecting CSS after body tag as fallback');
      return `${beforeBody}\n${styleTag}\n${afterBody}`;
    }

    // If no injection point found, log warning and return original template
    this.logger.warn('No CSS injection point found in template - neither {{{injectedCSS}}} placeholder, </head> tag, nor <body> tag');
    return template;
  }

  /**
   * Replace design token placeholders in CSS content
   * @param cssContent - CSS content with placeholders
   * @param designTokens - Design token values
   * @returns CSS with replaced tokens
   */
  private replaceDesignTokens(cssContent: string, designTokens: any): string {
    let processedCSS = cssContent;

    // Replace design token placeholders like {{designTokens.colors.primary}}
    const tokenRegex = /\{\{designTokens\.([^}]+)\}\}/g;

    processedCSS = processedCSS.replace(tokenRegex, (match, tokenPath) => {
      try {
        // Navigate through the design tokens object using the path
        const value = this.getNestedValue(designTokens, tokenPath);

        if (value !== undefined && value !== null) {
          return value.toString();
        } else {
          this.logger.warn(`Design token not found: ${tokenPath}`);
          return match; // Return original placeholder if token not found
        }
      } catch (error) {
        this.logger.warn(`Error replacing design token ${tokenPath}: ${error.message}`);
        return match; // Return original placeholder on error
      }
    });

    return processedCSS;
  }

  /**
   * Create email-compatible style tag with proper attributes
   * @param cssContent - CSS content to wrap in style tag
   * @returns Complete style tag with email client compatibility attributes
   */
  private createEmailCompatibleStyleTag(cssContent: string): string {
    return `  <style type="text/css">
    /* Email client compatibility styles */
    ${cssContent}
  </style>`;
  }

  /**
   * Make CSS compatible with email clients
   * @param cssContent - Original CSS content
   * @returns Email client compatible CSS
   */
  private makeEmailClientCompatible(cssContent: string): string {
    let compatibleCSS = cssContent;

    // Add email client specific prefixes and fallbacks
    compatibleCSS = this.addEmailClientPrefixes(compatibleCSS);

    // Add Outlook-specific fixes
    compatibleCSS = this.addOutlookCompatibility(compatibleCSS);

    // Add Gmail-specific fixes
    compatibleCSS = this.addGmailCompatibility(compatibleCSS);

    // Ensure proper email client resets are included
    compatibleCSS = this.addEmailClientResets(compatibleCSS);

    return compatibleCSS;
  }

  /**
   * Add email client specific CSS prefixes
   * @param cssContent - CSS content to add prefixes to
   * @returns CSS with email client prefixes
   */
  private addEmailClientPrefixes(cssContent: string): string {
    let prefixedCSS = cssContent;

    // Add -webkit- prefixes for better email client support
    prefixedCSS = prefixedCSS.replace(
      /text-size-adjust:\s*([^;]+);/g,
      '-webkit-text-size-adjust: $1; -ms-text-size-adjust: $1; text-size-adjust: $1;'
    );

    // Add vendor prefixes for border-radius
    prefixedCSS = prefixedCSS.replace(
      /border-radius:\s*([^;]+);/g,
      '-webkit-border-radius: $1; -moz-border-radius: $1; border-radius: $1;'
    );

    // Add vendor prefixes for box-shadow
    prefixedCSS = prefixedCSS.replace(
      /box-shadow:\s*([^;]+);/g,
      '-webkit-box-shadow: $1; -moz-box-shadow: $1; box-shadow: $1;'
    );

    return prefixedCSS;
  }

  /**
   * Add Outlook-specific compatibility fixes
   * @param cssContent - CSS content to add Outlook fixes to
   * @returns CSS with Outlook compatibility
   */
  private addOutlookCompatibility(cssContent: string): string {
    const outlookFixes = `
    /* Outlook-specific fixes */
    <!--[if mso]>
    <style type="text/css">
      table {
        mso-table-lspace: 0pt !important;
        mso-table-rspace: 0pt !important;
      }

      td {
        mso-line-height-rule: exactly !important;
      }

      .outlook-hide {
        display: none !important;
        mso-hide: all !important;
      }

      .outlook-gradient {
        background: var(--color-primary, #2c3e50) !important;
      }
    </style>
    <![endif]-->
    `;

    return outlookFixes + '\n' + cssContent;
  }

  /**
   * Add Gmail-specific compatibility fixes
   * @param cssContent - CSS content to add Gmail fixes to
   * @returns CSS with Gmail compatibility
   */
  private addGmailCompatibility(cssContent: string): string {
    const gmailFixes = `
    /* Gmail-specific fixes */
    .gmail-fix {
      display: table !important;
      width: 100% !important;
    }

    .gmail-safe-button {
      display: inline-block !important;
      padding: 16px 32px !important;
      text-decoration: none !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      text-align: center !important;
    }
    `;

    return gmailFixes + '\n' + cssContent;
  }

  /**
   * Add universal email client resets
   * @param cssContent - CSS content to add resets to
   * @returns CSS with email client resets
   */
  private addEmailClientResets(cssContent: string): string {
    const emailResets = `
    /* Universal email client resets */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }

    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }

    img {
      -ms-interpolation-mode: bicubic !important;
      border: 0 !important;
      outline: none !important;
      text-decoration: none !important;
    }

    table {
      border-collapse: collapse !important;
    }

    #outlook a {
      padding: 0 !important;
    }

    .ReadMsgBody, .ExternalClass {
      width: 100% !important;
    }

    .ExternalClass, .ExternalClass p, .ExternalClass span,
    .ExternalClass font, .ExternalClass td, .ExternalClass div {
      line-height: 100% !important;
    }
    `;

    return emailResets + '\n' + cssContent;
  }

  /**
   * Get nested value from object using dot notation path
   * @param obj - Object to search in
   * @param path - Dot notation path (e.g., 'colors.primary')
   * @returns Value at the path or undefined
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Basic CSS minification
   * @param cssContent - CSS content to minify
   * @returns Minified CSS
   */
  private minifyCSS(cssContent: string): string {
    return cssContent
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove whitespace around certain characters
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      // Remove trailing semicolons before closing braces
      .replace(/;}/g, '}')
      // Trim
      .trim();
  }

  /**
   * Validate CSS content for basic syntax errors
   * @param cssFileName - Name of the CSS file being validated
   * @param cssContent - CSS content to validate
   * @throws CSSValidationError if validation fails
   */
  private validateCSSContent(cssFileName: string, cssContent: string): void {
    const validationErrors: string[] = [];

    // Check for balanced braces
    const openBraces = (cssContent.match(/\{/g) || []).length;
    const closeBraces = (cssContent.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      validationErrors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for basic CSS structure (at least one rule or comment)
    const hasRules = /[^{}]*\{[^{}]*\}/.test(cssContent);
    const hasComments = /\/\*[\s\S]*?\*\//.test(cssContent);

    if (!hasRules && !hasComments && cssContent.trim().length > 0) {
      validationErrors.push('No valid CSS rules or comments found');
    }

    if (validationErrors.length > 0) {
      this.logger.warn(`CSS validation failed for '${cssFileName}': ${validationErrors.join(', ')}`);
      // Don't throw error, just log warning to allow fallback behavior
    }
  }

  /**
   * Set up file watcher for CSS file in development mode with hot-reloading
   * @param cssFileName - Name of the CSS file to watch
   * @param filePath - Full path to the CSS file
   */
  private setupFileWatcher(cssFileName: string, filePath: string): void {
    if (this.fileWatchers.has(filePath)) {
      return; // Already watching this file
    }

    try {
      const fs = require('fs');
      const watcher = fs.watchFile(filePath, { interval: 500 }, (curr: any, prev: any) => {
        // Check if file was actually modified (not just accessed)
        if (curr.mtime !== prev.mtime) {
          this.logger.debug(`CSS file changed: ${cssFileName} (modified: ${curr.mtime})`);

          // Remove from cache to force reload on next access
          this.cssCache.delete(cssFileName);

          // Emit hot-reload event if enabled
          this.emitHotReloadEvent(cssFileName, filePath);
        }
      });

      this.fileWatchers.set(filePath, watcher);
      this.logger.debug(`File watcher set up for: ${cssFileName} (hot-reload enabled)`);
    } catch (error) {
      this.logger.warn(`Failed to set up file watcher for ${cssFileName}: ${error.message}`);
    }
  }

  /**
   * Emit hot-reload event for CSS file changes (for potential future integration)
   * @param cssFileName - Name of the changed CSS file
   * @param filePath - Full path to the changed CSS file
   */
  private emitHotReloadEvent(cssFileName: string, filePath: string): void {
    // This method can be extended to emit events to a WebSocket connection
    // or other hot-reload mechanism in the future
    this.logger.log(`Hot-reload triggered for CSS file: ${cssFileName}`);

    // For now, just log the event. In the future, this could:
    // 1. Emit WebSocket events to connected clients
    // 2. Trigger template re-compilation
    // 3. Notify other services of CSS changes
  }

  /**
   * Enable hot-reloading for all CSS files (development mode only)
   */
  async enableHotReloading(): Promise<void> {
    if (!this.config.isDevelopment) {
      this.logger.warn('Hot-reloading is only available in development mode');
      return;
    }

    this.logger.log('Enabling hot-reloading for all CSS files...');

    // Set up watchers for all cached CSS files
    for (const cssFileName of this.cssCache.keys()) {
      const filePath = this.getCSSFilePath(cssFileName);
      if (!this.fileWatchers.has(filePath)) {
        this.setupFileWatcher(cssFileName, filePath);
      }
    }

    this.logger.log('Hot-reloading enabled for all cached CSS files');
  }

  /**
   * Disable hot-reloading for all CSS files
   */
  async disableHotReloading(): Promise<void> {
    this.logger.log('Disabling hot-reloading for all CSS files...');

    // Close all file watchers
    for (const [filePath, watcher] of this.fileWatchers) {
      try {
        if (watcher && typeof watcher.close === 'function') {
          await watcher.close();
        }
      } catch (error) {
        this.logger.warn(`Failed to close file watcher for ${filePath}: ${error.message}`);
      }
    }

    this.fileWatchers.clear();
    this.logger.log('Hot-reloading disabled for all CSS files');
  }

  /**
   * Get hot-reloading status
   * @returns True if hot-reloading is enabled and active
   */
  isHotReloadingEnabled(): boolean {
    return this.config.isDevelopment && this.fileWatchers.size > 0;
  }

  /**
   * Get list of currently watched CSS files
   * @returns Array of CSS file names being watched
   */
  getWatchedFiles(): string[] {
    const watchedFiles: string[] = [];

    for (const filePath of this.fileWatchers.keys()) {
      // Extract filename from path
      const fileName = filePath.split('/').pop() || filePath;
      watchedFiles.push(fileName);
    }

    return watchedFiles;
  }

  /**
   * Get default CSS content for fallback scenarios
   * @returns Default CSS content
   */
  private getDefaultCSS(): string {
    return `
/* Default email styles - fallback when CSS file is missing */
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333333;
  margin: 0;
  padding: 0;
}

.email-container {
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
}

.email-header {
  background-color: #2c3e50;
  color: #ffffff;
  padding: 20px;
  text-align: center;
}

.email-content {
  padding: 30px 20px;
  color: #333333;
}

.email-footer {
  background-color: #ecf0f1;
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #7f8c8d;
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  background-color: #3498db;
  color: #ffffff;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td, th {
  padding: 8px;
  border-bottom: 1px solid #ecf0f1;
}

th {
  background-color: #34495e;
  color: #ffffff;
  font-weight: bold;
}
    `.trim();
  }

  /**
   * Get default design tokens for CSS preprocessing
   * @returns Default design tokens object
   */
  private getDefaultDesignTokens(): any {
    return {
      colors: MODERN_EMAIL_STYLES.colors,
      typography: MODERN_EMAIL_STYLES.typography,
      spacing: MODERN_EMAIL_STYLES.spacing,
      borderRadius: MODERN_EMAIL_STYLES.borderRadius,
      shadows: MODERN_EMAIL_STYLES.shadows,
      buttons: MODERN_BUTTON_STYLES,
      statusBadges: STATUS_BADGE_STYLES,
      darkMode: DARK_MODE_COLORS,
      accessibility: ACCESSIBILITY_STANDARDS
    };
  }

  /**
   * Inject CSS variables from design tokens at the beginning of CSS content
   * @param cssContent - CSS content to inject variables into
   * @param designTokens - Design tokens to convert to CSS variables
   * @returns CSS content with injected variables
   */
  private injectCSSVariables(cssContent: string, designTokens: any): string {
    const cssVariables = this.generateCSSVariables(designTokens);

    // Check if CSS already has :root section
    if (cssContent.includes(':root')) {
      // Inject variables into existing :root section
      return cssContent.replace(
        /:root\s*\{/,
        `:root {\n${cssVariables}`
      );
    } else {
      // Add new :root section at the beginning
      return `:root {\n${cssVariables}\n}\n\n${cssContent}`;
    }
  }

  /**
   * Generate CSS variables from design tokens
   * @param designTokens - Design tokens object
   * @returns CSS variable declarations
   */
  private generateCSSVariables(designTokens: any): string {
    const variables: string[] = [];

    // Generate variables for colors
    if (designTokens.colors) {
      Object.entries(designTokens.colors).forEach(([key, value]) => {
        variables.push(`  --color-${this.kebabCase(key)}: ${value};`);
      });
    }

    // Generate variables for typography
    if (designTokens.typography) {
      if (designTokens.typography.fontFamily) {
        variables.push(`  --font-family: ${designTokens.typography.fontFamily};`);
      }
      if (designTokens.typography.fontSize) {
        Object.entries(designTokens.typography.fontSize).forEach(([key, value]) => {
          variables.push(`  --font-size-${this.kebabCase(key)}: ${value};`);
        });
      }
      if (designTokens.typography.lineHeight) {
        Object.entries(designTokens.typography.lineHeight).forEach(([key, value]) => {
          variables.push(`  --line-height-${this.kebabCase(key)}: ${value};`);
        });
      }
    }

    // Generate variables for spacing
    if (designTokens.spacing) {
      Object.entries(designTokens.spacing).forEach(([key, value]) => {
        variables.push(`  --spacing-${this.kebabCase(key)}: ${value};`);
      });
    }

    // Generate variables for border radius
    if (designTokens.borderRadius) {
      Object.entries(designTokens.borderRadius).forEach(([key, value]) => {
        variables.push(`  --border-radius-${this.kebabCase(key)}: ${value};`);
      });
    }

    // Generate variables for shadows
    if (designTokens.shadows) {
      Object.entries(designTokens.shadows).forEach(([key, value]) => {
        variables.push(`  --shadow-${this.kebabCase(key)}: ${value};`);
      });
    }

    return variables.join('\n');
  }

  /**
   * Convert camelCase to kebab-case
   * @param str - String to convert
   * @returns kebab-case string
   */
  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Validate processed CSS for common issues
   * @param cssContent - Processed CSS content to validate
   * @throws CSSValidationError if validation fails
   */
  private validateProcessedCSS(cssContent: string): void {
    const validationErrors: string[] = [];

    // Check for unresolved design token placeholders
    const unresolvedTokens = cssContent.match(/\{\{[^}]+\}\}/g);
    if (unresolvedTokens) {
      validationErrors.push(`Unresolved design tokens: ${unresolvedTokens.join(', ')}`);
    }

    // Check for invalid CSS variable references
    const invalidVarReferences = cssContent.match(/var\([^)]*\{\{[^}]+\}\}[^)]*\)/g);
    if (invalidVarReferences) {
      validationErrors.push(`Invalid CSS variable references: ${invalidVarReferences.join(', ')}`);
    }

    // Check for malformed CSS rules after preprocessing
    const malformedRules = cssContent.match(/[^{}]*\{[^{}]*\{\{[^}]+\}\}[^{}]*\}/g);
    if (malformedRules) {
      validationErrors.push(`Malformed CSS rules with unresolved tokens: ${malformedRules.length} found`);
    }

    if (validationErrors.length > 0) {
      this.logger.warn(`CSS validation warnings: ${validationErrors.join(', ')}`);
      // Don't throw error, just log warnings to allow fallback behavior
    }
  }
}