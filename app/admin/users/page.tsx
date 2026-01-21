import { Suspense } from 'react';
import { UserTable } from '@/components/admin/user-table';
import { UserTableSkeleton } from '@/components/admin/user-table-skeleton';
import { UserStats, UserStatsSkeleton } from '@/components/admin/user-stats';

export const metadata = {
  title: '用户管理 - 设计百宝箱',
  description: '管理用户和权限',
};

export default function UsersPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            用户管理
          </h1>
          <p className="text-text-secondary mt-2 text-lg">管理用户账号和角色权限</p>
        </div>
      </div>

      {/* Statistics */}
      <Suspense fallback={<UserStatsSkeleton />}>
        <UserStats />
      </Suspense>

      {/* User Table */}
      <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm">
        <Suspense fallback={<UserTableSkeleton />}>
          <UserTable />
        </Suspense>
      </div>
    </div>
  );
}
