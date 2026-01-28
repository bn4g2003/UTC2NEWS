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
    // Get all posts
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    console.log(`\n📚 Found ${posts.length} posts to index\n`);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`[${i + 1}/${posts.length}] Processing: ${post.title}`);

      try {
        // 1. Create embedding for full post
        const fullText = `${post.title}\n\n${post.content}`;
        console.log(`  → Generating full post embedding...`);
        const fullVector = await embeddings.embedQuery(fullText);
        const fullVectorString = `[${fullVector.join(',')}]`;

        await prisma.$executeRawUnsafe(
          `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
          fullVectorString,
          post.id
        );
        console.log(`  ✓ Full post embedding saved`);

        // 2. Delete old chunks
        await prisma.$executeRaw`
          DELETE FROM post_chunks WHERE "postId" = ${post.id}
        `;

        // 3. Create chunks
        const chunks = chunkingService.smartChunk(post.content, 500, 100);
        console.log(`  → Created ${chunks.length} chunks`);

        // 4. Create embeddings for each chunk
        for (const chunk of chunks) {
          const chunkText = `${post.title}\n\n${chunk.content}`;
          const chunkVector = await embeddings.embedQuery(chunkText);
          const chunkVectorString = `[${chunkVector.join(',')}]`;

          await prisma.$executeRawUnsafe(
            `INSERT INTO post_chunks (id, "postId", content, "chunkIndex", embedding, "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW())`,
            post.id,
            chunk.content,
            chunk.index,
            chunkVectorString
          );

          // Delay to avoid rate limit
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`  ✓ ${chunks.length} chunk embeddings saved\n`);

      } catch (error) {
        console.error(`  ❌ Failed to index post ${post.id}:`, error.message);
      }
    }

    console.log('\n✅ Re-indexing completed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reindexAllPosts();
