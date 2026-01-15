'use client'

import { useState, type FormEvent } from 'react'
import { MessageSquare, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollVisibility } from '@/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AIPromptInputProps {
  onSubmit: (prompt: string) => void
  placeholder?: string
  isLoading?: boolean
  className?: string
}

/**
 * AIPromptInput 组件
 * 
 * 固定底部悬浮的 AI Prompt 输入框，类似 ChatGPT 风格
 * 滚动时自动隐藏，停止滚动后延迟显示
 * 
 * @param onSubmit - 提交回调函数
 * @param placeholder - 输入框占位符
 * @param isLoading - 是否正在加载
 * @param className - 额外的 CSS 类名
 */
export function AIPromptInput({
  onSubmit,
  placeholder = '输入你想要的设计资源，AI 帮你找...',
  isLoading = false,
  className,
}: AIPromptInputProps) {
  const [value, setValue] = useState('')
  const isVisible = useScrollVisibility(300)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!value.trim() || isLoading) return
    
    onSubmit(value.trim())
    setValue('') // 清空输入框
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4',
        'transition-all duration-200 ease-out',
        isVisible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-5 opacity-0',
        className
      )}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          'flex h-14 items-center gap-3 rounded-[28px] border px-4',
          'border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl',
          'shadow-[0_4px_24px_var(--shadow)]',
          'transition-shadow duration-200',
          'focus-within:shadow-[0_4px_32px_var(--shadow-strong)]'
        )}
      >
        {/* 左侧图标 */}
        <MessageSquare className="h-5 w-5 flex-shrink-0 text-[var(--text-muted)]" />

        {/* 输入框 */}
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            'h-auto flex-1 border-0 bg-transparent px-0 text-base shadow-none',
            'placeholder:text-[var(--text-muted)]',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="AI 搜索输入框"
        />

        {/* 发送按钮 */}
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim() || isLoading}
          className={cn(
            'h-9 w-9 flex-shrink-0 rounded-full',
            'bg-[var(--accent)] text-[var(--accent-foreground)]',
            'transition-all duration-200',
            'hover:scale-110 hover:bg-[var(--accent)]',
            'disabled:pointer-events-none disabled:opacity-50',
            'active:scale-95'
          )}
          aria-label="发送"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </form>

      {/* 提示文字（可选） */}
      {isLoading && (
        <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
          AI 正在思考...
        </p>
      )}
    </div>
  )
}
