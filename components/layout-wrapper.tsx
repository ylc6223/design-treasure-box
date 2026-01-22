'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DockSidebar } from './dock-sidebar';
import { AIPromptInput } from './ai-prompt-input';
import { AIChatInterface } from './ai-chat-interface';
import { Header } from './header';
import { BackToTop } from './back-to-top';
import { useCategories } from '@/hooks/use-categories';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface LayoutWrapperProps {
  children: React.ReactNode;
  profile?: Profile | null;
}

/**
 * LayoutWrapper 组件
 *
 * 客户端包装组件，处理导航和交互逻辑
 * 注意：管理后台路径（/admin）不使用此布局
 */
export function LayoutWrapper({ children, profile }: LayoutWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: categories = [] } = useCategories();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined);

  // 如果是管理后台路径，直接返回 children，不渲染前端布局
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  // 从路径中提取当前分类
  const activeCategory = pathname.startsWith('/category/') ? pathname.split('/')[2] : undefined;

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'favorites') {
      router.push('/favorites');
    } else if (categoryId) {
      router.push(`/category/${categoryId}`);
    } else {
      router.push('/');
    }
  };

  const handleAIPromptSubmit = (prompt: string) => {
    console.log('AI Prompt:', prompt);
    setInitialQuery(prompt);
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
    setInitialQuery(undefined);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* 顶部 Header */}
      <Header profile={profile} onAskAI={() => setIsChatOpen(true)} />

      <div className="flex flex-1">
        {/* 左侧 Dock 导航 */}
        <DockSidebar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />

        {/* 主内容区 */}
        <main className="flex-1 md:mx-20">{children}</main>
      </div>

      {/* 底部 AI Prompt 输入框 - 聊天面板打开时自动隐藏 */}
      <AIPromptInput onSubmit={handleAIPromptSubmit} isHidden={isChatOpen} />

      {/* 回到顶部按钮 */}
      <BackToTop />

      {/* AI Chat Interface - 右侧滑出聊天界面 */}
      <AIChatInterface isOpen={isChatOpen} onClose={handleChatClose} initialQuery={initialQuery} />
    </div>
  );
}
