'use client';

import { RatingStars } from './rating-stars';
import { cn } from '@/lib/utils';
import type { Rating } from '@/types';

export interface RatingBreakdownProps {
  rating: Rating;
  className?: string;
}

export function RatingBreakdown({ rating, className }: RatingBreakdownProps) {
  const dimensions = [
    { key: 'usability', label: '实用性', value: rating.usability },
    { key: 'aesthetics', label: '美观度', value: rating.aesthetics },
    { key: 'updateFrequency', label: '更新频率', value: rating.updateFrequency },
    { key: 'freeLevel', label: '免费程度', value: rating.freeLevel },
  ] as const;

  return (
    <div className={cn('space-y-10', className)}>
      {/* 综合评分区域 */}
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
          <div className="relative text-5xl font-black tracking-tighter text-primary">
            {rating.overall.toFixed(1)}
          </div>
        </div>
        <div className="space-y-1">
          <RatingStars rating={rating.overall} size="lg" showValue={false} />
          <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">
            综合策展指数
          </p>
        </div>
      </div>

      {/* 评分维度细节 */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 bg-primary/20 rounded-full" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            多维评估
          </h3>
        </div>
        <div className="grid gap-5">
          {dimensions.map((dimension) => (
            <div key={dimension.key} className="space-y-2 group">
              <div className="flex items-center justify-between text-xs font-bold px-0.5">
                <span className="text-foreground/70 uppercase tracking-tight">
                  {dimension.label}
                </span>
                <span className="text-primary tabular-nums">{dimension.value.toFixed(1)}</span>
              </div>
              <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(dimension.value / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
