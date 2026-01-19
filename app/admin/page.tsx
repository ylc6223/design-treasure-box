import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, Star, TrendingUp, Camera } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScreenshotServiceCard } from '@/components/admin/screenshot-service-card'

/**
 * 管理后台仪表板
 * 显示关键统计数据和最近活动
 */
export default async function AdminDashboard() {
  const supabase = await createClient()

  // 计算 7 天前的时间
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 获取统计数据
  const [
    resourcesResult,
    usersResult,
    ratingsResult,
    featuredResourcesResult,
    recentUsersResult,
    recentRatingsResult,
    // 截图统计
    screenshotSuccessResult,
    screenshotFailedResult,
    screenshotPendingResult,
    failedResourcesResult,
  ] = await Promise.all([
    supabase.from('resources').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('ratings').select('*', { count: 'exact', head: true }),
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('is_featured', true),
    supabase
      .from('profiles')
      .select('id, name, email, image, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('ratings')
      .select('id, overall, created_at, profiles(name, email), resources(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    // 成功的截图：有 URL 且在 7 天内且无错误
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .not('screenshot_url', 'is', null)
      .gte('screenshot_updated_at', sevenDaysAgo)
      .is('screenshot_error', null),
    // 失败的截图
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .not('screenshot_error', 'is', null),
    // 待更新的截图：无 URL 或过期（不包括失败的）
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .is('screenshot_error', null)
      .or(`screenshot_url.is.null,screenshot_updated_at.lt.${sevenDaysAgo}`),
    // 获取失败资源的 ID（最多 10 个用于批量重截）
    supabase
      .from('resources')
      .select('id')
      .not('screenshot_error', 'is', null)
      .limit(10),
  ])

  const stats = [
    {
      title: '资源总数',
      value: resourcesResult.count || 0,
      icon: Package,
      description: '平台收录的设计资源',
    },
    {
      title: '精选资源',
      value: featuredResourcesResult.count || 0,
      icon: TrendingUp,
      description: '标记为精选的资源',
    },
    {
      title: '用户总数',
      value: usersResult.count || 0,
      icon: Users,
      description: '注册用户数量',
    },
    {
      title: '评分总数',
      value: ratingsResult.count || 0,
      icon: Star,
      description: '用户提交的评分',
    },
  ]

  const recentUsers = recentUsersResult.data || []
  const recentRatings = recentRatingsResult.data || []

  // 截图统计
  const totalResources = resourcesResult.count || 0
  const successCount = screenshotSuccessResult.count || 0
  const failedCount = screenshotFailedResult.count || 0
  const pendingCount = screenshotPendingResult.count || 0
  const successRate = totalResources > 0 ? Math.round((successCount / totalResources) * 100) : 0
  const failedResourceIds = (failedResourcesResult.data || []).map((r: { id: string }) => r.id)

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return '刚刚'
    if (diffInHours < 24) return `${diffInHours} 小时前`
    if (diffInHours < 48) return '昨天'
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">仪表板</h1>
        <p className="text-text-secondary mt-2">欢迎来到设计百宝箱管理后台</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-text-muted mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 截图服务概览 */}
      <ScreenshotServiceCard
        successCount={successCount}
        pendingCount={pendingCount}
        failedCount={failedCount}
        successRate={successRate}
        failedResourceIds={failedResourceIds}
      />

      {/* 最近活动 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 最近注册用户 */}
        <Card>
          <CardHeader>
            <CardTitle>最近注册用户</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-text-muted">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                      <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <span className="text-xs text-text-muted whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近评分 */}
        <Card>
          <CardHeader>
            <CardTitle>最近评分</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRatings.length === 0 ? (
              <p className="text-sm text-text-muted">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {recentRatings.map((rating: any) => (
                  <div key={rating.id} className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {rating.resources?.name || '未知资源'}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {rating.profiles?.name || rating.profiles?.email || '匿名用户'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {rating.overall}
                      </Badge>
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {formatDate(rating.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-text-secondary">
            从左侧导航栏选择功能模块开始管理：
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
            <li>资源管理 - 添加、编辑、删除设计资源</li>
            <li>用户管理 - 查看用户列表，管理用户角色</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
