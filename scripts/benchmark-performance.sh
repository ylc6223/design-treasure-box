#!/bin/bash

# Week 4 Day 5: 性能基准测试
# 测试 API 响应时间和识别瓶颈

API_URL="http://localhost:3000/api/chat"
ITERATIONS=10

echo "🚀 Week 4 性能基准测试"
echo "========================"
echo "测试次数: $ITERATIONS"
echo "目标: API响应时间 < 2秒 (p95)"
echo ""

# 测试函数
benchmark_query() {
  local name="$1"
  local query="$2"
  local times=()
  
  echo "📊 测试: $name"
  echo "   查询: $query"
  
  for i in $(seq 1 $ITERATIONS); do
    start=$(date +%s%3N)
    response=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"$query\"}" \
      -w "\n%{time_total}")
    end=$(date +%s%3N)
    
    # 提取响应时间（秒转毫秒）
    time_total=$(echo "$response" | tail -1)
    time_ms=$(echo "$time_total * 1000" | bc)
    times+=($time_ms)
    
    echo -n "."
  done
  
  echo ""
  
  # 计算统计数据
  sorted_times=($(printf '%s\n' "${times[@]}" | sort -n))
  min=${sorted_times[0]}
  max=${sorted_times[-1]}
  
  # 计算平均值
  sum=0
  for t in "${times[@]}"; do
    sum=$(echo "$sum + $t" | bc)
  done
  avg=$(echo "scale=2; $sum / $ITERATIONS" | bc)
  
  # 计算 p95
  p95_index=$(echo "($ITERATIONS * 0.95) / 1" | bc)
  p95=${sorted_times[$p95_index]}
  
  echo "   最小: ${min}ms"
  echo "   最大: ${max}ms"
  echo "   平均: ${avg}ms"
  echo "   P95:  ${p95}ms"
  
  # 判断是否达标
  if (( $(echo "$p95 < 2000" | bc -l) )); then
    echo "   ✅ 达标 (< 2000ms)"
  else
    echo "   ❌ 未达标 (>= 2000ms)"
  fi
  
  echo ""
}

# 1. 基础查询（有缓存）
benchmark_query "基础查询" "医疗图标"

# 2. 复杂查询（无缓存）
benchmark_query "复杂查询" "红色 3D 金融 图标 $(date +%s)"

# 3. 模糊查询（触发澄清）
benchmark_query "模糊查询" "图标 $(date +%s)"

echo "========================"
echo "✅ 基准测试完成"
echo ""
echo "📋 性能目标:"
echo "  [ ] API响应时间 < 2秒 (p95)"
echo "  [ ] 查询分析 < 100ms"
echo "  [ ] 向量搜索 < 500ms"
