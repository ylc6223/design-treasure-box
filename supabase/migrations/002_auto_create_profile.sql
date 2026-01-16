-- supabase/migrations/002_auto_create_profile.sql
-- 自动创建用户 Profile 触发器

-- 创建触发器函数：当 auth.users 新增记录时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, image, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url',
    'USER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：在 auth.users 插入新记录后执行
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 注释说明
COMMENT ON FUNCTION public.handle_new_user() IS '当新用户通过 OAuth 注册时自动创建 profile 记录';
