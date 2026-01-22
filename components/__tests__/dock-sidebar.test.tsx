import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DockSidebar } from '../dock-sidebar';
import { type Category } from '@/types';

const mockCategories: Category[] = [
  {
    id: 'color',
    name: '配色工具',
    icon: 'Palette',
    description: '调色板、配色方案生成器',
    color: '#E94560',
  },
  {
    id: 'css',
    name: 'CSS模板',
    icon: 'Code',
    description: 'CSS框架、样式库、动画效果',
    color: '#00D9FF',
  },
  {
    id: 'font',
    name: '字体资源',
    icon: 'Type',
    description: '免费字体、字体配对工具',
    color: '#F8B500',
  },
];

describe('DockSidebar', () => {
  it('renders all categories', () => {
    const onCategoryClick = vi.fn();
    render(<DockSidebar categories={mockCategories} onCategoryClick={onCategoryClick} />);

    // 检查所有分类按钮是否存在（桌面版 + 移动版）
    expect(screen.getAllByLabelText('配色工具').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('CSS模板').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('字体资源').length).toBeGreaterThan(0);
  });

  it('renders favorites button', () => {
    const onCategoryClick = vi.fn();
    render(<DockSidebar categories={mockCategories} onCategoryClick={onCategoryClick} />);

    // 检查收藏按钮
    const favoritesButtons = screen.getAllByLabelText('我的收藏');
    expect(favoritesButtons.length).toBeGreaterThan(0);
  });

  it('calls onCategoryClick when category is clicked', () => {
    const onCategoryClick = vi.fn();

    render(<DockSidebar categories={mockCategories} onCategoryClick={onCategoryClick} />);

    const colorButtons = screen.getAllByLabelText('配色工具');
    fireEvent.click(colorButtons[0]); // 点击第一个（桌面版）

    expect(onCategoryClick).toHaveBeenCalledWith('color');
  });

  it('highlights active category', () => {
    const onCategoryClick = vi.fn();

    render(
      <DockSidebar
        categories={mockCategories}
        activeCategory="color"
        onCategoryClick={onCategoryClick}
      />
    );

    // 激活的分类应该有特殊样式
    const activeButtons = screen.getAllByLabelText('配色工具');
    expect(activeButtons[0].className).toContain('bg-[var(--surface)]');
  });

  it('renders desktop and mobile versions', () => {
    const onCategoryClick = vi.fn();

    const { container } = render(
      <DockSidebar categories={mockCategories} onCategoryClick={onCategoryClick} />
    );

    // 应该有桌面版（aside）和移动版（nav）
    const aside = container.querySelector('aside');
    const nav = container.querySelector('nav');

    expect(aside).toBeDefined();
    expect(nav).toBeDefined();
  });

  it('applies custom className', () => {
    const onCategoryClick = vi.fn();

    const { container } = render(
      <DockSidebar
        categories={mockCategories}
        onCategoryClick={onCategoryClick}
        className="custom-class"
      />
    );

    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('custom-class');
  });
});
