#!/bin/bash

# Week 4 手动测试清单
# 测试 AI 聊天功能的各种场景

API_URL="http://localhost:3000/api/chat"

echo "🧪 Week 4 手动测试清单"
echo "========================"
echo ""

# 测试函数
test_query() {
  local name="$1"
  local query="$2"
  local session_context="$3"
  
  echo "📝 测试: $name"
  echo "   查询: $query"
  
  if [ -z "$session_context" ]; then
    response=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"$query\"}")
  else
    response=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"$query\", \"sessionContext\": $session_context}")
  fi
  
  # 检查响应
  if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "   ✅ 成功"
    
    # 提取关键信息
    intent=$(echo "$response" | jq -r '.data.queryAnalysis.intent // "N/A"')
    confidence=$(echo "$response" | jq -r '.data.queryAnalysis.confidence // "N/A"')
    results_count=$(echo "$response" | jq -r '.data.searchResults | length // 0')
    needs_clarification=$(echo "$response" | jq -r '.data.needsClarification // false')
    from_cache=$(echo "$response" | jq -r '.data.fromCache // false')
    
    echo "   意图: $intent (置信度: $confidence)"
    echo "   结果数: $results_count"
    echo "   需要澄清: $needs_clarification"
    echo "   来自缓存: $from_cache"
  else
    echo "   ❌ 失败"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
  fi
  
  echo ""
  sleep 1
}

# 1. 基础查询
test_query "基础查询" "医疗图标"

# 2. 复杂查询
test_query "复杂查询" "红色 3D 医疗 图标"

# 3. 纠正意图
test_query "纠正意图" "不对，要蓝色的" '{"style": "3D", "industry": "医疗"}'

# 4. 探索意图
test_query "探索意图" "给我一些灵感"

# 5. 模糊查询（应触发澄清）
test_query "模糊查询" "图标"

# 6. 零结果查询
test_query "零结果查询" "xxxxxx不存在的资源yyyy"

# 7. 缓存测试（重复查询）
test_query "缓存测试" "医疗图标"

echo "========================"
echo "✅ 测试完成"
echo ""
echo "📋 验收清单:"
echo "  [ ] 基础查询返回结果"
echo "  [ ] 复杂查询返回精确结果"
echo "  [ ] 纠正意图被正确识别"
echo "  [ ] 探索意图返回多样化结果"
echo "  [ ] 模糊查询触发澄清"
echo "  [ ] 零结果返回友好提示"
echo "  [ ] 缓存命中提升速度"
