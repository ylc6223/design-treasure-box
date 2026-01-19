import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase client
const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Import after mock
import { GET } from '../needed/route'

describe('GET /api/admin/resources/screenshot/needed', () => {
    const validApiKey = 'test-api-key'

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.DATABASE_API_KEY = validApiKey
    })

    it('should return 401 without authorization header', async () => {
        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/needed')

        const response = await GET(request)

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 with invalid API key', async () => {
        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/needed', {
            headers: {
                'Authorization': 'Bearer invalid-key',
            },
        })

        const response = await GET(request)

        expect(response.status).toBe(401)
    })

    it('should return resources needing screenshots with valid API key', async () => {
        const mockResources = [
            { id: 'resource-1', url: 'https://example.com' },
            { id: 'resource-2', url: 'https://example2.com' },
        ]

        mockSupabase.order.mockResolvedValueOnce({
            data: mockResources,
            error: null,
        })

        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/needed', {
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
            },
        })

        const response = await GET(request)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.total).toBe(2)
        expect(data.resources).toEqual(mockResources)
    })

    it('should apply 7-day filter to query', async () => {
        mockSupabase.order.mockResolvedValueOnce({
            data: [],
            error: null,
        })

        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/needed', {
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
            },
        })

        await GET(request)

        // Verify the or filter was called with proper conditions
        expect(mockSupabase.from).toHaveBeenCalledWith('resources')
        expect(mockSupabase.select).toHaveBeenCalledWith('id, url')
        expect(mockSupabase.or).toHaveBeenCalled()

        // Check that the or filter contains the expected pattern
        const orCall = mockSupabase.or.mock.calls[0][0]
        expect(orCall).toContain('screenshot_url.is.null')
        expect(orCall).toContain('screenshot_updated_at.lt.')
    })

    it('should return 500 on database error', async () => {
        mockSupabase.order.mockResolvedValueOnce({
            data: null,
            error: { message: 'Database error' },
        })

        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/needed', {
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
            },
        })

        const response = await GET(request)

        expect(response.status).toBe(500)
    })
})
