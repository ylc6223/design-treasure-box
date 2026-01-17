/**
 * Custom Hooks
 * 
 * 设计百宝箱应用的自定义 React Hooks
 */

export { useFavorites } from './use-favorites'
export {
  useResources,
  useResourceById,
  useResourcesByCategory,
  useFeaturedResources,
} from './use-resources'
export {
  useSearch,
  useAllTags,
  usePopularTags,
} from './use-search'
export { useScrollVisibility } from './use-scroll-visibility'
export { useInfiniteResources } from './use-infinite-resources'
export { useIntersectionObserver } from './use-intersection-observer'
export {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategoryName,
  useCategoryMap,
} from './use-categories'
