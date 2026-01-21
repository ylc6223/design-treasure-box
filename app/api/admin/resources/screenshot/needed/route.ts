import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * 获取需要截图的资源列表（增量过滤）
 *
 * 过滤条件：
 * - screenshot_url IS NULL（从未生成过截图）
 * - screenshot_updated_at < NOW() - 7 days（截图已过期）
 *
 * @returns 返回截图工作流需要的最小字段：id, url
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 API Key
    const authHeader = request.headers.get('Authorization');
    const expectedToken = `Bearer ${process.env.DATABASE_API_KEY}`;

    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const specificIds = searchParams.get('ids');

    const supabase = await createAdminClient();
    let query = supabase.from('resources').select('id, url');

    if (specificIds) {
      // 场景 A: 指定 ID 截图（点名重截 - 强制重新抓取）
      const idArray = specificIds.split(',').filter(Boolean);
      query = query.in('id', idArray);
    } else {
      // 场景 B: 批量增量截图（定时巡检或全量补全 - 每批 50 条）
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .or(`screenshot_url.is.null,screenshot_updated_at.lt.${sevenDaysAgo}`)
        .order('created_at', { ascending: true })
        .limit(50);
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      total: resources.length,
      resources: resources,
    });
  } catch (error) {
    console.error('Failed to fetch resources needing screenshots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
