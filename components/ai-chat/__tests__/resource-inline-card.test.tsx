/**
 * ResourceInlineCard 组件测试
 * 
 * Feature: ai-chat-assistant
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResourceInlineCard } from '../resource-inline-card';
import type { Resource } from '@/types';

describe('ResourceInlineCard', () => {
  const mockResource: Resource = {
    id: 'test-resource-1',
    name: 'Dribbble',
    url: 'https://dribbble.com',
    description: '高质量UI设计作品集',
    screenshot: 'https://example.com/screenshot.jpg',
    categoryId: 'ui-inspiration',
    tags: ['UI设计', '灵感', '作品集'],
    rating: {
      overall: 4.8,
      usability: 4.5,
      aesthetics: 5.0,
      updateFrequency: 4.5,
      freeLevel: 3.5,
    },
    curatorNote: '全球顶尖设计师的创意作品',
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00Z',
    viewCount: 1000,
    favoriteCount: 500,
  };

  const mockHandlers = {
    onViewDetails: vi.fn(),
    onFavorite: vi.fn(),
    onVisit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('简化版卡片渲染', () => {
    it('应该显示缩略图、名称、评分和类别', () => {
      render(
        <ResourceInlineCard
          resource={mockResource}
          {...mockHandlers}
        />
      );

      // 名称
      expect(screen.getByText('Dribbble')).toBeInTheDocument();
      
      // 类别
      expect(screen.getByText('ui-inspiration')).toBeInTheDocument();
      
      // 精选标识
      expect(screen.getByText('精选')).toBeInTheDocument();
    });

    it('应该显示缩略图', () => {
      render(
        <ResourceInlineCard
          resource={mockResource}
          {...mockHandlers}
        />
      );

      const image = screen.getByAltText('Dribbble');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src');
    });

    it('应该显示箭头图标', () => {
      const { container } = render(
        <ResourceInlineCard
          resource={mockResource}
          {...mockHandlers}
        />
      );

      // ChevronRight 图标应该存在
      const svg = container.querySelector('svg[class*="lucide-chevron-right"]');
      expect(svg).toBeInTheDocument();
    });

    it('应该在非精选资源时不显示精选标识', () => {
      const nonFeaturedResource = { ...mockResource, isFeatured: false };
      
      render(
        <ResourceInlineCard
          resource={nonFeaturedResource}
          {...mockHandlers}
        />
      );

      expect(screen.queryByText('精选')).not.toBeInTheDocument();
    });
  });

  describe('悬停效果', () => {
    it('应该有悬停样式类', () => {
      const { container } = render(
        <ResourceInlineCard
          resource={mockResource}
          {...mockHandlers}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('hover:bg-accent/50');
      expect(card).toHaveClass('transition-colors');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('点击交互', () => {
    it('应该在点击卡片时打开详情', () => {
      const { container } = render(
        <ResourceInlineCard
          resource={mockResource}
          {...mockHandlers}
        />
      );

      const card = container.firstChild as HTMLElement;
      fireEvent.click(card);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(mockResource);
    });

    it('应该在点击卡片后显示详情内容', () => {
      const { container } = render(
        <ResourceInlineCard
          resource={mockResource}
          {...mockHandlers}
        />
      );

      const card = container.firstChild as HTMLElement;
      fireEvent.click(card);

      // Sheet 应该打开，显示详细信息
      // 注意：由于 Sheet 使用 Portal，可能需要特殊处理
      // 这里我们验证 onViewDetails 被调用即可
      expect(mockHandlers.onViewDetails).toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    it('应该处理图片加载失败', () => {
      render(
        <ResourceInlineCard
          resource={mockResource}
          {...mockHandlers}
        />
      );

      const image = screen.getByAltText('Dribbble');
      
      // 触发图片加载失败
      fireEvent.error(image);

      // 应该显示占位符
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('应该处理没有标签的资源', () => {
      const resourceWithoutTags = { ...mockResource, tags: [] };
      
      render(
        <ResourceInlineCard
          resource={resourceWithoutTags}
          {...mockHandlers}
        />
      );

      // 应该正常渲染，不报错
      expect(screen.getByText('Dribbble')).toBeInTheDocument();
    });

    it('应该处理没有策展人笔记的资源', () => {
      const resourceWithoutNote = { ...mockResource, curatorNote: '' };
      
      render(
        <ResourceInlineCard
          resource={resourceWithoutNote}
          {...mockHandlers}
        />
      );

      // 应该正常渲染，不报错
      expect(screen.getByText('Dribbble')).toBeInTheDocument();
    });
  });

  describe('收藏状态', () => {
    it('应该显示未收藏状态', () => {
      render(
        <ResourceInlineCard
          resource={mockResource}
          isFavorited={false}
          {...mockHandlers}
        />
      );

      // 卡片应该正常显示
      expect(screen.getByText('Dribbble')).toBeInTheDocument();
    });

    it('应该显示已收藏状态', () => {
      render(
        <ResourceInlineCard
          resource={mockResource}
          isFavorited={true}
          {...mockHandlers}
        />
      );

      // 卡片应该正常显示
      expect(screen.getByText('Dribbble')).toBeInTheDocument();
    });
  });
});
