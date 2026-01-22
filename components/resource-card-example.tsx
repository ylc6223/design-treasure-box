'use client';

/**
 * ResourceCard 使用示例
 *
 * 这个文件展示了如何使用 ResourceCard 组件
 */

import { ResourceCard } from './resource-card';
import { useFavorites } from '@/hooks';
import type { Resource } from '@/types';

export function ResourceCardExample() {
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();

  // 示例资源数据
  const exampleResource: Resource = {
    id: 'coolors-1',
    name: 'Coolors',
    url: 'https://coolors.co',
    description: '快速生成配色方案的在线工具，支持导出多种格式，可以锁定颜色进行调整',
    screenshotUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
    categoryId: 'color',
    tags: ['配色', '工具', '免费', '在线'],
    rating: {
      overall: 4.5,
      usability: 5.0,
      aesthetics: 4.5,
      updateFrequency: 4.0,
      freeLevel: 5.0,
    },
    curatorNote: '非常好用的配色工具，界面简洁，功能强大。',
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    viewCount: 1250,
    favoriteCount: 320,
  };

  const handleFavorite = () => {
    if (isFavorited(exampleResource.id)) {
      removeFavorite(exampleResource.id);
    } else {
      addFavorite(exampleResource.id);
    }
  };

  return (
    <div className="max-w-sm">
      <ResourceCard
        resource={exampleResource}
        isFavorited={isFavorited(exampleResource.id)}
        onFavorite={handleFavorite}
      />
    </div>
  );
}

/**
 * 瀑布流网格示例
 *
 * 展示多个 ResourceCard 在网格布局中的使用
 */
export function ResourceGridExample({ resources }: { resources: Resource[] }) {
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();

  const handleFavorite = (id: string) => {
    if (isFavorited(id)) {
      removeFavorite(id);
    } else {
      addFavorite(id);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          isFavorited={isFavorited(resource.id)}
          onFavorite={() => handleFavorite(resource.id)}
        />
      ))}
    </div>
  );
}
