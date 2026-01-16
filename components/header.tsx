'use client'

import Link from 'next/link'
import { Heart, Search, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { SearchInput } from './search-input'
import { LoginDialog } from './auth/login-dialog'
import { UserMenu } from './auth/user-menu'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'
import type { Database } from '@/types/database'
import { useState } from 'react'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface HeaderProps {
  categories: Category[]
  activeCategory?: string
  onCategoryChange?: (categoryId: string) => void
  showSearch?: boolean
  className?: string
  profile?: Profile | null
}

/**
 * Header 组件
 * 
 * 顶部导航栏，包含：
 * - Logo
 * - 分类标签切换
 * - 主题切换按钮
 * - 收藏入口
 * 
 * 特性：
 * - 简洁的顶部导航
 * - 分类标签横向滚动
 * - 响应式设计
 */
export function Header({
  categories,
  activeCategory,
  onCategoryChange,
  showSearch = true,
  className,
  profile,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <span className="text-lg font-bold">设</span>
          </div>
          <span className="hidden font-bold sm:inline-block">
            设计百宝箱
          </span>
        </Link>

        {/* 分类标签 */}
        <nav className="flex flex-1 items-center justify-center px-4">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
            {/* 全部 */}
            <Button
              variant={!activeCategory ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onCategoryChange?.('')}
              asChild={!onCategoryChange}
              className="shrink-0"
            >
              {onCategoryChange ? (
                <span>全部</span>
              ) : (
                <Link href="/">全部</Link>
              )}
            </Button>

            {/* 分类标签 */}
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onCategoryChange?.(category.id)}
                asChild={!onCategoryChange}
                className="shrink-0"
              >
                {onCategoryChange ? (
                  <span>{category.name}</span>
                ) : (
                  <Link href={`/category/${category.id}`}>{category.name}</Link>
                )}
              </Button>
            ))}
          </div>
        </nav>

        {/* 右侧操作 */}
        <div className="flex items-center space-x-2">
          {/* 搜索按钮（移动端） */}
          {showSearch && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden"
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">搜索</span>
              </Button>

              {/* 搜索输入框（桌面端） */}
              <div className="hidden md:block w-64">
                <SearchInput placeholder="搜索资源..." />
              </div>
            </>
          )}

          {/* 收藏入口 */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/favorites">
              <Heart className="h-5 w-5" />
              <span className="sr-only">我的收藏</span>
            </Link>
          </Button>

          {/* 用户菜单或登录按钮 */}
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsLoginOpen(true)}
              className="hidden sm:inline-flex"
            >
              <LogIn className="mr-2 h-4 w-4" />
              登录
            </Button>
          )}

          {/* 主题切换 */}
          <ThemeToggle />
        </div>
      </div>

      {/* 移动端搜索栏 */}
      {showSearch && isSearchOpen && (
        <div className="border-t px-4 py-3 md:hidden">
          <SearchInput placeholder="搜索资源..." />
        </div>
      )}

      {/* 登录对话框 */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  )
}
