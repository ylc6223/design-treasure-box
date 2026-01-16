'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AdminNavProps {
  user: {
    id: string
    email?: string
  }
  profile: {
    name: string | null
    email: string
    image: string | null
    role: 'USER' | 'ADMIN'
  }
}

const navItems = [
  {
    title: '仪表板',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: '资源管理',
    href: '/admin/resources',
    icon: Package,
  },
  {
    title: '用户管理',
    href: '/admin/users',
    icon: Users,
  },
]

export function AdminNav({ user, profile }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoggingOut(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  return (
    <aside className="w-64 border-r bg-surface">
      <div className="flex h-full flex-col">
        {/* Logo 和返回首页 */}
        <div className="border-b p-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            返回首页
          </Link>
          <h1 className="mt-4 text-xl font-semibold">管理后台</h1>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-text-secondary hover:bg-accent/50 hover:text-text-primary'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* 用户信息和退出 */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.image || undefined} alt={profile.name || profile.email} />
              <AvatarFallback>{getInitials(profile.name, profile.email)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile.name || profile.email}
              </p>
              <p className="text-xs text-text-muted truncate">{profile.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleSignOut}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? '退出中...' : '退出登录'}
          </Button>
        </div>
      </div>
    </aside>
  )
}
