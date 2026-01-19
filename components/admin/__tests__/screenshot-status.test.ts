import { describe, it, expect } from 'vitest'
import type { ResourceResponse } from '@/types/resource'

// 从 resource-table.tsx 中提取的辅助函数进行测试
type ScreenshotStatus = 'success' | 'pending' | 'failed'

function getScreenshotStatus(resource: ResourceResponse): ScreenshotStatus {
    if (resource.screenshot_error) {
        return 'failed'
    }
    if (!resource.screenshot_url) {
        return 'pending'
    }
    if (resource.screenshot_updated_at) {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        if (new Date(resource.screenshot_updated_at).getTime() < sevenDaysAgo) {
            return 'pending'
        }
    }
    return 'success'
}

function formatUpdateTime(dateString: string | null): string {
    if (!dateString) return '未生成'
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return '刚刚'
    if (diffInHours < 24) return `${diffInHours} 小时前`
    if (diffInHours < 48) return '昨天'
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} 天前`
    return date.toLocaleDateString('zh-CN')
}

// Helper to create mock resource
function createMockResource(overrides: Partial<ResourceResponse> = {}): ResourceResponse {
    return {
        id: 'test-id',
        name: 'Test Resource',
        url: 'https://example.com',
        description: 'Test description',
        category_id: 'cat-1',
        tags: ['test'],
        curator_note: 'Test note',
        is_featured: false,
        curator_rating: {
            overall: 4,
            usability: 4,
            aesthetics: 4,
            updateFrequency: 4,
            freeLevel: 4,
        },
        view_count: 0,
        favorite_count: 0,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        screenshot_url: null,
        screenshot_updated_at: null,
        screenshot_error: null,
        ...overrides,
    }
}

describe('getScreenshotStatus', () => {
    describe('failed status', () => {
        it('should return "failed" when screenshot_error exists', () => {
            const resource = createMockResource({
                screenshot_error: 'Page load timeout',
            })

            expect(getScreenshotStatus(resource)).toBe('failed')
        })

        it('should return "failed" even if screenshot_url exists', () => {
            const resource = createMockResource({
                screenshot_url: 'https://example.com/screenshot.jpg',
                screenshot_updated_at: new Date().toISOString(),
                screenshot_error: 'Some error',
            })

            expect(getScreenshotStatus(resource)).toBe('failed')
        })
    })

    describe('pending status', () => {
        it('should return "pending" when screenshot_url is null', () => {
            const resource = createMockResource({
                screenshot_url: null,
            })

            expect(getScreenshotStatus(resource)).toBe('pending')
        })

        it('should return "pending" when screenshot is older than 7 days', () => {
            const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
            const resource = createMockResource({
                screenshot_url: 'https://example.com/screenshot.jpg',
                screenshot_updated_at: eightDaysAgo,
            })

            expect(getScreenshotStatus(resource)).toBe('pending')
        })

        it('should return "pending" when screenshot is exactly 7 days old', () => {
            // 7 days + 1 minute to ensure it's past the threshold
            const sevenDaysAndOneMinuteAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 60000).toISOString()
            const resource = createMockResource({
                screenshot_url: 'https://example.com/screenshot.jpg',
                screenshot_updated_at: sevenDaysAndOneMinuteAgo,
            })

            expect(getScreenshotStatus(resource)).toBe('pending')
        })
    })

    describe('success status', () => {
        it('should return "success" when screenshot is fresh (within 7 days)', () => {
            const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            const resource = createMockResource({
                screenshot_url: 'https://example.com/screenshot.jpg',
                screenshot_updated_at: oneDayAgo,
            })

            expect(getScreenshotStatus(resource)).toBe('success')
        })

        it('should return "success" when screenshot is just generated', () => {
            const justNow = new Date().toISOString()
            const resource = createMockResource({
                screenshot_url: 'https://example.com/screenshot.jpg',
                screenshot_updated_at: justNow,
            })

            expect(getScreenshotStatus(resource)).toBe('success')
        })

        it('should return "success" when screenshot_updated_at is null but url exists', () => {
            // Edge case: URL exists but no timestamp
            const resource = createMockResource({
                screenshot_url: 'https://example.com/screenshot.jpg',
                screenshot_updated_at: null,
            })

            expect(getScreenshotStatus(resource)).toBe('success')
        })
    })
})

describe('formatUpdateTime', () => {
    it('should return "未生成" for null', () => {
        expect(formatUpdateTime(null)).toBe('未生成')
    })

    it('should return "刚刚" for times less than 1 hour ago', () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        expect(formatUpdateTime(fiveMinutesAgo)).toBe('刚刚')
    })

    it('should return hours for times between 1-24 hours', () => {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        expect(formatUpdateTime(threeHoursAgo)).toBe('3 小时前')
    })

    it('should return "昨天" for times between 24-48 hours', () => {
        const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
        expect(formatUpdateTime(thirtyHoursAgo)).toBe('昨天')
    })

    it('should return days for times between 2-7 days', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        expect(formatUpdateTime(threeDaysAgo)).toBe('3 天前')
    })

    it('should return formatted date for times older than 7 days', () => {
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        const result = formatUpdateTime(tenDaysAgo)
        // Should be a date string like "2024/1/5"
        expect(result).toMatch(/^\d{4}\/\d{1,2}\/\d{1,2}$/)
    })
})
