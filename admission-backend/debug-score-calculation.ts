import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugScoreCalculation() {
  console.log('=== DEBUG TÍNH ĐIỂM ===\n');
  
  const session = await prisma.admissionSession.findFirst();
  if (!session) return;
  
  // Get quotas with conditions
  const quotas = await prisma.sessionQuota.findMany({
    where: { sessionId: session.id },
    include: { major: true }
  });
  
  // Get applications with score = 0
  const zeroScoreApps = await prisma.application.findMany({
    where: {
      sessionId: session.id,
      calculatedScore: 0
    },
    include: { student: true, major: true }
  });
  
  console.log(`📊 Applications có điểm = 0: ${zeroScoreApps.length}\n`);
  
  for (const app of zeroScoreApps) {
    console.log(`\n👤 ${app.student.fullName} -> ${app.major.code} (${app.admissionMethod})`);
    
    const subjectScores = app.subjectScores as any;
    console.log(`   Điểm môn trong application: ${JSON.stringify(subjectScores)}`);
    
    const studentScores = app.student.scores as any;
    console.log(`   Điểm môn trong student: ${JSON.stringify(studentScores)}`);
    
    // Find matching quota
    function mapBlockToMethod(block: string): string {
      const blockUpper = block.toUpperCase();
      if (['A00', 'A01', 'B00', 'C00'].includes(blockUpper)) return 'entrance_exam';
      if (['D01', 'D07', 'D08', 'D09', 'D10'].includes(blockUpper)) return 'high_school_transcript';
      return 'entrance_exam';
    }
    
    const mappedMethod = mapBlockToMethod(app.admissionMethod);
    const quota = quotas.find(q => q.majorId === app.majorId && q.admissionMethod === mappedMethod);
    
    if (quota) {
      const conditions = quota.conditions as any;
      console.log(`   Quota: ${quota.major.code} - ${quota.admissionMethod}`);
      console.log(`   Điều kiện:`);
      console.log(`     - subjectCombinations: ${JSON.stringify(conditions?.subjectCombinations || [])}`);
      console.log(`     - minTotalScore: ${conditions?.minTotalScore || 'N/A'}`);
      console.log(`     - minSubjectScores: ${JSON.stringify(conditions?.minSubjectScores || {})}`);
      
      // Check if subject scores match any combination
      if (conditions?.subjectCombinations) {
        console.log(`\n   Kiểm tra tổ hợp môn:`);
        conditions.subjectCombinations.forEach((combo: string[], idx: number) => {
          const hasAll = combo.every(subject => {
            const hasScore = subjectScores[subject] !== undefined && 
                           subjectScores[subject] !== null &&
                           !isNaN(subjectScores[subject]);
            console.log(`     Combo ${idx + 1} [${combo.join(', ')}]: ${subject} = ${subjectScores[subject]} ${hasScore ? '✅' : '❌'}`);
            return hasScore;
          });
          console.log(`     → Combo ${idx + 1}: ${hasAll ? '✅ HỢP LỆ' : '❌ KHÔNG HỢP LỆ'}`);
        });
      }
    } else {
      console.log(`   ❌ Không tìm thấy quota`);
    }
  }
  
  await prisma.$disconnect();
}

debugScoreCalculation().catch(console.error);
