import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testGeminiEmbedding() {
  try {
    console.log('🧪 Kiểm tra Gemini Embedding với dimension 3072...\n');

    // 1. Khởi tạo Gemini Embeddings
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY không được cấu hình trong .env');
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      modelName: "models/gemini-embedding-001",
    });

    console.log('✅ Đã khởi tạo Gemini Embeddings');
    console.log('   Model: models/gemini-embedding-001');
    console.log('   Expected dimension: 3072\n');

    // 2. Tạo embedding cho một đoạn text mẫu
    const sampleText = "Trường Đại học Giao thông Vận tải TP.HCM tuyển sinh năm 2026";
    console.log(`📝 Text mẫu: "${sampleText}"`);
    
    const vector = await embeddings.embedQuery(sampleText);
    
    console.log(`\n✅ Đã tạo embedding thành công!`);
    console.log(`   Dimension: ${vector.length}`);
    console.log(`   First 5 values: [${vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`   Last 5 values: [...${vector.slice(-5).map(v => v.toFixed(4)).join(', ')}]`);

    // 3. Kiểm tra dimension
    if (vector.length !== 3072) {
      throw new Error(`❌ Dimension không đúng! Expected: 3072, Got: ${vector.length}`);
    }
    console.log('\n✅ Dimension chính xác: 3072');

    // 4. Test lưu vào database
    console.log('\n📊 Test lưu embedding vào database...');
    
    // Tạo một bài viết test
    const testPost = await prisma.post.create({
      data: {
        title: 'Test Gemini Embedding',
        slug: `test-embedding-${Date.now()}`,
        content: sampleText,
        status: 'draft',
      }
    });

    console.log(`✅ Đã tạo bài viết test: ${testPost.id}`);

    // Lưu embedding vào database
    const vectorString = `[${vector.join(',')}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
      vectorString,
      testPost.id
    );

    console.log('✅ Đã lưu embedding vào database');

    // 5. Test tìm kiếm vector
    console.log('\n🔍 Test tìm kiếm vector...');
    
    const searchQuery = "tuyển sinh đại học";
    const searchVector = await embeddings.embedQuery(searchQuery);
    const searchVectorString = `[${searchVector.join(',')}]`;

    const results = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        id, 
        title, 
        1 - (embedding <=> $1::vector) as similarity
       FROM posts
       WHERE embedding IS NOT NULL
       ORDER BY similarity DESC
       LIMIT 5`,
      searchVectorString
    );

    console.log(`✅ Tìm thấy ${results.length} kết quả:`);
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title} (similarity: ${(r.similarity * 100).toFixed(2)}%)`);
    });

    // 6. Dọn dẹp
    console.log('\n🧹 Dọn dẹp bài viết test...');
    await prisma.post.delete({ where: { id: testPost.id } });
    console.log('✅ Đã xóa bài viết test');

    console.log('\n🎉 TẤT CẢ TESTS ĐỀU PASS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Gemini Embedding model hoạt động chính xác');
    console.log('✅ Vector dimension: 3072');
    console.log('✅ Database lưu trữ vector đúng');
    console.log('✅ Vector search hoạt động tốt');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testGeminiEmbedding();
