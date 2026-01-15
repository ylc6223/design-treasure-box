'use client'

import { useRouter, usePathname } from 'next/navigation'
import { DockSidebar } from './dock-sidebar'
import { AIPromptInput } from './ai-prompt-input'
import type { Category } from '@/types'

interface LayoutWrapperProps {
  categories: Category[]
  children: React.ReactNode
}

/**
 * LayoutWrapper 组件
 * 
 * 客户端包装组件，处理导航和交互逻辑
 */
export function LayoutWrapper({ categories, children }: LayoutWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()

  // 从路径中提取当前分类
  const activeCategory = pathname.startsWith('/category/')
    ? pathname.split('/')[2]
    : undefined

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'favorites') {
      router.push('/favorites')
    } else if (categoryId) {
      router.push(`/category/${categoryId}`)
    } else {
      router.push('/')
    }
  }

  const handleAIPromptSubmit = (prompt: string) => {
    console.log('AI Prompt:', prompt)
    // TODO: 实现 AI 搜索功能
    // router.push(`/search?q=${encodeURIComponent(prompt)}`)
  }

  return (
    <div className="relative flex min-h-screen">
      {/* 左侧 Dock 导航 */}
      <DockSidebar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* 主内容区 */}
      <main className="flex-1 md:ml-20">{children}</main>

      {/* 底部 AI Prompt 输入框 */}
      <AIPromptInput onSubmit={handleAIPromptSubmit} />
    </div>
  )
}
