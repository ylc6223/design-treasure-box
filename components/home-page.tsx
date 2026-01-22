'use client';

import { useState } from 'react';
import { MasonicGrid } from '@/components/masonic-grid';
import { CategoryFilter } from '@/components/category-filter';
import { FeaturedSections } from '@/components/featured-sections';
import { useFavorites, useInfiniteResources, useHotResources, useLatestResources } from '@/hooks';
import { Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';
import { AnimatePresence, motion } from 'motion/react';

/**
 * 首页组件
 *
 * 职责：
 * 1. 协调分类筛选状态
 * 2. 集成热门、最新及瀑布流资源列表
 * 3. 处理资源收藏与访问逻辑
 *
 * 数据流策略：
 * - 采用按需加载：热门/最新资源与主列表分页请求并行，互不阻塞。
 * - 列表分页：使用 useInfiniteResources 实现后端分页，显著提升大数据量下的首屏速度。
 */
export function HomePage() {
  // --- 1. 状态与基础数据获取 ---

  // 获取分类列表（用于筛选栏）
  const { data: categories = [] } = useCategories();

  // 当前激活的分类 ID，undefined 表示“全部”
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

  // --- 2. 推荐数据获取 (Hot & Latest) ---

  // 获取热门资源 (Top 8)，仅在首页“全部”分类下展示
  const { data: hotResources = [] } = useHotResources();

  // 获取最新收录资源 (Top 8)
  const { data: latestResources = [] } = useLatestResources();

  // --- 3. 核心瀑布流列表 (Infinite Scroll) ---

  // 收藏功能 Hook
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();

  /**
   * 无限滚动 Hook
   * 逻辑：根据 activeCategory 向后端请求分页数据
   * 返回 resources 为已加载的所有页面的展平数组
   */
  const {
    resources,
    hasMore,
    loadMore,
    isFetchingNextPage,
    isLoading: isListLoading,
  } = useInfiniteResources({
    categoryId: activeCategory,
  });

  // --- 4. 交互处理函数 ---

  /**
   * 处理收藏切换
   */
  const handleFavorite = (resourceId: string) => {
    if (isFavorited(resourceId)) {
      removeFavorite(resourceId);
    } else {
      addFavorite(resourceId);
    }
  };

  /**
   * 处理分类切换
   */
  const handleCategoryChange = (categoryId: string | undefined) => {
    setActiveCategory(categoryId);
  };

  // --- 5. 加载状态处理 ---
  // [极致优化]：内容优先策略。
  // 首页内容是公开的，即便身份验证（authLoading）还在后台进行，
  // 只要资源列表（isListLoading）加载完成，就应立即向用户展示内容。
  const isInitialLoading = isListLoading && resources.length === 0;

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
        <p className="mt-4 text-sm text-[var(--text-muted)]">正在搜罗优质设计...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 主内容容器 */}
      <div className="container px-4 py-8">
        {/* 1. 欢迎与标题区域 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">设计百宝箱</h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            精选设计资源聚合入口，为设计师和开发者提供高质量的设计美学参考
          </p>
        </div>

        {/* 2. 分类筛选栏 (调整到推荐板块上方，避免布局跳动) */}
        <div className="mb-6 sticky top-16 z-30 bg-background/95 backdrop-blur-md py-4 -mx-4 px-4 border-b border-border/40 transition-all">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            className="justify-center"
          />
        </div>

        {/* 3. 推荐板块 (热门 + 最新) 
            策略：仅在未选择特定分类时（即“全部”视图）展示，保持界面简洁 
            优化：添加高度过渡动画，减少视觉突变
        */}
        <AnimatePresence>
          {!activeCategory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <FeaturedSections
                hotResources={hotResources}
                latestResources={latestResources}
                isFavorited={isFavorited}
                onFavorite={handleFavorite}
                onVisit={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. 瀑布流资源网格
            实现：内部集成了无限滚动监听，到底部自动触发 onLoadMore
        */}
        <MasonicGrid
          resources={resources}
          hasMore={hasMore}
          isLoading={isFetchingNextPage}
          onLoadMore={loadMore}
          isFavorited={isFavorited}
          onFavorite={handleFavorite}
        />
      </div>
    </div>
  );
}
