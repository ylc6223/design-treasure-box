# Implementation Plan: Screenshot Service

## Overview

本实施计划将基于 Cloudflare Workers 构建一个自动化截图服务系统。系统通过定时任务每周更新资源截图，采用增量更新机制提高效率，并通过 CDN 提供高性能的图片访问服务。

## Tasks

- [x] 1. 设置 Cloudflare Workers 项目结构和核心接口
  - 配置 TypeScript 环境和依赖
  - 定义核心接口和类型定义
  - 设置测试框架 (Vitest + fast-check)
  - _Requirements: 1.1, 8.1_

- [x] 2. 实现资源管理和数据库集成
  - [x] 2.1 实现资源列表获取功能
    - 创建 fetchAllResources 函数
    - 实现 API 认证和错误处理
    - _Requirements: 1.1, 5.5, 8.1_

  - [ ]* 2.2 编写资源获取的属性测试
    - **Property 1: Resource List Retrieval Completeness**
    - **Validates: Requirements 1.1**

  - [x] 2.3 实现增量更新过滤逻辑
    - 创建时间比较和过滤函数
    - 处理空时间戳的情况
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 2.4 编写增量更新的属性测试
    - **Property 12: Incremental Update Time Comparison**
    - **Property 13: Null Timestamp Handling**
    - **Property 14: Filtered Resource List Accuracy**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 3. 实现浏览器自动化和截图生成
  - [x] 3.1 实现浏览器配置和页面设置
    - 配置 Puppeteer 浏览器实例
    - 设置视口、用户代理和请求拦截
    - _Requirements: 1.2, 7.3, 7.5_

  - [ ]* 3.2 编写浏览器配置的属性测试
    - **Property 26: User Agent Configuration**
    - **Property 24: Page Stabilization Wait Strategy**
    - **Validates: Requirements 7.5, 7.3**

  - [x] 3.3 实现截图生成核心逻辑
    - 创建网页导航和截图捕获功能
    - 实现页面元素隐藏和优化
    - _Requirements: 1.2, 1.3, 7.4_

  - [ ]* 3.4 编写截图生成的属性测试
    - **Property 2: Screenshot Dimension Consistency**
    - **Property 11: Image Format and Quality Compliance**
    - **Property 25: DOM Element Hiding**
    - **Validates: Requirements 1.2, 3.5, 7.4**

- [ ] 4. 实现文件存储和 CDN 服务
  - [ ] 4.1 实现 R2 存储上传功能
    - 创建文件上传和元数据设置
    - 实现文件命名和覆盖逻辑
    - _Requirements: 1.4, 3.1, 3.2, 3.3_

  - [ ]* 4.2 编写存储功能的属性测试
    - **Property 3: File Upload and Storage Integrity**
    - **Property 7: File Naming Convention Compliance**
    - **Property 8: File Overwrite Behavior**
    - **Property 9: Metadata Completeness**
    - **Validates: Requirements 1.4, 3.1, 3.2, 3.3**

  - [ ] 4.3 实现 CDN 图片访问服务
    - 创建图片请求处理器
    - 实现缓存控制和 HTTP 头设置
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.4 编写 CDN 服务的属性测试
    - **Property 15: CDN Image Access Functionality**
    - **Property 16: HTTP Caching Support**
    - **Property 17: Missing Image Error Handling**
    - **Property 10: Cache Control Header Correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 3.4**

- [ ] 5. 检查点 - 确保核心功能测试通过
  - 确保所有测试通过，如有问题请询问用户

- [ ] 6. 实现批量处理和定时任务
  - [ ] 6.1 实现批量处理控制逻辑
    - 创建并发控制和批次间隔机制
    - 实现处理结果统计和日志记录
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [ ]* 6.2 编写批量处理的属性测试
    - **Property 5: Batch Processing Concurrency Control**
    - **Property 6: Batch Interval Timing**
    - **Property 30: Processing Statistics Logging**
    - **Validates: Requirements 2.3, 2.4, 9.2, 9.4**

  - [ ] 6.3 实现定时任务调度器
    - 创建 scheduled 事件处理器
    - 集成所有处理步骤
    - _Requirements: 2.1, 2.2_

  - [ ]* 6.4 编写定时任务的单元测试
    - 测试任务调度和执行流程
    - 验证错误处理和恢复机制
    - _Requirements: 2.1, 2.2_

- [ ] 7. 实现数据库更新和同步
  - [ ] 7.1 实现数据库更新功能
    - 创建截图 URL 和时间戳更新
    - 实现原子性更新和错误处理
    - _Requirements: 1.5, 5.1, 5.2, 5.3_

  - [ ]* 7.2 编写数据库更新的属性测试
    - **Property 4: Database Update Consistency**
    - **Property 18: Database Field Update Atomicity**
    - **Property 19: API Authentication Enforcement**
    - **Validates: Requirements 1.5, 5.1, 5.2, 5.3**

- [ ] 8. 实现错误处理和容错机制
  - [ ] 8.1 实现错误分类和处理策略
    - 创建不同类型错误的处理器
    - 实现重试逻辑和错误隔离
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 8.2 编写错误处理的属性测试
    - **Property 20: Error Isolation in Batch Processing**
    - **Property 21: Timeout Enforcement**
    - **Property 22: Database Retry Logic**
    - **Property 23: Storage Upload Error Handling**
    - **Validates: Requirements 5.4, 6.1, 6.2, 6.3, 6.4**

- [ ] 9. 实现 API 安全性和健康检查
  - [ ] 9.1 实现 API 认证和授权
    - 创建 Bearer token 验证
    - 实现访问控制和错误响应
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ]* 9.2 编写 API 安全的属性测试
    - **Property 27: API Token Validation**
    - **Property 28: Environment Variable Usage**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ] 9.3 实现健康检查端点
    - 创建 /health 端点
    - 实现状态监控和日志记录
    - _Requirements: 9.1, 9.3, 9.5_

  - [ ]* 9.4 编写健康检查的属性测试
    - **Property 29: Health Check Response Format**
    - **Validates: Requirements 9.1**

- [ ] 10. 配置部署和环境设置
  - [ ] 10.1 配置 Cloudflare Workers 部署
    - 设置 wrangler.jsonc 配置文件
    - 配置 R2 存储桶和 Browser API
    - 设置定时任务触发器
    - _Requirements: 2.1, 8.4_

  - [ ] 10.2 配置环境变量和密钥
    - 设置数据库连接和 API 密钥
    - 配置 CDN 域名和缓存策略
    - _Requirements: 8.3, 8.4_

  - [ ]* 10.3 编写部署配置的单元测试
    - 验证配置文件的正确性
    - 测试环境变量的加载
    - _Requirements: 8.4_

- [ ] 11. 集成测试和端到端验证
  - [ ] 11.1 实现完整流程的集成测试
    - 测试从资源获取到截图生成的完整流程
    - 验证数据库更新和文件存储的一致性
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [ ]* 11.2 编写端到端的属性测试
    - 测试完整的截图生成和存储流程
    - 验证系统在各种输入下的正确性
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ] 12. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 标记为 `*` 的任务是可选的，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求以确保可追溯性
- 检查点确保增量验证和质量控制
- 属性测试验证通用的正确性属性
- 单元测试验证具体的示例和边界情况