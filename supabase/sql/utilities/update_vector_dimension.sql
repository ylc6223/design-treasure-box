-- 更新向量维度从1536到1024
-- 手动执行脚本：在Supabase Dashboard SQL编辑器中运行
-- 用途：修复向量维度不匹配问题，重建embedding表结构

-- 1. 删除现有的相似度搜索函数（如果存在）
DROP FUNCTION IF EXISTS match_resources(vector, float, int, text[], float);

-- 2. 删除现有表（如果存在数据，请先备份）
DROP TABLE IF EXISTS resource_embeddings;

-- 3. 重新创建表结构（1024维）
CREATE TABLE resource_embeddings (
  id SERIAL PRIMARY KEY,
  resource_id VARCHAR(255) UNIQUE NOT NULL,
  embedding vector(1024) NOT NULL,  -- 智谱 embedding-2 维度
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX idx_resource_embeddings_resource_id ON resource_embeddings(resource_id);
CREATE INDEX idx_resource_embeddings_embedding ON resource_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_resource_embeddings_metadata_category ON resource_embeddings USING btree ((metadata->>'category'));
CREATE INDEX idx_resource_embeddings_metadata_rating ON resource_embeddings USING btree (((metadata->>'rating')::numeric));

-- 5. 重新创建相似度搜索函数（1024维）
CREATE OR REPLACE FUNCTION match_resources(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10,
  category_filter text[] DEFAULT NULL,
  min_rating float DEFAULT NULL
)
RETURNS TABLE (
  resource_id varchar(255),
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.resource_id,
    1 - (re.embedding <=> query_embedding) as similarity,
    re.metadata
  FROM resource_embeddings re
  WHERE 
    1 - (re.embedding <=> query_embedding) > match_threshold
    AND (category_filter IS NULL OR re.metadata->>'category' = ANY(category_filter))
    AND (min_rating IS NULL OR (re.metadata->>'rating')::numeric >= min_rating)
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. 验证设置
SELECT 'Table created successfully' as status;
SELECT 'Function created successfully' as status;