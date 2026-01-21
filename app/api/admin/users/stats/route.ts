import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/auth';

/**
 * 用户统计数据接口
 */
interface UserStats {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  recentUsers: number;
}

/**
 * GET /api/admin/users/stats
 * 获取用户统计数据
 * 需要管理员权限
 */
export async function GET() {
  try {
    // 验证管理员权限
    await requireAdmin();
    const supabase = await createClient();

    // 获取总用户数
    const { count: totalUsers, error: totalError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Failed to fetch total users:', totalError);
      throw totalError;
    }

    // 获取管理员数量
    const { count: adminCount, error: adminError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN');

    if (adminError) {
      console.error('Failed to fetch admin count:', adminError);
      throw adminError;
    }

    // 获取普通用户数量
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'USER');

    if (userError) {
      console.error('Failed to fetch user count:', userError);
      throw userError;
    }

    // 获取近30天新增用户
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentUsers, error: recentError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) {
      console.error('Failed to fetch recent users:', recentError);
      throw recentError;
    }

    const stats: UserStats = {
      totalUsers: totalUsers || 0,
      adminCount: adminCount || 0,
      userCount: userCount || 0,
      recentUsers: recentUsers || 0,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Admin users stats GET error:', error);

    if (error.message === 'Unauthorized' || error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (error.message === 'Forbidden' || error.name === 'AuthorizationError') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
