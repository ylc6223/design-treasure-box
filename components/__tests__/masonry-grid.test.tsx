import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MasonryGrid } from '../masonry-grid';
import type { Resource } from '@/types';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const mockResources: Resource[] = [
  {
    id: 'test-1',
    name: 'Test Resource 1',
    url: 'https://example.com/1',
    description: 'Test description 1',
    screenshotUrl: 'https://example.com/screenshot1.jpg',
    categoryId: 'color',
    tags: ['配色', '工具'],
    rating: {
      overall: 4.5,
      usability: 5.0,
      aesthetics: 4.5,
      updateFrequency: 4.0,
      freeLevel: 5.0,
    },
    curatorNote: 'Test note 1',
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    viewCount: 100,
    favoriteCount: 50,
  },
  {
    id: 'test-2',
    name: 'Test Resource 2',
    url: 'https://example.com/2',
    description: 'Test description 2',
    screenshotUrl: 'https://example.com/screenshot2.jpg',
    categoryId: 'css',
    tags: ['CSS', '框架'],
    rating: {
      overall: 5.0,
      usability: 5.0,
      aesthetics: 5.0,
      updateFrequency: 5.0,
      freeLevel: 5.0,
    },
    curatorNote: 'Test note 2',
    isFeatured: false,
    createdAt: '2024-01-02T00:00:00.000Z',
    viewCount: 200,
    favoriteCount: 100,
  },
  {
    id: 'test-3',
    name: 'Test Resource 3',
    url: 'https://example.com/3',
    description: 'Test description 3',
    screenshotUrl: 'https://example.com/screenshot3.jpg',
    categoryId: 'font',
    tags: ['字体', '免费'],
    rating: {
      overall: 4.0,
      usability: 4.0,
      aesthetics: 4.5,
      updateFrequency: 3.5,
      freeLevel: 5.0,
    },
    curatorNote: 'Test note 3',
    isFeatured: false,
    createdAt: '2024-01-03T00:00:00.000Z',
    viewCount: 150,
    favoriteCount: 75,
  },
];

describe('MasonryGrid', () => {
  it('renders all resources', () => {
    const isFavorited = vi.fn(() => false);
    const onFavorite = vi.fn();

    render(
      <MasonryGrid resources={mockResources} isFavorited={isFavorited} onFavorite={onFavorite} />
    );

    expect(screen.getByText('Test Resource 1')).toBeInTheDocument();
    expect(screen.getByText('Test Resource 2')).toBeInTheDocument();
    expect(screen.getByText('Test Resource 3')).toBeInTheDocument();
  });

  it('displays empty state when no resources', () => {
    const isFavorited = vi.fn(() => false);
    const onFavorite = vi.fn();

    render(<MasonryGrid resources={[]} isFavorited={isFavorited} onFavorite={onFavorite} />);

    expect(screen.getByText('暂无资源')).toBeInTheDocument();
    expect(screen.getByText('请尝试其他筛选条件')).toBeInTheDocument();
  });

  it('applies responsive grid classes', () => {
    const isFavorited = vi.fn(() => false);
    const onFavorite = vi.fn();

    const { container } = render(
      <MasonryGrid resources={mockResources} isFavorited={isFavorited} onFavorite={onFavorite} />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2'); // Mobile
    expect(grid).toHaveClass('md:grid-cols-3'); // Tablet
    expect(grid).toHaveClass('lg:grid-cols-4'); // Desktop
    expect(grid).toHaveClass('xl:grid-cols-5'); // XL
  });

  it('applies custom className', () => {
    const isFavorited = vi.fn(() => false);
    const onFavorite = vi.fn();

    const { container } = render(
      <MasonryGrid
        resources={mockResources}
        isFavorited={isFavorited}
        onFavorite={onFavorite}
        className="custom-class"
      />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('custom-class');
  });

  it('passes correct props to ResourceCard', () => {
    const isFavorited = vi.fn((id) => id === 'test-1');
    const onFavorite = vi.fn();

    render(
      <MasonryGrid resources={mockResources} isFavorited={isFavorited} onFavorite={onFavorite} />
    );

    // 验证 isFavorited 被调用
    expect(isFavorited).toHaveBeenCalledWith('test-1');
    expect(isFavorited).toHaveBeenCalledWith('test-2');
    expect(isFavorited).toHaveBeenCalledWith('test-3');
  });

  it('applies stagger animation delay', () => {
    const isFavorited = vi.fn(() => false);
    const onFavorite = vi.fn();

    const { container } = render(
      <MasonryGrid resources={mockResources} isFavorited={isFavorited} onFavorite={onFavorite} />
    );

    const cards = container.querySelectorAll('.animate-fade-in');

    // 第一个卡片延迟 0ms
    expect(cards[0]).toHaveStyle({ animationDelay: '0ms' });

    // 第二个卡片延迟 50ms
    expect(cards[1]).toHaveStyle({ animationDelay: '50ms' });

    // 第三个卡片延迟 100ms
    expect(cards[2]).toHaveStyle({ animationDelay: '100ms' });
  });

  it('renders correct number of cards', () => {
    const isFavorited = vi.fn(() => false);
    const onFavorite = vi.fn();

    const { container } = render(
      <MasonryGrid resources={mockResources} isFavorited={isFavorited} onFavorite={onFavorite} />
    );

    const cards = container.querySelectorAll('.animate-fade-in');
    expect(cards).toHaveLength(mockResources.length);
  });

  it('handles single resource', () => {
    const isFavorited = vi.fn(() => false);
    const onFavorite = vi.fn();

    render(
      <MasonryGrid
        resources={[mockResources[0]]}
        isFavorited={isFavorited}
        onFavorite={onFavorite}
      />
    );

    expect(screen.getByText('Test Resource 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Resource 2')).not.toBeInTheDocument();
  });

  it('handles large number of resources', () => {
    const isFavorited = vi.fn(() => false);
    const onFavorite = vi.fn();

    const manyResources = Array.from({ length: 20 }, (_, i) => ({
      ...mockResources[0],
      id: `test-${i}`,
      name: `Test Resource ${i}`,
    }));

    const { container } = render(
      <MasonryGrid resources={manyResources} isFavorited={isFavorited} onFavorite={onFavorite} />
    );

    const cards = container.querySelectorAll('.animate-fade-in');
    expect(cards).toHaveLength(20);
  });
});
