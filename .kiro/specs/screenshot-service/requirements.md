# Requirements Document

## Introduction

设计百宝箱截图服务是一个基于 Cloudflare Workers 的自动化截图系统，用于为设计资源网站生成和管理截图。该系统通过定时任务自动更新所有资源的截图，并通过 CDN 提供高性能的图片访问服务。

## Glossary

- **Screenshot_Service**: 基于 Cloudflare Workers 的截图生成服务
- **Resource**: 设计百宝箱中收录的设计资源网站或工具
- **R2_Storage**: Cloudflare R2 对象存储服务，用于存储截图文件
- **CDN**: Cloudflare 内容分发网络，用于缓存和分发截图
- **Supabase_Database**: 项目使用的 PostgreSQL 数据库
- **Cron_Job**: 定时执行的批量截图任务
- **Puppeteer**: 无头浏览器自动化工具，用于生成网页截图

## Requirements

### Requirement 1: 自动化截图生成

**User Story:** 作为系统管理员，我希望系统能够自动为所有资源生成截图，这样用户就能看到资源网站的视觉预览。

#### Acceptance Criteria

1. WHEN 定时任务触发时，THE Screenshot_Service SHALL 获取所有资源的URL列表
2. WHEN 处理每个资源URL时，THE Screenshot_Service SHALL 使用Puppeteer生成1200x800像素的截图
3. WHEN 生成截图时，THE Screenshot_Service SHALL 阻止字体、媒体文件和广告的加载以提高性能
4. WHEN 截图生成完成时，THE Screenshot_Service SHALL 将图片上传到R2_Storage
5. WHEN 上传成功时，THE Screenshot_Service SHALL 更新Supabase_Database中的截图URL和更新时间

### Requirement 2: 定时任务调度

**User Story:** 作为系统管理员，我希望截图能够定期自动更新，这样用户看到的预览图始终是最新的。

#### Acceptance Criteria

1. THE Cron_Job SHALL 每7天执行一次截图更新任务
2. WHEN Cron_Job执行时，THE Screenshot_Service SHALL 处理所有资源而不需要人工干预
3. WHEN 批量处理时，THE Screenshot_Service SHALL 限制并发数量为3个以避免系统过载
4. WHEN 处理批次间隔时，THE Screenshot_Service SHALL 等待2秒以控制请求频率
5. WHEN 任务完成时，THE Screenshot_Service SHALL 记录成功和失败的统计信息

### Requirement 3: 文件存储和命名

**User Story:** 作为开发者，我希望截图文件有固定的命名规则，这样可以实现文件覆盖和缓存管理。

#### Acceptance Criteria

1. WHEN 生成截图文件时，THE Screenshot_Service SHALL 使用格式"screenshots/{resource.id}.jpg"命名文件
2. WHEN 上传新截图时，THE Screenshot_Service SHALL 覆盖同名的旧文件
3. WHEN 设置文件元数据时，THE Screenshot_Service SHALL 包含资源ID、名称、目标URL和更新时间
4. WHEN 配置缓存时，THE Screenshot_Service SHALL 设置7天的HTTP缓存控制头
5. THE Screenshot_Service SHALL 使用JPEG格式，质量设置为85%

### Requirement 10: 增量更新机制

**User Story:** 作为系统管理员，我希望截图服务能够智能地只更新需要更新的资源，避免不必要的重复工作。

#### Acceptance Criteria

1. WHEN 检查资源时，THE Screenshot_Service SHALL 比较当前时间与screenshot_updated_at字段
2. WHEN 截图更新时间超过7天时，THE Screenshot_Service SHALL 将该资源标记为需要更新
3. WHEN 截图更新时间少于7天时，THE Screenshot_Service SHALL 跳过该资源的截图生成
4. WHEN 资源没有screenshot_updated_at时间戳时，THE Screenshot_Service SHALL 将其视为需要首次生成截图
5. WHEN 增量检查完成时，THE Screenshot_Service SHALL 只处理需要更新的资源列表

### Requirement 4: CDN图片访问服务

**User Story:** 作为用户，我希望能够快速加载资源截图，这样可以提升浏览体验。

#### Acceptance Criteria

