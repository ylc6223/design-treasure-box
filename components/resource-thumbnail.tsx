'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface ResourceThumbnailProps {
  url: string
  name: string
  className?: string
  priority?: boolean
}

/**
 * ResourceThumbnail 组件
 * 
 * 使用 Microlink API 自动获取网站图片
 * 优先级：Open Graph 图片 → 截图 → 占位图
 * 
 * 优点：
 * - 零存储成本 - 不保存任何图片文件
 * - 零后端压力 - 前端直接调用 API
 * - 完全免费 - Microlink 免费额度足够使用
 * - 自动缓存 - Microlink 自动缓存结果
 * - 实时更新 - 网站更新后自动获取新图片
 */
export function ResourceThumbnail({
  url,
  name,
  className,
  priority = false,
}: ResourceThumbnailProps) {
  const [imageError, setImageError] = React.useState(false)
  const [useScreenshot, setUseScreenshot] = React.useState(false)

  // 构造 Microlink API URL
  // 优先使用 Open Graph 图片（官方图片，质量好）
  const getImageUrl = React.useCallback(() => {
    const encodedUrl = encodeURIComponent(url)
    
    if (useScreenshot) {
      // 回退到截图
      return `https://api.microlink.io/?url=${encodedUrl}&screenshot=true&meta=false&embed=screenshot.url`
    }
    
    // 优先使用 OG 图片
    return `https://api.microlink.io/?url=${encodedUrl}&meta=false&embed=image.url`
  }, [url, useScreenshot])

  const handleError = React.useCallback(() => {
    if (!useScreenshot) {
      // 第一次失败，尝试使用截图
      setUseScreenshot(true)
      setImageError(false)
    } else {
      // 截图也失败，显示占位图
      setImageError(true)
    }
  }, [useScreenshot])

  // 当 URL 变化时重置状态
  React.useEffect(() => {
    setImageError(false)
    setUseScreenshot(false)
  }, [url])

  if (imageError) {
    // 占位图
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-muted',
          className
        )}
      >
        <div className="text-center space-y-2 p-4">
          <div className="text-4xl">🖼️</div>
          <p className="text-sm text-muted-foreground">图片加载失败</p>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={getImageUrl()}
      alt={name}
      fill
      className={cn(
        'object-cover transition-transform duration-300 group-hover:scale-105',
        className
      )}
      loading={priority ? undefined : 'lazy'}
      priority={priority}
      onError={handleError}
      unoptimized // Microlink 已经优化过图片
    />
  )
}
