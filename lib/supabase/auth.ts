// lib/supabase/auth.ts
// 权限验证辅助函数

import { createClient } from './server'
import type { Database } from '@/types/database'

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * 验证用户已登录
 * @returns 用户信息和 profile
 * @throws AuthenticationError 如果用户未登录
 */
export async function requireAuth() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthenticationError()
  }

  // 获取用户 profile（包含 role）
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new AuthenticationError('User profile not found')
  }

  return { user, profile: profile as Profile }
}

/**
 * 验证用户是管理员
 * @returns 用户信息和 profile
 * @throws AuthenticationError 如果用户未登录
 * @throws AuthorizationError 如果用户不是管理员
 */
export async function requireAdmin() {
  const { user, profile } = await requireAuth()

  if (profile.role !== 'ADMIN') {
    throw new AuthorizationError('Admin access required')
  }

  return { user, profile }
}

/**
 * 获取当前用户（如果已登录）
 * @returns 用户信息和 profile，如果未登录则返回 null
 */
export async function getCurrentUser() {
  try {
    return await requireAuth()
  } catch {
    return null
  }
}
