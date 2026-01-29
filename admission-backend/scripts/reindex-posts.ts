import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface Chunk {
  content: string;
  index: number;
}

class ChunkingService {
  smartChunk(text: string, chunkSize: number, overlap: number): Chunk[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if ((currentChunk + trimmedSentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });

        // Overlap: giữ lại một phần của chunk trước
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 10));
        currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({ content: currentChunk.trim(), index: chunkIndex });
    }

    return chunks.length > 0 ? chunks : [{ content: text, index: 0 }];
  }
}

async function reindexAllPosts() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY is not set in .env file');
    process.exit(1);
  }

  console.log('🔑 Using Google API Key:', apiKey.substring(0, 10) + '...');

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey,
    modelName: "models/gemini-embedding-001",
  });

  const chunkingService = new ChunkingService();

  try {
    // 1. Chỉ lấy các bài viết CHƯA có embedding (Dùng raw SQL vì Prisma không filter được field vector)
    const postsToIndex = await prisma.$queryRawUnsafe<{ id: string }[]>(
      'SELECT id FROM posts WHERE embedding IS NULL'
    );

    const ids = postsToIndex.map(p => p.id);

    if (ids.length === 0) {
      console.log('✨ All posts already have embeddings. Nothing to do!');
      return;
    }

    const posts = await prisma.post.findMany({
      where: {
        id: { in: ids }
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    console.log(`\n📚 Found ${posts.length} new posts to index\n`);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`[${i + 1}/${posts.length}] Processing: ${post.title}`);

      try {
        // 1. Create embedding for full post
        const fullText = `${post.title}\n\n${post.content}`;
        console.log(`  → Generating full post embedding...`);
        const [fullVector] = await embeddings.embedDocuments([fullText]);
        const fullVectorString = `[${fullVector.join(',')}]`;

        await prisma.$executeRawUnsafe(
          `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
          fullVectorString,
          post.id
        );
        console.log(`  ✓ Full post embedding saved`);

        // 2. Delete old chunks (just in case)
        await prisma.$executeRaw`
          DELETE FROM post_chunks WHERE "postId" = ${post.id}
        `;

        // 3. Create chunks
        const chunks = chunkingService.smartChunk(post.content, 500, 100);
        console.log(`  → Created ${chunks.length} chunks. Generating embeddings...`);

        if (chunks.length > 0) {
          // 4. Create embeddings for all chunks in ONE request
          const chunkTexts = chunks.map(chunk => `${post.title}\n\n${chunk.content}`);
          const chunkVectors = await embeddings.embedDocuments(chunkTexts);

          // 5. Save chunks
          for (let j = 0; j < chunks.length; j++) {
            const chunk = chunks[j];
            const vector = chunkVectors[j];
            const vectorString = `[${vector.join(',')}]`;

            await prisma.$executeRawUnsafe(
              `INSERT INTO post_chunks (id, "postId", content, "chunkIndex", embedding, "createdAt")
               VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW())`,
              post.id,
              chunk.content,
              chunk.index,
              vectorString
            );
          }
          console.log(`  ✓ ${chunks.length} chunk embeddings saved\n`);
        }

        // 6. Delay to avoid rate limit (Gemini Free: 15 RPM)
        // Set to 4 seconds to stay safe (~15 requests per minute)
        if (i < posts.length - 1) {
          console.log(`  ⏳ Waiting 4s for next post...`);
          await new Promise(resolve => setTimeout(resolve, 4000));
        }

      } catch (error) {
        console.error(`  ❌ Failed to index post ${post.id}:`, error.message);
        // Wait longer on error to let quota reset
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    console.log('\n✅ Re-indexing completed!\n');

  } catch (error) {
    console.error('❌ Global error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reindexAllPosts();
