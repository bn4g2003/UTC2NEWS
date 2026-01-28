-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to posts table with dimension 3072 for Gemini Embedding
-- Note: pgvector indexes (ivfflat, hnsw) only support up to 2000 dimensions
-- For 3072 dimensions, we cannot use indexes and will rely on sequential scan
ALTER TABLE posts ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- Add embedding column to post_chunks table with dimension 3072
ALTER TABLE post_chunks ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- No indexes due to dimension limit (max 2000 for pgvector indexes)
-- Sequential scan will be used for similarity search
-- This is acceptable for small to medium datasets (< 100k rows)
