import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function analyzeIssue() {
  console.log('=== PHÂN TÍCH VẤN ĐỀ LỌC ===\n');
  
  const session = await prisma.admissionSession.findFirst();
  if (!session) {
    console.log('❌ Không có session');
    return;
  }
  
  const sessionId = session.id;
  console.log(`📅 Session: ${session.name} (${sessionId})\n`);
  
  // 1. Lấy quotas
  const quotas = await prisma.sessionQuota.findMany({
    where: { sessionId },
    include: { major: true }
  });
  
  console.log('📊 QUOTAS:');
  const quotaMap = new Map();
  quotas.forEach(q => {
    const key = `${q.majorId}-${q.admissionMethod}`;
    quotaMap.set(key, q);
    console.log(`  ✓ ${q.major.code} - ${q.admissionMethod}: Chỉ tiêu ${q.quota}`);
    const conditions = q.conditions as any;
    if (conditions?.subjectCombinations) {
      console.log(`    Tổ hợp: ${JSON.stringify(conditions.subjectCombinations)}`);
    }
  });
  
  // 2. Lấy applications
  const applications = await prisma.application.findMany({
    where: { sessionId },
    include: { student: true, major: true }
  });
  
  console.log(`\n📝 APPLICATIONS: ${applications.length} nguyện vọng\n`);
  
  // 3. Phân tích từng application
  let matchCount = 0;
  let noMatchCount = 0;
  
  applications.forEach(app => {
    const quotaKey = `${app.majorId}-${app.admissionMethod}`;
    const quota = quotaMap.get(quotaKey);
    
    console.log(`\n👤 ${app.student.fullName} -> ${app.major.code} (${app.admissionMethod})`);
    console.log(`   Điểm môn: ${JSON.stringify(app.subjectScores)}`);
    console.log(`   Điểm tính: ${app.calculatedScore}`);
    
    if (quota) {
      console.log(`   ✅ MATCH với quota: ${quota.major.code} - ${quota.admissionMethod}`);
      matchCount++;
      
      // Kiểm tra điều kiện
      const conditions = quota.conditions as any;
      if (conditions?.subjectCombinations) {
        const subjectScores = app.subjectScores as any;
        const hasValidCombo = conditions.subjectCombinations.some((combo: string[]) => {
          return combo.every((subject: string) => {
            return subjectScores[subject] !== undefined && 
                   subjectScores[subject] !== null &&
                   !isNaN(subjectScores[subject]);
          });
        });
        
        if (hasValidCombo) {
          console.log(`   ✅ Đủ điều kiện tổ hợp môn`);
        } else {
          console.log(`   ❌ KHÔNG đủ điều kiện tổ hợp môn`);
          console.log(`      Yêu cầu: ${JSON.stringify(conditions.subjectCombinations)}`);
          console.log(`      Có: ${Object.keys(subjectScores).filter(k => subjectScores[k] !== null)}`);
        }
      }
    } else {
      console.log(`   ❌ KHÔNG MATCH với bất kỳ quota nào!`);
      console.log(`      Tìm kiếm key: ${quotaKey}`);
      console.log(`      Các quota có sẵn:`);
      quotaMap.forEach((q, key) => {
        console.log(`        - ${key} (${q.major.code} - ${q.admissionMethod})`);
      });
      noMatchCount++;
    }
  });
  
  console.log('\n\n=== TÓM TẮT ===');
  console.log(`✅ Applications match với quota: ${matchCount}`);
  console.log(`❌ Applications KHÔNG match: ${noMatchCount}`);
  console.log(`📊 Tổng: ${applications.length}`);
  
  if (noMatchCount > 0) {
    console.log('\n🔴 VẤN ĐỀ CHÍNH:');
    console.log('   Applications sử dụng admissionMethod (block codes như A00, D01, B00)');
    console.log('   Nhưng Quotas sử dụng admissionMethod khác (entrance_exam, high_school_transcript)');
    console.log('\n💡 GIẢI PHÁP:');
    console.log('   1. Tạo quotas với admissionMethod = block codes (A00, A01, D01, etc.)');
    console.log('   2. HOẶC cập nhật applications để dùng entrance_exam/high_school_transcript');
  }
  
  await prisma.$disconnect();
}

analyzeIssue().catch(console.error);
