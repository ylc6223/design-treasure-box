'use client';

import { useState, useEffect } from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'USER' | 'ADMIN';
  created_at: string;
}

interface PaginatedResponse {
  data: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10', // Standard pageSize for Vercel-like tables often feels better at 10 or 20
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data: PaginatedResponse = await response.json();
      setUsers(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: 'USER' | 'ADMIN') => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';

    try {
      setUpdatingRole(userId);
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      toast.success(newRole === 'ADMIN' ? 'Promoted to Admin' : 'Demoted to User');
      loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getInitials = (name: string | null, email: string) => {
    const s = name || email;
    return s.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-background/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户名称或邮箱..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 w-[250px] lg:w-[350px] h-9 border-border/50 focus-visible:border-border transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="relative w-full overflow-auto border border-border/50 rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead className="w-[80px] h-10 text-xs font-medium text-muted-foreground text-center">
                头像
              </TableHead>
              <TableHead className="h-10 text-xs font-medium text-muted-foreground">用户</TableHead>
              <TableHead className="h-10 text-xs font-medium text-muted-foreground text-center">
                角色
              </TableHead>
              <TableHead className="h-10 text-xs font-medium text-muted-foreground text-center">
                注册时间
              </TableHead>
              <TableHead className="h-10 text-xs font-medium text-muted-foreground text-center">
                在籍时长
              </TableHead>
              <TableHead className="w-[120px] h-10 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">加载中...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">暂无用户</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="py-3">
                    <div className="flex justify-center">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                        <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{user.name || '未设置名称'}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Badge
                      variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                      className="rounded-full font-normal text-xs"
                    >
                      {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap text-center">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="py-3 text-center text-sm text-muted-foreground">
                    -
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                        </span>
                        <Switch
                          checked={user.role === 'ADMIN'}
                          onCheckedChange={() => handleRoleToggle(user.id, user.role)}
                          disabled={updatingRole === user.id}
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 hover:bg-muted"
                          >
                            <span className="sr-only">打开菜单</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                            复制用户 ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <div className="text-xs text-muted-foreground tabular-nums">
            第 {page} 页 / 共 {totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="h-8 px-3 text-xs border-border/50 hover:bg-muted"
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 px-3 text-xs border-border/50 hover:bg-muted"
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
