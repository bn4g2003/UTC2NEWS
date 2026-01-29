
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
        modelName: "text-embedding-004",
    } as any);

    console.log('🔍 Searching for posts without embeddings...');

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
        let retries = 0;
        const maxRetries = 3;
        let success = false;

        while (retries < maxRetries && !success) {
            try {
                console.log(`\n📄 Processing [${successCount + failCount + 1}/${posts.length}]: "${post.title}"...${retries > 0 ? ` (Retry ${retries})` : ''}`);
                const textToEmbed = `${post.title}\n\n${post.content}`;

                console.log(`   📡 Calling Google API for embeddings (3072 dimensions)...`);
                const vector = await embeddings.embedQuery(textToEmbed);
                console.log(`   ✅ Received vector (${vector.length} dimensions)`);

                const vectorString = `[${vector.join(',')}]`;

                // Update post with embedding
                console.log(`   💾 Saving to Database...`);
                await prisma.$executeRawUnsafe(
                    `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
                    vectorString,
                    post.id
                );

                console.log(`  ✅ Vectorized successfully.`);
                successCount++;
                success = true;

                // Wait 10 seconds for Gemini Free tier (safety increase)
                await new Promise(r => setTimeout(r, 10000));
            } catch (error: any) { // Explicitly type error as 'any' or 'unknown'
                if (error.status === 429) {
                    console.error(`  ⚠️ Quota exceeded (429). Waiting 30 seconds before retry...`);
                    await new Promise(r => setTimeout(r, 30000));
                    retries++;
                } else {
                    console.error(`  ❌ Failed to vectorize post ${post.id}:`, error.message);
                    failCount++;
                    break;
                }
            }
        }

        if (!success && retries === maxRetries) {
            console.error(`  ❌ Max retries reached for post ${post.id}. Skipping.`);
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
