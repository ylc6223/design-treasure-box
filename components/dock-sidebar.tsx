'use client'

import { type DatabaseCategory } from '@/types/category'
import {
  Palette,
  Code,
  Type,
  Shapes,
  Sparkles,
  Globe,
  Layout,
  Smartphone,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// 图标映射
const iconMap = {
  Palette,
  Code,
  Type,
  Shapes,
  Sparkles,
  Globe,
  Layout,
  Smartphone,
  Heart,
}

interface DockSidebarProps {
  categories: DatabaseCategory[]
  activeCategory?: string
  onCategoryClick: (categoryId: string) => void
  className?: string
}

interface DockItemProps {
  icon: keyof typeof iconMap
  label: string
  isActive?: boolean
  onClick: () => void
  color?: string
}

function DockItem({ icon, label, isActive, onClick, color }: DockItemProps) {
  const Icon = iconMap[icon]

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-lg',
              'transition-all duration-150 ease-out',
              'hover:scale-115 hover:bg-surface',
              isActive && 'bg-surface'
            )}
            aria-label={label}
          >
            {/* 激活状态指示器 */}
            {isActive && (
              <div
                className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-accent"
                style={color ? { backgroundColor: color } : undefined}
              />
            )}
            
            <Icon
              className={cn(
                'h-6 w-6 transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
              style={isActive && color ? { color } : undefined}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * DockSidebar 组件
 * 
 * macOS 风格的侧边栏导航，固定在左侧，垂直居中紧凑型布局
 * 
 * @param categories - 分类列表
 * @param activeCategory - 当前激活的分类 ID
 * @param onCategoryClick - 分类点击回调
 * @param className - 额外的 CSS 类名
 */
export function DockSidebar({
  categories,
  activeCategory,
  onCategoryClick,
  className,
}: DockSidebarProps) {
  return (
    <>
      {/* 桌面端 Dock */}
      <aside
        className={cn(
          'fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 md:block',
          className
        )}
      >
        <div
          className={cn(
            'flex w-16 flex-col items-center gap-1 rounded-2xl border p-2',
            'border-border bg-card/80 backdrop-blur-xl',
            'shadow-lg'
          )}
        >
          {/* 分类图标 */}
          {categories.map((category) => (
            <DockItem
              key={category.id}
              icon={category.icon as keyof typeof iconMap}
              label={category.name}
              isActive={activeCategory === category.id}
              onClick={() => onCategoryClick(category.id)}
              color={category.color}
            />
          ))}

          {/* 分隔线 */}
          <div className="my-1 h-px w-8 bg-border" />

          {/* 收藏入口 */}
          <DockItem
            icon="Heart"
            label="我的收藏"
            isActive={activeCategory === 'favorites'}
            onClick={() => onCategoryClick('favorites')}
          />
        </div>
      </aside>

      {/* 移动端底部 Tab Bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 md:hidden',
          'border-t border-border bg-card/80 backdrop-blur-xl',
          'shadow-lg'
        )}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {/* 显示前 4 个分类 + 收藏 */}
          {categories.slice(0, 4).map((category) => {
            const Icon = iconMap[category.icon as keyof typeof iconMap]
            const isActive = activeCategory === category.id

            return (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 transition-colors',
                  isActive && 'text-foreground',
                  !isActive && 'text-muted-foreground'
                )}
                aria-label={category.name}
              >
                <Icon className="h-5 w-5" style={isActive ? { color: category.color } : undefined} />
                <span className="text-xs">{category.name}</span>
              </button>
            )
          })}

          {/* 收藏 */}
          <button
            onClick={() => onCategoryClick('favorites')}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 transition-colors',
              activeCategory === 'favorites' && 'text-foreground',
              activeCategory !== 'favorites' && 'text-muted-foreground'
            )}
            aria-label="我的收藏"
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">收藏</span>
          </button>
        </div>
      </nav>
    </>
  )
}
