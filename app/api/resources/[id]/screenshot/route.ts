import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 更新资源的截图URL
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证 API Key
    const authHeader = request.headers.get('Authorization')
    const expectedToken = `Bearer ${process.env.DATABASE_API_KEY}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { screenshotUrl, screenshotUpdatedAt } = await request.json()
    
    if (!screenshotUrl) {
      return NextResponse.json({ error: 'screenshotUrl is required' }, { status: 400 })
    }

    // 更新资源的截图信息
    const { error } = await supabase
      .from('resources')
      .update({
        screenshot_url: screenshotUrl,
        screenshot_updated_at: screenshotUpdatedAt || new Date().toISOString()
      })
      .eq('id', params.id)
    
    if (error) {
      console.error('Database update error:', error)
      throw error
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Screenshot URL updated successfully'
    })
  } catch (error) {
    console.error('Failed to update screenshot URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}