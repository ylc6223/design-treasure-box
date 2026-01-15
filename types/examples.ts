/**
 * 类型使用示例
 * 
 * 这个文件展示了如何使用定义的类型和 schema
 */

import {
  type Resource,
  type Category,
  type Rating,
  type FavoriteItem,
  type StoredFavorites,
  ResourceSchema,
  CategorySchema,
  RatingSchema,
  StoredFavoritesSchema,
  STORAGE_KEYS,
  FAVORITES_VERSION,
} from './index'

// ============================================================================
// 示例 1: 创建一个资源对象
// ============================================================================

const exampleRating: Rating = {
  overall: 4.5,
  usability: 5.0,
  aesthetics: 4.5,
  updateFrequency: 4.0,
  freeLevel: 5.0,
}

const exampleResource: Resource = {
  id: 'coolors-1',
  name: 'Coolors',
  url: 'https://coolors.co',
  description: '快速生成配色方案的在线工具，支持导出多种格式',
  screenshot: 'https://example.com/screenshots/coolors.jpg',
  categoryId: 'color',
  tags: ['配色', '工具', '免费', '在线'],
  rating: exampleRating,
  curatorNote: '非常好用的配色工具，界面简洁，功能强大。支持快速生成和调整配色方案。',
  isFeatured: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  viewCount: 1000,
  favoriteCount: 250,
}

// ============================================================================
// 示例 2: 创建一个分类对象
// ============================================================================

const exampleCategory: Category = {
  id: 'color',
  name: '配色工具',
  icon: 'Palette',
  description: '调色板、配色方案生成器',
  color: '#E94560',
}

// ============================================================================
// 示例 3: 使用 Zod Schema 验证数据
// ============================================================================

/**
 * 验证资源数据
 */
export function validateResource(data: unknown): Resource | null {
  const result = ResourceSchema.safeParse(data)
  
  if (result.success) {
    return result.data
  } else {
    console.error('资源数据验证失败:', result.error)
    return null
  }
}

/**
 * 验证分类数据
 */
export function validateCategory(data: unknown): Category | null {
  const result = CategorySchema.safeParse(data)
  
  if (result.success) {
    return result.data
  } else {
    console.error('分类数据验证失败:', result.error)
    return null
  }
}

/**
 * 验证评分数据
 */
export function validateRating(data: unknown): Rating | null {
  const result = RatingSchema.safeParse(data)
  
  if (result.success) {
    return result.data
  } else {
    console.error('评分数据验证失败:', result.error)
    return null
  }
}

// ============================================================================
// 示例 4: 创建收藏数据
// ============================================================================

const exampleFavoriteItem: FavoriteItem = {
  resourceId: 'coolors-1',
  addedAt: new Date().toISOString(),
}

const exampleStoredFavorites: StoredFavorites = {
  version: FAVORITES_VERSION,
  items: [exampleFavoriteItem],
  lastUpdated: new Date().toISOString(),
}

// ============================================================================
// 示例 5: localStorage 操作
// ============================================================================

/**
 * 保存收藏到 localStorage
 */
export function saveFavoritesToStorage(favorites: StoredFavorites): void {
  try {
    const json = JSON.stringify(favorites)
    localStorage.setItem(STORAGE_KEYS.FAVORITES, json)
  } catch (error) {
    console.error('保存收藏失败:', error)
  }
}

/**
 * 从 localStorage 读取收藏
 */
export function loadFavoritesFromStorage(): StoredFavorites | null {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.FAVORITES)
    if (!json) return null
    
    const data = JSON.parse(json)
    // 使用 schema 验证数据
    const result = StoredFavoritesSchema.safeParse(data)
    
    return result.success ? result.data : null
  } catch (error) {
    console.error('读取收藏失败:', error)
    return null
  }
}

// ============================================================================
// 导出示例数据（用于测试）
// ============================================================================

export const examples = {
  resource: exampleResource,
  category: exampleCategory,
  rating: exampleRating,
  favoriteItem: exampleFavoriteItem,
  storedFavorites: exampleStoredFavorites,
}
