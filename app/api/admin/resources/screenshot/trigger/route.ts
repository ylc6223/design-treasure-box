import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/auth';

/**
 * 触发截图生成（异步）
 *
 * 限流：单次最多 10 个资源
 * 通过 GitHub Repository Dispatch 触发截图工作流
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

    // 触发 GitHub Actions
    const githubOwner = process.env.GITHUB_REPO_OWNER;
    const githubRepo = process.env.GITHUB_REPO_NAME;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubOwner || !githubRepo || !githubToken) {
      console.error(
        'GitHub Actions configuration is missing (GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_TOKEN)'
      );
      return NextResponse.json(
        { error: 'Screenshot service (GitHub Actions) is not configured' },
        { status: 503 }
      );
    }

    // 触发 GitHub Repository Dispatch
    // 即使 GA 脚本目前可能不处理 payload，传递它也是为了将来能够支持选择性截图
    const githubResponse = await fetch(
      `https://api.github.com/repos/${githubOwner}/${githubRepo}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'screenshot_request',
          client_payload: { resourceIds },
        }),
      }
    );

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error('GitHub Dispatch failed:', errorText);
      return NextResponse.json({ error: 'Failed to trigger screenshot workflow' }, { status: 502 });
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
