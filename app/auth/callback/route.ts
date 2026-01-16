// app/auth/callback/route.ts
// OAuth 回调处理

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    // 交换 code 为 session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      // 重定向到首页并显示错误
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }
  }

  // 成功后重定向到首页
  return NextResponse.redirect(origin)
}
