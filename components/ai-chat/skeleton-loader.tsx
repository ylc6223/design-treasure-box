'use client';

import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';

/**
 * 资源卡片骨架屏 (Modern)
 * 用于加载时显示占位
 */
export function ResourceCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm',
        'animate-pulse',
        className
      )}
    >
      {/* 缩略图占位 */}
      <div className="shrink-0 h-16 w-16 sm:h-20 sm:w-24 rounded-lg bg-muted/80 flex items-center justify-center border border-border/20">
        <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
      </div>

      {/* 内容区域占位 */}
      <div className="flex-1 min-w-0 space-y-2.5 py-0.5">
        <div className="space-y-1.5">
          <div className="h-4 w-3/4 rounded-md bg-muted/80" />
          <div className="h-3 w-1/2 rounded-md bg-muted/60" />
        </div>

        <div className="flex gap-2">
          <div className="h-5 w-14 rounded-full bg-muted/60" />
          <div className="h-5 w-10 rounded-full bg-muted/60" />
        </div>
      </div>
    </div>
  );
}

/**
 * 泳道骨架屏
 * 显示分组标题和多个资源卡片骨架
 */
export function SwimlaneSkeleton({ count = 2 }: { title?: string; count?: number }) {
  return (
    <div className="space-y-4">
      {/* 分组标题 */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-8 w-8 rounded-md bg-muted/40 animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-24 rounded bg-muted/50 animate-pulse" />
        </div>
      </div>

      {/* 资源卡片骨架 */}
      <div className="space-y-3 pl-4 border-l border-border/30 ml-4 py-1">
        {Array.from({ length: count }).map((_, i) => (
          <ResourceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * AI 响应骨架屏 (Enhanced)
 * 三阶段智能加载指示
 */
export function AIResponseSkeleton({
  stage: _stage,
  className,
}: {
  stage?: number;
  className?: string;
}) {
  return (
    <div className={cn('w-full max-w-2xl space-y-6', className)}>
      <SwimlaneSkeleton count={2} />
      <SwimlaneSkeleton count={2} />
    </div>
  );
}

/**
 * 搜索进度指示器 (Tiny Version)
 */
export function SearchProgress({
  analyzing: _analyzing,
  searching: _searching,
  organizing: _organizing,
}: {
  analyzing?: boolean;
  searching?: boolean;
  organizing?: boolean;
}) {
  // 简单实现，保留接口兼容性
  return null;
}
