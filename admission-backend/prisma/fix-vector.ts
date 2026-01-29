import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting vector dimension fix...');

    try {
        // 1. Xóa dữ liệu vector cũ trong bảng post_chunks (vì sai dimension)
        console.log('Clearing post_chunks table...');
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE post_chunks;`);
        console.log('✅ Truncated post_chunks table.');

        // 2. Set embedding trong bảng posts về NULL
        console.log('Clearing embeddings in posts table...');
        await prisma.$executeRawUnsafe(`UPDATE posts SET embedding = NULL;`);
        console.log('✅ Cleared embeddings in posts table.');

        // 3. Cố gắng cập nhật lại kiểu dữ liệu column về vector(768)
        // Lưu ý: Lệnh này có thể thất bại nếu column chưa tồn tại hoặc DB không hỗ trợ,
        // nhưng nếu đang dùng pgvector thì sẽ ổn sau khi clear data.
        console.log('Attempting to alter column types to vector(768)...');

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE posts ALTER COLUMN embedding TYPE vector(768);`);
            console.log('✅ Altered posts.embedding to vector(768).');
        } catch (e) {
            console.warn('⚠️ Could not alter posts table directly (run prisma db push if needed). Error:', e.message);
        }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE post_chunks ALTER COLUMN embedding TYPE vector(768);`);
            console.log('✅ Altered post_chunks.embedding to vector(768).');
        } catch (e) {
            console.warn('⚠️ Could not alter post_chunks table directly. Error:', e.message);
        }

        console.log('\nSUCCESS! Vector data has been reset.');
        console.log('Please restart your backend if needed.');
        console.log('To re-index posts, simply update them in the CMS.');

    } catch (error) {
        console.error('❌ Error executing fix:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
