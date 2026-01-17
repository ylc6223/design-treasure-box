// Supabase 向量存储相关类型定义
// 扩展现有数据库类型，添加向量表和函数定义

export interface ResourceMetadata {
  category: string;
  rating: number;
  tags: string[];
  lastUpdated: string;
  name: string;
  description: string;
}

export interface VectorSearchOptions {
  limit?: number;
  minSimilarity?: number;
  categoryFilter?: string[];
  minRating?: number;
}

export interface VectorSearchResult {
  resourceId: string;
  similarity: number;
  metadata: ResourceMetadata;
}

// 扩展数据库类型定义
export interface VectorDatabase {
  public: {
    Tables: {
      resource_embeddings: {
        Row: {
          id: number;
          resource_id: string;
          embedding: number[];
          metadata: ResourceMetadata;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          resource_id: string;
          embedding: number[];
          metadata: ResourceMetadata;
        };
        Update: {
          embedding?: number[];
          metadata?: ResourceMetadata;
          updated_at?: string;
        };
      };
    };
    Functions: {
      match_resources: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          category_filter?: string[];
          min_rating?: number;
        };
        Returns: {
          resource_id: string;
          similarity: number;
          metadata: ResourceMetadata;
        }[];
      };
    };
  };
}