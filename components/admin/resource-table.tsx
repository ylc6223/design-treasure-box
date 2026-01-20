/**
 * ResourceTable - 资源管理表格组件
 *
 * 核心职责：
 * 1. 展示资源列表，支持分页、搜索、分类筛选
 * 2. 监控截图状态（成功/待更新/失败），提供手动触发截图功能
 * 3. 提供资源的编辑、删除、外链访问操作
 *
 * 截图状态判定逻辑：
 * - success: 截图存在且在 7 天内（避免过期内容）
 * - pending: 无截图或截图已过期（需要重新生成）
 * - failed: 存在错误信息（需要人工介入）
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, ExternalLink, Search, Camera, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { ResourceResponse, PaginatedResponse } from '@/types/resource';
import { useCategories } from '@/hooks/use-categories';

// 截图状态类型
type ScreenshotStatus = 'success' | 'pending' | 'failed';

/**
 * 获取资源的截图状态
 *
 * 状态判定优先级（从高到低）：
 * 1. failed: 存在错误信息 → 需要人工排查
 * 2. pending: 无截图或已过期 → 需要重新生成
 * 3. success: 截图存在且新鲜 → 可正常使用
 *
 * @param resource - 资源对象
 * @returns 截图状态
 *
 * @remarks
 * 7 天过期策略的原因：
 * - 设计资源网站内容更新频繁，过期截图可能误导用户
 * - 7 天是平衡"内容新鲜度"与"截图成本"的经验值
 * - 过期后标记为 pending 而非 failed，避免误报错误
 */
function getScreenshotStatus(resource: ResourceResponse): ScreenshotStatus {
  // 优先级 1: 有错误信息 → 失败状态
  if (resource.screenshot_error) {
    return 'failed';
  }
  // 优先级 2: 无截图 → 待生成
  if (!resource.screenshot_url) {
    return 'pending';
  }
  // 优先级 3: 检查是否过期（7 天阈值）
  if (resource.screenshot_updated_at) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (new Date(resource.screenshot_updated_at).getTime() < sevenDaysAgo) {
      return 'pending';
    }
  }
  return 'success';
}

/**
 * 格式化更新时间为相对时间
 *
 * @param dateString - ISO 8601 时间字符串
 * @returns 人类可读的相对时间
 *
 * @remarks
 * 使用相对时间而非绝对时间的原因：
 * - 用户更关心"多久没更新"而非"具体日期"
 * - 相对时间能快速传达"新鲜度"信息
 * - 时间段划分：刚刚 < 1小时 < 24小时 < 2天 < 7天 < 绝对日期
 */
