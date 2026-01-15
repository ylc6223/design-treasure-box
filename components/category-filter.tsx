'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Category } from '@/types'

export interface CategoryFilterProps {
  categories: Category[]
  activeCategory?: string
  onCategoryChange: (categoryId: string | undefined) => void
  className?: string
}

/**
 * CategoryFilter 组件
 * 
 * 分类筛选标签栏，用于在瀑布流上方切换不同分类
 * 
 * @param categories - 分类列表
 * @param activeCategory - 当前激活的分类 ID
 * @param onCategoryChange - 分类切换回调
 * @param className - 额外的 CSS 类名
 */
export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}: CategoryFilterProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* 全部按钮 */}
      <Button
        variant={!activeCategory ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange(undefined)}
        className={cn(
          'rounded-full transition-all',
          !activeCategory && 'bg-[var(--accent)] text-[var(--accent-foreground)]'
        )}
      >
        全部
      </Button>

      {/* 分类按钮 */}
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={activeCategory === category.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            'rounded-full transition-all',
            activeCategory === category.id &&
              'text-[var(--accent-foreground)]'
          )}
          style={
            activeCategory === category.id
              ? { backgroundColor: category.color }
              : undefined
          }
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
