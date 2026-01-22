'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DatabaseCategory } from '@/types/category';
import * as LucideIcons from 'lucide-react';
import { LayoutGrid } from 'lucide-react';

export interface CategoryFilterProps {
  categories: DatabaseCategory[];
  activeCategory?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
  className?: string;
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
    <div className={cn('flex flex-wrap items-center gap-3 py-2', className)}>
      {/* 全部按钮 */}
      <Button
        variant={!activeCategory ? 'default' : 'secondary'}
        size="sm"
        onClick={() => onCategoryChange(undefined)}
        className={cn(
          'rounded-full h-9 px-5 transition-all duration-300',
          !activeCategory
            ? 'shadow-md scale-105 font-medium'
            : 'text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary'
        )}
      >
        <LayoutGrid className="mr-2 h-4 w-4" />
        全部
      </Button>

      {/* 分类按钮 */}
      {categories.map((category) => {
        // 动态获取图标组件
        const Icon = category.icon
          ? (LucideIcons[category.icon as keyof typeof LucideIcons] as React.ElementType)
          : null;

        const isActive = activeCategory === category.id;

        return (
          <Button
            key={category.id}
            variant={isActive ? 'default' : 'secondary'}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'rounded-full h-9 px-4 transition-all duration-300 border border-transparent',
              isActive
                ? 'shadow-md scale-105 font-medium text-white'
                : 'text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary'
            )}
            style={
              isActive
                ? {
                    backgroundColor: category.color,
                    borderColor: category.color,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }
                : undefined
            }
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {category.name}
          </Button>
        );
      })}
    </div>
  );
}
