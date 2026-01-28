# Cấu hình Vector Search với Gemini Embedding

## Tổng quan

Hệ thống sử dụng **Google Gemini Embedding model** (`models/gemini-embedding-001`) để tạo vector embeddings cho bài viết và hỗ trợ tìm kiếm semantic.

## Thông số kỹ thuật

### Model
- **Model name**: `models/gemini-embedding-001`
- **Vector dimension**: **3072**
- **Provider**: Google Generative AI
- **Library**: `@langchain/google-genai`

### Database
- **Extension**: pgvector
- **Vector type**: `vector(3072)`
- **Index**: Không sử dụng (do giới hạn 2000 dimensions của pgvector)
- **Search method**: Sequential scan với cosine distance

## Cấu hình

### 1. Environment Variables

Thêm vào file `.env`:

```env
GOOGLE_API_KEY=your_google_api_key_here
```

### 2. Database Schema

```prisma
model Post {
  // ... other fields
  embedding Unsupported("vector(3072)")?
  chunks    PostChunk[]
}

model PostChunk {
  id         String   @id @default(uuid())
  postId     String
  content    String
  chunkIndex Int
  embedding  Unsupported("vector(3072)")?
  // ... other fields
}
```

### 3. Migration

Migration đã được tạo tại: `prisma/migrations/20260128_add_vector_embeddings/migration.sql`

Chạy migration:
```bash
npx prisma migrate deploy
```

## Cách sử dụng

### 1. Index bài viết

Khi tạo hoặc cập nhật bài viết, hệ thống tự động tạo embeddings:

```typescript
// Trong cms.service.ts
await this.searchService.indexPostWithChunks(post.id, post.title, post.content);
```

### 2. Tìm kiếm

```typescript
// Hybrid search với chunks (khuyến nghị)
const results = await cmsService.searchPosts(query, limit, true, true);

// Vector search đơn giản
const results = await searchService.search(query, limit);

// Keyword search (fallback)
const results = await searchService.keywordSearch(query, limit);
```

## Chunking Strategy

Hệ thống chia bài viết thành các chunks nhỏ để tìm kiếm chính xác hơn:

- **Chunk size**: 500 ký tự
- **Overlap**: 100 ký tự
- **Smart chunking**: Chia theo đoạn văn, không cắt giữa câu

## Performance

### Ưu điểm
- ✅ Tìm kiếm semantic chính xác
- ✅ Hỗ trợ tiếng Việt tốt
- ✅ Chunking giúp tìm kiếm trong bài viết dài
- ✅ Hybrid search kết hợp vector + keyword

### Giới hạn
- ⚠️ Không có index (do dimension > 2000)
- ⚠️ Sequential scan chậm với dataset lớn (>100k rows)
- ⚠️ Rate limit của Google API

### Khuyến nghị
- Sử dụng cho dataset nhỏ/trung bình (< 100k bài viết)
- Implement caching cho queries phổ biến
- Monitor API usage để tránh rate limit

## Testing

### Test embedding dimension
```bash
npx ts-node test-gemini-embedding.ts
```

### Test vector search
```bash
npx ts-node check-vector-dimension.ts
```

### Reindex tất cả bài viết
```bash
npx ts-node scripts/reindex-posts.ts
```

## Troubleshooting

### Lỗi: "expected X dimensions, not 3072"
- Kiểm tra database schema có đúng `vector(3072)` không
- Chạy lại migration: `npx prisma migrate reset --force`

### Lỗi: "GOOGLE_API_KEY is not set"
- Thêm API key vào file `.env`
- Restart server

### Tìm kiếm không trả về kết quả
- Kiểm tra bài viết đã được index chưa
- Chạy reindex: `npx ts-node scripts/reindex-posts.ts`
- Kiểm tra threshold trong search service

## API Endpoints

### Search posts
```http
GET /cms/posts/search?q=query&limit=5&hybrid=true&chunks=true
```

### Reindex post
```http
POST /cms/posts/:id/reindex
```

## Tham khảo

- [Google Gemini Embedding Documentation](https://ai.google.dev/gemini-api/docs/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [LangChain Google GenAI](https://js.langchain.com/docs/integrations/text_embedding/google_generativeai)
