// app/auth/callback/route.ts
// OAuth 回调处理

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // 优先使用环境变量中的 APP_URL，确保在多环境下跳转到正确的域名
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !user) {
      console.error('Auth callback error:', authError);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    // 获取用户权限角色以决定跳转目标
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const profile = profileData as Profile | null;

    // 默认跳转：管理员去后台，普通用户留首页
    let nextTarget = '/';
    if (profile?.role === 'ADMIN') {
      nextTarget = '/admin';
    }

    // 如果 URL 中手动指定了 next 参数，则优先使用该参数
    const nextParam = requestUrl.searchParams.get('next');
    const finalTarget = nextParam || nextTarget;

    return NextResponse.redirect(`${origin}${finalTarget}`);
  }

  return NextResponse.redirect(origin);
}
