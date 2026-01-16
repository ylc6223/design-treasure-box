'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { type Resource, ResourceSchema } from '@/types'
import type { Database } from '@/types/database'

type ResourceRow = Database['public']['Tables']['resources']['Row']

/**
 * 从 Supabase 获取所有资源数据
 * 包含聚合评分和评分人数
 */
async function fetchResources(): Promise<Resource[]> {
  const supabase = createClient()
  
  // 查询资源
  const { data: resources, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<ResourceRow[]>()
  
  if (error) {
    console.error('Failed to fetch resources:', error)
    throw new Error('Failed to fetch resources')
  }
  
  if (!resources) {
    return []
  }
  
  // 转换数据格式并验证
  const validatedResources = await Promise.all(
    resources.map(async (resource) => {
      // 获取该资源的评分信息
      const { data: ratings } = await supabase
        .from('ratings')
        .select('overall, usability, aesthetics, update_frequency, free_level')
        .eq('resource_id', resource.id)
      
      // 计算聚合评分
      let aggregatedRating = null
      let ratingCount = 0
      
      if (ratings && ratings.length > 0) {
        ratingCount = ratings.length
        
        // 计算平均值
        const sum = ratings.reduce(
          (acc, r) => ({
            overall: acc.overall + Number(r.overall),
            usability: acc.usability + Number(r.usability),
            aesthetics: acc.aesthetics + Number(r.aesthetics),
            updateFrequency: acc.updateFrequency + Number(r.update_frequency),
            freeLevel: acc.freeLevel + Number(r.free_level),
          }),
          { overall: 0, usability: 0, aesthetics: 0, updateFrequency: 0, freeLevel: 0 }
        )
        
        // 四舍五入到 0.5
        const roundTo05 = (num: number) => Math.round(num * 2) / 2
        
        aggregatedRating = {
          overall: roundTo05(sum.overall / ratingCount),
          usability: roundTo05(sum.usability / ratingCount),
          aesthetics: roundTo05(sum.aesthetics / ratingCount),
          updateFrequency: roundTo05(sum.updateFrequency / ratingCount),
          freeLevel: roundTo05(sum.freeLevel / ratingCount),
        }
      }
      
      // 构造 Resource 对象
      const resourceData: Resource = {
        id: resource.id,
        name: resource.name,
        url: resource.url,
        description: resource.description,
        screenshot: resource.url, // 使用 url 作为 screenshot（通过 Microlink API 获取）
        categoryId: resource.category_id,
        tags: resource.tags,
        rating: aggregatedRating || (resource.curator_rating as any), // 如果没有用户评分，使用策展人评分
        curatorNote: resource.curator_note,
        isFeatured: resource.is_featured,
        createdAt: resource.created_at,
        viewCount: resource.view_count,
        favoriteCount: resource.favorite_count,
      }
      
      // 验证数据
      const result = ResourceSchema.safeParse(resourceData)
      if (!result.success) {
        console.error(`Invalid resource data for ${resource.id}:`, result.error)
        throw new Error(`Invalid resource data for ${resource.id}`)
      }
      
      return result.data
    })
  )
  
  return validatedResources
}

/**
 * useResources Hook
 * 
 * 使用 TanStack Query 从 Supabase 获取和缓存资源数据
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

