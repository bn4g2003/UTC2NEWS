import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  console.log('=== KIỂM TRA DỮ LIỆU DATABASE ===\n');
  
  // 1. Sessions
  const sessions = await prisma.admissionSession.findMany();
  console.log('📅 SESSIONS:', sessions.length);
  sessions.forEach(s => {
    console.log(`  - ${s.name} (ID: ${s.id}, Status: ${s.status})`);
  });
  
  if (sessions.length === 0) {
    console.log('\n❌ KHÔNG CÓ SESSION NÀO!');
    await prisma.$disconnect();
    return;
  }
  
  const sessionId = sessions[0].id;
  console.log(`\n🎯 Sử dụng session: ${sessionId}\n`);
  
  // 2. Majors
  const majors = await prisma.major.findMany();
  console.log('🎓 MAJORS:', majors.length);
  majors.forEach(m => {
    console.log(`  - ${m.code}: ${m.name}`);
  });
  
  // 3. Quotas
  const quotas = await prisma.sessionQuota.findMany({
    where: { sessionId },
    include: { major: true }
  });
  console.log(`\n📊 QUOTAS cho session ${sessionId}:`, quotas.length);
  quotas.forEach(q => {
    const conditions = q.conditions as any;
    console.log(`  - ${q.major.code} - ${q.admissionMethod}: Chỉ tiêu ${q.quota}`);
    if (conditions) {
      console.log(`    • minTotalScore: ${conditions.minTotalScore || 'N/A'}`);
      console.log(`    • minSubjectScores: ${JSON.stringify(conditions.minSubjectScores || {})}`);
      console.log(`    • subjectCombinations: ${JSON.stringify(conditions.subjectCombinations || [])}`);
    }
  });
  
  // 4. Students
  const students = await prisma.student.findMany({
    where: { sessionId }
  });
  console.log(`\n👨‍🎓 STUDENTS cho session ${sessionId}:`, students.length);
  students.forEach(s => {
    const scores = s.scores as any;
    console.log(`  - ${s.fullName} (ID: ${s.idCard})`);
    console.log(`    Điểm: ${JSON.stringify(scores || {})}`);
    console.log(`    Ưu tiên: ${s.priorityPoints}`);
  });
  
  // 5. Applications
  const applications = await prisma.application.findMany({
    where: { sessionId },
    include: { student: true, major: true },
    orderBy: [
      { studentId: 'asc' },
      { preferencePriority: 'asc' }
    ]
  });
  console.log(`\n📝 APPLICATIONS cho session ${sessionId}:`, applications.length);
  applications.forEach(app => {
    const subjectScores = app.subjectScores as any;
    console.log(`  - ${app.student.fullName} -> NV${app.preferencePriority}: ${app.major.code} (${app.admissionMethod})`);
    console.log(`    Điểm môn: ${JSON.stringify(subjectScores)}`);
    console.log(`    Điểm tính: ${app.calculatedScore}`);
    console.log(`    Trạng thái: ${app.admissionStatus}`);
  });
  
  await prisma.$disconnect();
}

checkData().catch(console.error);
