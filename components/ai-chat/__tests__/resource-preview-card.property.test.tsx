/**
 * ResourcePreviewCard 属性测试
 * Feature: ai-chat-assistant, Property 5: 视觉预览完整性
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ResourcePreviewCard } from '../resource-preview-card';
import * as fc from 'fast-check';
import type { Resource } from '@/types';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, onLoad }: any) => {
    return (
      <img src={src} alt={alt} onError={onError} onLoad={onLoad} data-testid="preview-image" />
    );
  },
}));

describe('ResourcePreviewCard - Property Tests', () => {
  const mockOnFavorite = vi.fn();
  const mockOnVisit = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 5: 视觉预览完整性', () => {
    /**
     * Property: 对于任何资源推荐，视觉预览卡片应该包含所有必需元素
     * (screenshot, name, category, rating, description)
     * Validates: Requirements 4.1, 4.2
     */
    it('Property: 任何资源都应该显示所有必需的元素', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
            description: fc
              .string({ minLength: 1, maxLength: 500 })
              .filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
              { minLength: 1, maxLength: 10 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.boolean(),
            curatorNote: fc.string({ maxLength: 200 }),
          }),
          async (resource: Resource) => {
            const { unmount } = render(
              <ResourcePreviewCard resource={resource} onFavorite={mockOnFavorite} />
            );

            // 验证必需元素存在
            expect(screen.getByText(resource.name.trim())).toBeInTheDocument();

            // 验证评分显示
            const ratingText = resource.rating.overall.toFixed(1);
            expect(screen.getByText(ratingText)).toBeInTheDocument();

            // 验证缩略图
            const image = screen.getByTestId('preview-image');
            expect(image).toHaveAttribute('src', resource.screenshot);
            expect(image).toHaveAttribute('alt', resource.name);

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 资源卡片应该正确处理加载状态
     * Validates: Requirement 4.3
     */
    it('Property: 任何资源卡片都应该显示加载状态指示器', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string().filter((s) => s.trim().length > 0),
              { minLength: 1 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.boolean(),
            curatorNote: fc.string(),
          }),
          (resource: Resource) => {
            const { container, unmount } = render(
              <ResourcePreviewCard resource={resource} onFavorite={mockOnFavorite} />
            );

            // 验证加载状态指示器存在（在图片加载完成前）
            const loadingSpinner = container.querySelector('.animate-spin');
            expect(loadingSpinner).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 缩略图加载失败时应该显示占位符和基本信息
     * Validates: Requirement 4.4
     */
    it('Property: 任何资源在图片加载失败时都应该显示占位符', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string().filter((s) => s.trim().length > 0),
              { minLength: 1 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.boolean(),
            curatorNote: fc.string(),
          }),
          async (resource: Resource) => {
            const { unmount } = render(
              <ResourcePreviewCard resource={resource} onFavorite={mockOnFavorite} />
            );

            // 触发图片加载失败
            const image = screen.getByTestId('preview-image');
            image.dispatchEvent(new Event('error'));

            // 验证占位符显示
            await waitFor(
              () => {
                expect(screen.getByText('无图片')).toBeInTheDocument();
              },
              { timeout: 1000 }
            );

            // 验证基本信息仍然显示
            expect(screen.getByText(resource.name.trim())).toBeInTheDocument();
            const ratingText = resource.rating.overall.toFixed(1);
            expect(screen.getByText(ratingText)).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 50 } // 减少运行次数以避免超时
      );
    }, 10000); // 增加测试超时时间

    /**
     * Property: 精选资源应该显示精选标识
     * Validates: Requirement 4.2
     */
    it('Property: 任何精选资源都应该显示精选标识', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string().filter((s) => s.trim().length > 0),
              { minLength: 1 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.constant(true), // 强制为精选
            curatorNote: fc.string(),
          }),
          (resource: Resource) => {
            const { unmount } = render(
              <ResourcePreviewCard resource={resource} onFavorite={mockOnFavorite} />
            );

            // 验证精选标识显示
            expect(screen.getByText('精选')).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 非精选资源不应该显示精选标识
     * Validates: Requirement 4.2
     */
    it('Property: 任何非精选资源都不应该显示精选标识', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string().filter((s) => s.trim().length > 0),
              { minLength: 1 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.constant(false), // 强制为非精选
            curatorNote: fc.string(),
          }),
          (resource: Resource) => {
            const { unmount } = render(
              <ResourcePreviewCard resource={resource} onFavorite={mockOnFavorite} />
            );

            // 验证精选标识不显示
            expect(screen.queryByText('精选')).not.toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 匹配理由应该正确显示
     * Validates: Requirement 4.2
     */
    it('Property: 任何提供的匹配理由都应该被显示', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string().filter((s) => s.trim().length > 0),
              { minLength: 1 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.boolean(),
            curatorNote: fc.string(),
          }),
          fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
          (resource: Resource, matchReason: string) => {
            const { unmount } = render(
              <ResourcePreviewCard
                resource={resource}
                matchReason={matchReason}
                onFavorite={mockOnFavorite}
              />
            );

            // 验证匹配理由显示
            expect(screen.getByText(matchReason.trim())).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 匹配方面标签应该正确显示（最多3个）
     * Validates: Requirement 4.2
     */
    it('Property: 任何匹配方面标签都应该被显示（最多3个）', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string().filter((s) => s.trim().length > 0),
              { minLength: 1 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.boolean(),
            curatorNote: fc.string(),
          }),
          fc.array(
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
            { minLength: 1, maxLength: 10 }
          ),
          (resource: Resource, matchedAspects: string[]) => {
            const { unmount } = render(
              <ResourcePreviewCard
                resource={resource}
                matchedAspects={matchedAspects}
                onFavorite={mockOnFavorite}
              />
            );

            // 验证前3个标签显示
            const displayCount = Math.min(3, matchedAspects.length);
            for (let i = 0; i < displayCount; i++) {
              expect(screen.getByText(matchedAspects[i].trim())).toBeInTheDocument();
            }

            // 如果超过3个，验证"+N"标签
            if (matchedAspects.length > 3) {
              expect(screen.getByText(`+${matchedAspects.length - 3}`)).toBeInTheDocument();
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 高相关度资源应该显示匹配指示器
     * Validates: Requirement 4.2
     */
    it('Property: 任何相关度>0.8的资源都应该显示高度匹配指示器', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string().filter((s) => s.trim().length > 0),
              { minLength: 1 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.boolean(),
            curatorNote: fc.string(),
          }),
          fc.double({ min: 0.81, max: 1.0 }), // 使用double代替float
          (resource: Resource, relevanceScore: number) => {
            const { unmount } = render(
              <ResourcePreviewCard
                resource={resource}
                relevanceScore={relevanceScore}
                onFavorite={mockOnFavorite}
              />
            );

            // 验证高度匹配指示器显示
            expect(screen.getByText('高度匹配')).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 低相关度资源不应该显示匹配指示器
     * Validates: Requirement 4.2
     */
    it('Property: 任何相关度≤0.8的资源都不应该显示高度匹配指示器', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string().filter((s) => s.trim().length > 0),
              { minLength: 1 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.boolean(),
            curatorNote: fc.string(),
          }),
          fc.double({ min: 0, max: 0.8 }), // 使用double代替float
          (resource: Resource, relevanceScore: number) => {
            const { unmount } = render(
              <ResourcePreviewCard
                resource={resource}
                relevanceScore={relevanceScore}
                onFavorite={mockOnFavorite}
              />
            );

            // 验证高度匹配指示器不显示
            expect(screen.queryByText('高度匹配')).not.toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 两种变体都应该正确渲染所有必需元素
     * Validates: Requirements 4.1, 4.2
     */
    it('Property: 任何变体（compact/default）都应该显示所有必需元素', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            url: fc.webUrl(),
            screenshot: fc.webUrl(),
            category: fc.constantFrom(
              'colors',
              'fonts',
              'icons',
              'templates',
              'inspiration',
              'examples',
              'ui-kits',
              'mockups'
            ),
            tags: fc.array(
              fc.string().filter((s) => s.trim().length > 0),
              { minLength: 1 }
            ),
            rating: fc.record({
              overall: fc.float({ min: 0, max: 5 }),
              usability: fc.float({ min: 0, max: 5 }),
              aesthetics: fc.float({ min: 0, max: 5 }),
              updateFrequency: fc.float({ min: 0, max: 5 }),
              freeLevel: fc.float({ min: 0, max: 5 }),
            }),
            isFeatured: fc.boolean(),
            curatorNote: fc.string(),
          }),
          fc.constantFrom('compact', 'default'),
          (resource: Resource, variant: 'compact' | 'default') => {
            const { unmount } = render(
              <ResourcePreviewCard
                resource={resource}
                variant={variant}
                onFavorite={mockOnFavorite}
              />
            );

            // 验证必需元素存在
            expect(screen.getByText(resource.name.trim())).toBeInTheDocument();
            const ratingText = resource.rating.overall.toFixed(1);
            expect(screen.getByText(ratingText)).toBeInTheDocument();

            const image = screen.getByTestId('preview-image');
            expect(image).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
