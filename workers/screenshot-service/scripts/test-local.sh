#!/bin/bash

# 本地测试脚本
# 用于测试 Worker 的基本功能

set -e

echo "🧪 开始本地测试..."

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo "❌ 错误: wrangler CLI 未安装"
    exit 1
fi

# TypeScript 编译检查
echo "🔍 检查 TypeScript 编译..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo "❌ TypeScript 编译失败"
    exit 1
fi

echo "✅ TypeScript 编译通过"

# 启动开发服务器 (后台运行)
echo "🚀 启动开发服务器..."
wrangler dev --remote --port 8787 &
DEV_PID=$!

# 等待服务器启动
sleep 5

# 测试健康检查
echo "🏥 测试健康检查..."
HEALTH_RESPONSE=$(curl -s http://localhost:8787/health || echo "FAILED")

if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败: $HEALTH_RESPONSE"
fi

# 测试 404 处理
echo "🔍 测试 404 处理..."
NOT_FOUND_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8787/nonexistent)

if [[ $NOT_FOUND_RESPONSE == *"404"* ]]; then
    echo "✅ 404 处理正确"
else
    echo "❌ 404 处理异常: $NOT_FOUND_RESPONSE"
fi

# 清理
echo "🧹 清理进程..."
kill $DEV_PID 2>/dev/null || true

echo "✅ 本地测试完成"