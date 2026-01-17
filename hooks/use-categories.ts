import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DatabaseCategory, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category'

// ============================================================================
// API Functions
// ============================================================================

/**
 * 获取所有分类
 */
async function fetchCategories(): Promise<DatabaseCategory[]> {
  const response = await fetch('/api/categories')
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }
  
  const result = await response.json()
  return result.data
}

/**
 * 获取单个分类
 */
async function fetchCategory(id: string): Promise<DatabaseCategory> {
  const response = await fetch(`/api/categories/${id}`)
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Category not found')
    }
    throw new Error('Failed to fetch category')
  }
  
  return response.json()
}

/**
 * 创建分类
 */
async function createCategory(data: CreateCategoryRequest): Promise<DatabaseCategory> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create category')
  }
  
  return response.json()
}

/**
 * 更新分类
 */
async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<DatabaseCategory> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update category')
  }
  
  return response.json()
}

/**
 * 删除分类
 */
async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete category')
  }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * 获取所有分类的 Hook
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
    gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
  })
}

/**
 * 获取单个分类的 Hook
 */
export function useCategory(id: string) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => fetchCategory(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * 创建分类的 Hook
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      // 刷新分类列表缓存
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/**
 * 更新分类的 Hook
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategory(id, data),
    onSuccess: (_, { id }) => {
      // 刷新相关缓存
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories', id] })
    },
  })
}

/**
 * 删除分类的 Hook
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_, id) => {
      // 刷新分类列表缓存
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      // 移除单个分类缓存
      queryClient.removeQueries({ queryKey: ['categories', id] })
    },
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * 根据ID获取分类名称
 */
export function useCategoryName(categoryId: string): string {
  const { data: categories } = useCategories()
  
  if (!categories) return categoryId
  
  const category = categories.find(c => c.id === categoryId)
  return category?.name || categoryId
}

/**
 * 获取分类映射对象 (ID -> Category)
 */
export function useCategoryMap(): Record<string, DatabaseCategory> {
  const { data: categories } = useCategories()
  
  if (!categories) return {}
  
  return categories.reduce((map, category) => {
    map[category.id] = category
    return map
  }, {} as Record<string, DatabaseCategory>)
}