import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * 获取需要截图的资源列表（增量过滤）
 * 
 * 过滤条件：
 * - screenshot_url IS NULL（从未生成过截图）
 * - screenshot_updated_at < NOW() - 7 days（截图已过期）
 * 
 * @returns 仅返回 Worker 需要的最小字段：id, url
 */
export async function GET(request: NextRequest) {
    try {
        // 验证 API Key
        const authHeader = request.headers.get('Authorization')
        const expectedToken = `Bearer ${process.env.DATABASE_API_KEY}`

        if (!authHeader || authHeader !== expectedToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()

        // 计算 7 天前的时间
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        // 获取需要截图的资源（增量过滤）
        const { data: resources, error } = await supabase
            .from('resources')
            .select('id, url')
            .or(`screenshot_url.is.null,screenshot_updated_at.lt.${sevenDaysAgo}`)
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
        console.error('Failed to fetch resources needing screenshots:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
