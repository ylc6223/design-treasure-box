import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { requireAdmin } from '@/lib/supabase/auth';
import { AdminNav } from '@/components/admin/admin-nav';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * 管理后台布局
 * 需要管理员权限
 * 注意：LayoutWrapper 会检测 /admin 路径并跳过前端布局渲染
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 验证管理员权限
  let userAndProfile;
  try {
    userAndProfile = await requireAdmin();
  } catch {
    // 未登录或非管理员，重定向到首页
    redirect('/');
  }

  const { user, profile } = userAndProfile;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* 侧边栏导航 */}
      <AdminNav user={user} profile={profile} />

      {/* 主内容区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <header className="flex h-16 items-center justify-end px-6 border-b bg-surface/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-text-secondary hover:text-text-primary"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                返回首页
              </Link>
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <ThemeToggle />
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
