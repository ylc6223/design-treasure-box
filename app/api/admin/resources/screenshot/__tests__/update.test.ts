import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase client
const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Import after mock
import { PATCH } from '../[id]/route'

describe('PATCH /api/admin/resources/screenshot/[id]', () => {
    const validApiKey = 'test-api-key'
    const resourceId = 'resource-123'

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.DATABASE_API_KEY = validApiKey
    })

    const createRequest = (body: object) => {
        return new NextRequest(`http://localhost/api/admin/resources/screenshot/${resourceId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
    }

    const createContext = () => ({
        params: Promise.resolve({ id: resourceId }),
    })

    it('should return 401 without authorization header', async () => {
        const request = new NextRequest(`http://localhost/api/admin/resources/screenshot/${resourceId}`, {
            method: 'PATCH',
            body: JSON.stringify({ screenshotUrl: 'https://example.com/screenshot.jpg' }),
        })

        const response = await PATCH(request, createContext())

        expect(response.status).toBe(401)
    })

    it('should return 400 when screenshotUrl is missing and no error provided', async () => {
        const request = createRequest({})

        const response = await PATCH(request, createContext())

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain('screenshotUrl')
    })

    it('should update screenshot URL and clear error on success', async () => {
        mockSupabase.eq.mockResolvedValueOnce({ error: null })

        const request = createRequest({
            screenshotUrl: 'https://cdn.example.com/screenshot.jpg',
            screenshotUpdatedAt: '2024-01-15T00:00:00.000Z',
        })

        const response = await PATCH(request, createContext())

        expect(response.status).toBe(200)
        expect(mockSupabase.update).toHaveBeenCalledWith(
            expect.objectContaining({
                screenshot_url: 'https://cdn.example.com/screenshot.jpg',
                screenshot_updated_at: '2024-01-15T00:00:00.000Z',
                screenshot_error: null, // Should be cleared on success
            })
        )
    })

    it('should allow reporting error without screenshotUrl', async () => {
        mockSupabase.eq.mockResolvedValueOnce({ error: null })

        const request = createRequest({
            screenshotError: 'Page load timeout',
        })

        const response = await PATCH(request, createContext())

        expect(response.status).toBe(200)
        expect(mockSupabase.update).toHaveBeenCalledWith(
            expect.objectContaining({
                screenshot_error: 'Page load timeout',
            })
        )
    })

    it('should truncate screenshot_error to 500 characters', async () => {
        mockSupabase.eq.mockResolvedValueOnce({ error: null })

        const longError = 'x'.repeat(600) // 600 characters
        const request = createRequest({
            screenshotError: longError,
        })

        const response = await PATCH(request, createContext())

        expect(response.status).toBe(200)
        const updateCall = mockSupabase.update.mock.calls[0][0]
        expect(updateCall.screenshot_error.length).toBe(500)
    })

    it('should allow clearing error by passing null', async () => {
        mockSupabase.eq.mockResolvedValueOnce({ error: null })

        const request = createRequest({
            screenshotUrl: 'https://cdn.example.com/screenshot.jpg',
            screenshotError: null,
        })

        const response = await PATCH(request, createContext())

        expect(response.status).toBe(200)
        expect(mockSupabase.update).toHaveBeenCalledWith(
            expect.objectContaining({
                screenshot_error: null,
            })
        )
    })

    it('should use current time when screenshotUpdatedAt is not provided', async () => {
        mockSupabase.eq.mockResolvedValueOnce({ error: null })

        const beforeCall = new Date().toISOString()

        const request = createRequest({
            screenshotUrl: 'https://cdn.example.com/screenshot.jpg',
        })

        await PATCH(request, createContext())

        const updateCall = mockSupabase.update.mock.calls[0][0]
        const updatedAt = new Date(updateCall.screenshot_updated_at)
        const afterCall = new Date()

        expect(updatedAt.getTime()).toBeGreaterThanOrEqual(new Date(beforeCall).getTime())
        expect(updatedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime())
    })

    it('should return 500 on database error', async () => {
        mockSupabase.eq.mockResolvedValueOnce({
            error: { message: 'Database error' },
        })

        const request = createRequest({
            screenshotUrl: 'https://cdn.example.com/screenshot.jpg',
        })

        const response = await PATCH(request, createContext())

        expect(response.status).toBe(500)
    })
})
