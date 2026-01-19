import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase/auth';
import { AdminNav } from '@/components/admin/admin-nav';

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
    <div className="flex h-screen w-full">
      {/* 侧边栏导航 */}
      <AdminNav user={user} profile={profile} />

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
