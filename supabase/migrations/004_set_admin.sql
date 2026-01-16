-- 设置管理员权限
-- 将指定用户设置为管理员角色

-- 方法 1: 通过邮箱设置（推荐）
-- 请将 'your-email@example.com' 替换为你的实际邮箱
UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';

-- 方法 2: 通过用户 ID 设置
-- 请将 'your-user-id' 替换为你的实际用户 ID
-- UPDATE public.profiles
-- SET role = 'ADMIN'
-- WHERE id = 'your-user-id';

-- 验证设置
SELECT id, email, name, role 
FROM public.profiles 
WHERE role = 'ADMIN';
