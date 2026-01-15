'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SearchInputProps {
  defaultValue?: string
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
}

/**
 * SearchInput 组件
 * 
 * 搜索输入框组件，支持：
 * - 输入搜索关键词
 * - 回车或点击搜索按钮触发搜索
 * - 自动导航到搜索结果页
 * 
 * 特性：
 * - 简洁的搜索界面
 * - 支持键盘快捷键（Enter）
 * - 响应式设计
 */
export function SearchInput({
  defaultValue = '',
  placeholder = '搜索设计资源...',
  className,
  onSearch,
}: SearchInputProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    // 调用回调函数（如果提供）
    onSearch?.(trimmedQuery)

    // 导航到搜索结果页
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-20"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          disabled={!query.trim()}
        >
          搜索
        </Button>
      </div>
    </form>
  )
}