1. WHEN 用户请求截图时，THE Screenshot_Service SHALL 通过CDN URL提供图片访问
2. WHEN 处理图片请求时，THE Screenshot_Service SHALL 返回正确的Content-Type为image/jpeg
3. WHEN 客户端发送If-None-Match头时，THE Screenshot_Service SHALL 支持304缓存响应
4. WHEN 图片不存在时，THE Screenshot_Service SHALL 返回404状态码
5. THE Screenshot_Service SHALL 设置公共缓存控制头以启用CDN缓存

### Requirement 5: 数据库集成

**User Story:** 作为前端应用，我需要获取包含截图URL的资源数据，这样可以直接显示预览图。

#### Acceptance Criteria

1. WHEN 截图生成成功时，THE Screenshot_Service SHALL 更新Supabase_Database中的screenshot_url字段
2. WHEN 更新数据库时，THE Screenshot_Service SHALL 同时更新screenshot_updated_at时间戳
3. WHEN 调用数据库API时，THE Screenshot_Service SHALL 使用Bearer token进行身份验证
4. WHEN 数据库更新失败时，THE Screenshot_Service SHALL 记录错误但不中断其他资源的处理
5. THE Screenshot_Service SHALL 通过/api/resources/all端点获取所有资源列表

### Requirement 6: 错误处理和容错

**User Story:** 作为系统管理员，我希望系统能够优雅地处理各种错误情况，确保服务的稳定性。

#### Acceptance Criteria

1. WHEN 网页加载超时时，THE Screenshot_Service SHALL 在15秒后终止请求并记录错误
2. WHEN 截图生成失败时，THE Screenshot_Service SHALL 继续处理其他资源而不中断整个任务
3. WHEN 数据库连接失败时，THE Screenshot_Service SHALL 重试一次后记录错误
4. WHEN R2存储上传失败时，THE Screenshot_Service SHALL 抛出错误并跳过该资源
5. WHEN 浏览器启动失败时，THE Screenshot_Service SHALL 记录详细错误信息并终止当前资源处理

### Requirement 7: 性能优化

**User Story:** 作为系统管理员，我希望截图服务能够高效运行，最小化资源消耗和成本。

#### Acceptance Criteria

1. WHEN 加载网页时，THE Screenshot_Service SHALL 阻止字体和媒体文件的下载
2. WHEN 处理页面时，THE Screenshot_Service SHALL 阻止Google Analytics和广告脚本的执行
3. WHEN 等待页面稳定时，THE Screenshot_Service SHALL 使用networkidle0策略并等待2秒
4. WHEN 隐藏页面元素时，THE Screenshot_Service SHALL 自动隐藏Cookie横幅和GDPR弹窗
5. WHEN 设置浏览器时，THE Screenshot_Service SHALL 使用标准的Chrome用户代理字符串

### Requirement 8: API安全性

**User Story:** 作为系统管理员，我希望截图服务的API端点是安全的，防止未授权访问。

#### Acceptance Criteria

1. WHEN 接收API请求时，THE Screenshot_Service SHALL 验证Authorization头中的Bearer token
2. WHEN token验证失败时，THE Screenshot_Service SHALL 返回401 Unauthorized状态码
3. WHEN 调用数据库API时，THE Screenshot_Service SHALL 使用环境变量中的DATABASE_API_KEY
4. WHEN 配置环境变量时，THE Screenshot_Service SHALL 将敏感信息存储为Cloudflare secrets
5. THE Screenshot_Service SHALL 只允许来自授权来源的API调用

### Requirement 9: 健康检查和监控

**User Story:** 作为运维人员，我希望能够监控截图服务的运行状态，及时发现和解决问题。

#### Acceptance Criteria

1. THE Screenshot_Service SHALL 提供/health端点返回服务状态和时间戳
2. WHEN 定时任务执行时，THE Screenshot_Service SHALL 记录处理的资源数量和结果统计
3. WHEN 发生错误时，THE Screenshot_Service SHALL 输出详细的错误日志到控制台
4. WHEN 批量任务完成时，THE Screenshot_Service SHALL 记录成功和失败的资源数量
5. THE Screenshot_Service SHALL 为每个处理步骤提供清晰的日志输出