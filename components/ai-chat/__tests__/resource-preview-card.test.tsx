/**
 * ResourcePreviewCard 组件单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourcePreviewCard } from '../resource-preview-card';
import type { Resource } from '@/types';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, onLoad }: any) => {
    return (
      <img
        src={src}
        alt={alt}
        onError={onError}
        onLoad={onLoad}
        data-testid="preview-image"
      />
    );
  },
}));

describe('ResourcePreviewCard', () => {
  const mockResource: Resource = {
    id: 'test-resource-1',
    name: '测试资源',
    description: '这是一个测试资源的描述',
    url: 'https://example.com',
    screenshot: 'https://example.com/screenshot.jpg',
    category: 'colors',
    tags: ['设计', '工具', '配色'],
    rating: {
      overall: 4.5,
      usability: 4.0,
      aesthetics: 5.0,
      updateFrequency: 4.0,
      freeLevel: 5.0,
    },
    isFeatured: true,
    curatorNote: '测试备注',
  };

  const mockOnFavorite = vi.fn();
  const mockOnVisit = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染资源的基本信息', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          onFavorite={mockOnFavorite}
          onVisit={mockOnVisit}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('测试资源')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('应该渲染资源缩略图', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          onFavorite={mockOnFavorite}
        />
      );

      const image = screen.getByTestId('preview-image');
      expect(image).toHaveAttribute('src', mockResource.screenshot);
      expect(image).toHaveAttribute('alt', mockResource.name);
    });

    it('应该显示精选标识', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          onFavorite={mockOnFavorite}
        />
      );

      expect(screen.getByText('精选')).toBeInTheDocument();
    });

    it('不应该显示精选标识（非精选资源）', () => {
      const nonFeaturedResource = { ...mockResource, isFeatured: false };
      render(
        <ResourcePreviewCard
          resource={nonFeaturedResource}
          onFavorite={mockOnFavorite}
        />
      );

      expect(screen.queryByText('精选')).not.toBeInTheDocument();
    });
  });

  describe('匹配信息显示', () => {
    it('应该显示匹配理由', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          matchReason="这个资源非常适合您的需求"
          onFavorite={mockOnFavorite}
        />
      );

      expect(screen.getByText('这个资源非常适合您的需求')).toBeInTheDocument();
    });

    it('应该显示匹配方面标签', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          matchedAspects={['配色方案', '易用性', '免费']}
          onFavorite={mockOnFavorite}
        />
      );

      expect(screen.getByText('配色方案')).toBeInTheDocument();
      expect(screen.getByText('易用性')).toBeInTheDocument();
      expect(screen.getByText('免费')).toBeInTheDocument();
    });

    it('应该限制显示最多3个匹配方面', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          matchedAspects={['方面1', '方面2', '方面3', '方面4', '方面5']}
          onFavorite={mockOnFavorite}
        />
      );

      expect(screen.getByText('方面1')).toBeInTheDocument();
      expect(screen.getByText('方面2')).toBeInTheDocument();
      expect(screen.getByText('方面3')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(screen.queryByText('方面4')).not.toBeInTheDocument();
    });

    it('应该显示高度匹配指示器', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          relevanceScore={0.9}
          onFavorite={mockOnFavorite}
        />
      );

      expect(screen.getByText('高度匹配')).toBeInTheDocument();
    });

    it('不应该显示低相关度指示器', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          relevanceScore={0.5}
          onFavorite={mockOnFavorite}
        />
      );

      expect(screen.queryByText('高度匹配')).not.toBeInTheDocument();
    });
  });

  describe('操作按钮', () => {
    it('应该调用收藏回调', async () => {
      const user = userEvent.setup();
      render(
        <ResourcePreviewCard
          resource={mockResource}
          onFavorite={mockOnFavorite}
        />
      );

      const favoriteButton = screen.getByLabelText('收藏');
      await user.click(favoriteButton);

      expect(mockOnFavorite).toHaveBeenCalledWith(mockResource.id);
      expect(mockOnFavorite).toHaveBeenCalledTimes(1);
    });

    it('应该显示已收藏状态', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          isFavorited={true}
          onFavorite={mockOnFavorite}
        />
      );

      const favoriteButton = screen.getByLabelText('取消收藏');
      expect(favoriteButton).toBeInTheDocument();
    });

    it('应该调用访问回调', async () => {
      const user = userEvent.setup();
      render(
        <ResourcePreviewCard
          resource={mockResource}
          onVisit={mockOnVisit}
        />
      );

      const visitButton = screen.getByText('访问');
      await user.click(visitButton);

      expect(mockOnVisit).toHaveBeenCalledWith(mockResource.id);
      expect(mockOnVisit).toHaveBeenCalledTimes(1);
    });

    it('应该调用查看详情回调', async () => {
      const user = userEvent.setup();
      render(
        <ResourcePreviewCard
          resource={mockResource}
          onViewDetails={mockOnViewDetails}
        />
      );

      const detailsButton = screen.getByText('详情');
      await user.click(detailsButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockResource);
      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    });

    it('不应该渲染未提供的操作按钮', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
        />
      );

      expect(screen.queryByLabelText('收藏')).not.toBeInTheDocument();
      expect(screen.queryByText('访问')).not.toBeInTheDocument();
      expect(screen.queryByText('详情')).not.toBeInTheDocument();
    });
  });

  describe('图片加载处理', () => {
    it('应该处理图片加载失败', async () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          onFavorite={mockOnFavorite}
        />
      );

      const image = screen.getByTestId('preview-image');
      
      // 触发图片加载失败
      image.dispatchEvent(new Event('error'));

      await waitFor(() => {
        expect(screen.getByText('无图片')).toBeInTheDocument();
      });
    });

    it('应该显示加载状态', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          onFavorite={mockOnFavorite}
        />
      );

      // 加载状态应该显示（在图片加载完成前）
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('应该在图片加载完成后隐藏加载状态', async () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          onFavorite={mockOnFavorite}
        />
      );

      const image = screen.getByTestId('preview-image');
      
      // 触发图片加载完成
      image.dispatchEvent(new Event('load'));

      await waitFor(() => {
        const loadingSpinner = document.querySelector('.animate-spin');
        expect(loadingSpinner).not.toBeInTheDocument();
      });
    });
  });

  describe('变体样式', () => {
    it('应该应用compact变体样式', () => {
      const { container } = render(
        <ResourcePreviewCard
          resource={mockResource}
          variant="compact"
          onFavorite={mockOnFavorite}
        />
      );

      // compact变体应该有较小的padding
      const cardContent = container.querySelector('.p-3');
      expect(cardContent).toBeInTheDocument();
    });

    it('应该应用default变体样式', () => {
      const { container } = render(
        <ResourcePreviewCard
          resource={mockResource}
          variant="default"
          onFavorite={mockOnFavorite}
        />
      );

      // default变体应该有较大的padding
      const cardContent = container.querySelector('.p-4');
      expect(cardContent).toBeInTheDocument();
    });
  });

  describe('自定义样式', () => {
    it('应该应用自定义className', () => {
      const { container } = render(
        <ResourcePreviewCard
          resource={mockResource}
          className="custom-class"
          onFavorite={mockOnFavorite}
        />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理空匹配方面数组', () => {
      render(
        <ResourcePreviewCard
          resource={mockResource}
          matchedAspects={[]}
          onFavorite={mockOnFavorite}
        />
      );

      // 不应该渲染标签区域
      const badges = screen.queryAllByRole('status');
      expect(badges.length).toBe(0);
    });

    it('应该处理长资源名称', () => {
      const longNameResource = {
        ...mockResource,
        name: '这是一个非常非常非常非常非常非常长的资源名称，应该被截断显示',
      };

      render(
        <ResourcePreviewCard
          resource={longNameResource}
          onFavorite={mockOnFavorite}
        />
      );

      const title = screen.getByText(longNameResource.name);
      expect(title).toHaveClass('line-clamp-1');
    });

    it('应该处理长匹配理由', () => {
      const longReason = '这是一个非常非常非常非常非常非常长的匹配理由，应该被截断为两行显示，超出的部分会被省略号替代';

      render(
        <ResourcePreviewCard
          resource={mockResource}
          matchReason={longReason}
          onFavorite={mockOnFavorite}
        />
      );

      const reason = screen.getByText(longReason);
      expect(reason).toHaveClass('line-clamp-2');
    });
  });
});
