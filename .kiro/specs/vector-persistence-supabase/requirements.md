# Requirements Document: 向量化持久化 Supabase 方案

## Introduction

基于当前项目的 AI 聊天助手实现，设计并实现一个使用 Supabase PostgreSQL + pgvector 的向量化持久化方案，解决当前纯内存向量索引的局限性，提供可扩展、高性能的语义搜索能力。

## Glossary

- **Vector_Store**: 向量存储服务，负责向量的持久化和检索
- **Embedding_Sync**: 向量同步服务，负责资源数据与向量的同步
- **Supabase_Client**: Supabase 数据库客户端
- **pgvector**: PostgreSQL 的向量扩展，支持向量存储和相似度搜索
- **Resource_Embedding**: 资源向量化数据，包含向量和元数据
- **Incremental_Sync**: 增量同步，只更新变更的资源向量
- **Vector_Index**: 向量索引，用于加速相似度搜索

## Requirements

### Requirement 1: 向量数据持久化

**User Story:** 作为系统管理员，我希望向量数据能够持久化存储，以便系统重启后无需重新生成向量，降低 API 调用成本和启动时间。

#### Acceptance Criteria

1. WHEN 系统启动时，THE Vector_Store SHALL 从 Supabase 数据库加载已存在的向量数据
2. WHEN 新资源添加时，THE Embedding_Sync SHALL 生成向量并存储到数据库
3. WHEN 资源更新时，THE Embedding_Sync SHALL 检测变更并更新对应的向量数据
4. WHEN 向量数据存储失败时，THE Vector_Store SHALL 记录错误并提供降级方案
5. THE Vector_Store SHALL 支持批量向量数据的插入和更新操作

### Requirement 2: 数据库架构设计

**User Story:** 作为开发者，我需要一个合理的数据库架构来存储向量数据和相关元数据，支持高效的相似度搜索。

#### Acceptance Criteria

1. THE Supabase_Client SHALL 创建 resource_embeddings 表存储向量数据
2. THE resource_embeddings 表 SHALL 包含 resource_id、embedding、metadata、timestamps 字段
3. THE embedding 字段 SHALL 使用 pgvector 的 vector 类型，维度为 1536（智谱 embedding-2）
4. THE Vector_Index SHALL 使用 ivfflat 索引算法优化余弦相似度搜索
5. THE metadata 字段 SHALL 使用 JSONB 类型存储资源的分类、评分、标签等信息

### Requirement 3: 增量同步机制

**User Story:** 作为系统运维人员，我希望系统能够智能地同步向量数据，只处理变更的资源，避免不必要的 API 调用。

#### Acceptance Criteria

1. WHEN 检查资源同步状态时，THE Incremental_Sync SHALL 比较资源的 updatedAt 时间戳
2. WHEN 资源内容发生变化时，THE Incremental_Sync SHALL 重新生成并更新向量
3. WHEN 资源被删除时，THE Incremental_Sync SHALL 从向量数据库中移除对应记录
4. THE Incremental_Sync SHALL 支持手动触发全量同步操作
5. THE Incremental_Sync SHALL 记录同步日志，包括处理的资源数量和耗时

### Requirement 4: 高性能向量搜索

**User Story:** 作为最终用户，我希望 AI 助手能够快速响应我的查询，提供准确的资源推荐。

#### Acceptance Criteria

1. WHEN 执行向量搜索时，THE Vector_Store SHALL 在 100ms 内返回相似度结果
2. WHEN 搜索结果数量超过限制时，THE Vector_Store SHALL 按相似度降序返回 Top-K 结果
3. THE Vector_Store SHALL 支持相似度阈值过滤，排除低相关性结果
4. THE Vector_Store SHALL 支持元数据过滤，如类别、评分等条件
5. THE Vector_Store SHALL 提供批量相似度搜索功能，支持多个查询向量

### Requirement 5: 错误处理和可靠性

**User Story:** 作为系统架构师，我需要确保向量服务的高可靠性，在出现问题时能够快速定位和恢复。

#### Acceptance Criteria

1. WHEN Supabase 连接失败时，THE Vector_Store SHALL 记录详细错误并抛出明确异常
2. WHEN 向量搜索超时时，THE Vector_Store SHALL 记录超时信息并返回错误状态
3. WHEN 数据库写入失败时，THE Vector_Store SHALL 实施重试机制并记录失败原因
4. THE Vector_Store SHALL 提供健康检查接口，监控数据库连接状态
5. THE Vector_Store SHALL 记录详细的错误日志，便于问题诊断和性能分析

### Requirement 6: 配置管理和环境支持

**User Story:** 作为开发团队成员，我需要灵活的配置选项来适应不同的部署环境（开发、测试、生产）。

#### Acceptance Criteria

1. THE Supabase_Client SHALL 支持通过环境变量配置数据库连接参数
2. THE Vector_Store SHALL 支持配置向量维度、索引类型、搜索参数
3. WHEN 在开发环境时，THE Vector_Store SHALL 支持数据库架构的自动创建和迁移
4. THE Vector_Store SHALL 支持配置缓存策略，如 TTL、最大缓存大小等
5. THE Vector_Store SHALL 提供配置验证功能，确保参数的有效性

### Requirement 7: 监控和性能指标

**User Story:** 作为运维工程师，我需要监控向量服务的性能指标，及时发现和解决问题。

#### Acceptance Criteria

1. THE Vector_Store SHALL 记录搜索响应时间、吞吐量等性能指标
2. THE Embedding_Sync SHALL 记录同步任务的执行时间和成功率
3. THE Vector_Store SHALL 提供向量数据库的存储使用情况统计
4. THE Vector_Store SHALL 支持性能指标的导出，集成到监控系统
5. WHEN 性能指标异常时，THE Vector_Store SHALL 触发告警通知

### Requirement 8: 数据迁移和备份

**User Story:** 作为数据管理员，我需要安全可靠的数据迁移和备份方案，确保向量数据的安全性。

#### Acceptance Criteria

1. THE Vector_Store SHALL 提供从内存索引到数据库的一次性迁移功能
2. THE Vector_Store SHALL 支持向量数据的导出和导入操作
3. THE Vector_Store SHALL 支持增量备份，只备份变更的向量数据
4. WHEN 执行数据迁移时，THE Vector_Store SHALL 验证数据完整性
5. THE Vector_Store SHALL 提供数据恢复功能，支持从备份恢复向量索引