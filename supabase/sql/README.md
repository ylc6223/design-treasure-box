# SQL 脚本目录

此目录包含需要手动执行的SQL脚本，按功能分类组织。

## 目录结构

```
sql/
├── manual/           # 手动执行脚本
├── seeds/            # 种子数据脚本
└── utilities/        # 工具SQL脚本
```

## 使用说明

### manual/ - 手动执行脚本
- 需要在Supabase Dashboard的SQL编辑器中手动执行
- 通常用于一次性的数据库操作或修复
- 文件命名：`{purpose}_{description}.sql`

### seeds/ - 种子数据脚本
- 用于初始化数据库数据
- 包含测试数据和基础数据
- 文件命名：`seed_{table_name}.sql`

### utilities/ - 工具SQL脚本
- 数据库维护和优化脚本
- 修复和更新脚本
- 文件命名：`{action}_{target}.sql`

## 执行方式

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目
3. 进入 SQL Editor
4. 复制脚本内容并执行
5. 检查执行结果

## 注意事项

- 执行前请仔细阅读脚本注释
- 生产环境执行前请先在测试环境验证
- 重要操作建议先备份数据