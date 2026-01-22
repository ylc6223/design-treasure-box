# Scripts 目录

此目录包含项目的各种脚本文件，按功能分类组织，用于数据迁移、开发工具和系统维护。

## 目录结构

```
scripts/
├── database/         # 数据库相关脚本
├── development/      # 开发工具脚本
├── maintenance/      # 维护脚本
└── README.md        # 本文档
```

## 快速开始

### 环境配置

确保 `.env.local` 文件包含必要的环境变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_secret_key
```

### 常用操作

```bash
# 检查数据库状态
npx tsx scripts/development/check-database-status.ts

# 迁移Categories数据
npx tsx scripts/database/migrate-categories.ts

# 验证迁移结果
npx tsx scripts/database/verify-categories-migration.ts
```

## 脚本分类

### 📊 database/ - 数据库脚本

- 数据迁移和同步
- 数据验证和修复
- SQL生成工具

### 🛠️ development/ - 开发工具

- 环境状态检查
- 开发辅助工具
- 测试脚本

### 🔧 maintenance/ - 维护脚本

- 生产环境维护
- 数据清理和优化
- 系统修复工具

## 执行流程

### 标准迁移流程

1. **环境检查**

   ```bash
   npx tsx scripts/development/check-database-status.ts
   ```

2. **数据迁移**

   ```bash
   npx tsx scripts/database/migrate-categories.ts
   npx tsx scripts/database/migrate-resources.ts
   ```

3. **结果验证**
   ```bash
   npx tsx scripts/database/verify-categories-migration.ts
   ```

## 安全注意事项

⚠️ **重要提醒**：

- 生产环境操作前必须先在测试环境验证
- 重要数据操作前请先备份
- 维护脚本需要特别谨慎，可能影响生产数据
- 确保API密钥安全，不要提交到版本控制

## 故障排除

### 常见问题

1. **环境变量未配置**
   - 检查 `.env.local` 文件
   - 确认Supabase项目配置

2. **权限不足**
   - 确认使用正确的Secret Key
   - 检查数据库RLS策略

3. **网络连接问题**
   - 检查Supabase服务状态
   - 确认网络连接正常

### 调试技巧

```bash
# 启用详细日志
DEBUG=true npx tsx scripts/database/migrate-categories.ts

# 检查脚本语法
npx tsc --noEmit scripts/database/migrate-categories.ts
```

## 开发指南

### 新增脚本规范

1. **文件命名**：使用kebab-case，描述性命名
2. **目录分类**：按功能放入对应目录
3. **错误处理**：包含完整的try-catch
4. **日志输出**：提供清晰的执行状态
5. **文档更新**：更新相应的README

### 脚本模板

```typescript
#!/usr/bin/env tsx
/**
 * 脚本描述
 * 用途：具体功能说明
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  try {
    console.log('🚀 开始执行脚本...');

    // 环境变量检查
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('缺少必要的环境变量');
    }

    // 脚本主要逻辑

    console.log('✅ 脚本执行完成');
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

main();
```

## 相关文档

- [数据库脚本说明](./database/README.md)
- [开发工具说明](./development/README.md)
- [维护脚本说明](./maintenance/README.md)
- [项目结构规范](../PROJECT_STRUCTURE.md)
