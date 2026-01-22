import type { SearchResult } from '@/types/ai-chat';

export interface SwimlaneGroup {
  title: string;
  icon?: string;
  results: SearchResult[];
  groupKey: string;
}

export type GroupByStrategy = 'category' | 'style' | 'relevance';

/**
 * 泳道组织器
 * 将搜索结果按不同策略分组
 */
export class SwimlaneOrganizer {
  /**
   * 将搜索结果组织成泳道分组
   */
  static organizeIntoSwimlanes(
    results: SearchResult[],
    strategy: GroupByStrategy = 'relevance'
  ): SwimlaneGroup[] {
    if (results.length === 0) return [];

    switch (strategy) {
      case 'category':
        return this.groupByCategory(results);
      case 'style':
        return this.groupByStyle(results);
      case 'relevance':
      default:
        return this.groupByRelevance(results);
    }
  }

  /**
   * 按类别分组
   */
  private static groupByCategory(results: SearchResult[]): SwimlaneGroup[] {
    const categoryMap = new Map<string, SearchResult[]>();

    for (const result of results) {
      const category = result.resource.categoryId || '其他';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(result);
    }

    return Array.from(categoryMap.entries())
      .filter(([_, items]) => items.length >= 3) // 每组至少3个资源
      .map(([category, items]) => ({
        title: this.getCategoryLabel(category),
        icon: category,
        results: items,
        groupKey: `category-${category}`,
      }));
  }

  /**
   * 按风格分组
   */
  private static groupByStyle(results: SearchResult[]): SwimlaneGroup[] {
    const styleMap = new Map<string, SearchResult[]>();

    for (const result of results) {
      const tags = result.resource.tags || [];
      const style = this.detectStyle(tags) || '综合';
      if (!styleMap.has(style)) {
        styleMap.set(style, []);
      }
      styleMap.get(style)!.push(result);
    }

    return Array.from(styleMap.entries())
      .filter(([_, items]) => items.length >= 3)
      .map(([style, items]) => ({
        title: style,
        icon: style,
        results: items,
        groupKey: `style-${style}`,
      }));
  }

  /**
   * 按相关度分组
   */
  private static groupByRelevance(results: SearchResult[]): SwimlaneGroup[] {
    const highRelevance = results.filter((r) => r.similarity >= 0.8);
    const mediumRelevance = results.filter((r) => r.similarity >= 0.5 && r.similarity < 0.8);
    const lowRelevance = results.filter((r) => r.similarity < 0.5);

    const groups: SwimlaneGroup[] = [];

    if (highRelevance.length > 0) {
      groups.push({
        title: '高度匹配',
        icon: 'sparkles',
        results: highRelevance,
        groupKey: 'relevance-high',
      });
    }

    if (mediumRelevance.length > 0) {
      groups.push({
        title: '相关推荐',
        icon: 'star',
        results: mediumRelevance,
        groupKey: 'relevance-medium',
      });
    }

    if (lowRelevance.length > 0) {
      groups.push({
        title: '更多探索',
        icon: 'search',
        results: lowRelevance,
        groupKey: 'relevance-low',
      });
    }

    return groups;
  }

  /**
   * 检测资源风格
   */
  private static detectStyle(tags: string[]): string | null {
    const styleKeywords: Record<string, string[]> = {
      极简风格: ['minimal', 'minimalist', '极简', '简约'],
      '3D 风格': ['3d', '立体', '三维'],
      扁平风格: ['flat', '扁平'],
      渐变风格: ['gradient', '渐变'],
      暗黑模式: ['dark', 'dark-mode', '暗黑'],
    };

    const lowerTags = tags.map((t) => t.toLowerCase());

    for (const [style, keywords] of Object.entries(styleKeywords)) {
      if (keywords.some((kw) => lowerTags.some((tag) => tag.includes(kw)))) {
        return style;
      }
    }

    return null;
  }

  /**
   * 获取类别标签
   */
  private static getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      website: '网站资源',
      icons: '图标素材',
      'ui-kits': 'UI 套件',
      color: '配色工具',
      fonts: '字体资源',
      illustrations: '插画素材',
      tools: '设计工具',
    };
    return labels[category] || category;
  }
}

/**
 * 便捷函数：组织搜索结果为泳道
 */
export function organizeIntoSwimlanes(
  results: SearchResult[],
  strategy: GroupByStrategy = 'relevance'
): SwimlaneGroup[] {
  return SwimlaneOrganizer.organizeIntoSwimlanes(results, strategy);
}
