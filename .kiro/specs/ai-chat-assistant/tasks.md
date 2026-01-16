# Implementation Plan: AI聊天助手

## Overview

本实现计划将AI聊天助手功能分解为一系列增量开发任务，使用TypeScript、Next.js 16、prompt-kit和Vercel AI SDK v6构建。实现将采用模块化架构，支持智谱大模型集成，并预留其他AI提供者的扩展接口。

## Tasks

- [x] 1. 项目依赖和基础配置
  - 安装Vercel AI SDK v6、prompt-kit等必要依赖
  - 配置环境变量和TypeScript类型定义
  - 设置AI提供者的基础配置结构
  - _Requirements: 9.1, 9.2_

- [x] 2. AI提供者接口和智谱AI集成
  - [x] 2.1 实现AIProvider抽象接口
    - 定义AIProvider、AICapabilities等核心接口
    - 创建AI提供者工厂模式
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 编写AI提供者接口的属性测试
    - **Property 1: AI提供者接口一致性**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 2.3 实现ZhipuAIProvider类
    - 集成zhipu-ai-provider和Vercel AI SDK
    - 实现聊天完成、流式响应和嵌入生成
    - _Requirements: 2.1, 2.4, 5.1_

  - [x] 2.4 编写智谱AI提供者的单元测试
    - 测试聊天完成和流式响应功能
    - 测试错误处理和重试机制
    - _Requirements: 2.1, 9.2, 9.4_

- [x] 3. 配置管理和环境设置
  - [x] 3.1 实现AIConfigManager配置管理器
    - 环境变量加载和验证
    - 运行时配置管理
    - _Requirements: 9.1, 9.2_

  - [x] 3.2 创建AI服务管理器
    - 提供者切换和故障转移逻辑
    - 连接池和缓存管理
    - _Requirements: 9.1, 9.3_

  - [x] 3.3 编写配置管理的单元测试
    - 测试配置加载和验证逻辑
    - 测试提供者切换功能
    - _Requirements: 9.2, 9.3_

- [x] 4. Checkpoint - 验证AI集成基础
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. RAG检索增强生成引擎
  - [x] 5.1 实现向量搜索功能
    - 基于现有资源数据创建向量索引
    - 实现语义相似度搜索
    - _Requirements: 2.1, 2.4_

  - [x] 5.2 编写向量搜索的属性测试
    - **Property 3: 混合搜索集成**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 5.3 实现混合搜索引擎
    - 结合向量搜索和结构化过滤
    - 实现搜索结果排序和合并逻辑
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 5.4 实现VercelAIRAGEngine类
    - 集成Vercel AI SDK进行响应生成
    - 实现流式响应和上下文构建
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 5.5 编写RAG引擎的属性测试
    - **Property 6: 推荐质量和解释**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 6. 引导式提问系统
  - [x] 6.1 实现GuidedQuestioningEngine
    - 查询清晰度分析
    - 澄清问题生成逻辑
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.2 编写引导式提问的属性测试
    - **Property 4: 模糊查询的引导式提问**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [x] 6.3 集成引导式提问到RAG引擎
    - 在RAG流程中集成澄清逻辑
    - 实现多轮对话上下文管理
    - _Requirements: 3.5, 5.5_

- [x] 7. Checkpoint - 验证搜索和推荐功能
  - 确保所有测试通过，如有问题请询问用户

- [ ] 8. 基于prompt-kit的聊天界面
  - [x] 8.1 配置prompt-kit基础组件
    - 安装和配置prompt-kit
    - 创建基础聊天界面结构
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 8.2 实现自定义消息渲染器
    - ResourceMessage组件用于显示资源推荐
    - ClarificationMessage组件用于澄清问题
    - _Requirements: 4.1, 4.2, 3.2_

  - [x] 8.3 编写聊天界面的属性测试
    - **Property 1: 聊天界面触发和显示**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 8.4 实现视觉预览组件
    - ResourcePreviewCard组件
    - 图片加载和错误处理
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 8.5 编写视觉预览的属性测试
    - **Property 5: 视觉预览完整性**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 9. 响应式设计和动画
  - [x] 9.1 实现响应式布局
    - 桌面、平板、移动设备的布局适配
    - 使用Tailwind CSS实现响应式设计
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 9.2 添加motion/react动画效果
    - 聊天界面滑入/滑出动画
    - 消息加载和过渡动画
    - _Requirements: 1.1, 1.4_

  - [ ] 9.3 编写响应式设计的属性测试
    - **Property 8: 响应式布局适配**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ] 10. 会话状态管理
  - [ ] 10.1 实现ChatSession数据模型
    - 会话数据结构和类型定义
    - 消息历史管理
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ] 10.2 实现本地存储持久化
    - localStorage集成
    - 会话数据序列化和反序列化
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 10.3 编写会话管理的属性测试
    - **Property 2: 会话状态持久化**
    - **Validates: Requirements 1.4, 1.5, 7.1, 7.2, 7.3, 7.4**

- [ ] 11. 资源操作和交互
  - [ ] 11.1 实现资源卡片交互功能
    - 点击查看详情、收藏、访问功能
    - 与现有收藏系统集成
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 11.2 编写资源交互的属性测试
    - **Property 7: 资源交互功能**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ] 11.3 实现扩展搜索功能
    - "更多同类资源"功能
    - 详细使用建议生成
    - _Requirements: 6.4, 6.5_

- [ ] 12. 错误处理和性能优化
  - [ ] 12.1 实现全面的错误处理
    - AI服务错误处理
    - 网络连接错误处理
    - 数据加载错误处理
    - _Requirements: 9.2, 9.3, 9.4_

  - [ ] 12.2 编写错误处理的属性测试
    - **Property 9: 性能和错误恢复**
    - **Validates: Requirements 9.1, 9.2, 9.4**

  - [ ] 12.3 性能优化和缓存
    - 响应时间优化
    - 请求缓存和重试机制
    - _Requirements: 9.1, 9.3_

- [ ] 13. 集成测试和端到端测试
  - [ ] 13.1 实现端到端用户流程测试
    - 从查询输入到资源推荐的完整流程
    - 多轮对话测试
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

  - [ ] 13.2 编写集成测试
    - 组件间通信测试
    - AI服务集成测试
    - _Requirements: 所有需求_

- [x] 14. 最终集成和优化
  - [x] 14.1 将聊天助手集成到主应用
    - 修改现有AI输入框以触发聊天界面
    - 确保与现有功能的兼容性
    - _Requirements: 1.1, 1.2_
    - **完成时间**: 2026-01-16
    - **实现内容**:
      - 将AI输入框和聊天界面的状态管理从HomePage移到LayoutWrapper组件
      - 修复了两个AI输入框导致的状态不同步问题
      - 实现handleAIPromptSubmit和handleChatClose事件处理
      - 清理Turbopack缓存解决编译错误
      - 验证聊天界面可以正常打开和显示用户消息
      - 创建集成测试验证完整流程（6个测试全部通过）
    - **Bug修复**:
      - 问题：LayoutWrapper和HomePage都渲染了AIPromptInput，导致状态不同步
      - 解决：将状态管理统一到LayoutWrapper，从HomePage移除AI组件
      - 验证：使用Chrome DevTools确认聊天界面正常显示和交互

  - [ ] 14.2 最终测试和调优
    - 性能测试和优化
    - 用户体验调优
    - _Requirements: 9.1, 8.1, 8.2, 8.3_

- [ ] 15. Final Checkpoint - 确保所有功能正常工作
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 所有任务都是必需的，确保从开始就有全面的测试覆盖
- 每个任务都引用了具体的需求以确保可追溯性
- Checkpoint任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况