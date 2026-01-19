'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, ExternalLink, Search, Camera, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import type { ResourceResponse, PaginatedResponse } from '@/types/resource'
import { useCategories } from '@/hooks/use-categories'

// 截图状态类型
type ScreenshotStatus = 'success' | 'pending' | 'failed'

/**
 * 获取资源的截图状态
 * - success: 截图存在且在 7 天内
 * - pending: 无截图或截图已过期
 * - failed: 存在错误信息
 */
function getScreenshotStatus(resource: ResourceResponse): ScreenshotStatus {
  if (resource.screenshot_error) {
    return 'failed'
  }
  if (!resource.screenshot_url) {
    return 'pending'
  }
  if (resource.screenshot_updated_at) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (new Date(resource.screenshot_updated_at).getTime() < sevenDaysAgo) {
      return 'pending'
    }
  }
  return 'success'
}

/**
 * 格式化更新时间
 */
function formatUpdateTime(dateString: string | null): string {
  if (!dateString) return '未生成'
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return '刚刚'
  if (diffInHours < 24) return `${diffInHours} 小时前`
  if (diffInHours < 48) return '昨天'
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} 天前`
  return date.toLocaleDateString('zh-CN')
}

export function ResourceTable() {
  const router = useRouter()
  const { data: categories = [] } = useCategories()
  const [resources, setResources] = useState<ResourceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [capturingIds, setCapturingIds] = useState<Set<string>>(new Set())

  // 加载资源列表
  const loadResources = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })

      if (search) {
        params.append('search', search)
      }

      if (categoryFilter !== 'all') {
        params.append('categoryId', categoryFilter)
      }

      const response = await fetch(`/api/admin/resources?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load resources')
      }

      const data: PaginatedResponse<ResourceResponse> = await response.json()
      setResources(data.data)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to load resources:', error)
      toast.error('加载失败', {
        description: '无法加载资源列表',
      })
    } finally {
      setLoading(false)
    }
  }

  // 删除资源
  const handleDelete = async () => {
    if (!deleteId) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/admin/resources/${deleteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete resource')
      }

      toast.success('删除成功', {
        description: '资源已删除',
      })

      // 重新加载列表
      loadResources()
    } catch (error) {
      console.error('Failed to delete resource:', error)
      toast.error('删除失败', {
        description: '无法删除资源',
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  // 触发截图捕获
  const handleCaptureScreenshot = async (resourceId: string) => {
    try {
      setCapturingIds(prev => new Set(prev).add(resourceId))

      const response = await fetch('/api/admin/resources/screenshot/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceIds: [resourceId] }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to trigger screenshot')
      }

      toast.success('截图任务已提交', {
        description: '截图将在后台生成，请稍后刷新查看',
      })
    } catch (error) {
      console.error('Failed to trigger screenshot:', error)
      toast.error('触发截图失败', {
        description: error instanceof Error ? error.message : '请稍后重试',
      })
    } finally {
      setCapturingIds(prev => {
        const next = new Set(prev)
        next.delete(resourceId)
        return next
      })
    }
  }

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    loadResources()
  }, [page, search, categoryFilter])

  // 获取分类名称
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || categoryId
  }

  // 获取状态 Badge 的 variant
  const getStatusBadgeVariant = (status: ScreenshotStatus) => {
    switch (status) {
      case 'success':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
    }
  }

  // 获取状态显示文本
  const getStatusText = (status: ScreenshotStatus) => {
    switch (status) {
      case 'success':
        return '已生成'
      case 'pending':
        return '待更新'
      case 'failed':
        return '失败'
    }
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* 筛选栏 */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="搜索资源名称或描述..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[200px]">
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

        {/* 资源表格 */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>截图状态</TableHead>
                <TableHead>评分</TableHead>
                <TableHead>精选</TableHead>
                <TableHead>浏览</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-text-secondary">
                    暂无资源
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((resource) => {
                  const screenshotStatus = getScreenshotStatus(resource)
                  const isCapturing = capturingIds.has(resource.id)

                  return (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{resource.name}</div>
                            <div className="text-sm text-text-secondary truncate max-w-[300px]">
                              {resource.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryName(resource.category_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={getStatusBadgeVariant(screenshotStatus)}>
                                {getStatusText(screenshotStatus)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {screenshotStatus === 'failed' && resource.screenshot_error ? (
                                <p className="max-w-xs">{resource.screenshot_error}</p>
                              ) : screenshotStatus === 'success' ? (
                                <p>更新于: {formatUpdateTime(resource.screenshot_updated_at)}</p>
                              ) : (
                                <p>等待截图生成</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCaptureScreenshot(resource.id)}
                            disabled={isCapturing}
                            title="手动触发截图"
                          >
                            {isCapturing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {resource.curator_rating.overall.toFixed(1)}
                          </span>
                          <span className="text-xs text-text-muted">/5.0</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {resource.is_featured && (
                          <Badge variant="default">精选</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-text-secondary">
                          {resource.view_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(resource.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/resources/${resource.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(resource.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              第 {page} 页，共 {totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}

        {/* 删除确认对话框 */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除这个资源吗？此操作无法撤销，相关的用户评分也会被删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? '删除中...' : '删除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
