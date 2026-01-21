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
    <div className="space-y-4">
      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between p-4 bg-background/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[250px]" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] h-10 text-center">头像</TableHead>
              <TableHead className="h-10">用户</TableHead>
              <TableHead className="h-10 text-center">角色</TableHead>
              <TableHead className="h-10 text-center">注册时间</TableHead>
              <TableHead className="h-10 text-center">在籍时长</TableHead>
              <TableHead className="w-[120px] h-10 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-5 w-[60px] rounded-full" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-[40px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-end space-x-2 p-4">
        <Skeleton className="h-4 w-[100px]" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-[70px]" />
          <Skeleton className="h-8 w-[70px]" />
        </div>
      </div>
    </div>
  );
}
