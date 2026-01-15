import { describe, it, expect } from 'vitest'
import {
  RatingSchema,
  ResourceSchema,
  CategorySchema,
  FavoriteItemSchema,
  StoredFavoritesSchema,
  type Rating,
  type Resource,
  type Category,
  type FavoriteItem,
} from '../index'

describe('Data Type Schemas', () => {
  describe('RatingSchema', () => {
    it('validates valid rating object', () => {
      const validRating: Rating = {
        overall: 4.5,
        usability: 5.0,
        aesthetics: 4.0,
        updateFrequency: 3.5,
        freeLevel: 5.0,
      }
      
      const result = RatingSchema.safeParse(validRating)
      expect(result.success).toBe(true)
    })

    it('rejects rating values outside 0-5 range', () => {
      const invalidRating = {
        overall: 6.0, // 超出范围
        usability: 5.0,
        aesthetics: 4.0,
        updateFrequency: 3.5,
        freeLevel: 5.0,
      }
      
      const result = RatingSchema.safeParse(invalidRating)
      expect(result.success).toBe(false)
    })

    it('rejects rating values not in 0.5 increments', () => {
      const invalidRating = {
        overall: 4.3, // 不是 0.5 的倍数
        usability: 5.0,
        aesthetics: 4.0,
        updateFrequency: 3.5,
        freeLevel: 5.0,
      }
      
      const result = RatingSchema.safeParse(invalidRating)
      expect(result.success).toBe(false)
    })

    it('accepts edge case values (0, 2.5, 5)', () => {
      const edgeCaseRating: Rating = {
        overall: 0,
        usability: 2.5,
        aesthetics: 5,
        updateFrequency: 0.5,
        freeLevel: 4.5,
      }
      
      const result = RatingSchema.safeParse(edgeCaseRating)
      expect(result.success).toBe(true)
    })
  })

  describe('ResourceSchema', () => {
    it('validates valid resource object', () => {
      const validResource: Resource = {
        id: 'coolors-1',
        name: 'Coolors',
        url: 'https://coolors.co',
        description: '快速生成配色方案的在线工具',
        screenshot: 'https://example.com/screenshot.jpg',
        categoryId: 'color',
        tags: ['配色', '工具', '免费'],
        rating: {
          overall: 4.5,
          usability: 5.0,
          aesthetics: 4.5,
          updateFrequency: 4.0,
          freeLevel: 5.0,
        },
        curatorNote: '非常好用的配色工具',
        isFeatured: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        viewCount: 1000,
        favoriteCount: 250,
      }
      
      const result = ResourceSchema.safeParse(validResource)
      expect(result.success).toBe(true)
    })

    it('rejects resource with empty tags array', () => {
      const invalidResource = {
        id: 'test-1',
        name: 'Test',
        url: 'https://test.com',
        description: 'Test description',
        screenshot: 'https://example.com/screenshot.jpg',
        categoryId: 'color',
        tags: [], // 空数组
        rating: {
          overall: 4.5,
          usability: 5.0,
          aesthetics: 4.5,
          updateFrequency: 4.0,
          freeLevel: 5.0,
        },
        curatorNote: 'Test note',
        isFeatured: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        viewCount: 0,
        favoriteCount: 0,
      }
      
      const result = ResourceSchema.safeParse(invalidResource)
      expect(result.success).toBe(false)
    })

    it('rejects resource with invalid URL', () => {
      const invalidResource = {
        id: 'test-1',
        name: 'Test',
        url: 'not-a-valid-url', // 无效 URL
        description: 'Test description',
        screenshot: 'https://example.com/screenshot.jpg',
        categoryId: 'color',
        tags: ['test'],
        rating: {
          overall: 4.5,
          usability: 5.0,
          aesthetics: 4.5,
          updateFrequency: 4.0,
          freeLevel: 5.0,
        },
        curatorNote: 'Test note',
        isFeatured: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        viewCount: 0,
        favoriteCount: 0,
      }
      
      const result = ResourceSchema.safeParse(invalidResource)
      expect(result.success).toBe(false)
    })
  })

  describe('CategorySchema', () => {
    it('validates valid category object', () => {
      const validCategory: Category = {
        id: 'color',
        name: '配色工具',
        icon: 'Palette',
        description: '调色板、配色方案生成器',
        color: '#E94560',
      }
      
      const result = CategorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it('rejects category with invalid color format', () => {
      const invalidCategory = {
        id: 'color',
        name: '配色工具',
        icon: 'Palette',
        description: '调色板、配色方案生成器',
        color: 'red', // 无效颜色格式
      }
      
      const result = CategorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })

    it('accepts lowercase hex colors', () => {
      const validCategory: Category = {
        id: 'color',
        name: '配色工具',
        icon: 'Palette',
        description: '调色板、配色方案生成器',
        color: '#e94560', // 小写
      }
      
      const result = CategorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })
  })

  describe('FavoriteItemSchema', () => {
    it('validates valid favorite item', () => {
      const validFavorite: FavoriteItem = {
        resourceId: 'coolors-1',
        addedAt: '2024-01-01T00:00:00.000Z',
      }
      
      const result = FavoriteItemSchema.safeParse(validFavorite)
      expect(result.success).toBe(true)
    })

    it('rejects favorite with invalid datetime', () => {
      const invalidFavorite = {
        resourceId: 'coolors-1',
        addedAt: 'not-a-datetime',
      }
      
      const result = FavoriteItemSchema.safeParse(invalidFavorite)
      expect(result.success).toBe(false)
    })
  })

  describe('StoredFavoritesSchema', () => {
    it('validates valid stored favorites', () => {
      const validStored = {
        version: 1,
        items: [
          {
            resourceId: 'coolors-1',
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        lastUpdated: '2024-01-01T00:00:00.000Z',
      }
      
      const result = StoredFavoritesSchema.safeParse(validStored)
      expect(result.success).toBe(true)
    })

    it('accepts empty items array', () => {
      const validStored = {
        version: 1,
        items: [],
        lastUpdated: '2024-01-01T00:00:00.000Z',
      }
      
      const result = StoredFavoritesSchema.safeParse(validStored)
      expect(result.success).toBe(true)
    })

    it('rejects negative version number', () => {
      const invalidStored = {
        version: -1,
        items: [],
        lastUpdated: '2024-01-01T00:00:00.000Z',
      }
      
      const result = StoredFavoritesSchema.safeParse(invalidStored)
      expect(result.success).toBe(false)
    })
  })
})
