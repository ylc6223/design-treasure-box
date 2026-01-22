/**
 * AI聊天组件导出
 *
 * 包含自定义消息渲染器和相关组件
 */

// 旧版组件（保留兼容）
export { ResourceMessage } from './resource-message';
export type { ResourceMessageProps } from './resource-message';

export { ClarificationMessage } from './clarification-message';
export type { ClarificationMessageProps } from './clarification-message';

export { ResourcePreviewCard } from './resource-preview-card';
export type { ResourcePreviewCardProps } from './resource-preview-card';

// 新版组件（MVP 重做）
export {
  ResourceCardSkeleton,
  SwimlaneSkeleton,
  AIResponseSkeleton,
  SearchProgress,
} from './skeleton-loader';

export { BatchClarification, QuickSuggestions } from './batch-clarification';

export { SwimlaneGroup, EmptySwimlanePlaceholder } from './swimlane-group';

export { ZeroResultsMessage, DimensionRelaxSuggestions } from './zero-results';
