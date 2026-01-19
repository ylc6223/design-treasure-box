/**
 * 设计百宝箱截图服务 - Cloudflare Worker
 * 分批处理架构：每5分钟处理5个资源，避免超时
 */

import puppeteer from '@cloudflare/puppeteer'
import { createClient } from '@supabase/supabase-js'

// 环境接口定义
interface Env {
  SCREENSHOT_BUCKET: R2Bucket
  MYBROWSER: any
  SUPABASE_URL: string
  SUPABASE_SECRET_KEY: string
  R2_PUBLIC_URL: string
}

// 资源接口定义
interface Resource {
  id: string
  name: string
  url: string
  screenshot_url?: string
}

// 批处理配置
const BATCH_SIZE = 3 // 每批处理3个资源（适应免费计划30秒限制）
const SCREENSHOT_TIMEOUT = 15000 // 15秒超时
const VIEWPORT_CONFIG = { width: 1200, height: 800 }
const JPEG_QUALITY = 80

export default {
  /**
   * 定时任务处理器 - 每5分钟执行一次，处理5个资源
   */
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log('🚀 开始批量截图处理任务...')

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
    let browser = null

    try {
      // 第一步：任务发现 - 获取待处理的资源
      console.log(`🔍 正在获取 ${BATCH_SIZE} 个需要截图的资源...`)

      const { data: resources, error: fetchError } = await supabase
        .from('resources')
        .select('id, name, url, screenshot_url')
        .is('screenshot_url', null)
        .limit(BATCH_SIZE)
        .order('id')

      if (fetchError) {
        throw new Error(`Failed to fetch resources: ${fetchError.message}`)
      }

      if (!resources || resources.length === 0) {
        console.log('✅ 没有需要处理的资源')
        return
      }

      console.log(`📋 发现 ${resources.length} 个资源待处理`)

      // 第二步：启动浏览器
      console.log('🌐 正在启动浏览器...')
      browser = await puppeteer.launch(env.MYBROWSER)

      // 第三步：串行处理每个资源
      for (const resource of resources) {
        await processResource(resource, browser, env, supabase)

        // 批次间延迟，避免过度并发
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log('✅ 批量任务处理完成')

    } catch (error) {
      console.error('💥 批量处理任务失败:', error)
      throw error
    } finally {
      // 【关键】无论成功还是报错，都要释放浏览器实例
      if (browser !== null) {
        await browser.close()
        console.log('🔒 浏览器已关闭')
      }
    }
  },

  /**
   * HTTP 请求处理器
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    try {
      // 根路径 - 显示服务信息
      if (path === '/') {
        return Response.json({
          service: 'Design Treasure Box Screenshot Service',
          version: '1.0.0',
          endpoints: {
            health: '/health',
            trigger: 'POST /trigger',
            images: '/images/screenshots/{id}.jpg'
          },
          status: 'running',
          batchSize: BATCH_SIZE,
          schedule: 'Every 5 minutes'
        })
      }

      // 健康检查
      if (path === '/health') {
        return Response.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'screenshot-service',
          batchSize: BATCH_SIZE
        })
      }

      // 手动触发截图任务
      if (path === '/trigger') {
        // 手动触发截图任务 - 异步执行
        const scheduledHandler = this.scheduled.bind(this)
        ctx.waitUntil(scheduledHandler({} as ScheduledEvent, env, ctx))

        return Response.json({
          message: 'Screenshot batch triggered',
          method: request.method,
          batchSize: BATCH_SIZE,
          timestamp: new Date().toISOString()
        })
      }

      // 图片服务
      if (path.startsWith('/images/')) {
        return handleImageRequest(request, env)
      }

      return Response.json({ error: 'Not found' }, { status: 404 })

    } catch (error) {
      console.error('HTTP request failed:', error)
      return Response.json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  }
}

/**
 * 处理单个资源的截图生成
 */
async function processResource(
  resource: Resource,
  browser: any,
  env: Env,
  supabase: any
): Promise<void> {
  let page = null

  try {
    console.log(`📸 正在处理: ${resource.name} (${resource.url})`)

    // 创建新页面
    page = await browser.newPage()

    // 设置视口
    await page.setViewport(VIEWPORT_CONFIG)

    // 导航到页面
    await page.goto(resource.url, {
      waitUntil: 'networkidle2',
      timeout: SCREENSHOT_TIMEOUT
    })

    // 注入中文字体支持
    await page.addStyleTag({
      content: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap');
        * { font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif !important; }
      `
    })

    // 等待页面稳定
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 生成截图
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: JPEG_QUALITY,
      fullPage: false
    })

    // 生成文件名 - 使用资源ID确保唯一性
    const filename = `screenshots/${resource.id}.jpg`

    // 上传到R2
    await env.SCREENSHOT_BUCKET.put(filename, screenshot, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, s-maxage=604800' // 7天强缓存
      }
    })

    // 构建公网访问URL
    const screenshotUrl = `${env.R2_PUBLIC_URL}/${filename}`

    // 第三步：数据回填 - 更新Supabase
    const { error: updateError } = await supabase
      .from('resources')
      .update({
        screenshot_url: screenshotUrl,
        screenshot_updated_at: new Date().toISOString()
      })
      .eq('id', resource.id)

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log(`✅ ${resource.name} 截图完成`)

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`❌ ${resource.name} 截图失败: ${errorMsg}`)

    // 可选：记录失败状态到数据库
    await supabase
      .from('resources')
      .update({
        screenshot_error: errorMsg,
        screenshot_updated_at: new Date().toISOString()
      })
      .eq('id', resource.id)
      .catch(() => { }) // 忽略更新错误，避免双重失败

  } finally {
    // 【关键】无论成功还是报错，都要释放页面实例
    if (page !== null) {
      await page.close()
    }
  }
}

/**
 * 生成URL的MD5哈希值（备用方案）
 */
async function generateUrlHash(url: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(url)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 处理图片请求
 */
async function handleImageRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const filename = url.pathname.slice(1) // 移除开头的 '/'

  try {
    const object = await env.SCREENSHOT_BUCKET.get(filename)

    if (!object) {
      return new Response('Image not found', { status: 404 })
    }

    const headers = new Headers({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, s-maxage=604800', // 7天强缓存
      'ETag': object.etag || ''
    })

    // 支持304缓存
    const ifNoneMatch = request.headers.get('If-None-Match')
    if (ifNoneMatch && ifNoneMatch === object.etag) {
      return new Response(null, { status: 304, headers })
    }

    return new Response(object.body, { headers })

  } catch (error) {
    console.error('Error fetching image:', error)
    return new Response('Error fetching image', { status: 500 })
  }
}