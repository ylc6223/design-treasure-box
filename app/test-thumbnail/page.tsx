'use client'

import { ResourceThumbnail } from '@/components/resource-thumbnail'

export default function TestThumbnailPage() {
  const testUrls = [
    { url: 'https://coolors.co', name: 'Coolors' },
    { url: 'https://www.figma.com', name: 'Figma' },
    { url: 'https://tailwindcss.com', name: 'Tailwind CSS' },
  ]

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">ResourceThumbnail 测试</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testUrls.map((item) => (
          <div key={item.url} className="space-y-2">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <ResourceThumbnail
                url={item.url}
                name={item.name}
              />
            </div>
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.url}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">测试说明</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>组件会先尝试加载 Open Graph 图片</li>
          <li>如果 OG 图片失败，会自动回退到截图</li>
          <li>如果截图也失败，会显示占位图</li>
          <li>所有图片都通过 Microlink API 获取，零存储成本</li>
        </ul>
      </div>
    </div>
  )
}
