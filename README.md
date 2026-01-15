# 设计百宝箱 (Design Treasure Box)

精选设计资源聚合入口，为设计师和开发者提供高质量的设计美学参考。

## 技术栈

- **Next.js 16** - React 框架，App Router
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 原子化 CSS
- **shadcn/ui** - UI 组件库
- **TanStack Query** - 数据获取与缓存
- **React Hook Form** - 表单处理
- **Zod** - 数据验证
- **Lucide React** - 图标库
- **next-themes** - 深色/浅色主题切换
- **Vitest** - 单元测试
- **fast-check** - 属性测试

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 运行测试 UI
npm run test:ui

# 生成测试覆盖率报告
npm run test:coverage
```

## 项目结构

```
design-treasure-box/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   └── ...               # 自定义组件
├── lib/                   # 工具函数
│   └── utils.ts          # cn() 等工具
├── hooks/                 # 自定义 Hooks
├── types/                 # TypeScript 类型定义
├── data/                  # 预置数据
│   ├── categories.json   # 分类数据
│   └── resources.json    # 资源数据
├── tests/                 # 测试文件
│   └── setup.ts          # 测试配置
└── public/               # 静态资源
```

## 功能特性

- ✅ 资源分类浏览
- ✅ 专业评分展示
- ✅ 资源搜索与筛选
- ✅ 个人收藏功能
- ✅ 资源推荐展示
- ✅ 资源详情页
- ✅ 响应式设计
- ✅ 深色/浅色主题切换

## 开发规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS
- 图标使用 Lucide React (禁止使用 emoji)
- 测试覆盖核心功能

## License

MIT
