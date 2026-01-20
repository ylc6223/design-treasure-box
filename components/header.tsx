'use client';

import Link from 'next/link';
import { Heart, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { LoginDialog } from './auth/login-dialog';
import { UserMenu } from './auth/user-menu';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';
import { useState } from 'react';
import { useAuthStore } from '@/hooks/use-auth-store';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface HeaderProps {
  className?: string;
  profile?: Profile | null;
}

/**
 * Header 组件
 *
 * 顶部导航栏，包含：
 * - Logo
 * - 主题切换按钮
 * - 收藏入口
 * - 用户菜单/登录按钮
 *
 * 特性：
 * - 简洁的顶部导航
 * - 响应式设计
 */
export function Header({ className, profile }: HeaderProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const storeProfile = useAuthStore((state) => state.profile);
  const currentProfile = storeProfile || profile;

  return (
    <header className={cn('sticky top-0 z-40 w-full border-b bg-surface', className)}>
      <div className="container px-4 mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <span className="text-lg font-bold">设</span>
            </div>
            <span className="hidden font-bold sm:inline-block">设计百宝箱</span>
          </Link>

          {/* 右侧操作区域 */}
          <div className="flex items-center space-x-1 shrink-0">
            {/* 收藏入口 */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <Link href="/favorites">
                <Heart className="h-5 w-5" />
                <span className="sr-only">我的收藏</span>
              </Link>
            </Button>

            {/* 用户菜单或登录按钮 */}
            {currentProfile ? (
              <UserMenu profile={currentProfile} />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLoginOpen(true)}
                className="hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="登录"
              >
                <UserCircle className="h-5 w-5" />
              </Button>
            )}

            {/* 主题切换 */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* 登录对话框 */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  );
}
