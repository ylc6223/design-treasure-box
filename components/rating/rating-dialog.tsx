'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RatingInput } from './rating-input';
import {
  SubmitRatingSchema,
  RATING_DIMENSION_LABELS,
  RATING_DIMENSION_DESCRIPTIONS,
} from '@/types/rating';
import type { SubmitRatingRequest, UserRating } from '@/types/rating';
import type { Resource } from '@/types';

export interface RatingDialogProps {
  /**
   * 资源信息
   */
  resource: Resource;
  /**
   * 现有评分（编辑模式）
   */
  existingRating?: UserRating | null;
  /**
   * 对话框打开状态
   */
  open: boolean;
  /**
   * 对话框状态变化回调
   */
  onOpenChange: (open: boolean) => void;
  /**
   * 评分提交回调
   */
  onSubmit: (rating: SubmitRatingRequest) => Promise<void>;
}

/**
 * RatingDialog 组件
 *
 * 评分对话框，用于提交或编辑资源评分
 *
 * 特性：
 * - 5个评分维度输入
 * - 可选评论文本框
 * - 表单验证（React Hook Form + Zod）
 * - 加载状态显示
 * - 编辑模式支持
 *
 * @example
 * ```tsx
 * <RatingDialog
 *   resource={resource}
 *   existingRating={userRating}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function RatingDialog({
  resource,
  existingRating,
  open,
  onOpenChange,
  onSubmit,
}: RatingDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 表单配置
  const form = useForm<SubmitRatingRequest>({
    resolver: zodResolver(SubmitRatingSchema),
    defaultValues: {
      resourceId: resource.id,
      overall: existingRating?.overall || 0,
      usability: existingRating?.usability || 0,
      aesthetics: existingRating?.aesthetics || 0,
      updateFrequency: existingRating?.updateFrequency || 0,
      freeLevel: existingRating?.freeLevel || 0,
      comment: existingRating?.comment || '',
    },
  });

  // 重置表单当对话框打开/关闭或现有评分变化时
  React.useEffect(() => {
    if (open) {
      form.reset({
        resourceId: resource.id,
        overall: existingRating?.overall || 0,
        usability: existingRating?.usability || 0,
        aesthetics: existingRating?.aesthetics || 0,
        updateFrequency: existingRating?.updateFrequency || 0,
        freeLevel: existingRating?.freeLevel || 0,
        comment: existingRating?.comment || '',
      });
    }
  }, [open, existingRating, resource.id, form]);

  // 处理表单提交
  const handleSubmit = async (data: SubmitRatingRequest) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Rating submission error:', error);
      // 错误处理由父组件负责
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingRating ? '编辑评分' : '评分'}</DialogTitle>
          <DialogDescription>
            为 <span className="font-medium text-text-primary">{resource.name}</span> 评分
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 评分维度输入 */}
          <div className="space-y-4">
            {/* 综合评分 */}
            <RatingInput
              label={RATING_DIMENSION_LABELS.overall}
              value={form.watch('overall')}
              onChange={(value) => form.setValue('overall', value)}
              required
            />
            <p className="text-xs text-text-muted">{RATING_DIMENSION_DESCRIPTIONS.overall}</p>

            {/* 易用性 */}
            <RatingInput
              label={RATING_DIMENSION_LABELS.usability}
              value={form.watch('usability')}
              onChange={(value) => form.setValue('usability', value)}
              required
            />
            <p className="text-xs text-text-muted">{RATING_DIMENSION_DESCRIPTIONS.usability}</p>

            {/* 美观度 */}
            <RatingInput
              label={RATING_DIMENSION_LABELS.aesthetics}
              value={form.watch('aesthetics')}
              onChange={(value) => form.setValue('aesthetics', value)}
              required
            />
            <p className="text-xs text-text-muted">{RATING_DIMENSION_DESCRIPTIONS.aesthetics}</p>

            {/* 更新频率 */}
            <RatingInput
              label={RATING_DIMENSION_LABELS.updateFrequency}
              value={form.watch('updateFrequency')}
              onChange={(value) => form.setValue('updateFrequency', value)}
              required
            />
            <p className="text-xs text-text-muted">
              {RATING_DIMENSION_DESCRIPTIONS.updateFrequency}
            </p>

            {/* 免费程度 */}
            <RatingInput
              label={RATING_DIMENSION_LABELS.freeLevel}
              value={form.watch('freeLevel')}
              onChange={(value) => form.setValue('freeLevel', value)}
              required
            />
            <p className="text-xs text-text-muted">{RATING_DIMENSION_DESCRIPTIONS.freeLevel}</p>
          </div>

          {/* 评论文本框 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">评论（可选）</label>
            <Textarea
              {...form.register('comment')}
              placeholder="分享你的使用体验..."
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-text-muted">{form.watch('comment')?.length || 0} / 500</p>
          </div>

          {/* 表单错误提示 */}
          {form.formState.errors.root && (
            <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
          )}

          {/* 对话框底部按钮 */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingRating ? '更新评分' : '提交评分'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
