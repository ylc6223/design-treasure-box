import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock global fetch for Worker API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('POST /api/admin/resources/screenshot/trigger', () => {
    const validApiKey = 'test-api-key'
    const workerUrl = 'https://worker.example.com'

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.DATABASE_API_KEY = validApiKey
        process.env.WORKER_API_URL = workerUrl
    })

    // Dynamic import to ensure mocks are set up first
    const importRoute = async () => {
        const module = await import('../trigger/route')
        return module
    }

    it('should return 401 without authorization header', async () => {
        const { POST } = await importRoute()
        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
            method: 'POST',
            body: JSON.stringify({ resourceIds: ['id-1'] }),
        })

        const response = await POST(request)

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when resourceIds is not an array', async () => {
        const { POST } = await importRoute()
        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resourceIds: 'not-an-array' }),
        })

        const response = await POST(request)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain('array')
    })

    it('should return 400 when resourceIds is empty', async () => {
        const { POST } = await importRoute()
        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resourceIds: [] }),
        })

        const response = await POST(request)

        expect(response.status).toBe(400)
    })

    it('should return 400 when resourceIds exceeds limit of 10', async () => {
        const { POST } = await importRoute()
        const tooManyIds = Array.from({ length: 11 }, (_, i) => `id-${i}`)

        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resourceIds: tooManyIds }),
        })

        const response = await POST(request)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain('10')
    })

    it('should accept exactly 10 resourceIds', async () => {
        const { POST } = await importRoute()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        })

        const tenIds = Array.from({ length: 10 }, (_, i) => `id-${i}`)

        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resourceIds: tenIds }),
        })

        const response = await POST(request)

        expect(response.status).toBe(200)
    })

    it('should proxy request to Worker API', async () => {
        const { POST } = await importRoute()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        })

        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resourceIds: ['id-1', 'id-2'] }),
        })

        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(mockFetch).toHaveBeenCalledWith(
            `${workerUrl}/trigger`,
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${validApiKey}`,
                }),
            })
        )

        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.queued).toBe(2)
    })

    it('should return 503 when WORKER_API_URL is not configured', async () => {
        delete process.env.WORKER_API_URL

        // Re-import to pick up the new env
        vi.resetModules()
        const { POST } = await importRoute()

        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resourceIds: ['id-1'] }),
        })

        const response = await POST(request)

        expect(response.status).toBe(503)
    })

    it('should return 502 when Worker API fails', async () => {
        const { POST } = await importRoute()
        mockFetch.mockResolvedValueOnce({
            ok: false,
            text: async () => 'Worker error',
        })

        const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resourceIds: ['id-1'] }),
        })

        const response = await POST(request)

        expect(response.status).toBe(502)
    })
})