function formatUpdateTime(dateString: string | null): string {
  if (!dateString) return '未生成';
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return '刚刚';
  if (diffInHours < 24) return `${diffInHours} 小时前`;
  if (diffInHours < 48) return '昨天';
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} 天前`;
  return date.toLocaleDateString('zh-CN');
}

export function ResourceTable() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();

  // ===== 数据状态 =====
  const [resources, setResources] = useState<ResourceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== 分页与筛选状态 =====
  // page 和 totalPages 配合实现服务端分页，减少单次数据传输量
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // search 和 categoryFilter 变化时重置 page 为 1，避免超出范围
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // ===== 操作状态 =====
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // 使用 Set 管理 capturingIds 的原因：
  // - 支持多个资源同时触发截图（并发操作）
  // - Set 天然去重，避免重复触发
  // - O(1) 查询复杂度，快速判断某资源是否正在截图
  const [capturingIds, setCapturingIds] = useState<Set<string>>(new Set());

  /**
   * 加载资源列表
   *
   * @remarks
   * 使用 URLSearchParams 构建查询参数的原因：
   * - 自动处理 URL 编码（如中文搜索词）
   * - 条件性添加参数，避免 ?search=&categoryId= 这种无效参数
   * - 符合 RESTful API 最佳实践
   *
   * 错误处理策略：
   * - 使用 toast 提示用户，而非 console.error 静默失败
   * - 保持 loading 状态管理在 finally 块，确保无论成功失败都能解除加载状态
   */
  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });

      // 只在有值时添加可选参数，保持 URL 简洁
      if (search) {
        params.append('search', search);
      }

      if (categoryFilter !== 'all') {
        params.append('categoryId', categoryFilter);
      }

      const response = await fetch(`/api/admin/resources?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load resources');
      }

      const data: PaginatedResponse<ResourceResponse> = await response.json();
      setResources(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast.error('加载失败', {
        description: '无法加载资源列表',
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  /**
   * 删除资源
   *
   * @remarks
   * 删除后重新加载列表而非手动更新状态的原因：
   * - 确保数据一致性：服务端可能有级联删除（如评分数据）
   * - 避免分页计算错误：删除后可能影响总页数和当前页内容
   * - 简化状态管理：无需手动处理边界情况（如删除最后一页的最后一项）
   */
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/resources/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }

      toast.success('删除成功', {
        description: '资源已删除',
      });

      // 重新加载列表以同步服务端状态
      loadResources();
    } catch (error) {
      console.error('Failed to delete resource:', error);
      toast.error('删除失败', {
        description: '无法删除资源',
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  /**
   * 触发截图捕获
   *
   * @param resourceId - 要截图的资源 ID
   *
   * @remarks
   * 设计要点：
   * 1. 使用 Set 管理 capturingIds 而非单个 boolean 的原因：
   *    - 支持同时触发多个资源的截图（提升管理效率）
   *    - 精确控制每个资源的按钮禁用状态
   *
   * 2. 不等待截图完成的原因：
   *    - 截图是后台异步任务，可能耗时数秒甚至失败
   *    - 只需确认任务已提交，避免阻塞 UI
   *    - 用户可通过刷新页面查看最新状态
   *
   * 3. 错误处理细节：
   *    - 解析服务端返回的具体错误信息（如截图服务配置问题）
   *    - 使用 toast 提供明确的用户反馈
   *    - finally 块确保无论成功失败都清理 loading 状态
   */
  const handleCaptureScreenshot = async (resourceId: string) => {
    try {
      // 添加到加载集合，禁用对应按钮
      setCapturingIds((prev) => new Set(prev).add(resourceId));

      const response = await fetch('/api/admin/resources/screenshot/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceIds: [resourceId] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger screenshot');
      }

      toast.success('截图任务已提交', {
        description: '截图将在后台生成，请稍后刷新查看',
      });
    } catch (error) {
      console.error('Failed to trigger screenshot:', error);
      toast.error('触发截图失败', {
        description: error instanceof Error ? error.message : '请稍后重试',
      });
    } finally {
      // 从加载集合中移除，恢复按钮状态
      setCapturingIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  };

  /**
   * 初始加载和筛选变化时重新加载资源列表
   *
   * @remarks
   * 依赖数组设计：
   * - page: 分页变化时加载新页
   * - search: 搜索词变化时重新查询（已在 Input onChange 中重置 page）
   * - categoryFilter: 分类筛选变化时重新查询（已在 Select onValueChange 中重置 page）
   *
   * 为什么不包含 loadResources：
   * - loadResources 是稳定的函数引用（未使用 useCallback）
   * - 包含它会导致无限循环（loadResources 内部使用了状态）
   * - 当前设计已足够：筛选条件变化 → 触发 effect → 调用 loadResources
   */
  useEffect(() => {
    loadResources();
  }, [loadResources]);

  /**
   * 根据分类 ID 获取分类名称
   *
   * @remarks
   * 使用 find 而非 Map 的原因：
   * - categories 数组通常很小（< 20 项），性能差异可忽略
   * - 避免额外的 Map 构建开销和内存占用
   */
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || categoryId;
  };

  /**
   * 获取截图状态的中文显示文本
   */
  const getStatusText = (status: ScreenshotStatus) => {
    switch (status) {
      case 'success':
        return '已生成';
      case 'pending':
        return '待更新';
      case 'failed':
        return '失败';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 筛选栏 - Vercel 风格：简洁、扁平 */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索资源名称或描述..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                // 搜索词变化时重置页码，避免停留在不存在的页面
                setPage(1);
              }}
              className="pl-10 h-9 border-border/50 focus-visible:border-border transition-colors"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              // 分类筛选变化时重置页码，与搜索逻辑保持一致
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] h-9 border-border/50">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 资源表格 - Vercel 风格：无外边框，细线分隔，悬停高亮 */}
        <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                  名称
                </TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                  分类
                </TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                  截图状态
                </TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                  评分
                </TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                  精选
                </TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                  浏览
                </TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-muted-foreground">暂无资源</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((resource) => {
                  const screenshotStatus = getScreenshotStatus(resource);
                  const isCapturing = capturingIds.has(resource.id);

                  return (
                    <TableRow
                      key={resource.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium text-sm text-foreground">{resource.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                            {resource.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary/50 text-secondary-foreground border border-border/50">
                          {getCategoryName(resource.category_id)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          {/* 截图状态 Badge + Tooltip：根据状态显示不同信息 */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                                  screenshotStatus === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                    : screenshotStatus === 'pending'
                                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                      : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                                }`}
                              >
                                {getStatusText(screenshotStatus)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {screenshotStatus === 'failed' && resource.screenshot_error ? (
                                // 失败状态：显示错误详情
                                <p className="max-w-xs text-xs">{resource.screenshot_error}</p>
                              ) : screenshotStatus === 'success' ? (
                                // 成功状态：显示更新时间
                                <p className="text-xs">
                                  更新于: {formatUpdateTime(resource.screenshot_updated_at)}
                                </p>
                              ) : (
                                // 待更新状态：提示等待
                                <p className="text-xs">等待截图生成</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                          {/* 手动触发截图按钮：支持单个资源的即时截图 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCaptureScreenshot(resource.id);
                            }}
                            disabled={isCapturing}
                            title="手动触发截图"
                            className="h-7 w-7 p-0 hover:bg-muted"
                          >
                            {isCapturing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Camera className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold tabular-nums">
                            {resource.curator_rating.overall.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">/5.0</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {resource.is_featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            精选
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {resource.view_count}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(resource.url, '_blank');
                            }}
                            className="h-7 w-7 p-0 hover:bg-muted"
                            title="访问链接"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/resources/${resource.id}/edit`);
                            }}
                            className="h-7 w-7 p-0 hover:bg-muted"
                            title="编辑"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(resource.id);
                            }}
                            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                            title="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页 - Vercel 风格：简洁的分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-1">
            <div className="text-xs text-muted-foreground tabular-nums">
              第 {page} 页 / 共 {totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="h-8 px-3 text-xs border-border/50 hover:bg-muted"
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="h-8 px-3 text-xs border-border/50 hover:bg-muted"
              >
                下一页
              </Button>
            </div>
          </div>
        )}

        {/* 删除确认对话框：防止误操作，明确告知级联删除影响 */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">确认删除</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                {/* 明确告知级联删除的影响，帮助用户做出明智决策 */}
                确定要删除这个资源吗？此操作无法撤销，相关的用户评分也会被删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} className="h-9 text-sm">
                取消
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? '删除中...' : '删除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
