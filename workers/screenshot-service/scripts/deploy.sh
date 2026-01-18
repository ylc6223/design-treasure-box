#!/bin/bash

# 设计百宝箱截图服务部署脚本
# 分批处理架构：每5分钟处理5个资源

set -e

echo "🚀 开始部署截图服务..."

# 检查必需的工具
if ! command -v wrangler &> /dev/null; then
    echo "❌ 错误: wrangler CLI 未安装"
    echo "请运行: npm install -g wrangler"
    exit 1
fi

# 检查登录状态
if ! wrangler whoami &> /dev/null; then
    echo "❌ 错误: 未登录 Cloudflare"
    echo "请运行: wrangler login"
    exit 1
fi

# 构建检查
echo "🔍 检查 TypeScript 编译..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo "❌ TypeScript 编译失败"
    exit 1
fi

# 设置密钥 (如果未设置)
echo "🔑 检查环境变量..."
if ! wrangler secret list --env production | grep -q "SUPABASE_SECRET_KEY"; then
    echo "⚠️  SUPABASE_SECRET_KEY 未设置"
    echo "请运行: wrangler secret put SUPABASE_SECRET_KEY --env production"
    echo "然后重新运行此脚本"
    exit 1
fi

# 部署到生产环境
echo "📦 部署到生产环境..."
wrangler deploy --env production

if [ $? -eq 0 ]; then
    echo "✅ 部署成功!"
    echo ""
    echo "📋 部署信息:"
    echo "  - Worker 名称: design-treasure-screenshot"
    echo "  - 环境: production"
    echo "  - 定时任务: 每5分钟执行一次"
    echo "  - 批处理大小: 5个资源/批次"
    echo ""
    echo "🔧 后续步骤:"
    echo "  1. 在 Cloudflare 控制台验证 R2 存储桶配置"
    echo "  2. 确认 Browser API 已启用"
    echo "  3. 更新 wrangler.jsonc 中的 SUPABASE_URL 和 R2_PUBLIC_URL"
    echo "  4. 测试手动触发: curl -X POST https://your-worker.workers.dev/trigger"
    echo ""
    echo "📊 预期处理时间:"
    echo "  - 32个资源 ÷ 5个/批次 = 约7批次"
    echo "  - 总时间: 约35分钟 (5分钟间隔)"
else
    echo "❌ 部署失败"
    exit 1
fi