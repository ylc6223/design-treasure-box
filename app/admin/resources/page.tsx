import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ResourceTable } from '@/components/admin/resource-table';
import { ResourceTableSkeleton } from '@/components/admin/resource-table-skeleton';

export const metadata = {
  title: '资源管理 - 设计百宝箱',
  description: '管理设计资源',
};

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">资源管理</h1>
          <p className="text-text-secondary mt-2">管理网站展示的设计资源</p>
        </div>
        <Link href="/admin/resources/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建资源
          </Button>
        </Link>
      </div>

      <Suspense fallback={<ResourceTableSkeleton />}>
        <ResourceTable />
      </Suspense>
    </div>
  );
}
