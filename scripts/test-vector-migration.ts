import { config } from 'dotenv';
import { SupabaseVectorStore } from '../lib/ai/supabase-vector-store.js';
import { EmbeddingSyncService } from '../lib/ai/embedding-sync-service.js';
import { SupabaseVectorSearchEngine } from '../lib/ai/supabase-vector-search-engine.js';
import { getAIServiceManager } from '../lib/ai/service-manager.js';

// 加载环境变量
config({ path: '.env.local' });

async function testVectorMigration() {
  console.log('🧪 Starting vector migration test...');

  // 验证环境变量
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error('  - SUPABASE_SECRET_KEY:', !!process.env.SUPABASE_SECRET_KEY);
    process.exit(1);
  }

  try {
    // 1. 测试数据库连接
    console.log('\n1️⃣ Testing database connection...');
    const vectorStore = new SupabaseVectorStore();
    const healthCheck = await vectorStore.healthCheck();
    console.log('Health check result:', healthCheck);

    if (healthCheck.status !== 'healthy') {
      throw new Error('Database connection failed');
    }

    // 2. 测试向量同步
    console.log('\n2️⃣ Testing vector synchronization...');
    
    // 初始化 AI 服务管理器
    const serviceManager = getAIServiceManager();
    await serviceManager.initialize();
    
    const syncService = new EmbeddingSyncService();
    const syncResult = await syncService.syncAllEmbeddings();
    console.log('Sync result:', syncResult);

    // 3. 测试向量搜索
    console.log('\n3️⃣ Testing vector search...');
    const provider = serviceManager.getCurrentProvider();
    
    const searchEngine = new SupabaseVectorSearchEngine(provider);
    const searchResults = await searchEngine.search('颜色工具', {
      limit: 3,
      minSimilarity: 0.1,
    });
    
    console.log('Search results:', searchResults.map(r => ({
      id: r.resourceId,
      name: r.resource.name,
      similarity: r.similarity,
    })));

    // 4. 测试统计信息
    console.log('\n4️⃣ Testing statistics...');
    const stats = await vectorStore.getStats();
    console.log('Vector store stats:', stats);

    console.log('\n✅ All tests passed! Vector migration is ready.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
testVectorMigration();