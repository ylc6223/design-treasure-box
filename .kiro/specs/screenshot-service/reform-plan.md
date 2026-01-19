# Screenshot Service Best Practice Reform Plan (截图服务最佳实践改造方案)

## 1. 背景与现状 (Context)
当前截图服务已在 `dev` 分支完成基础实现，但存在以下架构设计与用户体验方面的缺陷：
- **架构耦合**：Worker 直接读写数据库，缺乏业务层隔离。
- **文档冲突**：`requirements.md` 与 `design.md` 在 API 端点描述上不一致。
- **可观测性缺失**：Admin 后台无法直观查看截图状态，缺乏手动干预手段。
- **API 冗余/缺失**：现有的 `need-screenshot` 接口未实现过滤逻辑，单条更新接口未被有效集成。

## 2. 改造目标 (Goals)
- **工程品味提升**：实现控制面 (Next.js) 与执行面 (Worker) 的清晰解耦。
- **管理闭环**：在 Admin UI 提供完整的截图生命周期管理（查看、触发、修复）。
- **标准统一**：消除文档冲突，确立 Single Source of Truth。

## 3. 详细方案 (Detailed Plan)

### 3.1 架构层：控制面解耦 (Control Plane Decoupling)
将“哪些资源需要截图”的业务逻辑从 Worker 迁移回 Next.js。
- **API 改造**：
    - `GET /api/admin/resources/screenshot/needed`:
        - **逻辑**：查询 `screenshot_url IS NULL` OR `screenshot_updated_at < NOW() - 7 days`。
        - **返回**：仅返回 Worker 需要的最小字段（id, url）。
    - `PATCH /api/admin/resources/screenshot/[id]`:
        - **职责**：接收 Worker 或 UI 传回的截图 URL 和更新时间。

### 3.2 管理面：Admin UI 增强 (UI Observability)
在现有 `ResourceTable` 中增加管理维度。
- **字段展示**：增加“截图状态”列。
    - 🟢 `已生成` (显示更新时间)
    - 🟡 `待生成` (无 URL)
    - 🔴 `生成失败` (显示最近一次错误信息)
- **交互功能**：
    - **单条重截**：在操作栏增加“捕获截图”图标，点击后调用 Worker 的触发端点。
    - **批量管理**：仪表板增加一个“截图服务概览”卡片，显示当前总截图率和失败率。

### 3.3 文档层：标准一致性 (Documentation)
- **统一路由命名**：废弃 `api/resources/all`，统一使用 `api/admin/resources/screenshot/...`。
- **更新 Tasks**：将 UI 增强任务补充进 `tasks.md`，并标记为必须项而非可选。

## 4. 实施路径 (Implementation Path)

### 第一阶段：API 标准化 (API Consolidation)
1.  **修复** `app/api/admin/resources/need-screenshot/route.ts`：
    - 实现基于 7 天有效期的增量过滤逻辑。
    - 增加根据 ID 触发特定截图的逻辑支持。
2.  **增强** `app/api/resources/[id]/screenshot/route.ts`：
    - 确保支持更新 `screenshot_error` 字段，用于在预览界面显示具体失败原因。

### 第二阶段：UI 观测集成 (UI Integration)
1.  **修改** `components/admin/resource-table.tsx`：
    - 定义 `getScreenshotStatus` 辅助函数。
    - 渲染状态 Badge。
    - 集成 `RecaptureButton` 组件，调用 Worker API。
2.  **完善** `app/admin/page.tsx`：
    - 统计 `screenshot_error` 不为空的数量作为“需关注项”。

### 第三阶段：Worker 适配 (Worker Sync)
1.  **切换任务源**：让 Worker 从 `dev` 分支的 SDK 直接查询改为请求 `.../screenshot/needed` 端点。
2.  **统一错误汇报**：Worker 捕捉到 Puppeteer 错误后，显式回传错误字符串。

## 5. 技术细节核对清单 (Technical Checklist)

### 5.1 数据与类型定义
- [ ] **补齐 Resource 类型**：在 `types/resource.ts` 的 `ResourceResponse` 接口中添加 `screenshot_url`, `screenshot_updated_at`, `screenshot_error` 字段。
- [ ] **数据库一致性**：验证 Supabase 中的字段与代码定义完全匹配。

### 5.2 API 路由重构
- [ ] **统一命名空间**：将 API 统一搬迁至 `/api/admin/resources/screenshot/` 路径下。
- [ ] **逻辑升级**：`needed` 端点需实现 `screenshot_url IS NULL` 或 `> 7天` 的过滤逻辑。
- [ ] **错误上报支持**：`PATCH` 接口需支持 `screenshot_error` 的写入。

### 5.3 Worker 环境变量
- [ ] **安全加固**：在 Worker 中移除 Supabase SDK 相关密钥。
- [ ] **访问配置**：新增 `NEXTJS_API_URL` 和 `ADMIN_API_KEY`（对应 Next.js 端环境变量）。

### 5.4 UI 交互细节
- [ ] **状态渲染**：使用徽章 (Badge) 展示截图状态（🔴失败 / 🟡待定 / 🟢成功）。
- [ ] **手动捕获**：前端集成调用 Worker `/trigger` 的逻辑，支持带参数 ID 触发特定截图。

## 6. 分阶段实施计划 (Implementation Roadmap)

### 第一阶段：基石建设 (Backend Foundation)
- 修改 `types/resource.ts`。
- 创建并完善 `/api/admin/resources/screenshot/` 系列端点。
- 在 Next.js 项目中配置好 `DATABASE_API_KEY` 环境变量。

### 第二阶段：管理后台 UI (Admin UI Integration)
- 修改 `components/admin/resource-table.tsx` 展示截图状态。
- 添加手动触发按钮及其配套的 API 调用逻辑。
- 在 Admin Dashboard 增加异常截图统计。

### 第三阶段：Worker 逻辑同步 (Worker Migration)
- 修改 Worker 的 `Env` 接口定义。
- 将 `scheduled` 处理器中的数据获取逻辑从 SDK 切换到 API。
- 将截图结果（成功/失败）通过 API 回传给 Next.js 存储。

## 7. 评价指标 (Definition of Done)
- [ ] 管理后台能一眼看出哪个资源的截图是过时的或失败的。
- [ ] 管理员可以针对特定失败的资源点击按钮重新截图。
- [ ] Worker 只保留执行和上传逻辑，不包含“该谁截”的业务判断。
- [ ] `.kiro/specs/` 下的文档互相印证，无矛盾描述。
