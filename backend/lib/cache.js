/**
 * In-memory fast cache for high-frequency read endpoints.
 * Provides sub-millisecond response times for catalogue, items, and search queries.
 * Automatically evicts expired items and supports prefix-based cache invalidation.
 */
class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.data;
  }

  set(key, data, ttlSeconds = 30) {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  clearPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }
}

const memoryCache = new MemoryCache();

module.exports = memoryCache;
