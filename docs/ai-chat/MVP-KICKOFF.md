# AI 聊天 MVP 启动清单

**目标**: 在4-5周内完成可上线的MVP
**创建日期**: 2026-01-23
**状态**: 🚀 准备启动

---

## ⚡ 今天就可以开始的5件事

### 1. 验证环境（30分钟）

```bash
# 1. 确认依赖已安装
npm list next @supabase/supabase-js ai

# 2. 验证环境变量
cat .env.local | grep -E "SUPABASE|ZHIPU"

# 3. 测试数据库连接
npm run dev
# 访问 http://localhost:3000
```

**✅ 验证标准**:

- ✅ Next.js开发服务器正常启动
- ✅ 能访问现有的资源列表页面
- ✅ Supabase连接正常（检查现有数据）

---

### 2. 检查现有代码基础（1小时）

```bash
# 查看已有的AI聊天相关文件
ls -la lib/ai/
ls -la components/ai-chat*
ls -la hooks/use-ai-chat.ts
ls -la app/api/chat/route.ts
```

**✅ 验证标准**:

- ✅ 了解现有实现（见 `ai-chat-redesign-assessment.md`）
- ✅ 确认哪些模块可复用，哪些需要重写

---

### 3. 创建第一个新文件：意图分析器（2小时）

```bash
# 创建文件
touch lib/ai/query-analyzer.ts
```

**粘贴以下代码**:

```typescript
// lib/ai/query-analyzer.ts

/**
 * 查询分析结果
 */
export interface QueryAnalysis {
  intent: 'search' | 'inspiration' | 'correction' | 'blocked';
  confidence: number; // 0-1
  dimensions: SearchDimensions;
  clarity: 'clear' | 'ambiguous' | 'vague';
  requiresClarification: boolean;
}

/**
 * 搜索维度
 */
export interface SearchDimensions {
  industry?: string;
  style?: string;
  type?: string;
  color?: string;
}

/**
 * 分析用户查询
 *
 * @param query - 用户输入的查询文本
 * @param sessionContext - 会话上下文（历史偏好）
 * @returns 查询分析结果
 */
export async function analyzeQuery(
  query: string,
  sessionContext: SearchDimensions = {}
): Promise<QueryAnalysis> {
  // TODO: 实现关键词密度分析
  const keywordDensity = calculateKeywordDensity(query);

  // TODO: 实现维度提取
  const dimensions = await extractDimensions(query);

  // TODO: 实现置信度计算
  const confidence = calculateConfidence(keywordDensity, dimensions);

  // TODO: 实现澄清决策
  const requiresClarification =
    confidence < 0.7 || (keywordDensity === 'low' && Object.keys(dimensions).length < 2);

  // TODO: 实现意图分类
  const intent = classifyIntent(query, sessionContext);

  return {
    intent,
    confidence,
    dimensions,
    clarity: confidence > 0.8 ? 'clear' : confidence > 0.5 ? 'ambiguous' : 'vague',
    requiresClarification,
  };
}

// ============ 辅助函数（TODO: 实现）============

function calculateKeywordDensity(query: string): 'low' | 'medium' | 'high' {
  // TODO: 统计有效关键词数量
  const words = query.split(/\s+/).filter((w) => w.length > 1);
  return words.length >= 4 ? 'high' : words.length >= 2 ? 'medium' : 'low';
}

async function extractDimensions(query: string): Promise<SearchDimensions> {
  // TODO: 调用AI提取维度，或使用规则匹配
  return {};
}

function calculateConfidence(density: string, dimensions: SearchDimensions): number {
  // TODO: 基于密度和维度数计算置信度
  const dimensionCount = Object.keys(dimensions).length;
  const densityScore = density === 'high' ? 0.8 : density === 'medium' ? 0.5 : 0.3;
  return Math.min(1, densityScore + dimensionCount * 0.1);
}

function classifyIntent(
  query: string,
  context: SearchDimensions
): 'search' | 'inspiration' | 'correction' | 'blocked' {
  // TODO: 实现意图分类逻辑
  // 简单版：基于关键词匹配
  if (query.match(/^(不是|不要|不对|换个)/)) {
    return 'correction';
  }
  if (query.match(/(灵感|推荐|看看|有什么)/)) {
    return 'inspiration';
  }
  return 'search';
}
```

**✅ 验证标准**:

- ✅ 文件创建成功
- ✅ TypeScript编译无错误
- ✅ 能导出 `analyzeQuery` 函数

---

### 4. 编写第一个测试（1小时）

```bash
# 创建测试文件
touch lib/ai/__tests__/query-analyzer.test.ts
```

**粘贴以下代码**:

