import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * 更新资源的截图信息
 * 
 * 支持字段：
 * - screenshotUrl: 截图 CDN URL（必须）
 * - screenshotUpdatedAt: 更新时间（可选，默认当前时间）
 * - screenshotError: 错误信息（可选，成功时传 null 清空）
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 验证 API Key
        const authHeader = request.headers.get('Authorization')
        const expectedToken = `Bearer ${process.env.DATABASE_API_KEY}`

        if (!authHeader || authHeader !== expectedToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()
        const { screenshotUrl, screenshotUpdatedAt, screenshotError } = body

        // screenshotUrl 是必须的（除非只是报告错误）
        if (!screenshotUrl && screenshotError === undefined) {
            return NextResponse.json(
                { error: 'screenshotUrl is required unless reporting an error' },
                { status: 400 }
            )
        }

        // 构建更新对象
        const updateData: any = {}

        if (screenshotUrl) {
            updateData.screenshot_url = screenshotUrl
            updateData.screenshot_updated_at = screenshotUpdatedAt || new Date().toISOString()
            // 成功时清空错误
            updateData.screenshot_error = null
        }

        if (screenshotError !== undefined) {
            // 截断错误信息到 500 字符
            updateData.screenshot_error = screenshotError
                ? String(screenshotError).slice(0, 500)
                : null
        }

        // 更新资源的截图信息
        const { error } = await (supabase as any)
            .from('resources')
            .update(updateData)
            .eq('id', id)

        if (error) {
            console.error('Database update error:', error)
            throw error
        }

        return NextResponse.json({
            success: true,
            message: 'Screenshot info updated successfully'
        })
    } catch (error) {
        console.error('Failed to update screenshot info:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
