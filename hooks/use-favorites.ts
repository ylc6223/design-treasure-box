'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type FavoriteItem,
  type StoredFavorites,
  StoredFavoritesSchema,
  STORAGE_KEYS,
  FAVORITES_VERSION,
} from '@/types';

/**
 * useFavorites Hook
 *
 * 管理用户收藏的资源，支持添加、移除、查询和持久化到 localStorage
 *
 * @returns {Object} 收藏管理对象
 * @returns {FavoriteItem[]} favorites - 收藏的资源列表（包含 ID 和添加时间）
 * @returns {(resourceId: string) => void} addFavorite - 添加收藏
 * @returns {(resourceId: string) => void} removeFavorite - 移除收藏
 * @returns {(resourceId: string) => boolean} isFavorited - 检查是否已收藏
 * @returns {() => void} clearFavorites - 清空所有收藏
 * @returns {boolean} isLoading - 是否正在加载
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载收藏数据
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);

      if (stored) {
        const data = JSON.parse(stored);
        const result = StoredFavoritesSchema.safeParse(data);

        if (result.success) {
          // 数据有效，使用完整的 FavoriteItem 数组
          setFavorites(result.data.items);
        } else {
          // 数据无效，清空
          console.warn('Invalid favorites data in localStorage, clearing...');
          localStorage.removeItem(STORAGE_KEYS.FAVORITES);
        }
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存收藏数据到 localStorage
  const saveFavorites = useCallback((items: FavoriteItem[]) => {
    try {
      const storedData: StoredFavorites = {
        version: FAVORITES_VERSION,
        items,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(storedData));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }, []);

  // 添加收藏
  const addFavorite = useCallback(
    (resourceId: string) => {
      setFavorites((prev) => {
        if (prev.some((item) => item.resourceId === resourceId)) {
          return prev; // 已存在，不重复添加
        }
        const newItem: FavoriteItem = {
          resourceId,
          addedAt: new Date().toISOString(),
        };
        const newFavorites = [...prev, newItem];
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    [saveFavorites]
  );

  // 移除收藏
  const removeFavorite = useCallback(
    (resourceId: string) => {
      setFavorites((prev) => {
        const newFavorites = prev.filter((item) => item.resourceId !== resourceId);
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    [saveFavorites]
  );

  // 检查是否已收藏
  const isFavorited = useCallback(
    (resourceId: string) => {
      return favorites.some((item) => item.resourceId === resourceId);
    },
    [favorites]
  );

  // 清空所有收藏
  const clearFavorites = useCallback(() => {
    setFavorites([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    } catch (error) {
      console.error('Failed to clear favorites from localStorage:', error);
    }
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorited,
    clearFavorites,
    isLoading,
  };
}