```typescript
// lib/ai/__tests__/query-analyzer.test.ts

import { describe, it, expect } from '@jest/globals';
import { analyzeQuery } from '../query-analyzer';

describe('QueryAnalyzer', () => {
  it('应该分析简单查询', async () => {
    const result = await analyzeQuery('医疗图标');

    expect(result.intent).toBe('search');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.clarity).toBeDefined();
  });

  it('应该检测到纠正意图', async () => {
    const result = await analyzeQuery('不对，要红色的');

    expect(result.intent).toBe('correction');
  });

  it('应该检测到探索意图', async () => {
    const result = await analyzeQuery('给我一些灵感');

    expect(result.intent).toBe('inspiration');
  });

  it('低置信度查询应该触发澄清', async () => {
    const result = await analyzeQuery('图标');

    expect(result.requiresClarification).toBe(true);
  });
});
```

**运行测试**:

```bash
npm test -- query-analyzer.test.ts
```

**✅ 验证标准**:

- ✅ 至少2个测试通过
- ✅ 了解如何运行测试

---

### 5. 更新checklist.md（10分钟）

```bash
# 编辑checklist.md
# 在"Phase 0: 前期准备"部分勾选已完成的任务
```

**✅ 验证标准**:

- ✅ 至少勾选2项
- ✅ 更新进度百分比

---

## 📅 第一周完整计划（Phase 0）

### Day 1-2: 环境验证 + 基础框架

#### 任务1: 验证向量搜索

**文件**: `lib/ai/test-vector-search.ts`

```typescript
import { supabase } from '@/lib/supabase';

export async function testVectorSearch() {
  // 测试简单的向量搜索
  const { data, error } = await supabase.rpc('match_resources', {
    query_embedding: [0.1, 0.2, 0.3], // 示例向量
    match_threshold: 0.7,
    match_count: 10,
  });

  if (error) {
    console.error('向量搜索失败:', error);
    return false;
  }

  console.log('✅ 向量搜索正常，返回', data.length, '个结果');
  return true;
}
```

**运行**:

```bash
npx tsx lib/ai/test-vector-search.ts
```

---

#### 任务2: 验证智谱AI连接

**文件**: `lib/ai/test-zhipu.ts`

```typescript
import { ZhipuProvider } from './zhipu-provider';

export async function testZhipuAI() {
  const provider = new ZhipuProvider();

  try {
    const response = await provider.chat({
      messages: [{ role: 'user', content: '你好' }],
    });

    console.log('✅ 智谱AI连接正常:', response);
    return true;
  } catch (error) {
    console.error('❌ 智谱AI连接失败:', error);
    return false;
  }
}
```

---

### Day 3-4: 实现核心模块

#### 优先级1: 意图分析器（query-analyzer.ts）

- ✅ **状态**: 已创建骨架
- 📝 **待完成**:
  - [ ] 实现关键词密度计算
  - [ ] 实现维度提取（可先使用简单规则）
  - [ ] 实现置信度计算
  - [ ] 编写完整测试

---

#### 优先级2: RAG引擎优化

**文件**: `lib/ai/rag-engine.ts`

**现有代码**: 已有基础实现
**需要增强**:

```typescript
// 添加置信度检查
export async function searchWithConfidence(query: string, minConfidence: number = 0.7) {
  const analysis = await analyzeQuery(query);

  if (analysis.confidence < minConfidence) {
    return {
      results: [],
      needsClarification: true,
      suggestedQuestions: generateClarificationQuestions(analysis),
    };
  }

  // 原有的向量搜索逻辑
  return searchResources(query);
}
```

---

### Day 5: 集成测试

#### 创建端到端测试

**文件**: `app/api/chat/route.test.ts`

```typescript
import { POST } from './route';

describe('Chat API', () => {
  it('应该处理简单查询', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        query: '医疗图标',
        sessionId: 'test-session',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
  });
});
```

---

## 🎯 MVP核心功能实现顺序

### 第1-2周: Phase 1 - 核心引擎

```
┌─────────────────────────────────────┐
│ Week 1: 意图识别 + 向量搜索          │
├─────────────────────────────────────┤
│ ✅ Day 1-2: 环境验证               │
│ ✅ Day 3-4: query-analyzer.ts       │
│ ✅ Day 5: 集成测试                  │
│ ✅ Weekend: 代码审查 + 调试          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Week 2: 澄清策略 + 零结果处理        │
├─────────────────────────────────────┤
│ ✅ 澄清问题生成器                    │
│ ✅ 零结果预防机制                    │
│ ✅ 缓存系统（L1: 查询缓存）          │
└─────────────────────────────────────┘
```

**关键文件**:

1. `lib/ai/query-analyzer.ts` ⭐⭐⭐ （最重要）
2. `lib/ai/rag-engine.ts` （优化现有）
3. `lib/ai/clarification-generator.ts` （新建）
4. `lib/ai/cache-manager.ts` （新建）

---

### 第3周: Phase 2 - 智能交互

