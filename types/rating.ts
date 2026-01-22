import { z } from 'zod';

// ============================================================================
// Zod Schemas (用于运行时验证)
// ============================================================================

/**
 * 评分值 Schema
 * 所有评分值必须在 0-5 范围内，支持 0.5 精度
 */
export const RatingValueSchema = z
  .number()
  .min(0, '评分不能小于 0')
  .max(5, '评分不能大于 5')
  .multipleOf(0.5, '评分必须是 0.5 的倍数');

/**
 * 评分 Schema
 * 包含资源的各个维度评分
 */
export const RatingSchema = z.object({
  overall: RatingValueSchema,
  usability: RatingValueSchema,
  aesthetics: RatingValueSchema,
  updateFrequency: RatingValueSchema,
  freeLevel: RatingValueSchema,
});

/**
 * 用户评分提交 Schema
 * 用于验证用户提交的评分数据
 */
export const SubmitRatingSchema = RatingSchema.extend({
  resourceId: z.string().uuid('资源 ID 必须是有效的 UUID'),
  comment: z.string().max(500, '评论不能超过 500 字符').optional(),
});

/**
 * 用户评分完整 Schema
 * 包含数据库中存储的完整评分信息
 */
export const UserRatingSchema = RatingSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  resourceId: z.string().uuid(),
  comment: z.string().nullable(),
  createdAt: z.string(), // ISO 8601 字符串，与数据库返回类型一致
  updatedAt: z.string(), // ISO 8601 字符串，与数据库返回类型一致
});

/**
 * 资源评分信息 Schema
 * 包含聚合评分、评分人数和当前用户评分
 */
export const ResourceRatingsSchema = z.object({
  aggregatedRating: RatingSchema.nullable(),
  ratingCount: z.number().int().min(0),
  userRating: UserRatingSchema.nullable(),
});

// ============================================================================
// TypeScript Types (从 Zod Schema 推导)
// ============================================================================

/**
 * 评分接口
 * 包含资源的各个维度评分
 */
export type Rating = z.infer<typeof RatingSchema>;

/**
 * 用户评分提交接口
 * 用于提交新评分或更新现有评分
 */
export type SubmitRatingRequest = z.infer<typeof SubmitRatingSchema>;

/**
 * 用户评分完整接口
 * 数据库中存储的完整评分记录
 */
export type UserRating = z.infer<typeof UserRatingSchema>;

/**
 * 资源评分信息接口
 * 包含聚合评分、评分人数和当前用户评分
 */
export type ResourceRatings = z.infer<typeof ResourceRatingsSchema>;

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 评分维度类型
 */
export type RatingDimension = keyof Rating;

/**
 * 评分维度标签映射
 */
export const RATING_DIMENSION_LABELS: Record<RatingDimension, string> = {
  overall: '综合评分',
  usability: '易用性',
  aesthetics: '美观度',
  updateFrequency: '更新频率',
  freeLevel: '免费程度',
} as const;

/**
 * 评分维度描述映射
 */
export const RATING_DIMENSION_DESCRIPTIONS: Record<RatingDimension, string> = {
  overall: '对该资源的整体评价',
  usability: '资源的易用性和用户体验',
  aesthetics: '资源的视觉设计和美观程度',
  updateFrequency: '资源的更新频率和维护情况',
  freeLevel: '资源的免费程度和性价比',
} as const;

// ============================================================================
// 工具函数类型
// ============================================================================

/**
 * 评分四舍五入到 0.5 精度
 */
export function roundRatingTo05(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * 计算聚合评分
 * 对多个用户评分求平均值，并四舍五入到 0.5 精度
 */
export function calculateAggregatedRating(ratings: Rating[]): Rating {
  if (ratings.length === 0) {
    throw new Error('无法计算空数组的聚合评分');
  }

  const sum = ratings.reduce(
    (acc, rating) => ({
      overall: acc.overall + rating.overall,
      usability: acc.usability + rating.usability,
      aesthetics: acc.aesthetics + rating.aesthetics,
      updateFrequency: acc.updateFrequency + rating.updateFrequency,
      freeLevel: acc.freeLevel + rating.freeLevel,
    }),
    {
      overall: 0,
      usability: 0,
      aesthetics: 0,
      updateFrequency: 0,
      freeLevel: 0,
    }
  );

  const count = ratings.length;

  return {
    overall: roundRatingTo05(sum.overall / count),
    usability: roundRatingTo05(sum.usability / count),
    aesthetics: roundRatingTo05(sum.aesthetics / count),
    updateFrequency: roundRatingTo05(sum.updateFrequency / count),
    freeLevel: roundRatingTo05(sum.freeLevel / count),
  };
}

/**
 * 验证评分值是否有效
 */
export function isValidRatingValue(value: number): boolean {
  return value >= 0 && value <= 5 && value % 0.5 === 0;
}

/**
 * 验证评分对象是否有效
 */
export function isValidRating(rating: Rating): boolean {
  return (
    isValidRatingValue(rating.overall) &&
    isValidRatingValue(rating.usability) &&
    isValidRatingValue(rating.aesthetics) &&
    isValidRatingValue(rating.updateFrequency) &&
    isValidRatingValue(rating.freeLevel)
  );
}
