// AI模块的主入口文件
export * from './config-manager';
export * from './provider-factory';
export * from './service-manager';
export * from './base-provider';
export * from './zhipu-provider';
export * from './supabase-vector-store';
export * from './supabase-vector-search-engine';
export * from './embedding-sync-service';
export * from './hybrid-search';
export * from './rag-engine';
export * from './guided-questioning';

// 重新导出类型
export * from '@/types/ai-chat';

import { getAIServiceManager } from './service-manager';

/**
 * 初始化AI服务
 * 应在应用启动时调用
 */
export async function initializeAIServices(): Promise<void> {
  try {
    const serviceManager = getAIServiceManager();
    await serviceManager.initialize();
    console.log('AI services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI services:', error);
    throw error;
  }
}

/**
 * 获取AI服务的健康状态
 */
export async function getAIHealthStatus() {
  const serviceManager = getAIServiceManager();
  return await serviceManager.healthCheck();
}
