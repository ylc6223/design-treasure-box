import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock global fetch for Worker API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('POST /api/admin/resources/screenshot/trigger', () => {
  const validApiKey = 'test-api-key';
  const githubOwner = 'owner';
  const githubRepo = 'repo';
  const githubToken = 'token';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_API_KEY = validApiKey;
    process.env.GITHUB_REPO_OWNER = githubOwner;
    process.env.GITHUB_REPO_NAME = githubRepo;
    process.env.GITHUB_TOKEN = githubToken;
  });

  // Dynamic import to ensure mocks are set up first
  const importRoute = async () => {
    const routeModule = await import('../trigger/route');
    return routeModule;
  };

  it('should return 401 without authorization header', async () => {
    const { POST } = await importRoute();
    const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
      method: 'POST',
      body: JSON.stringify({ resourceIds: ['id-1'] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 when resourceIds is not an array', async () => {
    const { POST } = await importRoute();
    const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceIds: 'not-an-array' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('array');
  });

  it('should allow empty resourceIds (full batch mode)', async () => {
    const { POST } = await importRoute();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceIds: [] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Full batch');
  });

  it('should allow undefined resourceIds (full batch mode)', async () => {
    const { POST } = await importRoute();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should accept more than 10 resourceIds (limit removed)', async () => {
    const { POST } = await importRoute();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const twelveIds = Array.from({ length: 12 }, (_, i) => `id-${i}`);

    const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceIds: twelveIds }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.queued).toBe(12);
  });

  it('should trigger GitHub Repository Dispatch', async () => {
    const { POST } = await importRoute();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceIds: ['id-1', 'id-2'] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.github.com/repos/${githubOwner}/${githubRepo}/dispatches`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        }),
        body: expect.stringContaining('screenshot_request'),
      })
    );

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.queued).toBe(2);
  });

  it('should return 503 when GitHub config is missing', async () => {
    delete process.env.GITHUB_REPO_OWNER;

    // Re-import to pick up the new env
    vi.resetModules();
    const { POST } = await importRoute();

    const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceIds: ['id-1'] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(503);
  });

  it('should return 502 when GitHub API fails', async () => {
    const { POST } = await importRoute();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'GitHub error',
    });

    const request = new NextRequest('http://localhost/api/admin/resources/screenshot/trigger', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceIds: ['id-1'] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(502);
  });
});
