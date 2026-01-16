import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, Star } from 'lucide-react'

/**
 * 管理后台仪表板
 * 显示关键统计数据
 */
export default async function AdminDashboard() {
  const supabase = await createClient()

  // 获取统计数据
  const [resourcesResult, usersResult, ratingsResult] = await Promise.all([
    supabase.from('resources').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('ratings').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      title: '资源总数',
      value: resourcesResult.count || 0,
      icon: Package,
      description: '平台收录的设计资源',
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">仪表板</h1>
        <p className="text-text-secondary mt-2">欢迎来到设计百宝箱管理后台</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
