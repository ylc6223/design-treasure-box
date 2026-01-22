'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingInputProps {
  /**
   * 当前评分值 (0-5)
   */
  value: number;
  /**
   * 评分变化回调
   */
  onChange: (value: number) => void;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 标签文本
   */
  label?: string;
  /**
   * 是否必填
   */
  required?: boolean;
  /**
   * 星星大小
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * RatingInput 组件
 *
 * 可交互的星级评分输入组件，支持 0.5 精度（半星）
 *
 * 特性：
 * - 5星评分输入
 * - 支持半星精度（0.5 步进）
 * - 悬停预览效果
 * - 键盘导航支持
 * - 可选标签和必填标记
 *
 * @example
 * ```tsx
 * <RatingInput
 *   value={rating}
 *   onChange={setRating}
 *   label="综合评分"
 *   required
 * />
 * ```
 */
export function RatingInput({
  value,
  onChange,
  disabled = false,
  label,
  required = false,
  size = 'md',
  className,
}: RatingInputProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  // 星星尺寸映射
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const starSize = sizeClasses[size];

  // 显示的评分值（悬停时显示悬停值，否则显示当前值）
  const displayValue = hoverValue !== null ? hoverValue : value;

  // 处理星星点击
  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (disabled) return;
    const newValue = starIndex + (isHalf ? 0.5 : 1);
    onChange(newValue);
  };

  // 处理鼠标移动（半星检测）
  const handleStarMouseMove = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(starIndex + (isHalf ? 0.5 : 1));
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  // 渲染单个星星
  const renderStar = (starIndex: number) => {
    const starValue = starIndex + 1;
    const isFull = displayValue >= starValue;
    const isHalf = displayValue >= starValue - 0.5 && displayValue < starValue;

    return (
      <button
        key={starIndex}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const isHalfClick = x < rect.width / 2;
          handleStarClick(starIndex, isHalfClick);
        }}
        onMouseMove={(e) => handleStarMouseMove(e, starIndex)}
        className={cn(
          'relative transition-transform hover:scale-110',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        )}
        aria-label={`评分 ${starValue} 星`}
      >
        {/* 背景星星（空星） */}
        <Star className={cn(starSize, 'text-muted-foreground/30')} />

        {/* 前景星星（满星或半星） */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            width: isFull ? '100%' : isHalf ? '50%' : '0%',
          }}
        >
          <Star className={cn(starSize, 'fill-highlight text-highlight transition-colors')} />
        </div>
      </button>
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* 标签 */}
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* 星星输入 */}
      <div
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
        role="radiogroup"
        aria-label={label || '评分'}
      >
        {Array.from({ length: 5 }).map((_, i) => renderStar(i))}

        {/* 数值显示 */}
        <span className="ml-2 min-w-[3ch] text-sm font-medium text-text-secondary">
          {displayValue.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
