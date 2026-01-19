import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/auth';

/**
 * 触发截图生成（异步）
 *
 * 限流：单次最多 10 个资源
 * 通过 Next.js 代理调用 Worker /trigger 端点
 */
export async function POST(request: NextRequest) {
  try {
    // 双重鉴权逻辑：首先尝试验证管理员 Session
    const isAdmin = await requireAdmin()
      .then(() => true)
      .catch(() => false);

    // 如果不是管理员 Session，则检查 API Key (备选方案)
    if (!isAdmin) {
      const authHeader = request.headers.get('Authorization');
      const expectedToken = `Bearer ${process.env.DATABASE_API_KEY}`;

      if (!authHeader || authHeader !== expectedToken) {
        console.error('Trigger auth failed: Not an admin session and no valid API Key');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { resourceIds } = body;

    // 参数验证
    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return NextResponse.json({ error: 'resourceIds must be a non-empty array' }, { status: 400 });
    }

    // 限流：单次最多 10 个资源
    if (resourceIds.length > 10) {
      return NextResponse.json(
        { error: 'Max 10 resources per request to prevent Worker overload' },
        { status: 400 }
      );
    }

    // 获取 Worker API URL
    const workerApiUrl = process.env.WORKER_API_URL;
    if (!workerApiUrl) {
      console.error('WORKER_API_URL environment variable is not set');
      return NextResponse.json({ error: 'Screenshot service is not configured' }, { status: 503 });
    }

    // 异步调用 Worker trigger endpoint
    const workerResponse = await fetch(`${workerApiUrl}/trigger`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DATABASE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceIds }),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      console.error('Worker trigger failed:', errorText);
      return NextResponse.json({ error: 'Failed to trigger screenshot worker' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      queued: resourceIds.length,
      message: `${resourceIds.length} screenshot(s) queued for processing`,
    });
  } catch (error) {
    console.error('Failed to trigger screenshot generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
