'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import {
  ChevronRight,
  Sparkles,
  Star,
  LayoutTemplate,
  BoxSelect,
  Layers,
  Palette,
  Type,
  Image as ImageIcon,
  PenTool,
  Box,
  Moon,
  LayoutGrid,
  Search,
} from 'lucide-react';
import type { SearchResult } from '@/types/ai-chat';
import type { Resource } from '@/types';
import { ResourceInlineCard } from './resource-inline-card';

interface SwimlaneGroupProps {
  results: SearchResult[];
  onResourceClick: (resource: Resource) => void;
  onFavorite: (resourceId: string) => void;
  onVisit: (resourceId: string) => void;
  className?: string;
  groupBy?: 'category' | 'style' | 'relevance';
}

/**
 * 泳道式分组展示
 * 按类别、风格或相关度分组展示搜索结果
 */
export function SwimlaneGroup({
  results,
  onResourceClick,
  onFavorite,
  onVisit,
  className,
  groupBy = 'relevance',
}: SwimlaneGroupProps) {
  // 分组逻辑
  const groups = useMemo(() => {
    if (results.length === 0) return [];

    switch (groupBy) {
      case 'category':
        return groupByCategory(results);
      case 'style':
        return groupByStyle(results);
      case 'relevance':
      default:
        return groupByRelevance(results);
    }
  }, [results, groupBy]);

  return (
    <div className={cn('space-y-6', className)}>
      {groups.map((group, groupIndex) => (
        <SwimlaneLane
          key={group.title}
          title={group.title}
          icon={group.icon}
          results={group.results}
          onResourceClick={onResourceClick}
          onFavorite={onFavorite}
          onVisit={onVisit}
          delay={groupIndex * 0.15}
        />
      ))}
    </div>
  );
}

interface GroupResult {
  title: string;
  icon?: React.ReactNode;
  results: SearchResult[];
}

/**
 * 获取类别图标
 */
function getCategoryIcon(category: string): React.ReactNode {
  const iconClass = 'h-4 w-4 text-primary';

  switch (category) {
    case 'website':
      return <LayoutTemplate className={iconClass} />;
    case 'icons':
      return <BoxSelect className={iconClass} />;
    case 'ui-kits':
      return <Layers className={iconClass} />;
    case 'color':
      return <Palette className={iconClass} />;
    case 'fonts':
      return <Type className={iconClass} />;
    case 'illustrations':
      return <ImageIcon className={iconClass} />;
    case 'tools':
      return <PenTool className={iconClass} />;
    default:
      return <Box className={iconClass} />;
  }
}

/**
 * 获取风格图标
 */
function getStyleIcon(style: string): React.ReactNode {
  const iconClass = 'h-4 w-4 text-violet-500';

  switch (style) {
    case '极简风格':
      return <LayoutGrid className={iconClass} />;
    case '3D 风格':
      return <Box className={iconClass} />;
    case '扁平风格':
      return <Layers className={iconClass} />;
    case '渐变风格':
      return <Palette className={iconClass} />;
    case '暗黑模式':
      return <Moon className={iconClass} />;
    default:
      return <Sparkles className={iconClass} />;
  }
}

/**
 * 按类别分组
 */
function groupByCategory(results: SearchResult[]): GroupResult[] {
  const categoryMap = new Map<string, SearchResult[]>();

  for (const result of results) {
    const category = result.resource.categoryId || '其他';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(result);
  }

  return Array.from(categoryMap.entries()).map(([category, items]) => ({
    title: getCategoryLabel(category),
    icon: getCategoryIcon(category),
    results: items,
  }));
}

/**
 * 按风格分组
 */
function groupByStyle(results: SearchResult[]): GroupResult[] {
  const styleMap = new Map<string, SearchResult[]>();

  for (const result of results) {
    const tags = result.resource.tags || [];
    const style = detectStyle(tags) || '综合';
    if (!styleMap.has(style)) {
      styleMap.set(style, []);
    }
    styleMap.get(style)!.push(result);
  }

  return Array.from(styleMap.entries()).map(([style, items]) => ({
    title: style,
    icon: getStyleIcon(style),
    results: items,
  }));
}

/**
 * 按相关度分组
 */
