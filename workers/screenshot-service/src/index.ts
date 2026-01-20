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
const SCREENSHOT_TIMEOUT = 30000 // 增加到 30秒以应对慢速网站
const WAIT_AFTER_LOAD = 3000 // 增加等待时间确保渲染完成
const VIEWPORT_CONFIG = { width: 1200, height: 800 }
const JPEG_QUALITY = 80

export default {
  /**
   * 定时任务处理器
   */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScreenshotSync(env, { useJitter: true }));
  },

  /**
   * HTTP 请求处理器
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // 🛡️ 安全检查：拦截所有非授权请求，防止机器人扫描消耗浏览器配额
    // 仅健康检查 /health 允许公开访问
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${env.DATABASE_API_KEY}`;

    if (path !== '/health' && authHeader !== expectedAuth) {
      console.warn(`🛡️ 拦截到未授权访问: ${path} 来自: ${request.headers.get('CF-Connecting-IP')}`);
      return new Response('Unauthorized Access Blocked', { status: 401 });
    }

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
        // 手动请求不需要 jitter，立即执行
        ctx.waitUntil(runScreenshotSync(env, { useJitter: false }))

        return Response.json({
          message: 'Screenshot sync triggered (Async)',
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
 * 核心同步逻辑
 */
async function runScreenshotSync(env: Env, options: { useJitter: boolean }) {
  // 1. 随机抖动 (0-30s) 只给定时任务用，手动点击即刻开始
  if (options.useJitter) {
    const jitter = Math.floor(Math.random() * 30000);
    console.log(`⏳ [Scheduled] 等待随机抖动 ${jitter}ms 避开启动高峰...`);
    await new Promise(resolve => setTimeout(resolve, jitter));
  }

  console.log('🚀 [Sync] 开始批量截图任务...');
  let browser = null;

  try {
    // 任务发现
    const neededResponse = await fetch(`${env.API_BASE_URL}/api/admin/resources/screenshot/needed`, {
      headers: { 'Authorization': `Bearer ${env.DATABASE_API_KEY}` }
    });

    if (!neededResponse.ok) {
      console.error(`❌ [Sync] 获取列表失败: ${neededResponse.status}`);
      return;
    }

    const { resources: allResources } = await neededResponse.json() as { resources: Resource[] };
    if (!allResources || allResources.length === 0) {
      console.log('✅ [Sync] 无待处理任务');
      return;
    }

    // 免费版硬限制：由于并发实例极低，这里进一步收缩到 3 个
    const resources = allResources.slice(0, 3);
    console.log(`📋 [Sync] 待处理: ${allResources.length}，本次处理: ${resources.length}`);

    // 启动浏览器
    console.log('🌐 [Sync] 正在尝试启动浏览器...');
    try {
      browser = await puppeteer.launch(env.MYBROWSER);
    } catch (e: any) {
      if (e.message.includes('429')) {
        console.error('🚫 [Cloudflare] 触发频率限制 (429)。请 15 分钟后再试，当前有多任务并行。');
      } else {
        console.error('💥 [Cloudflare] 启动浏览器失败:', e.message);
      }
      return; // 优雅退出，不抛出异常
    }

    for (const resource of resources) {
      try {
        await processResource(resource, browser, env);
      } catch (err: any) {
        console.error(`❌ [Sync] 处理 ID ${resource.id} 异常:`, err.message);
      }
      await new Promise(resolve => setTimeout(resolve, 1500)); // 增加间歇防止 CPU 突发
    }

    console.log('✅ [Sync] 批量处理流程结束');

  } catch (error: any) {
    console.error('💥 [Sync] 流程未捕获错误:', error.message);
  } finally {
    if (browser !== null) {
      await browser.close().catch(() => { });
      console.log('🔒 [Sync] 浏览器已释放');
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

    await new Promise(resolve => setTimeout(resolve, WAIT_AFTER_LOAD))

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
  } catch {
    return new Response('Error', { status: 500 })
  }
}