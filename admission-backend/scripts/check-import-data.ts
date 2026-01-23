import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImportData() {
  console.log('📊 Checking import data...\n');
  
  try {
    // Count students
    const studentCount = await prisma.student.count();
    console.log(`✅ Total students: ${studentCount}`);
    
    // Count applications
    const applicationCount = await prisma.application.count();
    console.log(`✅ Total applications: ${applicationCount}`);
    
    // Get latest students
    const latestStudents = await prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        applications: {
          include: {
            major: true,
            session: true,
          },
          orderBy: {
            preferencePriority: 'asc',
          }
        }
      }
    });
    
    console.log('\n📝 Latest 5 students:');
    for (const student of latestStudents) {
      console.log(`\n- ${student.fullName} (${student.idCard})`);
      console.log(`  Email: ${student.email || 'N/A'}`);
      console.log(`  Phone: ${student.phone || 'N/A'}`);
      console.log(`  Priority Points: ${student.priorityPoints}`);
      console.log(`  Created: ${student.createdAt.toISOString()}`);
      console.log(`  Applications: ${student.applications.length}`);
      
      for (const app of student.applications) {
        console.log(`    ${app.preferencePriority}. ${app.major.name} (${app.major.code})`);
        console.log(`       Method: ${app.admissionMethod}`);
        console.log(`       Session: ${app.session.name}`);
        console.log(`       Score: ${app.calculatedScore || 'N/A'}`);
        console.log(`       Status: ${app.admissionStatus}`);
      }
    }
    
    // Check sessions
    console.log('\n📅 Admission Sessions:');
    const sessions = await prisma.admissionSession.findMany({
      include: {
        _count: {
          select: {
            applications: true,
            quotas: true,
          }
        }
      }
    });
    
    for (const session of sessions) {
      console.log(`\n- ${session.name} (${session.year})`);
      console.log(`  Status: ${session.status}`);
      console.log(`  Applications: ${session._count.applications}`);
      console.log(`  Quotas: ${session._count.quotas}`);
    }
    
    // Check majors
    console.log('\n🎓 Majors:');
    const majors = await prisma.major.findMany({
      include: {
        _count: {
          select: {
            applications: true,
            quotas: true,
          }
        }
      }
    });
    
    for (const major of majors) {
      console.log(`\n- ${major.name} (${major.code})`);
      console.log(`  Active: ${major.isActive}`);
      console.log(`  Applications: ${major._count.applications}`);
      console.log(`  Quotas: ${major._count.quotas}`);
    }
    
    // Check quotas
    console.log('\n📊 Session Quotas:');
    const quotas = await prisma.sessionQuota.findMany({
      include: {
        session: true,
        major: true,
      }
    });
    
    for (const quota of quotas) {
      console.log(`\n- ${quota.session.name} → ${quota.major.name}`);
      console.log(`  Method: ${quota.admissionMethod}`);
      console.log(`  Quota: ${quota.quota}`);
      
      // Count applications for this quota
      const appCount = await prisma.application.count({
        where: {
          sessionId: quota.sessionId,
          majorId: quota.majorId,
          admissionMethod: quota.admissionMethod,
        }
      });
      console.log(`  Applications: ${appCount}`);
      console.log(`  Remaining: ${quota.quota - appCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImportData().catch(console.error);
