// lib/screenshot-service.ts
interface ScreenshotResponse {
  success: boolean
  screenshotUrl?: string
  cached?: boolean
  hoursOld?: number
  error?: string
}

class ScreenshotService {
  private readonly baseUrl: string
  private readonly apiToken: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SCREENSHOT_SERVICE_URL || 'https://design-treasure-screenshot.your-account.workers.dev'
    this.apiToken = process.env.SCREENSHOT_API_TOKEN || ''
    
    if (!this.apiToken) {
      console.warn('SCREENSHOT_API_TOKEN not configured')
    }
  }

  async generateScreenshot(resourceId: string, targetUrl: string): Promise<ScreenshotResponse> {
    if (!this.apiToken) {
      return {
        success: false,
        error: 'Screenshot service not configured'
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          resourceId,
          targetUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Screenshot service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async batchGenerateScreenshots(resources: Array<{ id: string; url: string }>): Promise<ScreenshotResponse[]> {
    if (!this.apiToken) {
      return resources.map(() => ({
        success: false,
        error: 'Screenshot service not configured'
      }))
    }

    // 并发限制为3个，避免过载
    const results: ScreenshotResponse[] = []
    const batchSize = 3
    
    for (let i = 0; i < resources.length; i += batchSize) {
      const batch = resources.slice(i, i + batchSize)
      const batchPromises = batch.map(resource => 
        this.generateScreenshot(resource.id, resource.url)
      )
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            success: false,
            error: `Failed to generate screenshot for ${batch[index].url}: ${result.reason}`
          })
        }
      })
      
      // 批次间延迟，避免过载
      if (i + batchSize < resources.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

export const screenshotService = new ScreenshotService()