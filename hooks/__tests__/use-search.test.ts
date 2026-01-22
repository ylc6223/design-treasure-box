import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearch, useAllTags, usePopularTags } from '../use-search';
import { type Resource } from '@/types';

const mockResources: Resource[] = [
  {
    id: 'resource-1',
    name: 'Coolors',
    url: 'https://coolors.co',
    description: '快速生成配色方案',
    screenshot: 'https://example.com/1.jpg',
    categoryId: 'color',
    tags: ['配色', '工具', '免费'],
    rating: { overall: 4.5, usability: 5.0, aesthetics: 4.5, updateFrequency: 4.0, freeLevel: 5.0 },
    curatorNote: '非常好用',
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    viewCount: 1000,
    favoriteCount: 250,
  },
  {
    id: 'resource-2',
    name: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    description: 'CSS 框架',
    screenshot: 'https://example.com/2.jpg',
    categoryId: 'css',
    tags: ['CSS', '框架', '免费'],
    rating: { overall: 5.0, usability: 4.5, aesthetics: 4.5, updateFrequency: 5.0, freeLevel: 5.0 },
    curatorNote: '最流行的框架',
    isFeatured: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    viewCount: 2000,
    favoriteCount: 500,
  },
  {
    id: 'resource-3',
    name: 'Google Fonts',
    url: 'https://fonts.google.com',
    description: '免费字体库',
    screenshot: 'https://example.com/3.jpg',
    categoryId: 'font',
    tags: ['字体', '免费', 'Google'],
    rating: { overall: 4.0, usability: 4.5, aesthetics: 4.0, updateFrequency: 4.0, freeLevel: 5.0 },
    curatorNote: '最全面的字体库',
    isFeatured: false,
    createdAt: '2024-01-03T00:00:00.000Z',
    viewCount: 1500,
    favoriteCount: 300,
  },
];

describe('useSearch', () => {
  it('should return all resources when no filters applied', () => {
    const { result } = renderHook(() => useSearch(mockResources, {}));

    expect(result.current.results).toHaveLength(3);
    expect(result.current.total).toBe(3);
    expect(result.current.hasResults).toBe(true);
  });

  it('should filter by query (name)', () => {
    const { result } = renderHook(() => useSearch(mockResources, { query: 'Coolors' }));

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('resource-1');
  });

  it('should filter by query (description)', () => {
    const { result } = renderHook(() => useSearch(mockResources, { query: '框架' }));

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('resource-2');
  });

  it('should filter by query (tags)', () => {
    const { result } = renderHook(() => useSearch(mockResources, { query: '字体' }));

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('resource-3');
  });

  it('should filter by category', () => {
    const { result } = renderHook(() => useSearch(mockResources, { categoryId: 'color' }));

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].categoryId).toBe('color');
  });

  it('should filter by tags (single tag)', () => {
    const { result } = renderHook(() => useSearch(mockResources, { tags: ['免费'] }));

    expect(result.current.results).toHaveLength(3);
  });

  it('should filter by tags (multiple tags - AND logic)', () => {
    const { result } = renderHook(() => useSearch(mockResources, { tags: ['配色', '工具'] }));

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('resource-1');
  });

  it('should filter by featured status', () => {
    const { result } = renderHook(() => useSearch(mockResources, { isFeatured: true }));

    expect(result.current.results).toHaveLength(2);
    expect(result.current.results.every((r) => r.isFeatured)).toBe(true);
  });

  it('should sort by rating (descending)', () => {
    const { result } = renderHook(() =>
      useSearch(mockResources, { sortBy: 'rating', sortDirection: 'desc' })
    );

    expect(result.current.results[0].id).toBe('resource-2'); // rating 5.0
    expect(result.current.results[1].id).toBe('resource-1'); // rating 4.5
    expect(result.current.results[2].id).toBe('resource-3'); // rating 4.0
  });

  it('should sort by viewCount (ascending)', () => {
    const { result } = renderHook(() =>
      useSearch(mockResources, { sortBy: 'viewCount', sortDirection: 'asc' })
    );

    expect(result.current.results[0].viewCount).toBe(1000);
    expect(result.current.results[1].viewCount).toBe(1500);
    expect(result.current.results[2].viewCount).toBe(2000);
  });

  it('should combine multiple filters', () => {
    const { result } = renderHook(() =>
      useSearch(mockResources, {
        query: '免费',
        isFeatured: true,
        sortBy: 'rating',
        sortDirection: 'desc',
      })
    );

    expect(result.current.results).toHaveLength(2);
    expect(result.current.results[0].id).toBe('resource-2');
  });

  it('should return empty results when no matches', () => {
    const { result } = renderHook(() => useSearch(mockResources, { query: 'nonexistent' }));

    expect(result.current.results).toHaveLength(0);
    expect(result.current.hasResults).toBe(false);
  });
});

describe('useAllTags', () => {
  it('should return all unique tags', () => {
    const { result } = renderHook(() => useAllTags(mockResources));

    expect(result.current).toContain('配色');
    expect(result.current).toContain('工具');
    expect(result.current).toContain('免费');
    expect(result.current).toContain('CSS');
    expect(result.current).toContain('框架');
    expect(result.current).toContain('字体');
    expect(result.current).toContain('Google');
  });

  it('should sort tags by frequency (descending)', () => {
    const { result } = renderHook(() => useAllTags(mockResources));

    // '免费' appears 3 times, should be first
    expect(result.current[0]).toBe('免费');
  });
});

describe('usePopularTags', () => {
  it('should return top N tags', () => {
    const { result } = renderHook(() => usePopularTags(mockResources, 3));

    expect(result.current).toHaveLength(3);
  });

  it('should return most popular tags first', () => {
    const { result } = renderHook(() => usePopularTags(mockResources, 5));

    expect(result.current[0]).toBe('免费'); // appears 3 times
  });
});
