import { Suspense } from 'react'
import { UserTable } from '@/components/admin/user-table'
import { UserTableSkeleton } from '@/components/admin/user-table-skeleton'

export const metadata = {
  title: '用户管理 - 设计百宝箱',
  description: '管理用户和权限',
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
        <p className="text-text-secondary mt-2">
          管理用户账号和角色权限
        </p>
      </div>

      <Suspense fallback={<UserTableSkeleton />}>
        <UserTable />
      </Suspense>
    </div>
  )
}
