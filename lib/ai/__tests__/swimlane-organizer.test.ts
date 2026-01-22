import { describe, it, expect } from 'vitest';
import { SwimlaneOrganizer, organizeIntoSwimlanes } from '../swimlane-organizer';
import type { SearchResult } from '@/types/ai-chat';
import type { Resource } from '@/types';

// Mock 资源数据
const createMockResource = (id: string, categoryId: string, tags: string[] = []): Resource => ({
  id,
  name: `Resource ${id}`,
  description: 'Test resource',
  url: 'https://example.com',
  categoryId,
  tags,
  rating: {
    overall: 4.0,
    usability: 4.0,
    aesthetics: 4.0,
    updateFrequency: 4.0,
    freeLevel: 4.0,
  },
  featured: false,
  curatorNote: '',
  screenshot: '',
});

const createMockSearchResult = (
  id: string,
  categoryId: string,
  similarity: number,
  tags: string[] = []
): SearchResult => ({
  resource: createMockResource(id, categoryId, tags),
  similarity,
  matchedFields: ['name'],
});

describe('SwimlaneOrganizer', () => {
  describe('organizeIntoSwimlanes', () => {
    it('应该返回空数组当没有结果时', () => {
      const result = SwimlaneOrganizer.organizeIntoSwimlanes([], 'relevance');
      expect(result).toEqual([]);
    });

    it('应该按相关度分组（默认策略）', () => {
      const results: SearchResult[] = [
        createMockSearchResult('1', 'icons', 0.9),
        createMockSearchResult('2', 'icons', 0.85),
        createMockSearchResult('3', 'icons', 0.6),
        createMockSearchResult('4', 'icons', 0.4),
      ];

      const groups = SwimlaneOrganizer.organizeIntoSwimlanes(results);

      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].title).toBe('高度匹配');
      expect(groups[0].results.length).toBe(2);
    });

    it('应该按类别分组', () => {
      const results: SearchResult[] = [
        createMockSearchResult('1', 'icons', 0.9),
        createMockSearchResult('2', 'icons', 0.85),
        createMockSearchResult('3', 'icons', 0.8),
        createMockSearchResult('4', 'fonts', 0.7),
        createMockSearchResult('5', 'fonts', 0.6),
        createMockSearchResult('6', 'fonts', 0.5),
      ];

      const groups = SwimlaneOrganizer.organizeIntoSwimlanes(results, 'category');

      expect(groups.length).toBe(2);
      expect(groups.some((g) => g.title === '图标素材')).toBe(true);
      expect(groups.some((g) => g.title === '字体资源')).toBe(true);
    });

    it('应该过滤掉少于3个资源的分组', () => {
      const results: SearchResult[] = [
        createMockSearchResult('1', 'icons', 0.9),
        createMockSearchResult('2', 'icons', 0.85),
        createMockSearchResult('3', 'icons', 0.8),
        createMockSearchResult('4', 'fonts', 0.7), // 只有1个
      ];

      const groups = SwimlaneOrganizer.organizeIntoSwimlanes(results, 'category');

      expect(groups.length).toBe(1);
      expect(groups[0].title).toBe('图标素材');
    });

    it('应该按风格分组', () => {
      const results: SearchResult[] = [
        createMockSearchResult('1', 'icons', 0.9, ['minimal', 'clean']),
        createMockSearchResult('2', 'icons', 0.85, ['minimalist']),
        createMockSearchResult('3', 'icons', 0.8, ['极简']),
        createMockSearchResult('4', 'icons', 0.7, ['3d', 'modern']),
        createMockSearchResult('5', 'icons', 0.6, ['3d']),
        createMockSearchResult('6', 'icons', 0.5, ['立体']),
      ];

      const groups = SwimlaneOrganizer.organizeIntoSwimlanes(results, 'style');

      expect(groups.length).toBe(2);
      expect(groups.some((g) => g.title === '极简风格')).toBe(true);
      expect(groups.some((g) => g.title === '3D 风格')).toBe(true);
    });

    it('应该为每个分组生成唯一的 groupKey', () => {
      const results: SearchResult[] = [
        createMockSearchResult('1', 'icons', 0.9),
        createMockSearchResult('2', 'icons', 0.6),
        createMockSearchResult('3', 'icons', 0.3),
      ];

      const groups = SwimlaneOrganizer.organizeIntoSwimlanes(results, 'relevance');

      const groupKeys = groups.map((g) => g.groupKey);
      const uniqueKeys = new Set(groupKeys);
      expect(groupKeys.length).toBe(uniqueKeys.size);
    });
  });

  describe('detectStyle', () => {
    it('应该检测极简风格', () => {
      const results: SearchResult[] = [
        createMockSearchResult('1', 'icons', 0.9, ['minimal']),
        createMockSearchResult('2', 'icons', 0.9, ['minimalist']),
        createMockSearchResult('3', 'icons', 0.9, ['极简']),
        createMockSearchResult('4', 'icons', 0.9, ['other']),
        createMockSearchResult('5', 'icons', 0.9, ['other']),
        createMockSearchResult('6', 'icons', 0.9, ['other']),
      ];

      const groups = SwimlaneOrganizer.organizeIntoSwimlanes(results, 'style');
      expect(groups.some((g) => g.title === '极简风格')).toBe(true);
    });

    it('应该检测3D风格', () => {
      const results: SearchResult[] = [
        createMockSearchResult('1', 'icons', 0.9, ['3d']),
        createMockSearchResult('2', 'icons', 0.9, ['立体']),
        createMockSearchResult('3', 'icons', 0.9, ['三维']),
        createMockSearchResult('4', 'icons', 0.9, ['other']),
        createMockSearchResult('5', 'icons', 0.9, ['other']),
        createMockSearchResult('6', 'icons', 0.9, ['other']),
      ];

      const groups = SwimlaneOrganizer.organizeIntoSwimlanes(results, 'style');
      expect(groups.some((g) => g.title === '3D 风格')).toBe(true);
    });
  });

  describe('便捷函数', () => {
    it('organizeIntoSwimlanes 应该工作', () => {
      const results: SearchResult[] = [
        createMockSearchResult('1', 'icons', 0.9),
        createMockSearchResult('2', 'icons', 0.6),
      ];

      const groups = organizeIntoSwimlanes(results);
      expect(groups.length).toBeGreaterThan(0);
    });
  });
});
