'use client'

import { useState } from 'react'
import { Camera, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ScreenshotServiceCardProps {
    successCount: number
    pendingCount: number
    failedCount: number
    successRate: number
    failedResourceIds: string[]
}

/**
 * 截图服务概览卡片
 * 显示截图统计并支持批量重截失败资源
 */
export function ScreenshotServiceCard({
    successCount,
    pendingCount,
    failedCount,
    successRate,
    failedResourceIds,
}: ScreenshotServiceCardProps) {
    const [isRetrying, setIsRetrying] = useState(false)

    // 批量重截失败资源
    const handleRetryFailed = async () => {
        if (failedResourceIds.length === 0) {
            toast.info('没有失败的资源需要重截')
            return
        }

        try {
            setIsRetrying(true)

            const response = await fetch('/api/admin/resources/screenshot/trigger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resourceIds: failedResourceIds }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to trigger retry')
            }

            const data = await response.json()
            toast.success('重截任务已提交', {
                description: `${data.queued} 个资源已加入队列，请稍后刷新查看`,
            })
        } catch (error) {
            console.error('Failed to retry screenshots:', error)
            toast.error('触发重截失败', {
                description: error instanceof Error ? error.message : '请稍后重试',
            })
        } finally {
            setIsRetrying(false)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    截图服务
                </CardTitle>
                <Badge variant={successRate >= 80 ? 'default' : successRate >= 50 ? 'secondary' : 'destructive'}>
                    {successRate}% 成功率
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                    {/* 成功 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{successCount}</p>
                            <p className="text-xs text-text-muted">已生成</p>
                        </div>
                    </div>

                    {/* 待更新 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
                            <p className="text-xs text-text-muted">待更新</p>
                        </div>
                    </div>

                    {/* 失败 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <div>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</p>
                            <p className="text-xs text-text-muted">失败</p>
                        </div>
                    </div>

                    {/* 操作 */}
                    <div className="flex items-center justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetryFailed}
                            disabled={isRetrying || failedResourceIds.length === 0}
                            className="w-full"
                        >
                            {isRetrying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    处理中...
                                </>
                            ) : (
                                <>
                                    <Camera className="mr-2 h-4 w-4" />
                                    重截失败资源
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {failedCount > 10 && (
                    <p className="text-xs text-text-muted mt-3">
                        注意：每次最多重截 10 个资源，当前有 {failedCount} 个失败资源
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
