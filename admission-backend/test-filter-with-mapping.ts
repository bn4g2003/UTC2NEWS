import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testFilterWithMapping() {
  console.log('=== TEST FILTER VỚI BLOCK → METHOD MAPPING ===\n');
  
  const session = await prisma.admissionSession.findFirst();
  if (!session) {
    console.log('❌ Không có session');
    return;
  }
  
  const sessionId = session.id;
  console.log(`📅 Session: ${session.name}\n`);
  
  // 1. Quotas
  const quotas = await prisma.sessionQuota.findMany({
    where: { sessionId },
    include: { major: true }
  });
  
  console.log('📊 QUOTAS (Phương thức tuyển sinh):');
  quotas.forEach(q => {
    console.log(`  ${q.major.code} - ${q.admissionMethod}: Chỉ tiêu ${q.quota}`);
  });
  
  // 2. Applications
  const applications = await prisma.application.findMany({
    where: { sessionId },
    include: { student: true, major: true },
    orderBy: [
      { calculatedScore: 'desc' }
    ]
  });
  
  console.log(`\n📝 APPLICATIONS (Khối thi):`);
  
  // Mapping function
  function mapBlockToMethod(block: string): string {
    const blockUpper = block.toUpperCase();
    if (['A00', 'A01', 'B00', 'C00'].includes(blockUpper)) {
      return 'entrance_exam';
    }
    if (['D01', 'D07', 'D08', 'D09', 'D10'].includes(blockUpper)) {
      return 'high_school_transcript';
    }
    return 'entrance_exam';
  }
  
  // Group by major and mapped method
  const quotaMap = new Map<string, any>();
  quotas.forEach(q => {
    const key = `${q.majorId}-${q.admissionMethod}`;
    quotaMap.set(key, q);
  });
  
  let matchCount = 0;
  let eligibleCount = 0;
  
  applications.forEach(app => {
    const mappedMethod = mapBlockToMethod(app.admissionMethod);
    const quotaKey = `${app.majorId}-${mappedMethod}`;
    const quota = quotaMap.get(quotaKey);
    
    const match = quota ? '✅' : '❌';
    const eligible = app.calculatedScore && Number(app.calculatedScore) > 0 ? '✅' : '❌';
    
    if (quota) matchCount++;
    if (app.calculatedScore && Number(app.calculatedScore) > 0) eligibleCount++;
    
    console.log(`  ${match} ${app.student.fullName} -> ${app.major.code} (${app.admissionMethod})`);
    console.log(`     Block: ${app.admissionMethod} → Method: ${mappedMethod}`);
    console.log(`     Điểm: ${app.calculatedScore} ${eligible}`);
    console.log(`     Quota: ${quota ? `${quota.major.code}-${quota.admissionMethod} (${quota.quota} chỗ)` : 'KHÔNG TÌM THẤY'}`);
  });
  
  console.log('\n=== TÓM TẮT ===');
  console.log(`✅ Applications match với quota: ${matchCount}/${applications.length}`);
  console.log(`✅ Applications đủ điều kiện (score > 0): ${eligibleCount}/${applications.length}`);
  console.log(`🎯 Có thể đậu: ${Math.min(matchCount, eligibleCount)}`);
  
  if (matchCount > 0 && eligibleCount > 0) {
    console.log('\n✅ LOGIC MAPPING HOẠT ĐỘNG!');
    console.log('   Bây giờ có thể chạy filter để xem kết quả thực tế.');
    console.log(`   Command: curl -X POST http://localhost:3000/filter/run/${sessionId}`);
  } else {
    console.log('\n❌ VẪN CÒN VẤN ĐỀ:');
    if (matchCount === 0) {
      console.log('   - Không có application nào match với quota');
    }
    if (eligibleCount === 0) {
      console.log('   - Không có application nào đủ điều kiện (điểm = 0)');
    }
  }
  
  await prisma.$disconnect();
}

testFilterWithMapping().catch(console.error);
