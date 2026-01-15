import { describe, it, expect } from 'vitest'
import { CategorySchema, ResourceSchema } from '@/types'
import categoriesData from '../categories.json'
import resourcesData from '../resources.json'

describe('Preset Data Validation', () => {
  describe('Categories Data', () => {
    it('should have exactly 8 categories', () => {
      expect(categoriesData).toHaveLength(8)
    })

    it('all categories should be valid', () => {
      categoriesData.forEach((category, index) => {
        const result = CategorySchema.safeParse(category)
        expect(result.success, `Category ${index} (${category.id}) validation failed`).toBe(true)
      })
    })

    it('should have all required category IDs', () => {
      const expectedIds = ['color', 'css', 'font', 'icon', 'inspiration', 'website', 'ui-kit', 'mockup']
      const actualIds = categoriesData.map(c => c.id)
      
      expectedIds.forEach(id => {
        expect(actualIds).toContain(id)
      })
    })

    it('all category IDs should be unique', () => {
      const ids = categoriesData.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('all category colors should be valid hex format', () => {
      categoriesData.forEach(category => {
        expect(category.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })

  describe('Resources Data', () => {
    it('should have at least 30 resources', () => {
      expect(resourcesData.length).toBeGreaterThanOrEqual(30)
    })

    it('all resources should be valid', () => {
      resourcesData.forEach((resource, index) => {
        const result = ResourceSchema.safeParse(resource)
        if (!result.success) {
          console.error(`Resource ${index} (${resource.id}) validation failed:`, result.error)
        }
        expect(result.success, `Resource ${index} (${resource.id}) validation failed`).toBe(true)
      })
    })

    it('all resource IDs should be unique', () => {
      const ids = resourcesData.map(r => r.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('all resources should have valid category IDs', () => {
      const validCategoryIds = categoriesData.map(c => c.id)
      
      resourcesData.forEach(resource => {
        expect(validCategoryIds).toContain(resource.categoryId)
      })
    })

    it('all resources should have at least one tag', () => {
      resourcesData.forEach(resource => {
        expect(resource.tags.length).toBeGreaterThan(0)
      })
    })

    it('all resources should have valid ratings (0-5, 0.5 increments)', () => {
      resourcesData.forEach(resource => {
        const { rating } = resource
        
        // Check all rating values are in range
        expect(rating.overall).toBeGreaterThanOrEqual(0)
        expect(rating.overall).toBeLessThanOrEqual(5)
        expect(rating.usability).toBeGreaterThanOrEqual(0)
        expect(rating.usability).toBeLessThanOrEqual(5)
        expect(rating.aesthetics).toBeGreaterThanOrEqual(0)
        expect(rating.aesthetics).toBeLessThanOrEqual(5)
        expect(rating.updateFrequency).toBeGreaterThanOrEqual(0)
        expect(rating.updateFrequency).toBeLessThanOrEqual(5)
        expect(rating.freeLevel).toBeGreaterThanOrEqual(0)
        expect(rating.freeLevel).toBeLessThanOrEqual(5)
        
        // Check all rating values are multiples of 0.5
        expect(rating.overall % 0.5).toBe(0)
        expect(rating.usability % 0.5).toBe(0)
        expect(rating.aesthetics % 0.5).toBe(0)
        expect(rating.updateFrequency % 0.5).toBe(0)
        expect(rating.freeLevel % 0.5).toBe(0)
      })
    })

    it('should cover all categories', () => {
      const categoryIds = categoriesData.map(c => c.id)
      const usedCategoryIds = new Set(resourcesData.map(r => r.categoryId))
      
      categoryIds.forEach(categoryId => {
        expect(usedCategoryIds.has(categoryId), `Category ${categoryId} has no resources`).toBe(true)
      })
    })

    it('should have at least one featured resource', () => {
      const featuredResources = resourcesData.filter(r => r.isFeatured)
      expect(featuredResources.length).toBeGreaterThan(0)
    })

    it('all resources should have valid URLs', () => {
      resourcesData.forEach(resource => {
        expect(() => new URL(resource.url)).not.toThrow()
        expect(() => new URL(resource.screenshot)).not.toThrow()
      })
    })

    it('all resources should have valid ISO datetime strings', () => {
      resourcesData.forEach(resource => {
        expect(() => new Date(resource.createdAt).toISOString()).not.toThrow()
        expect(resource.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    })
  })

  describe('Data Integrity', () => {
    it('should have resources distributed across all categories', () => {
      const categoryIds = categoriesData.map(c => c.id)
      const resourcesByCategory = categoryIds.map(categoryId => ({
        categoryId,
        count: resourcesData.filter(r => r.categoryId === categoryId).length
      }))
      
      // Each category should have at least one resource
      resourcesByCategory.forEach(({ categoryId, count }) => {
        expect(count, `Category ${categoryId} should have at least one resource`).toBeGreaterThan(0)
      })
    })

    it('featured resources should be high quality (rating >= 4.0)', () => {
      const featuredResources = resourcesData.filter(r => r.isFeatured)
      
      featuredResources.forEach(resource => {
        expect(resource.rating.overall).toBeGreaterThanOrEqual(4.0)
      })
    })
  })
})
