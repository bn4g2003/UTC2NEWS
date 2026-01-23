
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const session = await prisma.admissionSession.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    if (!session) return;
    console.log(`Checking Session: ${session.name}`);

    const apps = await prisma.application.findMany({
        where: { sessionId: session.id },
        include: { student: true, major: true },
        take: 20
    });

    console.log(`\nFound ${apps.length} sample applications.`);

    apps.forEach(a => {
        console.log(`---`);
        console.log(`Student: ${a.student.fullName}`);
        console.log(`Major: ${a.major.name} (${a.major.code})`);
        console.log(`Method String in DB: "${a.admissionMethod}"`);
        console.log(`Subject Scores JSON: ${JSON.stringify(a.subjectScores)}`);
        console.log(`Current Score: ${a.calculatedScore}`);
        console.log(`Status: ${a.admissionStatus}`);
    });

    const quotas = await prisma.sessionQuota.findMany({
        where: { sessionId: session.id }
    });
    console.log(`\nQuotas found: ${quotas.length}`);
    quotas.forEach(q => {
        console.log(`Quota Major ID: ${q.majorId} | Method: ${q.admissionMethod} | Qty: ${q.quota}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
