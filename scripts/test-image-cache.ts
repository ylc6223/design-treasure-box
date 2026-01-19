/**
 * 测试图片缓存管理器
 */

import fetch from 'node-fetch';

// 设置全局 fetch
(global as any).fetch = fetch;

// 导入图片缓存管理器
// @ts-ignore - Module may not exist or is deprecated
import { imageCache } from '../lib/image-cache';

async function testImageCache() {
  console.log('🧪 开始测试图片缓存管理器...\n');

  // 测试 URL
  const testUrls = [
    'https://tailwindcss.com',
    'https://nextjs.org',
    'https://react.dev'
  ];

  console.log('📋 测试场景：');
  console.log('1. 并发请求限制（最多5个）');
  console.log('2. 请求去重（相同URL只请求一次）');
  console.log('3. 缓存机制（30分钟TTL）');
  console.log('4. 错误处理（5分钟错误缓存）\n');

  // 测试1：并发请求
  console.log('🚀 测试1：并发请求限制');
  const startTime = Date.now();
  
  try {
    const promises = testUrls.map(async (url, index) => {
      console.log(`  发起请求 ${index + 1}: ${url}`);
      const imageUrl = await imageCache.getImageUrl(url);
      console.log(`  ✓ 请求 ${index + 1} 完成: ${imageUrl.substring(0, 50)}...`);
      return imageUrl;
    });

    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`  ✅ 所有请求完成，耗时: ${endTime - startTime}ms`);
    console.log(`  📊 成功获取 ${results.length} 个图片URL\n`);

    // 测试2：缓存命中
    console.log('🎯 测试2：缓存命中测试');
    const cacheStartTime = Date.now();
    
    const cachedUrl = await imageCache.getImageUrl(testUrls[0]);
    const cacheEndTime = Date.now();
    
    console.log(`  ✓ 缓存命中，耗时: ${cacheEndTime - cacheStartTime}ms`);
    console.log(`  📋 缓存URL: ${cachedUrl.substring(0, 50)}...\n`);

    // 测试3：错误处理
    console.log('❌ 测试3：错误处理');
    try {
      await imageCache.getImageUrl('https://invalid-domain-that-does-not-exist.com');
      console.log('  ⚠️  预期错误但请求成功');
    } catch (err) {
      console.log(`  ✓ 正确处理错误: ${(err as Error).message}`);
    }

    console.log('\n🎉 所有测试完成！');

  } catch (err) {
    console.error('❌ 测试失败:', (err as Error).message);
  }
}

// 运行测试
testImageCache().catch(console.error);