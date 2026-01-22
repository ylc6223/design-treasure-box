/**
 * ResourceMessage 组件测试
 * Feature: ai-chat-assistant, Property 5: 视觉预览完整性
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResourceMessage } from '../resource-message';
import type { ResourceRecommendation } from '@/types/ai-chat';
import type { Resource } from '@/types';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, onError }: any) => (
    <img src={src} alt={alt} onError={onError} data-testid="resource-image" />
  ),
}));

describe('ResourceMessage', () => {
  const mockResource: Resource = {
    id: 'test-resource-1',
    name: 'Test Resource',
    url: 'https://example.com',
    description: 'A test resource for testing',
    screenshot: 'https://example.com/screenshot.jpg',
    categoryId: 'color',
    tags: ['test', 'color', 'tool'],
    rating: {
      overall: 4.5,
      usability: 4.5,
      aesthetics: 4.5,
      updateFrequency: 4.0,
      freeLevel: 5.0,
    },
    curatorNote: 'Test curator note',
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    viewCount: 100,
    favoriteCount: 20,
  };

  const mockRecommendation: ResourceRecommendation = {
    resource: mockResource,
    relevanceScore: 0.9,
    matchReason: 'This resource matches your requirements perfectly',
    matchedAspects: ['color', 'tool', 'free'],
    confidence: 0.95,
  };

  const mockHandlers = {
    onResourceClick: vi.fn(),
    onFavorite: vi.fn(),
    onVisit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该渲染资源推荐', () => {
      render(<ResourceMessage resources={[mockRecommendation]} {...mockHandlers} />);

      expect(screen.getByText('Test Resource')).toBeInTheDocument();
      expect(
        screen.getByText('This resource matches your requirements perfectly')
      ).toBeInTheDocument();
    });

    it('应该显示资源截图', () => {
      render(<ResourceMessage resources={[mockRecommendation]} {...mockHandlers} />);

      const image = screen.getByTestId('resource-image');
      expect(image).toHaveAttribute('src', 'https://example.com/screenshot.jpg');
      expect(image).toHaveAttribute('alt', 'Test Resource');
    });

    it('应该显示精选标识', () => {
      render(<ResourceMessage resources={[mockRecommendation]} {...mockHandlers} />);

      expect(screen.getByText('精选')).toBeInTheDocument();
    });

    it('应该显示评分', () => {
      render(<ResourceMessage resources={[mockRecommendation]} {...mockHandlers} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('应该显示匹配方面标签', () => {
      render(<ResourceMessage resources={[mockRecommendation]} {...mockHandlers} />);

      expect(screen.getByText('color')).toBeInTheDocument();
      expect(screen.getByText('tool')).toBeInTheDocument();
      expect(screen.getByText('free')).toBeInTheDocument();
    });
  });

  describe('图片加载错误处理', () => {
    it('应该在图片加载失败时显示占位符', () => {
      render(<ResourceMessage resources={[mockRecommendation]} {...mockHandlers} />);

      const image = screen.getByTestId('resource-image');
      fireEvent.error(image);

      expect(screen.getByText('无图片')).toBeInTheDocument();
    });
  });

  describe('用户交互', () => {
    it('应该在点击收藏按钮时调用 onFavorite', () => {
      render(<ResourceMessage resources={[mockRecommendation]} {...mockHandlers} />);

      const favoriteButton = screen.getByLabelText('收藏');
      fireEvent.click(favoriteButton);

      expect(mockHandlers.onFavorite).toHaveBeenCalledWith('test-resource-1');
    });

    it('应该在点击访问按钮时调用 onVisit', () => {
      render(<ResourceMessage resources={[mockRecommendation]} {...mockHandlers} />);

      const visitButton = screen.getByText('访问');
      fireEvent.click(visitButton);

      expect(mockHandlers.onVisit).toHaveBeenCalledWith('test-resource-1');
    });

    it('应该在点击详情按钮时调用 onResourceClick', () => {
      render(<ResourceMessage resources={[mockRecommendation]} {...mockHandlers} />);

      const detailsButton = screen.getByText('详情');
      fireEvent.click(detailsButton);

      expect(mockHandlers.onResourceClick).toHaveBeenCalledWith(mockResource);
    });
  });

  describe('多个资源', () => {
    it('应该渲染多个资源推荐', () => {
      const recommendations = [
        mockRecommendation,
        {
          ...mockRecommendation,
          resource: { ...mockResource, id: 'test-resource-2', name: 'Test Resource 2' },
        },
      ];

      render(<ResourceMessage resources={recommendations} {...mockHandlers} />);

      expect(screen.getByText('Test Resource')).toBeInTheDocument();
      expect(screen.getByText('Test Resource 2')).toBeInTheDocument();
    });
  });

  describe('高度匹配指示器', () => {
    it('应该为高相关度资源显示匹配指示器', () => {
      const highRelevanceRecommendation = {
        ...mockRecommendation,
        relevanceScore: 0.85,
      };

      render(<ResourceMessage resources={[highRelevanceRecommendation]} {...mockHandlers} />);

      expect(screen.getByText('高度匹配')).toBeInTheDocument();
    });

    it('应该为低相关度资源隐藏匹配指示器', () => {
      const lowRelevanceRecommendation = {
        ...mockRecommendation,
        relevanceScore: 0.5,
      };

      render(<ResourceMessage resources={[lowRelevanceRecommendation]} {...mockHandlers} />);

      expect(screen.queryByText('高度匹配')).not.toBeInTheDocument();
    });
  });

  describe('空状态', () => {
    it('应该在没有资源时不渲染任何内容', () => {
      const { container } = render(<ResourceMessage resources={[]} {...mockHandlers} />);

      expect(container.firstChild).toBeNull();
    });
  });
});
