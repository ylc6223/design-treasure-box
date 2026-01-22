# 评分功能使用指南

## 概述

评分系统允许已登录用户对资源进行多维度评分（综合、易用性、美观度、更新频率、免费程度）。

## 组件说明

### 1. RatingInput - 评分输入组件

单个评分维度的输入组件，支持 0.5 精度（半星）。

```tsx
import { RatingInput } from '@/components/rating/rating-input';

function MyComponent() {
  const [rating, setRating] = useState(0);

  return <RatingInput label="综合评分" value={rating} onChange={setRating} required />;
}
```

### 2. RatingDialog - 评分对话框

完整的评分表单对话框，包含所有评分维度和评论。

```tsx
import { RatingDialog } from '@/components/rating/rating-dialog';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (data) => {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    // 处理响应...
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>评分</button>
      <RatingDialog
        resource={resource}
        existingRating={userRating}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
}
```

### 3. RatingDisplay - 评分显示组件

显示资源的评分信息，包括策展人评分、用户聚合评分和个人评分。

```tsx
import { RatingDisplay } from '@/components/rating/rating-display';

function MyComponent() {
  return (
    <RatingDisplay
      curatorRating={resource.rating}
      aggregatedRating={aggregatedRating}
      ratingCount={ratingCount}
      userRating={userRating}
      isAuthenticated={!!user}
      onRate={() => setRatingDialogOpen(true)}
    />
  );
}
```

## 完整使用示例

### 在资源详情页中集成评分功能

```tsx
'use client';

import { useState, useEffect } from 'react';
import { RatingDialog } from '@/components/rating/rating-dialog';
import { RatingDisplay } from '@/components/rating/rating-display';
import { createClient } from '@/lib/supabase/client';
import type { Resource } from '@/types';
import type { ResourceRatings, SubmitRatingRequest } from '@/types/rating';

export function ResourceDetailPage({ resource }: { resource: Resource }) {
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState<ResourceRatings | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 获取当前用户
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // 获取评分数据
  useEffect(() => {
    fetchRatings();
  }, [resource.id]);

  const fetchRatings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ratings/${resource.id}`);
      const result = await response.json();
      if (result.success) {
        setRatings(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 提交评分
  const handleSubmitRating = async (data: SubmitRatingRequest) => {
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // 刷新评分数据
        await fetchRatings();
        alert('评分提交成功！');
      } else {
        alert('评分提交失败：' + result.error);
      }
    } catch (error) {
      console.error('Rating submission error:', error);
      alert('评分提交失败，请稍后重试');
    }
  };

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 资源信息 */}
      <div>
        <h1>{resource.name}</h1>
        <p>{resource.description}</p>
      </div>

      {/* 评分显示 */}
      <RatingDisplay
        curatorRating={resource.rating}
        aggregatedRating={ratings?.aggregatedRating || null}
        ratingCount={ratings?.ratingCount || 0}
        userRating={ratings?.userRating || null}
        isAuthenticated={!!user}
        onRate={() => setIsRatingDialogOpen(true)}
      />

      {/* 评分对话框 */}
      <RatingDialog
        resource={resource}
        existingRating={ratings?.userRating || null}
        open={isRatingDialogOpen}
        onOpenChange={setIsRatingDialogOpen}
        onSubmit={handleSubmitRating}
      />
    </div>
  );
}
```

## API 使用

### 提交评分

```typescript
POST /api/ratings

// 请求体
{
  "resourceId": "uuid",
  "overall": 4.5,
  "usability": 4.0,
  "aesthetics": 5.0,
  "updateFrequency": 4.5,
  "freeLevel": 3.5,
  "comment": "非常好用的工具！"
}

// 响应
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "resourceId": "uuid",
    "overall": 4.5,
    // ...
  }
}
```

### 查询评分

```typescript
GET /api/ratings/[resourceId]

// 响应
{
  "success": true,
  "data": {
    "aggregatedRating": {
      "overall": 4.3,
      "usability": 4.1,
      "aesthetics": 4.5,
      "updateFrequency": 4.2,
      "freeLevel": 3.8
    },
    "ratingCount": 15,
    "userRating": {
      "id": "uuid",
      "overall": 4.5,
      // ...
    }
  }
}
```

## 使用 TanStack Query 优化

推荐使用 TanStack Query 进行数据缓存和状态管理：

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useResourceRatings(resourceId: string) {
  return useQuery({
    queryKey: ['ratings', resourceId],
    queryFn: async () => {
      const response = await fetch(`/api/ratings/${resourceId}`);
      const result = await response.json();
      return result.data;
    },
  });
}

function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitRatingRequest) => {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      // 刷新评分数据
      queryClient.invalidateQueries({
        queryKey: ['ratings', variables.resourceId],
      });
    },
  });
}

// 使用
function MyComponent({ resource }) {
  const { data: ratings, isLoading } = useResourceRatings(resource.id);
  const submitRating = useSubmitRating();

  const handleSubmit = (data) => {
    submitRating.mutate(data);
  };

  // ...
}
```

## 注意事项

1. **认证要求**：评分功能需要用户登录，未登录用户只能查看评分
2. **评分精度**：所有评分值必须是 0.5 的倍数（0, 0.5, 1.0, ..., 5.0）
3. **评分更新**：用户可以修改自己的评分，系统会自动更新（使用 upsert）
4. **聚合计算**：聚合评分是所有用户评分的平均值，四舍五入到 0.5 精度
5. **评论长度**：评论最多 500 字符

## 样式定制

所有组件都支持通过 `className` prop 进行样式定制：

```tsx
<RatingDisplay
  className="my-custom-class"
  // ...
/>
```

使用 Tailwind CSS 工具类进行样式调整。
