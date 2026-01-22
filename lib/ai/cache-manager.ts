/**
 * 缓存管理器 (Cache Manager)
 *
 * 实现查询缓存和向量搜索结果缓存
 * 基于 technical-specification.md 2.2 节设计
 */

// ============ 类型定义 ============

/**
 * 缓存条目
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * 缓存配置
 */
interface CacheConfig {
  maxSize: number;
  ttlMs: number;
  name: string;
}

/**
 * 缓存统计
 */
export interface CacheStats {
  name: string;
  size: number;
  maxSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
}

// ============ LRU 缓存实现 ============

/**
 * 简单的 LRU 缓存实现
 */
class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private totalHits: number = 0;
  private totalMisses: number = 0;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * 获取缓存值
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.totalMisses++;
      return undefined;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key);
      this.totalMisses++;
      return undefined;
    }

    // 更新访问时间和命中计数
    entry.timestamp = Date.now();
    entry.hits++;
    this.totalHits++;

    // LRU: 移动到末尾（最近使用）
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: T): void {
    // 如果达到最大容量，删除最旧的条目
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    const total = this.totalHits + this.totalMisses;
    return {
      name: this.config.name,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: total > 0 ? this.totalHits / total : 0,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
    };
  }

  /**
   * 清理过期条目
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttlMs) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// ============ 缓存管理器 ============

/**
 * 搜索结果类型（简化）
 */
export interface CachedSearchResult {
  resources: any[];
  content?: string;
  processingTime: number;
}

/**
 * 缓存管理器
 * 实现三层缓存：语义缓存、向量缓存、会话缓存
 */
class CacheManager {
  // L1: 语义查询缓存（独立于会话）
  private semanticCache: LRUCache<CachedSearchResult>;

  // L2: 向量搜索结果缓存
  private vectorCache: LRUCache<any[]>;

  // L3: 会话级缓存
  private sessionCache: Map<string, Map<string, CachedSearchResult>> = new Map();

  constructor() {
    // L1: 1000条，1小时TTL
    this.semanticCache = new LRUCache<CachedSearchResult>({
      name: 'semantic',
      maxSize: 1000,
      ttlMs: 60 * 60 * 1000, // 1小时
    });

    // L2: 500条，30分钟TTL
    this.vectorCache = new LRUCache<any[]>({
      name: 'vector',
      maxSize: 500,
      ttlMs: 30 * 60 * 1000, // 30分钟
    });
  }

  /**
   * 生成语义缓存键
   * 将查询和上下文规范化为统一的缓存键
   */
  generateSemanticKey(query: string, context?: Record<string, string>): string {
    const normalizedQuery = query.trim().toLowerCase();
    const contextStr = context ? JSON.stringify(context, Object.keys(context).sort()) : '';
    return `${normalizedQuery}:${contextStr}`;
  }

  /**
   * 从语义缓存获取
   */
  getFromSemanticCache(key: string): CachedSearchResult | undefined {
    return this.semanticCache.get(key);
  }

  /**
   * 设置语义缓存
   */
  setSemanticCache(key: string, result: CachedSearchResult): void {
    this.semanticCache.set(key, result);
  }

  /**
   * 从向量缓存获取
   */
  getFromVectorCache(query: string): any[] | undefined {
    return this.vectorCache.get(query.toLowerCase());
  }

  /**
   * 设置向量缓存
   */
  setVectorCache(query: string, resources: any[]): void {
    this.vectorCache.set(query.toLowerCase(), resources);
  }

  /**
   * 获取会话缓存
   */
  getSessionCache(sessionId: string): Map<string, CachedSearchResult> {
    if (!this.sessionCache.has(sessionId)) {
      this.sessionCache.set(sessionId, new Map());
    }
    return this.sessionCache.get(sessionId)!;
  }

  /**
   * 从会话缓存获取
   */
  getFromSessionCache(sessionId: string, query: string): CachedSearchResult | undefined {
    const session = this.sessionCache.get(sessionId);
    return session?.get(query.toLowerCase());
  }

  /**
   * 设置会话缓存
   */
  setSessionCache(sessionId: string, query: string, result: CachedSearchResult): void {
    const session = this.getSessionCache(sessionId);
    session.set(query.toLowerCase(), result);
  }

  /**
   * 清除会话缓存
   */
  clearSessionCache(sessionId: string): void {
    this.sessionCache.delete(sessionId);
  }

  /**
   * 失效特定查询的缓存
   */
  invalidate(query: string): void {
    const key = query.toLowerCase();
    this.semanticCache.delete(key);
    this.vectorCache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clearAll(): void {
    this.semanticCache.clear();
    this.vectorCache.clear();
    this.sessionCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    semantic: CacheStats;
    vector: CacheStats;
    sessionCount: number;
  } {
    return {
      semantic: this.semanticCache.getStats(),
      vector: this.vectorCache.getStats(),
      sessionCount: this.sessionCache.size,
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup(): { semantic: number; vector: number } {
    return {
      semantic: this.semanticCache.cleanup(),
      vector: this.vectorCache.cleanup(),
    };
  }
}

// ============ 单例导出 ============

// 全局缓存管理器实例
let cacheManagerInstance: CacheManager | null = null;

/**
 * 获取缓存管理器单例
 */
export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

/**
 * 带缓存的搜索包装函数
 *
 * @param query - 搜索查询
 * @param context - 搜索上下文
 * @param searchFn - 实际的搜索函数
 * @returns 搜索结果（可能来自缓存）
 */
export async function cachedSearch<T extends CachedSearchResult>(
  query: string,
  context: Record<string, string> | undefined,
  searchFn: () => Promise<T>
): Promise<T & { fromCache: boolean }> {
  const cache = getCacheManager();
  const cacheKey = cache.generateSemanticKey(query, context);

  // 1. 尝试从语义缓存获取
  const cached = cache.getFromSemanticCache(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit: ${cacheKey.substring(0, 50)}...`);
    return { ...(cached as T), fromCache: true };
  }

  // 2. 执行实际搜索
  const startTime = Date.now();
  const result = await searchFn();
  const processingTime = Date.now() - startTime;

  // 3. 缓存结果
  const resultWithTime: CachedSearchResult = {
    ...result,
    processingTime,
  };
  cache.setSemanticCache(cacheKey, resultWithTime);

  console.log(`🔍 Cache miss: ${cacheKey.substring(0, 50)}... (${processingTime}ms)`);
  return { ...result, fromCache: false };
}

/**
 * 定期清理缓存
 * 建议在后台任务中调用
 */
export function scheduleCacheCleanup(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    const cache = getCacheManager();
    const cleaned = cache.cleanup();
    console.log(`🧹 Cache cleanup: semantic=${cleaned.semantic}, vector=${cleaned.vector}`);
  }, intervalMs);
}
