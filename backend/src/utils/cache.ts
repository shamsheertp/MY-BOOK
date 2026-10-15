import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  expiresAt: number;
  tags: string[];
}

class ServerCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Get cached data by key
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data with TTL and tags
   */
  set(key: string, data: any, tags: string[] = [], ttlMs: number = 45000): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      tags,
    });
  }

  /**
   * Invalidate all cache entries matching any given tag
   */
  invalidate(tags: string | string[]): void {
    const tagList = Array.isArray(tags) ? tags : [tags];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some((t) => tagList.includes(t))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Current number of cached items
   */
  size(): number {
    return this.cache.size;
  }
}

export const serverCache = new ServerCache();

/**
 * Express middleware for fast 1ms GET response caching
 */
export function cacheResponse(tag: string, ttlMs: number = 45000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = req.originalUrl || `${req.baseUrl}${req.url}`;
    const cachedData = serverCache.get(cacheKey);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Tag', tag);
      res.json(cachedData);
      return;
    }

    // Intercept res.json to store in cache
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful 200 responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        serverCache.set(cacheKey, body, [tag], ttlMs);
      }
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Tag', tag);
      return originalJson(body);
    };

    next();
  };
}