```
┌─────────────────────────────────────┐
│ Week 3: 前端UI升级                   │
├─────────────────────────────────────┤
│ ✅ 泳道式分组组件                    │
│ ✅ 骨架屏组件                        │
│ ✅ 澄清消息UI                        │
└─────────────────────────────────────┘
```

**关键文件**:

1. `components/ai-chat/swimlane-group.tsx` （新建）
2. `components/ai-chat/skeleton-card-grid.tsx` （新建）
3. `components/ai-chat/clarification-message.tsx` （增强现有）

---

### 第4周: Phase 2-3 - 集成 + 优化

```
┌─────────────────────────────────────┐
│ Week 4: 集成测试 + 性能优化          │
├─────────────────────────────────────┤
│ ✅ 端到端测试                        │
│ ✅ 性能优化（渐进式加载）            │
│ ✅ 安全防护（XML沙箱）               │
│ ✅ 内部验收测试                      │
└─────────────────────────────────────┘
```

---

## 🔥 优先级最高的3个文件

### 1. query-analyzer.ts ⭐⭐⭐⭐⭐

**为什么最重要**: 所有后续功能的基础
**工作量**: 2-3天
**依赖**: 无

**第一步**: 实现基础的规则匹配

```typescript
// 简单版（可先用这个）
const INDUSTRY_KEYWORDS = ['医疗', '金融', '教育', '电商'];
const STYLE_KEYWORDS = ['极简', '3D', '扁平', '手绘'];
// ... 规则匹配
```

**第二步**: 集成AI提升准确率

```typescript
// 进阶版（后续优化）
const dimensions = await zhipu.extractDimensions(query);
```

---

### 2. rag-engine.ts ⭐⭐⭐⭐

**为什么重要**: 核心推荐引擎
**工作量**: 1-2天（已有基础）
**依赖**: query-analyzer.ts

**需要做**:

- [ ] 集成query-analyzer
- [ ] 添加置信度短路逻辑
- [ ] 实现零结果预防

---

### 3. cache-manager.ts ⭐⭐⭐

**为什么重要**: 成本控制关键
**工作量**: 1天
**依赖**: 无

**最小实现**:

```typescript
const cache = new Map(); // 先用内存缓存

export async function cachedSearch(query: string) {
  if (cache.has(query)) {
    return cache.get(query);
  }

  const result = await vectorSearch(query);
  cache.set(query, result);
  return result;
}
```

---

## ✅ 第一个周末的目标

**到本周末，你应该能够**:

1. ✅ 运行一个简单的查询测试

   ```bash
   npm test
   # 至少5个测试通过
   ```

2. ✅ 看到基础的意图分析工作

   ```typescript
   const result = await analyzeQuery('医疗图标');
   console.log(result);
   // { intent: 'search', confidence: 0.7, ... }
   ```

3. ✅ 向量搜索返回结果

   ```typescript
   const results = await searchResources('医疗图标');
   console.log(results.length); // > 0
   ```

4. ✅ 更新checklist.md的进度

---

## 🚨 常见陷阱

### 陷阱1: 试图一次实现所有功能

**症状**: 在query-analyzer上花1周
**解决方案**: 先用简单规则，MVP后再优化

### 陷阱2: 忽略现有代码

**症状**: 从零重写所有内容
**解决方案**: 复用 `rag-engine.ts`, `hybrid-search.ts` 等

### 陷阱3: 过早优化

**症状**: 一开始就实现三层缓存
**解决方案**: MVP用简单Map，Phase 3再优化

### 陷阱4: 不写测试

**症状**: 直接在浏览器中手动测试
**解决方案**: 每个模块至少2个单元测试

---

## 📊 进度追踪

### 每日检查清单

```markdown
## [日期] 每日进度

### 今日完成

- [ ] 任务1
- [ ] 任务2

### 遇到的问题

- 问题1: ...

### 明日计划

- [ ] 任务1
- [ ] 任务2

### 验证标准

- [ ] 测试通过
- [ ] 代码审查完成
```

---

## 🎯 MVP验收标准

### 最低标准（必须达成）

- ✅ 能处理基础查询（"医疗图标"）
- ✅ 意图识别准确率 > 70%
- ✅ API响应时间 < 3秒 (p95)
- ✅ 零结果率 < 10%

### 理想标准（争取达成）

- ✅ 澄清功能工作
- ✅ 泳道式分组展示
- ✅ 会话记忆正常
- ✅ 移动端基本可用

---

## 📞 需要帮助？

### 技术问题

- 查看: `technical-specification.md` 第2章
- 搜索: 现有代码库 `lib/ai/` 目录

### 架构决策

- 查看: `technical-specification.md` 第1章
- 查看: 第8章决策矩阵总览

### 进度追踪

- 更新: `checklist.md`
- 参考: `ai-chat-implementation-plan.md`

---

**准备好了吗？开始吧！** 🚀

第一步: `npm run dev`
第二步: 打开 `lib/ai/query-analyzer.ts`
第三步: 开始编码！
