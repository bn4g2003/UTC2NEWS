
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const majors = await prisma.major.findMany({
        select: { code: true, name: true }
    });
    console.log('Majors in DB:', JSON.stringify(majors, null, 2));

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
