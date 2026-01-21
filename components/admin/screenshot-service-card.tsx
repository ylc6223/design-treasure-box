'use client';

import { useState } from 'react';
import { Camera, Loader2, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScreenshotServiceCardProps {
  successCount: number;
  pendingCount: number;
  failedCount: number;
  successRate: number;
  failedResourceIds: string[];
}

export function ScreenshotServiceCard({
  successCount,
  pendingCount,
  failedCount,
  successRate,
  failedResourceIds,
}: ScreenshotServiceCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryFailed = async () => {
    if (failedResourceIds.length === 0) {
      toast.info('没有失败的资源需要重截');
      return;
    }

    try {
      setIsRetrying(true);

      const response = await fetch('/api/admin/resources/screenshot/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceIds: failedResourceIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger retry');
      }

      const data = await response.json();
      toast.success('重截任务已提交', {
        description: `${data.queued} 个资源已加入队列，请稍后刷新查看`,
      });
    } catch (error) {
      console.error('Failed to retry screenshots:', error);
      toast.error('触发重截失败', {
        description: error instanceof Error ? error.message : '请稍后重试',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            截图服务状态
          </CardTitle>
          <CardDescription>监控和管理资源的网页截图状态</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'font-mono font-medium',
              successRate >= 80
                ? 'text-green-600 border-green-200 bg-green-50/50'
                : successRate >= 50
                  ? 'text-yellow-600 border-yellow-200 bg-yellow-50/50'
                  : 'text-red-600 border-red-200 bg-red-50/50'
            )}
          >
            {successRate}% 成功率
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* 成功 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              已生成截图
            </div>
            <div className="text-3xl font-bold tracking-tight">{successCount}</div>
          </div>

          {/* 待更新 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4 text-yellow-500" />
              待处理更新
            </div>
            <div className="text-3xl font-bold tracking-tight">{pendingCount}</div>
          </div>

          {/* 失败 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-red-500" />
              渲染失败
            </div>
            <div className="text-3xl font-bold tracking-tight text-red-600">{failedCount}</div>
          </div>
        </div>

        <div className="pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">重试失败任务</p>
            <p className="text-xs text-muted-foreground max-w-[400px]">
              重新触发所有渲染失败资源的截图任务。系统会自动分配队列进行异步处理。
              {failedCount > 10 && ` (当前前 10 个失败资源)`}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetryFailed}
            disabled={isRetrying || failedResourceIds.length === 0}
            className="w-full sm:w-auto font-medium"
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在提交任务...
              </>
            ) : (
              <>
                立即重试
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
