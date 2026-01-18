#!/bin/bash

# 快速测试脚本
# 用于验证截图服务的基本功能

set -e

echo "🧪 开始快速测试截图服务..."

# 检查当前目录
if [ ! -f "wrangler.jsonc" ]; then
    echo "❌ 错误: 请在 workers/screenshot-service 目录下运行此脚本"
    exit 1
fi

# 1. TypeScript 编译检查
echo "🔍 检查 TypeScript 编译..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript 编译通过"
else
    echo "❌ TypeScript 编译失败"
    exit 1
fi

# 2. 检查依赖
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  依赖未安装，正在安装..."
    npm install
fi

# 3. 检查配置文件
echo "⚙️  检查配置..."
if ! grep -q "SUPABASE_URL" wrangler.jsonc; then
    echo "⚠️  警告: wrangler.jsonc 中未配置 SUPABASE_URL"
fi

if ! grep -q "R2_PUBLIC_URL" wrangler.jsonc; then
    echo "⚠️  警告: wrangler.jsonc 中未配置 R2_PUBLIC_URL"
fi

# 4. 检查密钥（生产环境）
echo "🔑 检查密钥配置..."
if wrangler secret list --env production 2>/dev/null | grep -q "SUPABASE_SECRET_KEY"; then
    echo "✅ SUPABASE_SECRET_KEY 已配置"
else
    echo "⚠️  警告: SUPABASE_SECRET_KEY 未配置"
    echo "请运行: wrangler secret put SUPABASE_SECRET_KEY --env production"
fi

# 5. 启动本地测试（可选）
read -p "🚀 是否启动本地测试服务器？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 启动本地开发服务器..."
    echo "请在另一个终端运行以下命令测试："
    echo ""
    echo "# 健康检查"
    echo "curl http://localhost:8787/health"
    echo ""
    echo "# 手动触发"
    echo "curl -X POST http://localhost:8787/trigger"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    
    wrangler dev --port 8787
else
    echo "⏭️  跳过本地测试"
fi

echo ""
echo "📋 测试完成！"
echo ""
echo "🔧 下一步操作："
echo "1. 确保 Supabase 数据库包含截图字段"
echo "2. 配置 wrangler.jsonc 中的环境变量"
echo "3. 设置 SUPABASE_SECRET_KEY 密钥"
echo "4. 运行 ./scripts/deploy.sh 部署到生产环境"
echo ""
echo "📖 详细测试指南请查看: TESTING_GUIDE.md"