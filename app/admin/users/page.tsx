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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">用户管理</h1>
        <p className="text-sm text-muted-foreground">查看所有用户、管理角色权限及账号状态</p>
      </div>

      {/* Statistics */}
      <Suspense fallback={<UserStatsSkeleton />}>
        <UserStats />
      </Suspense>

      {/* User Table */}
      <div className="border rounded-lg shadow-sm bg-card">
        <Suspense fallback={<UserTableSkeleton />}>
          <UserTable />
        </Suspense>
      </div>
    </div>
  );
}
