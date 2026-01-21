import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Users, Star, TrendingUp, ArrowUpRight, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScreenshotServiceCard } from '@/components/admin/screenshot-service-card';
import { cn } from '@/lib/utils';

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  created_at: string;
}

interface RecentRating {
  id: string;
  overall: number;
  created_at: string;
  profiles: {
    name: string | null;
    email: string;
  } | null;
  resources: {
    name: string;
  } | null;
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    resourcesResult,
    usersResult,
    ratingsResult,
    featuredResourcesResult,
    recentUsersResult,
    recentRatingsResult,
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
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .not('screenshot_url', 'is', null)
      .gte('screenshot_updated_at', sevenDaysAgo)
      .is('screenshot_error', null),
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .not('screenshot_error', 'is', null),
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .is('screenshot_error', null)
      .or(`screenshot_url.is.null,screenshot_updated_at.lt.${sevenDaysAgo}`),
    supabase.from('resources').select('id').not('screenshot_error', 'is', null).limit(10),
  ]);

  const stats = [
    {
      title: '资源总数',
      value: resourcesResult.count || 0,
      icon: Package,
      description: '平台收录的设计资源',
      color: 'text-blue-500',
    },
    {
      title: '精选资源',
      value: featuredResourcesResult.count || 0,
      icon: TrendingUp,
      description: '标记为精选的资源',
      color: 'text-amber-500',
    },
    {
      title: '用户总数',
      value: usersResult.count || 0,
      icon: Users,
      description: '注册用户数量',
      color: 'text-purple-500',
    },
    {
      title: '评分总数',
      value: ratingsResult.count || 0,
      icon: Star,
      description: '用户提交的评分',
      color: 'text-rose-500',
    },
  ];

  const recentUsers = (recentUsersResult.data as unknown as RecentUser[]) || [];
  const recentRatings = (recentRatingsResult.data as unknown as RecentRating[]) || [];
  const totalResources = resourcesResult.count || 0;
  const successCount = screenshotSuccessResult.count || 0;
  const failedCount = screenshotFailedResult.count || 0;
  const pendingCount = screenshotPendingResult.count || 0;
  const successRate = totalResources > 0 ? Math.round((successCount / totalResources) * 100) : 0;
  const failedResourceIds = (failedResourcesResult.data || []).map((r: { id: string }) => r.id);

  const getInitials = (name: string | null, email: string) => {
    if (name)
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    return email[0].toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours} 小时前`;
    if (diffInHours < 48) return '昨天';
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">仪表板</h1>
        <p className="text-muted-foreground">
          欢迎使用设计百宝箱管理后台。在这里监控资源动态和截图任务。
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn('h-4 w-4', stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {stat.description}
                <ArrowUpRight className="h-3 w-3 opacity-50" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Screenshot Service Section */}
      <ScreenshotServiceCard
        successCount={successCount}
        pendingCount={pendingCount}
        failedCount={failedCount}
        successRate={successRate}
        failedResourceIds={failedResourceIds}
      />

      {/* Lists Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Ratings (Log style) */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-rose-500" />
                最近评价
              </CardTitle>
              <CardDescription>最近收到的资源反馈和评分</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground opacity-30" />
          </CardHeader>
          <CardContent>
            {recentRatings.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                暂无数据
              </div>
            ) : (
              <div className="space-y-6">
                {recentRatings.map((rating: RecentRating) => (
                  <div key={rating.id} className="flex items-start justify-between gap-4 group">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {rating.resources?.name || '未知资源'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{rating.profiles?.name || rating.profiles?.email || '匿名用户'}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>{formatDate(rating.created_at)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3 w-3',
                            i < Math.floor(rating.overall)
                              ? 'fill-current text-amber-400'
                              : 'text-border'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                新注册用户
              </CardTitle>
              <CardDescription>最近加入平台的设计师</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                暂无数据
              </div>
            ) : (
              <div className="space-y-6">
                {recentUsers.map((user: RecentUser) => (
                  <div key={user.id} className="flex items-center gap-4">
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                      <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                      <AvatarFallback className="bg-muted text-xs">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-none mb-1">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
