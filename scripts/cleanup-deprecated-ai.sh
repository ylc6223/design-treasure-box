#!/bin/bash

# AI 聊天功能重做 - 清理过时代码
# 移除不再使用的旧架构文件

echo "🧹 开始清理过时的 AI 代码..."

# 1. 备份旧文件到 .deprecated 目录
mkdir -p lib/ai/.deprecated
echo "📦 备份旧文件..."

mv lib/ai/guided-questioning.ts lib/ai/.deprecated/ 2>/dev/null && echo "  ✓ guided-questioning.ts"
mv lib/ai/hybrid-search.ts lib/ai/.deprecated/ 2>/dev/null && echo "  ✓ hybrid-search.ts"
mv lib/ai/rag-engine.ts lib/ai/.deprecated/ 2>/dev/null && echo "  ✓ rag-engine.ts"

# 2. 移除相关测试文件
mv lib/ai/__tests__/guided-questioning.test.ts lib/ai/.deprecated/ 2>/dev/null && echo "  ✓ guided-questioning.test.ts"
mv lib/ai/__tests__/rag-engine.test.ts lib/ai/.deprecated/ 2>/dev/null && echo "  ✓ rag-engine.test.ts"

echo ""
echo "✅ 清理完成！"
echo ""
echo "📋 已移除的文件："
echo "  - lib/ai/guided-questioning.ts (被 clarification-generator.ts 替代)"
echo "  - lib/ai/hybrid-search.ts (被 enhanced-search.ts 替代)"
echo "  - lib/ai/rag-engine.ts (被 enhanced-search.ts 替代)"
echo ""
echo "⚠️  注意：需要更新以下文件的导入："
echo "  - app/api/chat/route.ts"
echo "  - lib/ai/index.ts"
echo ""
echo "💾 备份位置: lib/ai/.deprecated/"
