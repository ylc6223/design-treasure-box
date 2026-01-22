'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { ArrowRight, RefreshCw, SearchX, FileQuestion, Sparkles, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZeroResultsProps {
  query: string;
  suggestions?: string[];
  onSuggestionClick: (suggestion: string) => void;
  onRelaxSearch?: () => void;
  className?: string;
}

/**
 * 零结果处理组件 (Modern)
 * 提供建设性的建议和替代查询
 */
export function ZeroResultsMessage({
  query,
  suggestions = [],
  onSuggestionClick,
  onRelaxSearch,
  className,
}: ZeroResultsProps) {
  // 生成默认建议（如果没有提供）
  const defaultSuggestions =
    suggestions.length > 0 ? suggestions : generateDefaultSuggestions(query);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('w-full max-w-lg mx-auto space-y-6', className)}
    >
      {/* Visual Hero Area */}
      <div className="flex flex-col items-center justify-center py-8 text-center relative overflow-hidden rounded-2xl bg-secondary/20 border border-border/50 p-6">
        <div className="bg-background/80 p-4 rounded-full shadow-lg ring-1 ring-border relative z-10 mb-4">
          <SearchX className="h-8 w-8 text-muted-foreground" />
          <motion.div
            className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-background"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <FileQuestion className="h-3 w-3 text-white" />
          </motion.div>
        </div>

        <h3 className="text-base font-semibold text-foreground mb-1">
          未找到与 &quot;{query}&quot; 相关的资源
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          换个关键词试试？或者看看下面的建议
        </p>

        {/* 背景装饰 */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-2 left-4 h-16 w-16 bg-primary/10 rounded-full blur-xl" />
          <div className="absolute bottom-2 right-4 h-24 w-24 bg-amber-500/10 rounded-full blur-xl" />
        </div>
      </div>

      {/* 建议区域 */}
      <div className="space-y-3 px-1">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-foreground">为您推荐的搜索方向</span>
        </div>

        <div className="grid gap-2.5">
          {defaultSuggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              onClick={() => onSuggestionClick(suggestion)}
              className={cn(
                'group relative flex items-center justify-between p-3.5 rounded-xl',
                'bg-card border border-border/40 hover:border-primary/40',
                'shadow-sm hover:shadow-md transition-all duration-300',
                'text-left'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Command className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {suggestion}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>

        {onRelaxSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-2"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onRelaxSearch}
              className="w-full gap-2 text-muted-foreground hover:text-foreground h-9 border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              尝试放宽搜索条件
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * 生成默认建议
 */
function generateDefaultSuggestions(query: string): string[] {
  const suggestions: string[] = [];
  // 简单分词，过滤空字符串
  const cleanQuery = query.replace(/[^\w\u4e00-\u9fa5\s]/g, '');
  const words = cleanQuery.split(/\s+/).filter((w) => w.length > 0);

  // 1. 如果有多个词，建议使用核心词
  if (words.length > 1) {
    suggestions.push(words[0]); // 使用第一个词
  }

  // 2. 尝试提取英文部分或中文部分（如果混合）
  const englishPart = query.match(/[a-zA-Z]+/)?.[0];
  const chinesePart = query.match(/[\u4e00-\u9fa5]+/)?.[0];

  if (englishPart && englishPart !== query && !suggestions.includes(englishPart)) {
    suggestions.push(englishPart);
  }
  if (chinesePart && chinesePart !== query && !suggestions.includes(chinesePart)) {
    suggestions.push(chinesePart);
  }

  // 3. 添加通用热门建议
  const genericSuggestions = ['热门图标库', 'UI 设计组件', '配色灵感', '免费插画'];

  while (suggestions.length < 3 && genericSuggestions.length > 0) {
    const next = genericSuggestions.shift()!;
    if (!suggestions.includes(next)) {
      suggestions.push(next);
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * 维度放宽建议
 */
interface DimensionRelaxProps {
  originalDimensions: Record<string, string>;
  onRelax: (dimension: string) => void;
  className?: string;
}

export function DimensionRelaxSuggestions({
  originalDimensions,
  onRelax,
  className,
}: DimensionRelaxProps) {
  const dimensions = Object.entries(originalDimensions).filter(([_, v]) => v);

  if (dimensions.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs text-muted-foreground">当前搜索条件较多，尝试去掉其中一个：</p>
      <div className="flex flex-wrap gap-1.5">
        {dimensions.map(([key, value]) => (
          <button
            key={key}
            onClick={() => onRelax(key)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
              'bg-muted/50 hover:bg-destructive/10 hover:text-destructive',
              'border border-border/50 hover:border-destructive/30',
              'transition-all group'
            )}
          >
            <span className="opacity-50 group-hover:opacity-0 transition-opacity">×</span>
            <span>
              {getDimensionLabel(key)}: {value}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 获取维度标签
 */
function getDimensionLabel(dimension: string): string {
  const labels: Record<string, string> = {
    industry: '行业',
    style: '风格',
    type: '类型',
    color: '颜色',
  };
  return labels[dimension] || dimension;
}
