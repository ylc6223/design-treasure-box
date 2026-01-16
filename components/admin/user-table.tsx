'use client'

import { useState, useEffect } from 'react'
import { Search, Shield, User as UserIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: 'USER' | 'ADMIN'
  created_at: string
}

interface PaginatedResponse {
  data: User[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })

      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load users')
      }

      const data: PaginatedResponse = await response.json()
      setUsers(data.data)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast({
        title: '加载失败',
        description: '无法加载用户列表',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 更新用户角色
  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      setUpdatingRole(userId)
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('Failed to update role')
      }

      toast({
        title: '更新成功',
        description: `用户角色已更新为 ${newRole === 'ADMIN' ? '管理员' : '普通用户'}`,
      })

      // 重新加载列表
      loadUsers()
    } catch (error) {
      console.error('Failed to update role:', error)
      toast({
        title: '更新失败',
        description: '无法更新用户角色',
        variant: 'destructive',
      })
    } finally {
      setUpdatingRole(null)
    }
  }

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    loadUsers()
  }, [page, search])

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // 获取用户名首字母
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.charAt(0).toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="搜索用户名称或邮箱..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* 用户表格 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                  暂无用户
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                        <AvatarFallback>
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.name || '未设置名称'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-text-secondary">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                      className="gap-1"
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
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as 'USER' | 'ADMIN')}
                      disabled={updatingRole === user.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">普通用户</SelectItem>
                        <SelectItem value="ADMIN">管理员</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            第 {page} 页，共 {totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
