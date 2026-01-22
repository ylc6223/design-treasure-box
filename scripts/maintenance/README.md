# 维护脚本目录

此目录包含生产环境维护和数据修复相关的脚本。

## 脚本列表

### 数据维护

- `update-resource-ids.js` - 更新资源ID格式
- `test-vector-migration.ts` - 测试向量数据迁移

## 使用方法

```bash
# 更新资源ID
node scripts/maintenance/update-resource-ids.js

# 测试向量迁移
npx tsx scripts/maintenance/test-vector-migration.ts
```

## 安全注意事项

⚠️ **重要提醒**：

- 这些脚本可能修改生产数据
- 执行前必须先备份相关数据
- 建议先在测试环境验证
- 生产环境操作需要审批流程

## 执行清单

执行维护脚本前请确认：

- [ ] 已备份相关数据
- [ ] 在测试环境验证过脚本
- [ ] 了解脚本的具体操作内容
- [ ] 准备好回滚方案
- [ ] 获得必要的操作授权

## 监控建议

- 执行过程中监控系统性能
- 记录操作日志
- 验证操作结果
- 必要时准备回滚
