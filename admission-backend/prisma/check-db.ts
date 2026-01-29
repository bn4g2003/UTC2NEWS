
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
    console.log('📊 Checking Database Structure and Data...\n');

    try {
        // 1. Check columns in 'posts' table
        const postColumns = await prisma.$queryRawUnsafe<any[]>(
            "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'embedding'"
        );

        if (postColumns.length > 0) {
            console.log(`✅ Table [posts] has column [embedding]`);
            console.log(`   Type: ${postColumns[0].data_type}, UDT: ${postColumns[0].udt_name}`);

            // Check vector dimension
            const postDim = await prisma.$queryRawUnsafe<any[]>(
                "SELECT atttypmod FROM pg_attribute WHERE attrelid = 'posts'::regclass AND attname = 'embedding'"
            );
            if (postDim.length > 0 && postDim[0].atttypmod !== -1) {
                console.log(`   Dimension: ${postDim[0].atttypmod}`);
            }
        } else {
            console.log(`❌ Table [posts] is MISSING column [embedding]`);
        }

        // 2. Check columns in 'post_chunks' table
        const chunkColumns = await prisma.$queryRawUnsafe<any[]>(
            "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'post_chunks' AND column_name = 'embedding'"
        );

        if (chunkColumns.length > 0) {
            console.log(`✅ Table [post_chunks] has column [embedding]`);
            console.log(`   Type: ${chunkColumns[0].data_type}, UDT: ${chunkColumns[0].udt_name}`);

            // Check vector dimension
            const chunkDim = await prisma.$queryRawUnsafe<any[]>(
                "SELECT atttypmod FROM pg_attribute WHERE attrelid = 'post_chunks'::regclass AND attname = 'embedding'"
            );
            if (chunkDim.length > 0 && chunkDim[0].atttypmod !== -1) {
                console.log(`   Dimension: ${chunkDim[0].atttypmod}`);
            }
        } else {
            console.log(`❌ Table [post_chunks] is MISSING column [embedding]`);
        }

        // 3. Count data
        console.log('\n📈 Data Statistics:');

        const postCount = await prisma.post.count();
        const postWithEmbedding = await prisma.$queryRawUnsafe<any[]>(
            "SELECT COUNT(*) as count FROM posts WHERE embedding IS NOT NULL"
        );
        console.log(`- Total Posts: ${postCount}`);
        console.log(`- Posts with Embeddings: ${postWithEmbedding[0].count}`);

        const chunkCount = await prisma.postChunk.count();
        const chunkWithEmbedding = await prisma.$queryRawUnsafe<any[]>(
            "SELECT COUNT(*) as count FROM post_chunks WHERE embedding IS NOT NULL"
        );
        console.log(`- Total Chunks: ${chunkCount}`);
        console.log(`- Chunks with Embeddings: ${chunkWithEmbedding[0].count}`);

    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
