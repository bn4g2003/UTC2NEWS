import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function showResults() {
  console.log('=== KẾT QUẢ LỌC CHI TIẾT ===\n');
  
  try {
    const session = await prisma.admissionSession.findFirst();
    if (!session) {
      console.log('❌ Không tìm thấy session');
      return;
    }
    
    console.log(`📅 Session: ${session.name}\n`);
  
    // Get admitted applications
    const admitted = await prisma.application.findMany({
      where: {
        sessionId: session.id,
        admissionStatus: 'admitted'
      },
      include: {
        student: true,
        major: true
      },
      orderBy: [
        { majorId: 'asc' },
        { calculatedScore: 'desc' }
      ]
    });
    
    console.log(`✅ SINH VIÊN TRÚNG TUYỂN: ${admitted.length}\n`);
    
    // Group by major
    const byMajor = new Map<string, any[]>();
    admitted.forEach(app => {
      const key = app.major.code;
      if (!byMajor.has(key)) {
        byMajor.set(key, []);
      }
      byMajor.get(key)!.push(app);
    });
    
    for (const [majorCode, apps] of byMajor.entries()) {
      console.log(`\n📚 ${majorCode} - ${apps[0].major.name} (${apps.length} sinh viên)`);
      console.log('─'.repeat(70));
      
      apps.forEach((app, idx) => {
        console.log(`${idx + 1}. ${app.student.fullName}`);
        console.log(`   Nguyện vọng: NV${app.preferencePriority}`);
        console.log(`   Khối thi: ${app.admissionMethod}`);
        console.log(`   Điểm: ${app.calculatedScore}`);
        console.log(`   Xếp hạng: ${app.rankInMajor}`);
      });
    }
    
    // Get not admitted
    const notAdmitted = await prisma.application.findMany({
      where: {
        sessionId: session.id,
        admissionStatus: 'not_admitted',
        calculatedScore: { gt: 0 }
      },
      include: {
        student: true,
        major: true
      },
      orderBy: [
        { calculatedScore: 'desc' }
      ]
    });
    
    console.log(`\n\n❌ SINH VIÊN KHÔNG TRÚNG TUYỂN (có điểm): ${notAdmitted.length}\n`);
    
    // Group by student
    const studentMap = new Map<string, any[]>();
    notAdmitted.forEach(app => {
      if (!studentMap.has(app.studentId)) {
        studentMap.set(app.studentId, []);
      }
      studentMap.get(app.studentId)!.push(app);
    });
    
    let idx = 1;
    for (const [, apps] of studentMap.entries()) {
      const student = apps[0].student;
      console.log(`${idx}. ${student.fullName}`);
      apps.forEach(app => {
        console.log(`   - NV${app.preferencePriority}: ${app.major.code} (${app.admissionMethod}) - Điểm: ${app.calculatedScore}`);
      });
      idx++;
    }
    
    // Summary by quota
    console.log(`\n\n📊 THỐNG KÊ THEO CHỈ TIÊU\n`);
    
    const quotas = await prisma.sessionQuota.findMany({
      where: { sessionId: session.id },
      include: { major: true }
    });
    
    for (const quota of quotas) {
      const count = admitted.filter(app => 
        app.majorId === quota.majorId && 
        (app.admissionMethod === quota.admissionMethod || 
         mapBlockToMethod(app.admissionMethod) === quota.admissionMethod)
      ).length;
      
      const percentage = (count / quota.quota * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / quota.quota * 20));
      
      console.log(`${quota.major.code} - ${quota.admissionMethod}:`);
      console.log(`  ${count}/${quota.quota} (${percentage}%) ${bar}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function mapBlockToMethod(block: string): string {
  const blockUpper = block.toUpperCase();
  if (['A00', 'A01', 'B00', 'C00'].includes(blockUpper)) return 'entrance_exam';
  if (['D01', 'D07', 'D08', 'D09', 'D10'].includes(blockUpper)) return 'high_school_transcript';
  return 'entrance_exam';
}

showResults().catch(err => {
  console.error('❌ Error:', err);
  prisma.$disconnect();
});
