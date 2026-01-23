import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixQuotaConditions() {
  console.log('=== SỬA QUOTA CONDITIONS ===\n');
  
  const session = await prisma.admissionSession.findFirst();
  if (!session) return;
  
  const quotas = await prisma.sessionQuota.findMany({
    where: { sessionId: session.id },
    include: { major: true }
  });
  
  for (const quota of quotas) {
    console.log(`\n📊 ${quota.major.code} - ${quota.admissionMethod}`);
    
    let newConditions: any = {};
    
    if (quota.admissionMethod === 'entrance_exam') {
      // entrance_exam hỗ trợ các khối: A00, A01, B00, C00
      newConditions = {
        subjectCombinations: [
          ['math', 'physics', 'chemistry'],  // A00
          ['math', 'physics', 'english'],    // A01
          ['math', 'chemistry', 'biology'],  // B00
          ['literature', 'history', 'geography']  // C00
        ],
        minTotalScore: 15.0,  // Điểm tối thiểu
        minSubjectScores: {},
        priorityBonus: {
          enabled: true,
          maxBonus: 2.0
        }
      };
    } else if (quota.admissionMethod === 'high_school_transcript') {
      // high_school_transcript hỗ trợ các khối D
      newConditions = {
        subjectCombinations: [
          ['math', 'literature', 'english'],  // D01
          ['math', 'chemistry', 'english'],   // D07
          ['math', 'biology', 'english'],     // D08
          ['math', 'geography', 'english'],   // D09
          ['math', 'history', 'english']      // D10
        ],
        minTotalScore: 15.0,
        minSubjectScores: {},
        priorityBonus: {
          enabled: true,
          maxBonus: 2.0
        }
      };
    }
    
    await prisma.sessionQuota.update({
      where: { id: quota.id },
      data: { conditions: newConditions }
    });
    
    console.log(`   ✅ Đã cập nhật conditions`);
    console.log(`   Tổ hợp mới: ${JSON.stringify(newConditions.subjectCombinations)}`);
  }
  
  console.log('\n\n✅ HOÀN TẤT! Bây giờ chạy lại filter để test.');
  
  await prisma.$disconnect();
}

fixQuotaConditions().catch(console.error);
