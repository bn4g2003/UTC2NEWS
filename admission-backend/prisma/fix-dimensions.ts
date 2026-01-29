
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🛠️ Fixing Vector Dimensions to 3072...');

    try {
        console.log('1. Dropping old embedding columns...');
        await prisma.$executeRawUnsafe(`ALTER TABLE posts DROP COLUMN IF EXISTS embedding`);
        await prisma.$executeRawUnsafe(`ALTER TABLE post_chunks DROP COLUMN IF EXISTS embedding`);

        console.log('2. Adding new embedding columns with 3072 dimensions...');
        await prisma.$executeRawUnsafe(`ALTER TABLE posts ADD COLUMN embedding vector(3072)`);
        await prisma.$executeRawUnsafe(`ALTER TABLE post_chunks ADD COLUMN embedding vector(3072)`);

        console.log('✅ Successfully updated columns to 3072 dimensions.');
    } catch (error) {
        console.error('❌ Error fixing dimensions:', error.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