function groupByRelevance(results: SearchResult[]): GroupResult[] {
  const highRelevance = results.filter((r) => r.similarity >= 0.8);
  const mediumRelevance = results.filter((r) => r.similarity >= 0.5 && r.similarity < 0.8);
  const lowRelevance = results.filter((r) => r.similarity < 0.5);

  const groups: GroupResult[] = [];

  if (highRelevance.length > 0) {
    groups.push({
      title: '高度匹配',
      icon: <Sparkles className="h-4 w-4 text-amber-500" />,
      results: highRelevance,
    });
  }

  if (mediumRelevance.length > 0) {
    groups.push({
      title: '相关推荐',
      icon: <Star className="h-4 w-4 text-primary" />,
      results: mediumRelevance,
    });
  }

  if (lowRelevance.length > 0) {
    groups.push({
      title: '更多探索',
      icon: <Search className="h-4 w-4 text-muted-foreground" />,
      results: lowRelevance,
    });
  }

  return groups;
}

/**
 * 检测资源风格
 */
function detectStyle(tags: string[]): string | null {
  const styleKeywords: Record<string, string[]> = {
    极简风格: ['minimal', 'minimalist', '极简', '简约'],
    '3D 风格': ['3d', '立体', '三维'],
    扁平风格: ['flat', '扁平'],
    渐变风格: ['gradient', '渐变'],
    暗黑模式: ['dark', 'dark-mode', '暗黑'],
  };

  const lowerTags = tags.map((t) => t.toLowerCase());

  for (const [style, keywords] of Object.entries(styleKeywords)) {
    if (keywords.some((kw) => lowerTags.some((tag) => tag.includes(kw)))) {
      return style;
    }
  }

  return null;
}

/**
 * 获取类别标签
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    website: '网站资源',
    icons: '图标素材',
    'ui-kits': 'UI 套件',
    color: '配色工具',
    fonts: '字体资源',
    illustrations: '插画素材',
    tools: '设计工具',
  };
  return labels[category] || category;
}

interface SwimlaneLaneProps {
  title: string;
  icon?: React.ReactNode;
  results: SearchResult[];
  onResourceClick: (resource: Resource) => void;
  onFavorite: (resourceId: string) => void;
  onVisit: (resourceId: string) => void;
  delay?: number;
}

/**
 * 单个泳道
 */
function SwimlaneLane({
  title,
  icon,
  results,
  onResourceClick,
  onFavorite,
  onVisit,
  delay = 0,
}: SwimlaneLaneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="group/lane space-y-3"
    >
      {/* 分组标题 */}
      <div className="flex items-center gap-2.5 px-1 py-1">
        <div className="p-1.5 rounded-md bg-secondary/50 group-hover/lane:bg-secondary transition-colors">
          {icon}
        </div>
        <span className="text-sm font-semibold text-foreground tracking-tight">{title}</span>
        <span className="text-xs font-medium text-muted-foreground/70 bg-secondary/30 px-1.5 py-0.5 rounded-md">
          {results.length}
        </span>
        {/* 装饰线 */}
        <div className="flex-1 h-px bg-gradient-to-r from-border/80 via-border/20 to-transparent ml-2" />

        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5 opacity-0 group-hover/lane:opacity-100 transform translate-x-2 group-hover/lane:translate-x-0 transition-all duration-200">
          查看全部
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* 资源列表 */}
      <div className="space-y-2.5 pl-2 relative">
        {/* 左侧连接线 */}
        <div className="absolute left-[1.35rem] top-0 bottom-4 w-px bg-border/30 -z-10 group-hover/lane:bg-border/60 transition-colors" />

        {results.map((result, index) => (
          <motion.div
            key={result.resource.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + index * 0.05 }}
            className="pl-4"
          >
            <ResourceInlineCard
              resource={result.resource}
              onFavorite={() => onFavorite(result.resource.id)}
              onVisit={() => onVisit(result.resource.id)}
              onViewDetails={() => onResourceClick(result.resource)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * 空结果占位
 */
export function EmptySwimlanePlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
        <Sparkles className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">暂无搜索结果</p>
      <p className="text-xs text-muted-foreground/70 mt-1">尝试使用不同的关键词或放宽搜索条件</p>
    </div>
  );
}
