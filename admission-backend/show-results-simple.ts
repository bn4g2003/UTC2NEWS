import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== KẾT QUẢ LỌC ===\n');
  
  const admitted = await prisma.application.findMany({
    where: { admissionStatus: 'admitted' },
    include: { student: true, major: true }
  });
  
  console.log(`✅ Số sinh viên đậu: ${admitted.length}\n`);
  
  admitted.forEach((app, idx) => {
    console.log(`${idx + 1}. ${app.student.fullName}`);
    console.log(`   → ${app.major.code} - ${app.major.name}`);
    console.log(`   Nguyện vọng: NV${app.preferencePriority}`);
    console.log(`   Khối: ${app.admissionMethod}`);
    console.log(`   Điểm: ${app.calculatedScore}\n`);
  });
  
  await prisma.$disconnect();
}

main();
