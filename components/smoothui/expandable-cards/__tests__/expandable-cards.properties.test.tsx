import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
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

// 生成随机资源数据的 arbitrary
const resourceArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  screenshot: fc.constant('https://example.com/screenshot.jpg'),
  url: fc.webUrl(),
  categoryId: fc.constantFrom(
    'color',
    'css',
    'font',
    'icon',
    'inspiration',
    'website',
    'ui-kit',
    'mockup'
  ),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
  rating: fc.record({
    overall: fc.double({ min: 0, max: 5 }),
    usability: fc.double({ min: 0, max: 5 }),
    aesthetics: fc.double({ min: 0, max: 5 }),
    updateFrequency: fc.double({ min: 0, max: 5 }),
    freeLevel: fc.double({ min: 0, max: 5 }),
  }),
  curatorNote: fc.string({ minLength: 10, maxLength: 100 }),
  isFeatured: fc.boolean(),
  createdAt: fc.date().map((d) => d.toISOString()),
  viewCount: fc.nat(),
  favoriteCount: fc.nat(),
}) as fc.Arbitrary<Resource>;

describe('ExpandableCards - Property-Based Tests', () => {
  /**
   * Feature: featured-cards-ui-improvement, Property 1: Favorite button visibility
   * Validates: Requirements 1.1, 1.2, 1.4
   */
  it('Property 1: favorite button is always visible with correct styling', () => {
    fc.assert(
      fc.property(
        fc.array(resourceArbitrary, { minLength: 1, maxLength: 5 }),
        fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
        (resources, favoritedIds) => {
          const onFavorite = vi.fn();
          const onVisit = vi.fn();
          const isFavorited = (id: string) => favoritedIds.includes(id);

          const { container } = render(
            <ExpandableCards
              resources={resources}
              isFavorited={isFavorited}
              onFavorite={onFavorite}
              onVisit={onVisit}
            />
          );

          // 对每个资源，验证收藏按钮存在且有正确的样式
          resources.forEach((resource) => {
            // 查找收藏按钮（通过 aria-label）
            const favoriteButtons = screen.getAllByLabelText(/收藏|取消收藏/);
            expect(favoriteButtons.length).toBeGreaterThanOrEqual(resources.length);

            // 验证按钮容器有正确的定位类
            const buttonContainers = container.querySelectorAll('.absolute.top-2.right-2');
            expect(buttonContainers.length).toBe(resources.length);

            // 验证按钮有半透明背景和背景模糊
            const buttons = container.querySelectorAll('button[aria-label*="收藏"]');
            buttons.forEach((button) => {
              const classes = button.className;
              expect(classes).toContain('bg-black/40');
              expect(classes).toContain('backdrop-blur-sm');
              expect(classes).toContain('h-8');
              expect(classes).toContain('w-8');
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: featured-cards-ui-improvement, Property 2: Favorite button interaction isolation
 * Validates: Requirements 1.3, 5.1
 */
it('Property 2: clicking favorite button does not trigger card expansion', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.array(resourceArbitrary, { minLength: 1, maxLength: 3 }),
      async (resources) => {
        const onFavorite = vi.fn();
        const onVisit = vi.fn();
        const onSelect = vi.fn();
        const isFavorited = () => false;
        const user = userEvent.setup();

        render(
          <ExpandableCards
            resources={resources}
            isFavorited={isFavorited}
            onFavorite={onFavorite}
            onVisit={onVisit}
            onSelect={onSelect}
          />
        );

        // 获取第一个收藏按钮
        const favoriteButtons = screen.getAllByLabelText(/收藏/);
        const firstButton = favoriteButtons[0];

        // 点击收藏按钮
        await user.click(firstButton);

        // 验证 onFavorite 被调用
        expect(onFavorite).toHaveBeenCalledWith(resources[0].id);

        // 验证 onSelect 没有被调用（卡片没有展开）
        expect(onSelect).not.toHaveBeenCalled();
      }
    ),
    { numRuns: 100 }
  );
});

/**
 * Feature: featured-cards-ui-improvement, Property 5: Border styling correctness
 * Validates: Requirements 3.1, 3.2, 3.3
 */
it('Property 5: right panel has border-l but not border-r', () => {
  fc.assert(
    fc.property(fc.array(resourceArbitrary, { minLength: 1, maxLength: 3 }), (resources) => {
      const onFavorite = vi.fn();
      const onVisit = vi.fn();
      const isFavorited = () => false;

      const { container } = render(
        <ExpandableCards
          resources={resources}
          selectedCard={resources[0].id}
          isFavorited={isFavorited}
          onFavorite={onFavorite}
          onVisit={onVisit}
        />
      );

      // 查找右侧面板
      const rightPanel = container.querySelector('.border-l');
      expect(rightPanel).toBeTruthy();

      // 验证有 border-l 类
      expect(rightPanel?.className).toContain('border-l');

      // 验证没有 border-r 类
      expect(rightPanel?.className).not.toContain('border-r');
    }),
    { numRuns: 100 }
  );
});

/**
 * Feature: featured-cards-ui-improvement, Property 4: Content area contrast
 * Validates: Requirements 2.3, 2.4
 */
it('Property 4: content area text has white color for contrast', () => {
  fc.assert(
    fc.property(fc.array(resourceArbitrary, { minLength: 1, maxLength: 3 }), (resources) => {
      const onFavorite = vi.fn();
      const onVisit = vi.fn();
      const isFavorited = () => false;

      const { container } = render(
        <ExpandableCards
          resources={resources}
          isFavorited={isFavorited}
          onFavorite={onFavorite}
          onVisit={onVisit}
        />
      );

      // 验证资源名称有 text-white 类
      const nameElements = container.querySelectorAll('h3.text-white');
      expect(nameElements.length).toBe(resources.length);

      // 验证评分值有 text-white/90 类
      const ratingElements = container.querySelectorAll('.text-white\\/90');
      expect(ratingElements.length).toBeGreaterThanOrEqual(resources.length);

      // 验证标签有 text-white 类
      const badges = container.querySelectorAll('.bg-white\\/20.text-white');
      expect(badges.length).toBeGreaterThan(0);
    }),
    { numRuns: 100 }
  );
});
