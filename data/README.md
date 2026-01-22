# 预置数据

这个目录包含了设计百宝箱应用的预置数据文件。

## 文件结构

```
data/
├── categories.json           # 8个资源分类
├── resources.json            # 32个精选资源
├── README.md                 # 本文档
└── __tests__/
    └── data-validation.test.ts  # 数据验证测试
```

## 数据文件

### categories.json

包含 8 个资源分类：

| ID          | 名称     | 图标       | 颜色    |
| ----------- | -------- | ---------- | ------- |
| color       | 配色工具 | Palette    | #E94560 |
| css         | CSS模板  | Code       | #00D9FF |
| font        | 字体资源 | Type       | #F8B500 |
| icon        | 图标库   | Shapes     | #7B68EE |
| inspiration | 设计灵感 | Sparkles   | #FF6B6B |
| website     | 网站案例 | Globe      | #4ECDC4 |
| ui-kit      | UI组件   | Layout     | #95E1D3 |
| mockup      | 样机素材 | Smartphone | #DDA0DD |

### resources.json

包含 32 个精选设计资源，覆盖所有分类：

**配色工具 (4个)**

- Coolors - 快速配色生成器 ⭐
- Adobe Color - Adobe 官方配色工具 ⭐
- Color Hunt - 配色方案分享平台
- Gradient Hunt - 渐变色方案平台

**CSS模板 (4个)**

- Tailwind CSS - 实用优先的 CSS 框架 ⭐
- Animate.css - CSS 动画库
- Uiverse - 开源 UI 元素库 ⭐
- CSS-Tricks - CSS 技巧和教程网站

**字体资源 (4个)**

- Google Fonts - Google 免费字体库 ⭐
- Font Pair - 字体配对灵感
- Font Squirrel - 免费商用字体
- Fontjoy - AI 字体配对工具

**图标库 (4个)**

- Lucide Icons - 简洁美观的图标库 ⭐
- Heroicons - Tailwind 官方图标库 ⭐
- Iconify - 统一的图标框架
- Flaticon - 全球最大免费图标库

**设计灵感 (4个)**

- Dribbble - 顶尖设计师作品平台 ⭐
- Behance - Adobe 创意作品平台 ⭐
- Pinterest - 视觉灵感搜索引擎
- Mobbin - 移动应用设计参考库 ⭐

**网站案例 (4个)**

- Awwwards - 全球最佳网站设计奖项 ⭐
- SiteInspire - 精选网站设计案例
- Land-book - 落地页设计灵感库
- Screenlane - UI 设计灵感库

**UI组件 (4个)**

- shadcn/ui - 可复制的精美组件库 ⭐
- Chakra UI - 简单模块化的 React 组件库 ⭐
- daisyUI - Tailwind CSS 组件库
- Ant Design - 蚂蚁集团企业级 UI
- Material-UI - Material Design React 实现

**样机素材 (4个)**

- Mockuphone - 免费在线设备样机生成器
- Smartmockups - 专业样机生成工具 ⭐
- Mockup World - 免费样机资源下载站

⭐ = 精选资源 (isFeatured: true)

## 数据统计

- **总分类数**: 8 个
- **总资源数**: 32 个
- **精选资源数**: 13 个
- **平均评分**: 4.4 / 5.0
- **完全免费资源**: 28 个 (freeLevel = 5.0)

## 数据质量保证

所有数据都经过严格验证：

✅ **Schema 验证**

- 所有分类符合 CategorySchema
- 所有资源符合 ResourceSchema
- 评分范围 0-5，精度 0.5
- URL 格式正确
- 日期格式为 ISO 8601

✅ **完整性检查**

- 每个分类至少有一个资源
- 所有资源都有有效的分类 ID
- 所有资源至少有一个标签
- 所有 ID 唯一

✅ **质量标准**

- 精选资源评分 ≥ 4.0
- 所有资源包含完整的评分维度
- 所有资源有策展人推荐语

## 使用方法

### 在代码中导入

```typescript
import categoriesData from '@/data/categories.json';
import resourcesData from '@/data/resources.json';
import { CategorySchema, ResourceSchema } from '@/types';

// 验证数据
const categories = categoriesData.map((c) => CategorySchema.parse(c));
const resources = resourcesData.map((r) => ResourceSchema.parse(r));
```

### 按分类筛选资源

```typescript
const colorResources = resourcesData.filter((r) => r.categoryId === 'color');
```

### 获取精选资源

```typescript
const featuredResources = resourcesData.filter((r) => r.isFeatured);
```

### 按评分排序

```typescript
const topRated = [...resourcesData].sort((a, b) => b.rating.overall - a.rating.overall);
```

## 数据更新

如需添加新资源或分类：

1. 编辑 `categories.json` 或 `resources.json`
2. 确保数据符合 schema 定义
3. 运行测试验证：`pnpm test data/`
4. 所有测试通过后提交

## 测试

运行数据验证测试：

```bash
pnpm test data/__tests__/data-validation.test.ts
```

测试覆盖：

- ✅ 分类数量和格式
- ✅ 资源数量和格式
- ✅ ID 唯一性
- ✅ 分类覆盖完整性
- ✅ 评分范围和精度
- ✅ URL 有效性
- ✅ 日期格式
- ✅ 数据完整性
