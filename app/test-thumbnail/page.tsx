'use client'

import { ResourceThumbnail } from '@/components/resource-thumbnail'

export default function TestThumbnailPage() {
  const testUrls = [
    { 
      url: 'https://coolors.co', 
      name: 'Coolors',
      screenshotUrl: 'https://screenshots.your-domain.com/example1.jpg',
      screenshotStatus: 'success' as const
    },
    { 
      url: 'https://www.figma.com', 
      name: 'Figma',
      screenshotStatus: 'generating' as const
    },
    { 
      url: 'https://tailwindcss.com', 
      name: 'Tailwind CSS',
      screenshotStatus: 'failed' as const
    },
  ]

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">ResourceThumbnail 测试</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testUrls.map((item) => (
          <div key={item.url} className="space-y-2">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <ResourceThumbnail
                screenshotUrl={item.screenshotUrl}
                name={item.name}
              />
            </div>
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.url}</p>
            <p className="text-xs text-blue-600">状态: {item.screenshotStatus}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">测试说明</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>组件直接使用 Microlink 截图 API 获取网站截图</li>
          <li>如果截图失败，会显示占位图</li>
          <li>所有图片都通过 Microlink API 获取，零存储成本</li>
          <li>带有智能缓存和请求去重机制</li>
        </ul>
      </div>
    </div>
  )
}
