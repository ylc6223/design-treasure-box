import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 获取所有资源（供 Workers 定时任务使用）
export async function GET(request: NextRequest) {
  try {
    // 验证 API Key
    const authHeader = request.headers.get('Authorization')
    const expectedToken = `Bearer ${process.env.DATABASE_API_KEY}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取所有资源的基本信息
    const { data: resources, error } = await supabase
      .from('resources')
      .select('id, name, url')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database query error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      total: resources.length,
      resources: resources
    })
  } catch (error) {
    console.error('Failed to fetch all resources:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}