import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('--- ALL STUDENTS IN DATABASE ---');
        const allStudents = await prisma.student.findMany({
            select: { id: true, idCard: true, fullName: true, sessionId: true }
        });
        console.log(`Total students: ${allStudents.length}`);
        allStudents.forEach(s => console.log(`- ${s.idCard} (${s.fullName}) Session: ${s.sessionId}`));

        console.log('\n--- ALL APPLICATIONS IN DATABASE ---');
        const allApps = await prisma.application.findMany({
            include: {
                student: { select: { idCard: true } },
                major: { select: { code: true } }
            }
        });
        console.log(`Total applications: ${allApps.length}`);
        allApps.forEach(app => console.log(`- Student: ${app.student.idCard}, Major: ${app.major.code}, Session: ${app.sessionId}, Priority: ${app.preferencePriority}`));

        console.log('\n--- ALL SESSIONS ---');
        const sessions = await prisma.admissionSession.findMany();
        sessions.forEach(s => console.log(`- ${s.id} (${s.name})`));

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
