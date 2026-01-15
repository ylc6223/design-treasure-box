'use client'

import { useQuery } from '@tanstack/react-query'
import { type Resource, ResourceSchema } from '@/types'
import resourcesData from '@/data/resources.json'

/**
 * 获取所有资源数据
 * 
 * 从预置数据加载资源，并进行 schema 验证
 */
async function fetchResources(): Promise<Resource[]> {
  // 模拟网络延迟（可选）
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 验证数据
  const validatedResources = resourcesData.map(resource => {
    const result = ResourceSchema.safeParse(resource)
    if (!result.success) {
      console.error(`Invalid resource data for ${resource.id}:`, result.error)
      throw new Error(`Invalid resource data for ${resource.id}`)
    }
    return result.data
  })
  
  return validatedResources
}

/**
 * useResources Hook
 * 
 * 使用 TanStack Query 获取和缓存资源数据
 * 
 * @returns {Object} Query 结果对象
 * @returns {Resource[] | undefined} data - 资源列表
 * @returns {boolean} isLoading - 是否正在加载
 * @returns {boolean} isError - 是否发生错误
 * @returns {Error | null} error - 错误对象
 * @returns {() => void} refetch - 重新获取数据
 */
export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: fetchResources,
    staleTime: 1000 * 60 * 5, // 5 分钟内数据保持新鲜
    gcTime: 1000 * 60 * 30, // 30 分钟后清除缓存
  })
}

/**
 * useResourceById Hook
 * 
 * 根据 ID 获取单个资源
 * 
 * @param resourceId - 资源 ID
 * @returns {Object} Query 结果对象
 */
export function useResourceById(resourceId: string) {
  const { data: resources, ...rest } = useResources()
  
  const resource = resources?.find(r => r.id === resourceId)
  
  return {
    data: resource,
    ...rest,
  }
}

/**
 * useResourcesByCategory Hook
 * 
 * 根据分类获取资源列表
 * 
 * @param categoryId - 分类 ID
 * @returns {Object} Query 结果对象
 */
export function useResourcesByCategory(categoryId: string) {
  const { data: resources, ...rest } = useResources()
  
  const filteredResources = resources?.filter(r => r.categoryId === categoryId)
  
  return {
    data: filteredResources,
    ...rest,
  }
}

/**
 * useFeaturedResources Hook
 * 
 * 获取精选资源列表
 * 
 * @returns {Object} Query 结果对象
 */
export function useFeaturedResources() {
  const { data: resources, ...rest } = useResources()
  
  const featuredResources = resources?.filter(r => r.isFeatured)
  
  return {
    data: featuredResources,
    ...rest,
  }
}
