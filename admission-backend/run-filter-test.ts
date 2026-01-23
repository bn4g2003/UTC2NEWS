import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { VirtualFilterService } from './src/filter/virtual-filter.service';

async function runFilterTest() {
  console.log('=== CHẠY FILTER TEST ===\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const filterService = app.get(VirtualFilterService);
  
  const sessionId = '606fc914-b151-4eaf-918d-1c7a7dfc22a1';
  
  console.log(`🎯 Chạy filter cho session: ${sessionId}\n`);
  
  try {
    const result = await filterService.runFilter(sessionId);
    
    console.log('✅ FILTER HOÀN TẤT!\n');
    console.log(`📊 Kết quả:`);
    console.log(`   - Tổng sinh viên: ${result.totalStudents}`);
    console.log(`   - Số sinh viên đậu: ${result.admittedCount}`);
    console.log(`   - Thời gian thực thi: ${result.executionTime}ms`);
    console.log(`   - Tỷ lệ đậu: ${((result.admittedCount / result.totalStudents) * 100).toFixed(1)}%`);
    
    // Show admitted students
    const admitted = result.decisions.filter(d => d.status === 'admitted');
    console.log(`\n👥 Danh sách sinh viên đậu:`);
    
    // Group by student
    const studentMap = new Map<string, any[]>();
    admitted.forEach(d => {
      if (!studentMap.has(d.studentId)) {
        studentMap.set(d.studentId, []);
      }
      studentMap.get(d.studentId)!.push(d);
    });
    
    let index = 1;
    for (const [studentId, decisions] of studentMap.entries()) {
      const decision = decisions[0]; // Should only be one per student
      console.log(`   ${index}. Student ID: ${studentId.substring(0, 8)}... → NV${decision.admittedPreference}`);
      index++;
    }
    
  } catch (error) {
    console.error('❌ LỖI:', error.message);
    console.error(error.stack);
  }
  
  await app.close();
}

runFilterTest().catch(console.error);
