# Cấu hình Gemini Embedding - Tóm tắt

## ✅ Cấu hình đã hoàn tất

### Model Information
```
Model Name:    models/gemini-embedding-001
Provider:      Google Generative AI
Dimension:     3072 (NOT 768!)
Library:       @langchain/google-genai
```

### Database Schema
```sql
-- Posts table
ALTER TABLE posts ADD COLUMN embedding vector(3072);

-- Post chunks table  
ALTER TABLE post_chunks ADD COLUMN embedding vector(3072);

-- No indexes (dimension > 2000 limit)
```

### Environment Variables
```env
GOOGLE_API_KEY=your_api_key_here
```

## 🎯 Điểm quan trọng

### 1. Vector Dimension = 3072
- ❌ KHÔNG PHẢI 768
- ✅ Gemini embedding model tạo ra vector 3072 chiều
- ⚠️ Khác với OpenAI (1536) và nhiều model khác

### 2. Không có Index
- pgvector chỉ hỗ trợ index cho vector ≤ 2000 dimensions
- Sử dụng sequential scan (quét tuần tự)
- Chấp nhận được với dataset < 100k rows

### 3. Chunking Strategy
- Chunk size: 500 ký tự
- Overlap: 100 ký tự
- Smart chunking: không cắt giữa câu

## 📊 Files đã cấu hình

### Schema
- ✅ `prisma/schema.prisma` - Updated với vector(3072)

### Migrations
- ✅ `prisma/migrations/20260127041219_init_new_logic/migration.sql` - Added pgvector extension
- ✅ `prisma/migrations/20260128_add_vector_embeddings/migration.sql` - Added vector columns

### Services
- ✅ `src/cms/search.service.ts` - Gemini embedding integration
- ✅ `src/cms/cms.service.ts` - Auto-indexing on create/update

### Scripts
- ✅ `scripts/reindex-posts.ts` - Reindex all posts
- ✅ `test-gemini-embedding.ts` - Test embedding functionality
- ✅ `check-vector-dimension.ts` - Verify database schema

### Documentation
- ✅ `docs/VECTOR_SEARCH_CONFIGURATION.md` - Detailed configuration
- ✅ `VECTOR_SEARCH_SETUP.md` - Setup guide
- ✅ `GEMINI_EMBEDDING_CONFIG.md` - This file

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install @langchain/google-genai

# 2. Configure API key in .env
echo "GOOGLE_API_KEY=your_key" >> .env

# 3. Run migrations
npx prisma migrate deploy

# 4. Test configuration
npx ts-node test-gemini-embedding.ts

# 5. Reindex existing posts
npx ts-node scripts/reindex-posts.ts

# 6. Test search
curl "http://localhost:3000/cms/posts/search?q=test&limit=5"
```

## 🔍 Verification

### Check dimension
```bash
npx ts-node check-vector-dimension.ts
```

Expected output:
```
✅ Vector dimension: 3072 (Gemini Embedding model)
```

### Test embedding
```bash
npx ts-node test-gemini-embedding.ts
```

Expected output:
```
✅ Dimension chính xác: 3072
✅ Database lưu trữ vector đúng
✅ Vector search hoạt động tốt
```

## 📝 Usage Examples

### Search API
```typescript
// Hybrid search (recommended)
GET /cms/posts/search?q=tuyển sinh&limit=5&hybrid=true&chunks=true

// Vector search only
GET /cms/posts/search?q=tuyển sinh&limit=5&hybrid=false&chunks=true

// Keyword search only
GET /cms/posts/search?q=tuyển sinh&limit=5&hybrid=false&chunks=false
```

### Programmatic
```typescript
import { CmsService } from './src/cms/cms.service';

// Hybrid search with chunks (best results)
const results = await cmsService.searchPosts(
  'tuyển sinh đại học', 
  5,      // limit
  true,   // hybrid
  true    // chunks
);
```

## ⚠️ Important Notes

1. **Dimension**: Always use 3072, not 768
2. **No Index**: Sequential scan is used (acceptable for < 100k rows)
3. **Rate Limit**: Add delays between API calls (200ms recommended)
4. **Caching**: Implement Redis cache for popular queries
5. **Monitoring**: Track API usage to avoid quota limits

## 🐛 Common Issues

### Issue: "expected 768 dimensions, not 3072"
**Solution**: Run `npx prisma db execute --file fix-vector-dimension.sql`

### Issue: "GOOGLE_API_KEY is not set"
**Solution**: Add API key to `.env` and restart server

### Issue: No search results
**Solution**: Run `npx ts-node scripts/reindex-posts.ts`

## 📚 References

- [Gemini Embedding API](https://ai.google.dev/gemini-api/docs/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [LangChain Google GenAI](https://js.langchain.com/docs/integrations/text_embedding/google_generativeai)
