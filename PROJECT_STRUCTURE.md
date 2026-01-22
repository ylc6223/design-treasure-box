# 项目文件组织规范

## 目录结构约定

```
design-treasure-box/
├── supabase/
│   ├── migrations/           # 数据库迁移文件 (按版本号命名)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_auto_create_profile.sql
│   │   ├── 003_seed_resources.sql
│   │   ├── 004_set_admin.sql
│   │   ├── 005_create_categories_table.sql
│   │   └── README.md
│   └── sql/                  # 手动执行的SQL脚本
│       ├── manual/           # 手动执行脚本
│       │   └── create_categories_table.sql
│       ├── seeds/            # 种子数据
│       │   └── seed_resources.sql
│       ├── utilities/        # 工具SQL
│       │   └── update_vector_dimension.sql
│       └── README.md
├── scripts/
│   ├── database/             # 数据库相关脚本
│   │   ├── migrate-categories.ts
│   │   ├── migrate-resources.ts
│   │   ├── migrate-data.ts
│   │   ├── run-categories-migration.ts
│   │   ├── verify-categories-migration.ts
│   │   ├── generate-insert-sql.js
│   │   └── README.md
│   ├── development/          # 开发工具脚本
│   │   ├── check-database-status.ts
│   │   ├── test-e2e.ts
│   │   └── README.md
│   ├── maintenance/          # 维护脚本
│   │   ├── test-vector-migration.ts
│   │   ├── update-resource-ids.js
│   │   └── README.md
│   └── README.md
├── data/                     # 静态数据文件 (逐步移除)
└── docs/                     # 文档
    ├── database/             # 数据库文档
    └── scripts/              # 脚本使用说明
```

## 文件命名约定

### SQL文件

- **迁移文件**: `{version}_{description}.sql` (如: `001_initial_schema.sql`)
- **手动脚本**: `{purpose}_{description}.sql` (如: `manual_create_categories.sql`)
- **种子数据**: `seed_{table_name}.sql` (如: `seed_categories.sql`)

### TypeScript脚本

- **数据库脚本**: `{action}-{target}.ts` (如: `migrate-categories.ts`)
- **工具脚本**: `{tool}-{purpose}.ts` (如: `verify-migration.ts`)

### 文档文件

- **说明文档**: `README.md` (每个目录一个)
- **迁移文档**: `MIGRATION_{version}.md` (如: `MIGRATION_005.md`)

## 脚本分类原则

### supabase/migrations/

- **用途**: 版本化的数据库迁移
- **执行**: 自动或通过Supabase CLI
- **特点**: 不可修改，按顺序执行

### supabase/sql/

- **用途**: 手动执行的SQL脚本
- **执行**: 在Supabase Dashboard中手动执行
- **特点**: 可重复执行，独立功能

### scripts/database/

- **用途**: 数据库操作的TypeScript脚本
- **执行**: 通过npm/pnpm运行
- **特点**: 包含业务逻辑，可配置

### scripts/development/

- **用途**: 开发环境相关脚本
- **执行**: 开发时使用
- **特点**: 本地环境，可修改

### scripts/maintenance/

- **用途**: 生产环境维护脚本
- **执行**: 运维时使用
- **特点**: 生产就绪，经过测试
