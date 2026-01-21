import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function UserTableSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Search Bar Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-5 w-[100px]" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border border-border/50 bg-background/30">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="font-semibold">用户</TableHead>
              <TableHead className="font-semibold">邮箱</TableHead>
              <TableHead className="font-semibold">角色</TableHead>
              <TableHead className="font-semibold">注册时间</TableHead>
              <TableHead className="text-right font-semibold">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="border-border/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full ring-2 ring-background" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[180px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[90px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-6 w-11" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-4 w-[120px]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[60px]" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-[60px]" />
        </div>
      </div>
    </div>
  );
}
