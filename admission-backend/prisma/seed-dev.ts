import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting development data seeding...');

  // Create sample majors
  console.log('Creating sample majors...');
  const majors = [
    {
      code: 'CS01',
      name: 'Computer Science',
      subjectCombinations: JSON.stringify([
        ['math', 'physics', 'chemistry'],
        ['math', 'physics', 'english'],
      ]),
      description: 'Bachelor of Computer Science program',
      isActive: true,
    },
    {
      code: 'EE01',
      name: 'Electrical Engineering',
      subjectCombinations: JSON.stringify([
        ['math', 'physics', 'chemistry'],
        ['math', 'physics', 'english'],
      ]),
      description: 'Bachelor of Electrical Engineering program',
      isActive: true,
    },
    {
      code: 'ME01',
      name: 'Mechanical Engineering',
      subjectCombinations: JSON.stringify([
        ['math', 'physics', 'chemistry'],
      ]),
      description: 'Bachelor of Mechanical Engineering program',
      isActive: true,
    },
    {
      code: 'BA01',
      name: 'Business Administration',
      subjectCombinations: JSON.stringify([
        ['math', 'literature', 'english'],
        ['math', 'history', 'geography'],
      ]),
      description: 'Bachelor of Business Administration program',
      isActive: true,
    },
    {
      code: 'EN01',
      name: 'English Language',
      subjectCombinations: JSON.stringify([
        ['literature', 'english', 'history'],
        ['math', 'literature', 'english'],
      ]),
      description: 'Bachelor of English Language program',
      isActive: true,
    },
  ];

  const createdMajors: Array<{ id: string; code: string; name: string }> = [];
  for (const major of majors) {
    const created = await prisma.major.upsert({
      where: { code: major.code },
      update: {},
      create: major,
    });
    createdMajors.push(created);
    console.log(`  Created major: ${created.code} - ${created.name}`);
  }

  // Create sample admission session
  console.log('Creating sample admission session...');
  const currentYear = new Date().getFullYear();
  const session = await prisma.admissionSession.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: `Round 1 - ${currentYear}`,
      year: currentYear,
      startDate: new Date(`${currentYear}-06-01`),
      endDate: new Date(`${currentYear}-08-31`),
      status: 'active',
    },
  });
  console.log(`  Created session: ${session.name}`);

  // Create sample quotas for each major
  console.log('Creating sample quotas...');
  const admissionMethods = ['entrance_exam', 'high_school_transcript', 'direct_admission'];
  
  for (const major of createdMajors) {
    for (const method of admissionMethods) {
      let quota = 0;
      
      // Set different quotas based on method
      if (method === 'entrance_exam') {
        quota = 50; // 50 students via entrance exam
      } else if (method === 'high_school_transcript') {
        quota = 30; // 30 students via high school transcript
      } else if (method === 'direct_admission') {
        quota = 10; // 10 students via direct admission
      }

      await prisma.sessionQuota.upsert({
        where: {
          sessionId_majorId_admissionMethod: {
            sessionId: session.id,
            majorId: major.id,
            admissionMethod: method,
          },
        },
        update: {},
        create: {
          sessionId: session.id,
          majorId: major.id,
          admissionMethod: method,
          quota: quota,
        },
      });
      console.log(`  Created quota: ${major.code} - ${method} - ${quota} students`);
    }
  }

  console.log('\n=== Development data seeding completed successfully ===');
  console.log(`Created ${createdMajors.length} majors`);
  console.log(`Created 1 admission session`);
  console.log(`Created ${createdMajors.length * admissionMethods.length} quotas`);
}

main()
  .catch((e) => {
    console.error('Error during development seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
