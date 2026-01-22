'use client';

import Link from 'next/link';
import { Heart, UserCircle, Menu, Home, Shield, LogOut, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { LoginDialog } from './auth/login-dialog';
import { UserMenu } from './auth/user-menu';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';
import { useState } from 'react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface HeaderProps {
  className?: string;
  profile?: Profile | null;
  onAskAI?: () => void;
}

export function Header({ className, profile, onAskAI }: HeaderProps) {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const storeProfile = useAuthStore((state) => state.profile);
  const currentProfile = storeProfile || profile;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    router.refresh();
  };

  return (
    <header
      className={cn('sticky top-0 z-40 w-full border-b bg-surface/80 backdrop-blur-md', className)}
    >
      <div className="container px-4 mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <span className="text-lg font-bold">设</span>
            </div>
            <span className="font-bold tracking-tight text-lg">设计百宝箱</span>
          </Link>

          {/* 右侧操作区域 */}
          <div className="flex items-center gap-1">
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onAskAI}
                className="justify-start md:justify-center font-semibold gap-2"
              >
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-base tracking-tight">问AI</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="justify-start md:justify-center font-medium"
              >
                <Link href="/favorites">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>

              {currentProfile ? (
                <UserMenu profile={currentProfile} />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLoginOpen(true)}
                  className="justify-start md:justify-center font-medium"
                >
                  <UserCircle className="h-5 w-5" />
                </Button>
              )}
            </div>

            <ThemeToggle />

            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0">
                  <SheetHeader className="p-6 border-b text-left">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs">
                        设
                      </div>
                      设计百宝箱
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col h-[calc(100vh-80px)]">
                    <div className="flex-1 p-4 space-y-2">
                      <p className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-4">
                        导航菜单
                      </p>

                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 rounded-xl"
                        asChild
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href="/">
                          <Home className="mr-3 h-5 w-5" /> 首页探索
                        </Link>
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 rounded-xl"
                        onClick={() => {
                          onAskAI?.();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Sparkles className="mr-3 h-5 w-5 text-primary" /> AI 设计助手
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 rounded-xl"
                        asChild
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href="/favorites">
                          <Heart className="mr-3 h-5 w-5" /> 我的收藏
                        </Link>
                      </Button>

                      {currentProfile && (
                        <>
                          <div className="h-px bg-border my-4" />
                          <p className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-4">
                            账号管理
                          </p>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-xl"
                            onClick={() => {
                              router.push('/profile');
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <User className="mr-3 h-5 w-5" /> 个人资料
                          </Button>
                          {currentProfile.role === 'ADMIN' && (
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-12 rounded-xl"
                              onClick={() => {
                                router.push('/admin');
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <Shield className="mr-3 h-5 w-5" /> 管理后台
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={handleSignOut}
                          >
                            <LogOut className="mr-3 h-5 w-5" /> 退出登录
                          </Button>
                        </>
                      )}
                    </div>

                    {!currentProfile && (
                      <div className="p-4 border-t bg-muted/20">
                        <Button
                          className="w-full h-12 rounded-xl font-bold"
                          onClick={() => {
                            setIsLoginOpen(true);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          立即登录
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  );
}
