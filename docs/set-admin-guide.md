# 设置管理员权限指南

## 问题
访问 `/admin` 时被重定向到首页，因为你的账号不是管理员角色。

## 解决方案

### 步骤 1: 查找你的用户信息

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 查看所有用户
SELECT id, email, name, role, created_at
FROM public.profiles
ORDER BY created_at DESC;
```

找到你的邮箱对应的记录。

### 步骤 2: 设置为管理员

**方法 A: 通过邮箱设置（推荐）**

```sql
-- 将你的邮箱替换为实际邮箱
UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';
```

**方法 B: 通过用户 ID 设置**

```sql
-- 将 user-id 替换为你的实际用户 ID
UPDATE public.profiles
SET role = 'ADMIN'
WHERE id = 'your-user-id';
```

### 步骤 3: 验证设置

```sql
-- 查看所有管理员
SELECT id, email, name, role
FROM public.profiles
WHERE role = 'ADMIN';
```

### 步骤 4: 刷新页面

1. 退出登录（如果已登录）
2. 重新登录
3. 访问 `http://localhost:3000/admin`
4. 应该能看到管理后台了！

## 快速设置（一键执行）

如果你知道你的邮箱，可以直接执行：

```sql
-- 示例：设置 260902108@qq.com 为管理员
UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = '260902108@qq.com';

-- 验证
SELECT email, role FROM public.profiles WHERE email = '260902108@qq.com';
```

## 注意事项

1. **必须先登录过一次** - 只有登录过的用户才会在 `profiles` 表中有记录
2. **需要重新登录** - 修改角色后需要重新登录才能生效
3. **RLS 策略** - 管理员可以修改任何用户的角色，普通用户只能查看

## 常见问题

### Q: 我看不到我的用户记录
A: 请先登录一次，系统会自动创建 profile 记录。

### Q: 修改后还是被重定向
A: 请退出登录后重新登录，让系统重新获取你的角色信息。

### Q: 如何取消管理员权限
A: 执行相同的 SQL，将 `role = 'ADMIN'` 改为 `role = 'USER'`

```sql
UPDATE public.profiles
SET role = 'USER'
WHERE email = 'your-email@example.com';
```
