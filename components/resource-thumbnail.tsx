'use client'

import * as React from 'react'
import Image from 'next/image'
import { ImageIcon, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ResourceThumbnailProps {
  screenshotUrl?: string
  name: string
  className?: string
  priority?: boolean
}

/**
 * ResourceThumbnail 组件
 * 
 * 显示资源截图，支持不同状态的 UI 反馈
 * 图片通过 Cloudflare CDN 缓存，无需客户端缓存逻辑
 */
export function ResourceThumbnail({
  screenshotUrl,
  name,
  className,
  priority = false,
}: ResourceThumbnailProps) {
  const [imageError, setImageError] = React.useState(false)

  // 渲染占位图
  const renderPlaceholder = (message: string) => (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-muted',
        className
      )}
    >
      <div className="text-center space-y-2 p-4">
        <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )

  // 如果没有截图URL或加载失败，显示占位图
  if (!screenshotUrl || imageError) {
    return renderPlaceholder(!screenshotUrl ? '暂无截图' : '图片加载失败')
  }

  return (
    <Image
      src={screenshotUrl}
      alt={name}
      fill
      className={cn(
        'object-cover transition-transform duration-300 group-hover:scale-105',
        className
      )}
      loading={priority ? undefined : 'lazy'}
      priority={priority}
      onError={() => setImageError(true)}
    />
  )
}
