
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as dotenv from 'dotenv';
import { TaskType } from "@google/generative-ai";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting vectorization process for posts...');

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('❌ GOOGLE_API_KEY is missing in .env');
        return;
    }

    // Initialize embedding model
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: apiKey,
        modelName: "models/gemini-embedding-001",
        taskType: TaskType.RETRIEVAL_DOCUMENT,
    });

    // Fetch ONLY published posts WITHOUT embeddings (Raw SQL for vector field)
    const postsToIndex = await prisma.$queryRawUnsafe<{ id: string }[]>(
        "SELECT id FROM posts WHERE status = 'published' AND embedding IS NULL"
    );

    const ids = postsToIndex.map(p => p.id);

    if (ids.length === 0) {
        console.log('✨ All published posts already have embeddings. Done!');
        return;
    }

    const posts = await prisma.post.findMany({
        where: {
            id: { in: ids }
        }
    });

    console.log(`Found ${posts.length} new published posts to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const post of posts) {
        try {
            console.log(`Processing: "${post.title}"...`);
            const textToEmbed = `${post.title}\n\n${post.content}`;

            const vector = await embeddings.embedQuery(textToEmbed);
            const vectorString = `[${vector.join(',')}]`;

            // Update post with embedding
            await prisma.$executeRawUnsafe(
                `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
                vectorString,
                post.id
            );

            console.log(`  ✅ Vectorized successfully.`);
            successCount++;

            // Wait 4 seconds for Gemini Free tier (max 15 RPM)
            await new Promise(r => setTimeout(r, 4000));
        } catch (error) {
            console.error(`  ❌ Failed to vectorize post ${post.id}:`, error);
            failCount++;
            // Wait longer on error
            await new Promise(r => setTimeout(r, 10000));
        }
    }

    console.log('\n✨ Vectorization Complete ✨');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
