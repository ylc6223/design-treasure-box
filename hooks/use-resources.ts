'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { type Resource, ResourceSchema } from '@/types'
import type { Database } from '@/types/database'

type ResourceRow = Database['public']['Tables']['resources']['Row']

// 辅助函数：将数据库行转换为 Resource 对象
function transformResource(resource: ResourceRow): Resource | null {
  // 构造评分对象
  // 列表页使用缓存的 average_rating
  // 如果需要详细维度的评分，需要单独获取详情，或者在数据库也做缓存(过于复杂不推荐)
  // 这里我们使用 average_rating 填充 overall，其他维度暂时给默认值或 curator_rating
  const curatorRating = resource.curator_rating as any
  
  const rating = {
    overall: resource.average_rating ?? curatorRating?.overall ?? 0,
    // 列表页通常只需要总分，以下细分维度在列表页展示时如果需要，
    // 可以考虑也加到 resources 表，或者列表页就不展示细分维度
    usability: curatorRating?.usability ?? 0,
    aesthetics: curatorRating?.aesthetics ?? 0,
    updateFrequency: curatorRating?.updateFrequency ?? 0,
    freeLevel: curatorRating?.freeLevel ?? 0,
  }

  const resourceData = {
    id: resource.id,
    name: resource.name,
    url: resource.url,
    description: resource.description,
    screenshotUrl: resource.screenshot_url || `https://api.microlink.io/?url=${encodeURIComponent(resource.url)}&meta=false&embed=image.url`,
    screenshotUpdatedAt: resource.screenshot_updated_at,
    categoryId: resource.category_id,
    tags: resource.tags,
    rating: rating,
    curatorNote: resource.curator_note,
    isFeatured: resource.is_featured,
    createdAt: new Date(resource.created_at).toISOString(),
    viewCount: resource.view_count,
    favoriteCount: resource.favorite_count,
  }

  try {
    return ResourceSchema.parse(resourceData)
  } catch (error) {
    console.error(`Invalid resource data for ${resource.id}:`, error)
    return null
  }
}

// ----------------------------------------------------------------------------
// 1. 分页获取资源 (Backend Pagination)
// ----------------------------------------------------------------------------

export interface FetchResourcePageOptions {
  page: number
  pageSize: number
  categoryId?: string
}

export async function fetchResourcePage({
  page,
  pageSize,
  categoryId,
}: FetchResourcePageOptions) {
  const supabase = createClient()
  
  const from = page * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('resources')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data: resources, count, error } = await query

  if (error) throw new Error(error.message)
  if (!resources) return { data: [], total: 0 }

  const validatedResources = resources
    .map(transformResource)
    .filter(Boolean) as Resource[]

  return {
    data: validatedResources,
    total: count || 0
  }
}

// ----------------------------------------------------------------------------
// 2. 获取热门资源 (Top 8) - 独立查询
// ----------------------------------------------------------------------------

async function fetchHotResources() {
  const supabase = createClient()
  
  const { data: resources, error } = await supabase
    .from('resources')
    .select('*')
    .order('favorite_count', { ascending: false })
    .limit(8)
    .returns<ResourceRow[]>()

  if (error) throw new Error(error.message)
  if (!resources) return []

  return resources.map(transformResource).filter(Boolean) as Resource[]
}

export function useHotResources() {
  return useQuery({
    queryKey: ['resources', 'hot'],
    queryFn: fetchHotResources,
    staleTime: 1000 * 60 * 10, // 10分钟
  })
}

// ----------------------------------------------------------------------------
// 3. 获取最新资源 (Top 8) - 独立查询
// ----------------------------------------------------------------------------

async function fetchLatestResources() {
  const supabase = createClient()
  
  const { data: resources, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)
    .returns<ResourceRow[]>()

  if (error) throw new Error(error.message)
  if (!resources) return []

  return resources.map(transformResource).filter(Boolean) as Resource[]
}

export function useLatestResources() {
  return useQuery({
    queryKey: ['resources', 'latest'],
    queryFn: fetchLatestResources,
    staleTime: 1000 * 60 * 5, // 5分钟
  })
}

// ----------------------------------------------------------------------------
// Legacy / Utility Hooks
// ----------------------------------------------------------------------------

/**
 * useResourceById Hook
 */
export function useResourceById(resourceId: string) {
  return useQuery({
    queryKey: ['resources', resourceId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single()
      
      if (error) throw error
      // 对于详情页，如果确实需要详细评分分布，这里其实应该再查一次 ratings 表
      // 但为了保持接口一致性，目前先用 transformResource
      return transformResource(data)
    },
    enabled: !!resourceId
  })
}

/**
 * useResourcesByCategory Hook (Deprecated logic: prefer useInfiniteResources)
 */
export function useResourcesByCategory(categoryId: string) {
   return useQuery({
    queryKey: ['resources', 'category', categoryId],
    queryFn: () => fetchResourcePage({ page: 0, pageSize: 24, categoryId }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * useResources Hook (Deprecated: Full Fetch)
 */
export function useResources() {
  return useQuery({
    queryKey: ['resources', 'all'],
    queryFn: async () => {
       const supabase = createClient()
       const { data: resources, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<ResourceRow[]>()

       if (error) throw error
       if (!resources) return []
       
       return resources.map(transformResource).filter(Boolean) as Resource[]
    },
    staleTime: 1000 * 60 * 5,
  })
}