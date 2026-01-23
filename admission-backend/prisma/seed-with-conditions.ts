import { PrismaClient, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with quota conditions...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.application.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.sessionQuota.deleteMany({});
  await prisma.admissionSession.deleteMany({});
  await prisma.major.deleteMany({});
  console.log('✅ Cleared existing data');

  // 1. Create admission session
  const session = await prisma.admissionSession.create({
    data: {
      name: 'Tuyển sinh 2024 - Đợt 1',
      year: 2024,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      status: SessionStatus.active,
    },
  });
  console.log('✅ Created session:', session.name);

  // 2. Create majors
  const cntt = await prisma.major.create({
    data: {
      code: 'CNTT',
      name: 'Công nghệ thông tin',
      subjectCombinations: {
        blocks: ['A00', 'A01', 'D01'],
      },
      description: 'Ngành Công nghệ thông tin',
      isActive: true,
    },
  });

  const ktpm = await prisma.major.create({
    data: {
      code: 'KTPM',
      name: 'Kỹ thuật phần mềm',
      subjectCombinations: {
        blocks: ['A00', 'A01'],
      },
      description: 'Ngành Kỹ thuật phần mềm',
      isActive: true,
    },
  });

  const ktdt = await prisma.major.create({
    data: {
      code: 'KTDT',
      name: 'Kỹ thuật điện tử',
      subjectCombinations: {
        blocks: ['A00', 'A01'],
      },
      description: 'Ngành Kỹ thuật điện tử',
      isActive: true,
    },
  });

  console.log('✅ Created 3 majors');

  // 3. Create quotas with conditions - separate quota for each block
  // CNTT - Block A00
  await prisma.sessionQuota.create({
    data: {
      sessionId: session.id,
      majorId: cntt.id,
      admissionMethod: 'A00',
      quota: 40,
      conditions: {
        minTotalScore: 18.0,
        minSubjectScores: {
          math: 5.0,
        },
        subjectCombinations: [
          ['math', 'physics', 'chemistry'],
        ],
        priorityBonus: {
          enabled: true,
          maxBonus: 2.0,
        },
      },
    },
  });

  // CNTT - Block A01
  await prisma.sessionQuota.create({
    data: {
      sessionId: session.id,
      majorId: cntt.id,
      admissionMethod: 'A01',
      quota: 30,
      conditions: {
        minTotalScore: 18.0,
        minSubjectScores: {
          math: 5.0,
        },
        subjectCombinations: [
          ['math', 'physics', 'english'],
        ],
        priorityBonus: {
          enabled: true,
          maxBonus: 2.0,
        },
      },
    },
  });

  // CNTT - Block D01
  await prisma.sessionQuota.create({
    data: {
      sessionId: session.id,
      majorId: cntt.id,
      admissionMethod: 'D01',
      quota: 30,
      conditions: {
        minTotalScore: 18.0,
        minSubjectScores: {
          math: 5.0,
        },
        subjectCombinations: [
          ['math', 'literature', 'english'],
        ],
        priorityBonus: {
          enabled: true,
          maxBonus: 2.0,
        },
      },
    },
  });

  // KTPM - Block A00
  await prisma.sessionQuota.create({
    data: {
      sessionId: session.id,
      majorId: ktpm.id,
      admissionMethod: 'A00',
      quota: 40,
      conditions: {
        minTotalScore: 20.0,
        minSubjectScores: {
          math: 6.0,
        },
        subjectCombinations: [
          ['math', 'physics', 'chemistry'],
        ],
        priorityBonus: {
          enabled: true,
          maxBonus: 1.5,
        },
      },
    },
  });

  // KTPM - Block A01
  await prisma.sessionQuota.create({
    data: {
      sessionId: session.id,
      majorId: ktpm.id,
      admissionMethod: 'A01',
      quota: 30,
      conditions: {
        minTotalScore: 20.0,
        minSubjectScores: {
          math: 6.0,
        },
        subjectCombinations: [
          ['math', 'physics', 'english'],
        ],
        priorityBonus: {
          enabled: true,
          maxBonus: 1.5,
        },
      },
    },
  });

  // KTPM - Block D01
  await prisma.sessionQuota.create({
    data: {
      sessionId: session.id,
      majorId: ktpm.id,
      admissionMethod: 'D01',
      quota: 10,
      conditions: {
        minTotalScore: 20.0,
        minSubjectScores: {
          math: 6.0,
        },
        subjectCombinations: [
          ['math', 'literature', 'english'],
        ],
        priorityBonus: {
          enabled: true,
          maxBonus: 1.5,
        },
      },
    },
  });

  // KTDT - Block A00
  await prisma.sessionQuota.create({
    data: {
      sessionId: session.id,
      majorId: ktdt.id,
      admissionMethod: 'A00',
      quota: 40,
      conditions: {
        minTotalScore: 19.0,
        minSubjectScores: {
          math: 5.5,
          physics: 5.0,
        },
        subjectCombinations: [
          ['math', 'physics', 'chemistry'],
        ],
        priorityBonus: {
          enabled: true,
          maxBonus: 2.0,
        },
      },
    },
  });

  // KTDT - Block A01
  await prisma.sessionQuota.create({
    data: {
      sessionId: session.id,
      majorId: ktdt.id,
      admissionMethod: 'A01',
      quota: 20,
      conditions: {
        minTotalScore: 19.0,
        minSubjectScores: {
          math: 5.5,
          physics: 5.0,
        },
        subjectCombinations: [
          ['math', 'physics', 'english'],
        ],
        priorityBonus: {
          enabled: true,
          maxBonus: 2.0,
        },
      },
    },
  });

  console.log('✅ Created 8 quotas with conditions (separate for each block)');

  // 4. Create sample students với điểm đầy đủ theo tổ hợp
  const students: any[] = [];

  // Student 1: Điểm cao, tổ hợp A00 (Toán, Lý, Hóa)
  const student1 = await prisma.student.create({
    data: {
      idCard: '001234567890',
      fullName: 'Nguyễn Văn A',
      dateOfBirth: new Date('2006-01-15'),
      email: 'nguyenvana@example.com',
      phone: '0901234567',
      address: 'Hà Nội',
      priorityPoints: 0,
      sessionId: session.id,
      scores: {
        math: 9.0,
        physics: 8.5,
        chemistry: 8.0,
        biology: 7.0,
        literature: 7.5,
        english: 7.5,
        history: 6.5,
        geography: 6.0,
      },
    },
  });
  students.push(student1);

  // Student 2: Điểm trung bình, tổ hợp A00, có điểm ưu tiên
  const student2 = await prisma.student.create({
    data: {
      idCard: '001234567891',
      fullName: 'Trần Thị B',
      dateOfBirth: new Date('2006-03-20'),
      email: 'tranthib@example.com',
      phone: '0901234568',
      address: 'TP.HCM',
      priorityPoints: 2.0,
      sessionId: session.id,
      scores: {
        math: 7.0,
        physics: 6.5,
        chemistry: 6.0,
        biology: 6.0,
        literature: 6.5,
        english: 6.5,
        history: 5.5,
        geography: 5.0,
      },
    },
  });
  students.push(student2);

  // Student 3: Điểm cao, tổ hợp A01 (Toán, Lý, Anh)
  const student3 = await prisma.student.create({
    data: {
      idCard: '001234567892',
      fullName: 'Lê Văn C',
      dateOfBirth: new Date('2006-05-10'),
      email: 'levanc@example.com',
      phone: '0901234569',
      address: 'Đà Nẵng',
      priorityPoints: 0,
      sessionId: session.id,
      scores: {
        math: 9.5,
        physics: 9.0,
        chemistry: 7.0,
        biology: 6.5,
        literature: 7.0,
        english: 8.5,
        history: 6.0,
        geography: 5.5,
      },
    },
  });
  students.push(student3);

  // Student 4: Điểm thấp, không đủ điều kiện
  const student4 = await prisma.student.create({
    data: {
      idCard: '001234567893',
      fullName: 'Phạm Thị D',
      dateOfBirth: new Date('2006-07-25'),
      email: 'phamthid@example.com',
      phone: '0901234570',
      address: 'Cần Thơ',
      priorityPoints: 1.0,
      sessionId: session.id,
      scores: {
        math: 4.0,
        physics: 4.5,
        chemistry: 4.0,
        biology: 4.5,
        literature: 5.0,
        english: 5.0,
        history: 4.0,
        geography: 3.5,
      },
    },
  });
  students.push(student4);

  // Student 5: Điểm khá, tổ hợp A00, nhiều nguyện vọng
  const student5 = await prisma.student.create({
    data: {
      idCard: '001234567894',
      fullName: 'Hoàng Văn E',
      dateOfBirth: new Date('2006-09-12'),
      email: 'hoangvane@example.com',
      phone: '0901234571',
      address: 'Hải Phòng',
      priorityPoints: 0.5,
      sessionId: session.id,
      scores: {
        math: 8.5,
        physics: 8.0,
        chemistry: 7.5,
        biology: 7.0,
        literature: 7.5,
        english: 7.0,
        history: 6.5,
        geography: 6.0,
      },
    },
  });
  students.push(student5);

  // Student 6: Điểm cao, tổ hợp B00 (Toán, Hóa, Sinh)
  const student6 = await prisma.student.create({
    data: {
      idCard: '001234567895',
      fullName: 'Vũ Thị F',
      dateOfBirth: new Date('2006-11-05'),
      email: 'vuthif@example.com',
      phone: '0901234572',
      address: 'Huế',
      priorityPoints: 0,
      sessionId: session.id,
      scores: {
        math: 8.0,
        physics: 7.0,
        chemistry: 8.5,
        biology: 8.0,
        literature: 7.0,
        english: 6.5,
        history: 6.0,
        geography: 5.5,
      },
    },
  });
  students.push(student6);

  console.log('✅ Created 6 sample students');

  // 5. Create applications (preferences) với block và calculatedScore
  
  // Student 1: NV1=CNTT (A00), NV2=KTPM (A01), NV3=KTDT (A00)
  await prisma.application.create({
    data: {
      studentId: student1.id,
      sessionId: session.id,
      majorId: cntt.id,
      admissionMethod: 'A00', // Block code
      preferencePriority: 1,
      subjectScores: {
        math: 9.0,
        physics: 8.5,
        chemistry: 8.0,
      } as any,
      calculatedScore: 25.5, // 9.0 + 8.5 + 8.0
      admissionStatus: 'pending',
    },
  });

  await prisma.application.create({
    data: {
      studentId: student1.id,
      sessionId: session.id,
      majorId: ktpm.id,
      admissionMethod: 'A01', // Block code
      preferencePriority: 2,
      subjectScores: {
        math: 9.0,
        physics: 8.5,
        english: 7.5,
      } as any,
      calculatedScore: 25.0, // 9.0 + 8.5 + 7.5
      admissionStatus: 'pending',
    },
  });

  await prisma.application.create({
    data: {
      studentId: student1.id,
      sessionId: session.id,
      majorId: ktdt.id,
      admissionMethod: 'A00', // Block code
      preferencePriority: 3,
      subjectScores: {
        math: 9.0,
        physics: 8.5,
        chemistry: 8.0,
      } as any,
      calculatedScore: 25.5, // 9.0 + 8.5 + 8.0
      admissionStatus: 'pending',
    },
  });

  // Student 2: NV1=CNTT (D01), NV2=KTPM (D01)
  await prisma.application.create({
    data: {
      studentId: student2.id,
      sessionId: session.id,
      majorId: cntt.id,
      admissionMethod: 'D01', // Block code
      preferencePriority: 1,
      subjectScores: {
        math: 7.0,
        literature: 6.5,
        english: 6.5,
      } as any,
      calculatedScore: 22.0, // 7.0 + 6.5 + 6.5 + 2.0 (priority)
      admissionStatus: 'pending',
    },
  });

  await prisma.application.create({
    data: {
      studentId: student2.id,
      sessionId: session.id,
      majorId: ktpm.id,
      admissionMethod: 'D01', // Block code
      preferencePriority: 2,
      subjectScores: {
        math: 7.0,
        literature: 6.5,
        english: 6.5,
      } as any,
      calculatedScore: 21.5, // 7.0 + 6.5 + 6.5 + min(2.0, 1.5) = 21.5
      admissionStatus: 'pending',
    },
  });

  // Student 3: NV1=CNTT (A00), NV2=KTPM (A01)
  await prisma.application.create({
    data: {
      studentId: student3.id,
      sessionId: session.id,
      majorId: cntt.id,
      admissionMethod: 'A00', // Block code
      preferencePriority: 1,
      subjectScores: {
        math: 9.5,
        physics: 9.0,
        chemistry: 7.0,
      } as any,
      calculatedScore: 25.5, // 9.5 + 9.0 + 7.0
      admissionStatus: 'pending',
    },
  });

  await prisma.application.create({
    data: {
      studentId: student3.id,
      sessionId: session.id,
      majorId: ktpm.id,
      admissionMethod: 'A01', // Block code
      preferencePriority: 2,
      subjectScores: {
        math: 9.5,
        physics: 9.0,
        english: 8.5,
      } as any,
      calculatedScore: 27.0, // 9.5 + 9.0 + 8.5
      admissionStatus: 'pending',
    },
  });

  // Student 4: NV1=CNTT (C00)
  await prisma.application.create({
    data: {
      studentId: student4.id,
      sessionId: session.id,
      majorId: cntt.id,
      admissionMethod: 'C00', // Block code
      preferencePriority: 1,
      subjectScores: {
        literature: 5.0,
        history: 4.0,
        geography: 3.5,
      } as any,
      calculatedScore: null, // Not eligible - wrong block
      admissionStatus: 'not_admitted',
    },
  });

  // Student 5: NV1=CNTT (A00), NV2=KTPM (B00), NV3=KTDT (A00)
  await prisma.application.create({
    data: {
      studentId: student5.id,
      sessionId: session.id,
      majorId: cntt.id,
      admissionMethod: 'A00', // Block code
      preferencePriority: 1,
      subjectScores: {
        math: 8.5,
        physics: 8.0,
        chemistry: 7.5,
      } as any,
      calculatedScore: 24.5, // 8.5 + 8.0 + 7.5 + 0.5 (priority)
      admissionStatus: 'pending',
    },
  });

  await prisma.application.create({
    data: {
      studentId: student5.id,
      sessionId: session.id,
      majorId: ktpm.id,
      admissionMethod: 'B00', // Block code
      preferencePriority: 2,
      subjectScores: {
        math: 8.5,
        chemistry: 7.5,
        biology: 7.0,
      } as any,
      calculatedScore: null, // Not eligible - wrong block
      admissionStatus: 'not_admitted',
    },
  });

  await prisma.application.create({
    data: {
      studentId: student5.id,
      sessionId: session.id,
      majorId: ktdt.id,
      admissionMethod: 'A00', // Block code
      preferencePriority: 3,
      subjectScores: {
        math: 8.5,
        physics: 8.0,
        chemistry: 7.5,
      } as any,
      calculatedScore: 24.5, // 8.5 + 8.0 + 7.5 + 0.5 (priority)
      admissionStatus: 'pending',
    },
  });

  // Student 6: NV1=CNTT (B00)
  await prisma.application.create({
    data: {
      studentId: student6.id,
      sessionId: session.id,
      majorId: cntt.id,
      admissionMethod: 'B00', // Block code
      preferencePriority: 1,
      subjectScores: {
        math: 8.0,
        chemistry: 8.5,
        biology: 8.0,
      } as any,
      calculatedScore: null, // Not eligible - wrong block
      admissionStatus: 'not_admitted',
    },
  });

  console.log('✅ Created applications (preferences) with correct blocks');

  console.log('\n📊 Summary:');
  console.log(`Session ID: ${session.id}`);
  console.log(`Majors: CNTT (${cntt.id}), KTPM (${ktpm.id}), KTDT (${ktdt.id})`);
  console.log(`Students: ${students.length}`);
  console.log(`Quotas: 8 (separate for each major-block combination)`);
  console.log(`  - CNTT: A00(40), A01(30), D01(30)`);
  console.log(`  - KTPM: A00(40), A01(30), D01(10)`);
  console.log(`  - KTDT: A00(40), A01(20)`);
  console.log(`\n📝 Student Details:`);
  console.log(`  Student 1: NV1=CNTT(A00: 9.0+8.5+8.0=25.5), NV2=KTPM(A01: 9.0+8.5+7.5=25.0), NV3=KTDT(A00)`);
  console.log(`  Student 2: NV1=CNTT(D01: 7.0+6.5+6.5=20.0+2.0ưu tiên=22.0), NV2=KTPM(D01)`);
  console.log(`  Student 3: NV1=CNTT(A00: 9.5+9.0+7.0=25.5), NV2=KTPM(A01: 9.5+9.0+8.5=27.0)`);
  console.log(`  Student 4: NV1=CNTT(C00: Văn+Sử+Địa) - Không đúng tổ hợp`);
  console.log(`  Student 5: NV1=CNTT(A00: 8.5+8.0+7.5=24.0+0.5=24.5), NV2=KTPM(B00), NV3=KTDT(A00)`);
  console.log(`  Student 6: NV1=CNTT(B00: Toán+Hóa+Sinh) - Không đúng tổ hợp`);
  console.log(`\n🎯 To run filter: POST /filter/run/${session.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
