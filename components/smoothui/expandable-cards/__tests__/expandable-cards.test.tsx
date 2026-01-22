import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpandableCards from '../index';
import type { Resource } from '@/types';

// Mock motion components
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockResource: Resource = {
  id: 'test-1',
  name: 'Test Resource',
  url: 'https://example.com',
  description: 'Test description',
  screenshot: 'https://example.com/screenshot.jpg',
  categoryId: 'color',
  tags: ['配色', '工具'],
  rating: {
    overall: 4.5,
    usability: 5.0,
    aesthetics: 4.5,
    updateFrequency: 4.0,
    freeLevel: 5.0,
  },
  curatorNote: 'Test note',
  isFeatured: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  viewCount: 100,
  favoriteCount: 50,
};

describe('ExpandableCards - Unit Tests', () => {
  describe('Right Panel Buttons', () => {
    it('right panel only contains visit button when expanded', () => {
      const onFavorite = vi.fn();
      const onVisit = vi.fn();
      const isFavorited = () => false;

      const { container } = render(
        <ExpandableCards
          resources={[mockResource]}
          selectedCard={mockResource.id}
          isFavorited={isFavorited}
          onFavorite={onFavorite}
          onVisit={onVisit}
        />
      );

      // 查找右侧面板（通过 border-l 类）
      const rightPanel = container.querySelector('.border-l');
      expect(rightPanel).toBeTruthy();

      // 在右侧面板中查找按钮
      const visitButton = within(rightPanel as HTMLElement).getByText('访问');
      expect(visitButton).toBeInTheDocument();

      // 验证右侧面板中没有收藏按钮（通过文本"收藏"或"已收藏"）
      expect(within(rightPanel as HTMLElement).queryByText('收藏')).not.toBeInTheDocument();
      expect(within(rightPanel as HTMLElement).queryByText('已收藏')).not.toBeInTheDocument();
    });

    it('visit button calls onVisit with correct URL', async () => {
      const onFavorite = vi.fn();
      const onVisit = vi.fn();
      const isFavorited = () => false;
      const user = userEvent.setup();

      const { container } = render(
        <ExpandableCards
          resources={[mockResource]}
          selectedCard={mockResource.id}
          isFavorited={isFavorited}
          onFavorite={onFavorite}
          onVisit={onVisit}
        />
      );

      const rightPanel = container.querySelector('.border-l');
      const visitButton = within(rightPanel as HTMLElement).getByText('访问');

      await user.click(visitButton);

      expect(onVisit).toHaveBeenCalledWith(mockResource.url);
    });

    it('favorite button is not present in right panel', () => {
      const onFavorite = vi.fn();
      const onVisit = vi.fn();
      const isFavorited = () => false;

      const { container } = render(
        <ExpandableCards
          resources={[mockResource]}
          selectedCard={mockResource.id}
          isFavorited={isFavorited}
          onFavorite={onFavorite}
          onVisit={onVisit}
        />
      );

      const rightPanel = container.querySelector('.border-l');

      // 验证右侧面板中没有 Heart 图标
      const heartIcons = within(rightPanel as HTMLElement).queryAllByRole('img', { hidden: true });
      const hasHeartIcon = heartIcons.some((icon) => icon.className.includes('lucide-heart'));
      expect(hasHeartIcon).toBe(false);
    });
  });
});
