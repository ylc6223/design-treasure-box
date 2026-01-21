'use client';

import { useState, useEffect } from 'react';
import { Search, Shield, User as UserIcon } from 'lucide-react';
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
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
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
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('加载失败', {
        description: '无法加载用户列表',
      });
    } finally {
      setLoading(false);
    }
  };

  // 切换用户角色
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

      toast.success('更新成功', {
        description: `用户角色已更新为 ${newRole === 'ADMIN' ? '管理员' : '普通用户'}`,
      });

      // 重新加载列表
      loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('更新失败', {
        description: '无法更新用户角色',
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    loadUsers();
  }, [page, search]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 获取用户名首字母
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-text-secondary">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="搜索用户名称或邮箱..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-background/50 backdrop-blur-sm"
          />
        </div>
        <div className="text-sm text-text-secondary">共 {total.toLocaleString()} 位用户</div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/50 bg-background/30 backdrop-blur-sm">
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
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-muted p-3">
                      <UserIcon className="h-6 w-6 text-text-muted" />
                    </div>
                    <p className="text-text-secondary">暂无用户</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/50 transition-colors border-border/50"
                  style={{
                    animation: `fade-in 0.3s ease-out ${index * 0.02}s both`,
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-2 ring-background">
                        <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-xs font-semibold">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name || '未设置名称'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-text-secondary font-mono">{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                      className="gap-1.5 font-normal"
                    >
                      {user.role === 'ADMIN' ? (
                        <>
                          <Shield className="h-3 w-3" />
                          管理员
                        </>
                      ) : (
                        <>
                          <UserIcon className="h-3 w-3" />
                          普通用户
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-text-secondary">
                      {formatDate(user.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-sm text-text-secondary">
                        {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                      </span>
                      <Switch
                        checked={user.role === 'ADMIN'}
                        onCheckedChange={() => handleRoleToggle(user.id, user.role)}
                        disabled={updatingRole === user.id}
                        className="data-[state=checked]:bg-primary"
                      />
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
          <div className="text-xs text-text-secondary tabular-nums">
            第 {page} 页 / 共 {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="h-8 px-3 text-xs border-border/50 hover:bg-muted"
            >
              上一页
            </Button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={page === i ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(i)}
                      className={`h-8 w-8 p-0 text-xs ${
                        page === i
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'border-border/50 hover:bg-muted'
                      }`}
                    >
                      {i}
                    </Button>
                  );
                }

                return pages;
              })()}
            </div>

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
