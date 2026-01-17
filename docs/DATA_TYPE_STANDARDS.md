# 前后端数据类型统一规范

## 概述

为了避免前后端之间的数据类型转换错误，我们统一了数据类型定义，确保前端 Zod schema 与数据库返回的实际数据类型一致。

## 核心原则

1. **前端校验以数据库类型为准**：前端 Zod schema 必须与数据库返回的实际数据类型保持一致
2. **避免类型转换**：API 层不进行数据类型转换，直接返回数据库原始数据
3. **字段名保持前端习惯**：前端使用驼峰命名（camelCase），后端使用下划线命名（snake_case），通过映射处理

## 统一的数据类型

### 时间字段
- **数据库类型**: `TIMESTAMPTZ` 
- **返回类型**: `string` (ISO 8601 格式，如 "2024-01-01T00:00:00.000Z")
- **前端校验**: `z.string()` (不使用 `z.string().datetime()`)
- **示例**: `"2024-01-01T00:00:00.000Z"`

### 数值字段
- **评分值**: `number` (0-5，步长 0.5)
- **计数器**: `number` (整数，≥0)
- **前端校验**: `z.number()` 配合相应约束

### 布尔字段
- **数据库类型**: `BOOLEAN`
- **返回类型**: `boolean`
- **前端校验**: `z.boolean()`

### JSON 字段
- **数据库类型**: `JSONB`
- **返回类型**: `object` (已解析的 JSON 对象)
- **前端校验**: 具体的对象 schema

### 数组字段
- **数据库类型**: `TEXT[]`
- **返回类型**: `string[]`
- **前端校验**: `z.array(z.string())`

## 字段映射规则

### 前端 → 数据库
```typescript
// 前端提交数据
{
  resourceId: "uuid",
  updateFrequency: 4.5,
  freeLevel: 5,
  createdAt: "2024-01-01T00:00:00.000Z"
}

// 映射到数据库字段
{
  resource_id: "uuid",
  update_frequency: 4.5,
  free_level: 5,
  created_at: "2024-01-01T00:00:00.000Z"
}
```

### 数据库 → 前端
```typescript
// 数据库返回数据
{
  resource_id: "uuid",
  update_frequency: 4.5,
  free_level: 5,
  created_at: "2024-01-01T00:00:00.000Z"
}

// 映射到前端字段
{
  resourceId: "uuid",
  updateFrequency: 4.5,
  freeLevel: 5,
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## 具体实现

### 评分数据类型
```typescript
// 前端 Schema
export const RatingSchema = z.object({
  overall: z.number().min(0).max(5).multipleOf(0.5),
  usability: z.number().min(0).max(5).multipleOf(0.5),
  aesthetics: z.number().min(0).max(5).multipleOf(0.5),
  updateFrequency: z.number().min(0).max(5).multipleOf(0.5),
  freeLevel: z.number().min(0).max(5).multipleOf(0.5),
})

// 数据库字段类型
{
  overall: DECIMAL(2,1),
  usability: DECIMAL(2,1), 
  aesthetics: DECIMAL(2,1),
  update_frequency: DECIMAL(2,1),
  free_level: DECIMAL(2,1)
}
```

### 时间字段处理
```typescript
// 前端 Schema - 使用 string 而不是 datetime()
export const UserRatingSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  resourceId: z.string().uuid(),
  createdAt: z.string(), // ISO 8601 字符串
  updatedAt: z.string(), // ISO 8601 字符串
  // ...其他字段
})
```

### API 响应处理
```typescript
// API 直接返回数据库数据，不做类型转换
export const POST = withErrorHandler(async (request: NextRequest) => {
  // ... 业务逻辑
  
  const { data, error } = await supabase
    .from('ratings')
    .insert(ratingData)
    .select()
    .single()

  // 直接返回，不做字段名转换
  return successResponse({
    success: true,
    data: data, // 保持数据库原始字段名和类型
  })
})
```

## 验证规则

### 前端验证
- 使用 Zod schema 进行运行时验证
- Schema 定义必须与数据库返回类型完全一致
- 不在前端进行类型转换

### 后端验证
- API 层使用相同的 Zod schema 验证请求数据
- 数据库层使用 SQL 约束确保数据完整性
- 不在 API 层进行数据类型转换

## 注意事项

1. **时间处理**: 前端接收到的时间都是 ISO 8601 字符串，需要时可以用 `new Date()` 转换
2. **数值精度**: 评分值在数据库中是 DECIMAL(2,1)，JavaScript 中是 number
3. **JSON 字段**: 数据库 JSONB 字段会自动解析为 JavaScript 对象
4. **数组字段**: PostgreSQL 数组会自动转换为 JavaScript 数组

## 迁移指南

如果需要修改数据类型：

1. **先修改数据库 schema**
2. **更新 types/database.ts**
3. **同步更新前端 Zod schema**
4. **测试 API 端点**
5. **更新相关组件**

这样确保数据类型的一致性，避免运行时类型错误。