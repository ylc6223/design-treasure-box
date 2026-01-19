/**
 * 设计百宝箱截图服务 - Cloudflare Worker
 * 改造：解耦数据库，通过 Next.js API 进行任务获取和状态回填
 */

// @ts-ignore - Cloudflare-specific module
import puppeteer from '@cloudflare/puppeteer'

// Cloudflare-specific types
type R2Bucket = any;
type ScheduledEvent = any;
type ExecutionContext = any;

// 环境接口定义
interface Env {
  SCREENSHOT_BUCKET: R2Bucket
  MYBROWSER: any
  // 新增：Next.js API 配置
  API_BASE_URL: string
  DATABASE_API_KEY: string
  R2_PUBLIC_URL: string
}

// 资源接口定义
interface Resource {
  id: string
  url: string
}

// 批处理配置
// const BATCH_SIZE = 10 // 由 Next.js API 控制返回数量，这里设置一个上限安全值
const SCREENSHOT_TIMEOUT = 15000 // 15秒超时
const VIEWPORT_CONFIG = { width: 1200, height: 800 }
const JPEG_QUALITY = 80

export default {
  /**
   * 定时任务处理器
   */
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log('🚀 开始批量截图处理任务...')
    let browser = null

    try {
      // 第一步：任务发现 - 从 Next.js API 获取待处理资源
      console.log(`🔍 正在向 API 获取待处理资源...`)

      const neededResponse = await fetch(`${env.API_BASE_URL}/api/admin/resources/screenshot/needed`, {
        headers: {
          'Authorization': `Bearer ${env.DATABASE_API_KEY}`
        }
      })

      if (!neededResponse.ok) {
        throw new Error(`Failed to fetch tasks: ${neededResponse.status} ${await neededResponse.text()}`)
      }

      const { resources } = await neededResponse.json() as { resources: Resource[] }

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
        await processResource(resource, browser, env)
        // 批次间延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log('✅ 批量任务处理完成')

    } catch (error) {
      console.error('💥 批量处理任务失败:', error)
      throw error
    } finally {
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
      // 根路径
      if (path === '/') {
        return Response.json({
          service: 'Design Treasure Box Screenshot Service',
          version: '2.0.0 (Decoupled)',
          status: 'running',
          endpoints: {
            health: '/health',
            trigger: 'POST /trigger'
          }
        })
      }

      // 健康检查
      if (path === '/health') {
        return Response.json({ status: 'healthy', timestamp: new Date().toISOString() })
      }

      // 手动触发截图任务
      if (path === '/trigger') {
        // 这里可以接收特定的 resourceIds（由 Next.js 传过来）
        // 不过目前的 Worker 逻辑是从 needed 接口拉取，所以 /trigger 主要是触发拉取动作
        const scheduledHandler = this.scheduled.bind(this)
        ctx.waitUntil(scheduledHandler({} as ScheduledEvent, env, ctx))

        return Response.json({
          message: 'Screenshot sync triggered',
          timestamp: new Date().toISOString()
        })
      }

      // 图片服务 (R2 Proxy)
      if (path.startsWith('/images/')) {
        return handleImageRequest(request, env)
      }

      return Response.json({ error: 'Not found' }, { status: 404 })

    } catch (error) {
      console.error('HTTP request failed:', error)
      return Response.json({ error: 'Internal error' }, { status: 500 })
    }
  }
}

/**
 * 处理单个资源的截图生成
 */
async function processResource(
  resource: Resource,
  browser: any,
  env: Env
): Promise<void> {
  let page = null

  try {
    console.log(`📸 正在处理 ID: ${resource.id} URL: ${resource.url}`)

    page = await browser.newPage()
    await page.setViewport(VIEWPORT_CONFIG)

    // 导航
    await page.goto(resource.url, {
      waitUntil: 'networkidle2',
      timeout: SCREENSHOT_TIMEOUT
    })

    // 中文支持
    await page.addStyleTag({
      content: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap');
        * { font-family: 'Noto Sans SC', sans-serif !important; }
      `
    })

    await new Promise(resolve => setTimeout(resolve, 2000))

    // 截图
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: JPEG_QUALITY,
      fullPage: false
    })

    // 上传 R2
    const filename = `screenshots/${resource.id}.jpg`
    await env.SCREENSHOT_BUCKET.put(filename, screenshot, {
      httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, s-maxage=604800' }
    })

    const screenshotUrl = `${env.R2_PUBLIC_URL}/${filename}`

    // 回填 Next.js API
    const updateResponse = await fetch(`${env.API_BASE_URL}/api/admin/resources/screenshot/${resource.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${env.DATABASE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        screenshotUrl,
        screenshotUpdatedAt: new Date().toISOString()
      })
    })

    if (!updateResponse.ok) {
      throw new Error(`Update API failed: ${updateResponse.status} ${await updateResponse.text()}`)
    }

    console.log(`✅ ID: ${resource.id} 截图完成并上报成功`)

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`❌ ID: ${resource.id} 截图失败: ${errorMsg}`)

    // 上报错误给 API
    await fetch(`${env.API_BASE_URL}/api/admin/resources/screenshot/${resource.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${env.DATABASE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        screenshotError: errorMsg
      })
    }).catch(e => console.error('Failed to report error to API:', e))

  } finally {
    if (page !== null) {
      await page.close()
    }
  }
}

/**
 * 处理图片请求 (R2 Proxy)
 */
async function handleImageRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const filename = url.pathname.slice(1)

  try {
    const object = await env.SCREENSHOT_BUCKET.get(filename)
    if (!object) return new Response('Not found', { status: 404 })

    const headers = new Headers({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, s-maxage=604800',
      'ETag': object.etag || ''
    })

    const ifNoneMatch = request.headers.get('If-None-Match')
    if (ifNoneMatch === object.etag) return new Response(null, { status: 304, headers })

    return new Response(object.body, { headers })
  } catch (error) {
    return new Response('Error', { status: 500 })
  }
}