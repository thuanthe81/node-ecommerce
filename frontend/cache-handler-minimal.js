/**
 * Minimal cache handler for ultra-low CPU usage
 * Optimized for systems with limited resources
 */

const cache = new Map();
const maxSize = 50; // Very small cache to minimize memory usage

class MinimalCacheHandler {
  constructor(options) {
    this.options = options;
    this.cache = cache;
  }

  async get(key) {
    const entry = this.cache.get(key);
    if (entry) {
      // Simple TTL check without complex logic
      if (Date.now() - entry.timestamp < 300000) { // 5 minutes
        return entry.value;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  async set(key, data, ctx) {
    // Simple LRU eviction - remove oldest entry if cache is full
    if (this.cache.size >= maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value: data,
      timestamp: Date.now(),
    });
  }

  async revalidateTag(tag) {
    // Minimal tag-based invalidation
    if (tag) {
      this.cache.clear(); // Simple approach - clear all cache
    }
  }
}

module.exports = MinimalCacheHandler;