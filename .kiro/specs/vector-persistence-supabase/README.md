# 向量化持久化 Supabase 方案

## 概述

本规格文档定义了将当前项目的纯内存向量索引迁移到 Supabase PostgreSQL + pgvector 持久化方案的完整实现计划。该方案解决了当前实现的冷启动、成本和扩展性问题，为生产环境提供可靠的向量搜索服务。

## 问题背景

### 当前方案的局限性

1. **冷启动问题** - 每次服务重启需要重新调用智谱 AI API 生成所有向量
2. **成本浪费** - 重复的向量化调用产生不必要的 API 费用
3. **内存限制** - 随着资源数量增长，内存占用线性增加
4. **单机限制** - 无法在多个服务实例间共享向量索引
5. **并发瓶颈** - 所有搜索请求都在单个进程中处理

### 解决方案优势

1. **持久化存储** - 向量数据存储在 PostgreSQL 中，系统重启无需重新生成
2. **成本优化** - 智能增量同步，只处理变更的资源
3. **高性能** - pgvector 优化的向量索引，搜索响应时间 < 100ms
4. **可扩展性** - 支持水平扩展和多实例部署
5. **生产就绪** - 完整的错误处理和监控机制，无降级依赖

## 技术架构

### 核心组件

- **Vector Persistence Service** - 向量数据的持久化存储和检索
- **Embedding Sync Service** - 资源数据与向量的智能同步
- **Vector Cache Layer** - 高性能内存缓存，提升查询速度
- **Supabase Integration** - PostgreSQL + pgvector 数据库集成

### 数据库架构

```sql
-- 资源向量表
CREATE TABLE resource_embeddings (
  id SERIAL PRIMARY KEY,
  resource_id VARCHAR(255) UNIQUE NOT NULL,
  embedding vector(1536) NOT NULL,  -- 智谱 embedding-2 维度
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 向量索引（余弦相似度）
CREATE INDEX resource_embeddings_embedding_idx 
ON resource_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

### 性能指标

- **搜索响应时间**: < 100ms
- **向量维度**: 1536 (智谱 embedding-2)
- **相似度算法**: 余弦相似度
- **索引类型**: IVFFlat (适合中等规模数据)
- **缓存策略**: LRU + TTL

## 实施计划

### 阶段 1: 基础设施 (Tasks 1-2)
- Supabase 数据库架构设置
- pgvector 扩展和索引配置
- 客户端集成和基础 API

### 阶段 2: 核心服务 (Tasks 3-4)
- 向量持久化服务实现
- 增量同步机制开发
- 缓存层和性能优化

### 阶段 3: 监控运维 (Tasks 6-7)
- 配置管理和环境支持
- 性能监控和健康检查
- 错误处理和监控机制

### 阶段 4: 迁移集成 (Tasks 8-9)
- 数据迁移工具开发
- 完全替换内存索引
- 生产环境部署

### 阶段 5: 验证优化 (Tasks 11-13)
- 端到端集成测试
- 性能基准测试
- 生产环境验证

## 配置要求

### 环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_secret_key

# 向量存储配置
VECTOR_STORE_PROVIDER=supabase
VECTOR_CACHE_TTL=3600
VECTOR_CACHE_SIZE=1000

# 同步配置
EMBEDDING_SYNC_INTERVAL=300
EMBEDDING_BATCH_SIZE=50
```

### Supabase 要求

- PostgreSQL 版本 >= 14
- pgvector 扩展已启用
- 足够的存储空间（估算：32个资源 × 1536维 × 4字节 ≈ 200KB）
- 适当的连接池配置

## 迁移策略

### 1. 数据库优先架构
- 完全依赖 Supabase PostgreSQL + pgvector
- 移除所有内存索引相关代码
- 所有向量操作都通过数据库执行

### 2. 零停机部署
- 数据库架构预先创建
- 后台同步向量数据
- 原子性切换搜索后端

### 3. 完整替换策略
- 不保留原有内存索引代码
- 彻底重构向量搜索服务
- 确保生产环境的一致性

## 质量保证

### 测试策略

- **单元测试** - 覆盖所有核心组件
- **属性测试** - 验证系统不变量和正确性
- **集成测试** - 端到端功能验证
- **性能测试** - 响应时间和吞吐量基准

### 监控指标

- 搜索响应时间分布
- 向量同步成功率
- 数据库连接状态
- 缓存命中率
- 错误率和降级频率

## 文档结构

- `requirements.md` - 详细的功能需求和验收标准
- `design.md` - 技术架构和接口设计
- `tasks.md` - 分阶段的实施任务列表
- `README.md` - 本概述文档

## 下一步行动

1. 审查需求文档，确认业务需求
2. 评估设计方案，验证技术可行性
3. 开始执行任务列表，从数据库架构开始
4. 建立测试环境，验证 Supabase 集成
5. 制定详细的迁移时间表

---

*本方案基于当前项目的实际情况设计，充分考虑了现有技术栈和业务需求，确保平滑迁移和长期可维护性。*