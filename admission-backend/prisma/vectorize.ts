
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

    // Fetch posts without embeddings or all posts to be safe/update
    // Here we just fetch published posts for efficiency
    const posts = await prisma.post.findMany({
        where: {
            status: 'published'
        }
    });

    console.log(`Found ${posts.length} published posts to process.`);

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

            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 500));
        } catch (error) {
            console.error(`  ❌ Failed to verify post ${post.id}:`, error);
            failCount++;
        }
    }

    console.log('\n✨ Vectorization Complete ✨');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
