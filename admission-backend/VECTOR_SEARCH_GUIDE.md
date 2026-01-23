# Hướng dẫn triển khai Tìm kiếm Thông minh (Vector Search)

Tài liệu này hướng dẫn cách nâng cấp hệ thống tìm kiếm từ "keyword matching" sang "Semantic Search" (tìm theo ngữ nghĩa) sử dụng Vector Database.

Bạn có thể tùy chọn sử dụng **OpenAI**, **Google Gemini**, hoặc **Local AI (Chạy trên máy)** để tạo vector. Cách hoạt động là như nhau, chỉ khác nguồn tạo vector.

## 1. Kiến trúc tổng quan

Để thực hiện tìm kiếm vector, luồng dữ liệu sẽ hoạt động như sau:
1.  **Khi tạo/sửa bài viết**: Nội dung bài viết sẽ được gửi qua một mô hình AI (Embedding Model) để chuyển đổi thàng một dãy số vector.
2.  **Lưu trữ**: Vector này được lưu vào database (PostgreSQL với extension `pgvector`).
3.  **Khi tìm kiếm**: Câu truy vấn của người dùng cũng được chuyển thành vector tương ứng.
4.  **So khớp**: Database tính toán khoảng cách để tìm vector gần nhất.

## 2. Cài đặt Database (PostgreSQL + pgvector)

Hệ thống hiện tại sử dụng PostgreSQL. Bạn cần kích hoạt extension `pgvector`.

### Bước 1: Kích hoạt extension
Chạy câu lệnh SQL sau trong database:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Bước 2: Cập nhật Schema Prisma
Trong file `prisma/schema.prisma`. Lưu ý kích thước vector phụ thuộc vào model bạn chọn:
*   OpenAI (`text-embedding-3-small`): **1536** chiều.
*   Gemini (`text-embedding-004`): **768** chiều.
*   Local (ví dụ `nomic-embed-text` qua Ollama): **768** chiều.

Ví dụ dưới đây dùng **768** (phổ biến cho Gemini/Local):

```prisma
model Post {
  // ... các field cũ
  
  // Dùng 768 nếu dùng Gemini hoặc Local Nomic
  // Dùng 1536 nếu dùng OpenAI
  embedding Unsupported("vector(768)")? 
  
  @@map("posts")
}
```

Chạy migration:
```bash
npx prisma migrate dev --name add_vector_search
```

## 3. Lựa chọn "Bộ não" tạo Vector (AI Model)

Bạn chỉ cần chọn 1 trong 3 cách sau:

### Lựa chọn A: Dùng Google Gemini API (Khuyên dùng - Ngon, Bổ, Rẻ/Miễn phí)
Google cung cấp model `text-embedding-004` rất mạnh và có gói miễn phí hào phóng.

1.  Cài đặt:
    ```bash
    npm install @langchain/google-genai
    ```
2.  Code setup (`search.service.ts`):
    ```typescript
    import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

    // Trong constructor
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY, // Lấy key tại aistudio.google.com
      modelName: "models/text-embedding-004", // Output: 768 dimensions
    });
    ```

### Lựa chọn B: Dùng Local Model (Chạy trên máy - Riêng tư 100%)
Dùng **Ollama** để chạy model miễn phí trên server của chính bạn. Không tốn tiền API, bảo mật tuyệt đối, nhưng tốn RAM/CPU server.

1.  Cài đặt Ollama trên máy/server (tải tại ollama.com).
2.  Tải model embedding nhẹ (ví dụ `nomic-embed-text`):
    ```bash
    ollama pull nomic-embed-text
    ```
3.  Cài thư viện JS:
    ```bash
    npm install @langchain/community @langchain/core
    ```
4.  Code setup (`search.service.ts`):
    ```typescript
    import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

    // Trong constructor
    this.embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text", // Output: 768 dimensions
      baseUrl: "http://localhost:11434", // Đường dẫn tới Ollama đang chạy
    });
    ```

### Lựa chọn C: Dùng OpenAI API (Chuẩn mực, dễ dùng nhưng tốn phí)
1.  Cài đặt:
    ```bash
    npm install @langchain/openai
    ```
2.  Code setup:
    ```typescript
    import { OpenAIEmbeddings } from "@langchain/openai";

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small', // Output: 1536 dimensions
    });
    ```

---

## 4. Code Service Hoàn chỉnh (Ví dụ dùng Gemini)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// import { OpenAIEmbeddings } from '@langchain/openai'; 
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

@Injectable()
export class SearchService {
  private embeddings;

  constructor(private prisma: PrismaService) {
    // Switch provider ở đây dễ dàng
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "models/text-embedding-004",
    });
  }

  // 1. Hàm tạo vector từ nội dung bài viết và lưu vào DB
  async indexPost(postId: string, title: string, content: string) {
    const textToEmbed = `${title}\n\n${content}`;
    
    // Tạo vector
    const vector = await this.embeddings.embedQuery(textToEmbed);
    
    // Lưu vector vào DB
    // Lưu ý: Đảm bảo cú pháp array string đúng format cho PGVector
    const vectorString = `[${vector.join(',')}]`;
    
    await this.prisma.$executeRaw`
      UPDATE posts 
      SET embedding = ${vectorString}::vector
      WHERE id = ${postId}
    `;
  }

  // 2. Hàm tìm kiếm semantic
  async search(query: string, limit = 5) {
    const vector = await this.embeddings.embedQuery(query);
    const vectorString = `[${vector.join(',')}]`;

    // Tìm kiếm
    const results = await this.prisma.$queryRaw`
      SELECT id, title, slug, excerpt, 
             (embedding <=> ${vectorString}::vector) as distance
      FROM posts
      WHERE status = 'published'
      ORDER BY distance ASC
      LIMIT ${limit};
    `;

    return results;
  }
}
```
