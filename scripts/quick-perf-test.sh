#!/bin/bash

# 简化的性能测试
API_URL="http://localhost:3000/api/chat"

echo "🚀 性能快速测试"
echo "================"
echo ""

test_once() {
  local query="$1"
  echo "测试: $query"
  
  time_output=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\"}" \
    -w "\nTime: %{time_total}s\n" \
    -o /dev/null)
  
  echo "$time_output"
  echo ""
}

# 测试3次
test_once "医疗图标"
test_once "红色 3D 医疗 图标"
test_once "图标"

echo "✅ 测试完成"
