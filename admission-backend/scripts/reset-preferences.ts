import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Đang xóa toàn bộ dữ liệu nguyện vọng (Applications)...');
    // Xóa toàn bộ dữ liệu trong bảng applications
    const deleted = await prisma.application.deleteMany({});
    console.log(`✅ Đã xóa ${deleted.count} hồ sơ nguyện vọng.`);

    console.log('🔄 Đang khôi phục lại dữ liệu mẫu duy nhất...');

    // 1. Lấy thông tin đợt tuyển sinh đang active
    const session = await prisma.admissionSession.findFirst({
        where: { status: 'active' },
    });

    if (!session) {
        console.error('❌ Không tìm thấy đợt tuyển sinh nào đang hoạt động (active).');
        return;
    }

    // 2. Lấy thông tin ngành học
    const majorCNTT = await prisma.major.findUnique({ where: { code: '7480201' } }); // CNTT
    const majorKHMT = await prisma.major.findUnique({ where: { code: '7480101' } }); // KHMT

    if (!majorCNTT || !majorKHMT) {
        console.error('❌ Không tìm thấy mã ngành 7480201 (CNTT) hoặc 7480101 (KHMT).');
        return;
    }

    // 3. Lấy danh sách 5 sinh viên mẫu (dựa vào ID Card trong seed.ts)
    const studentIdCards = [
        '079102345678',
        '079102345679',
        '079102345680',
        '079102345681',
        '079102345682'
    ];

    const students = await prisma.student.findMany({
        where: { idCard: { in: studentIdCards } }
    });

    console.log(`📝 Tìm thấy ${students.length} sinh viên mẫu. Đang tạo nguyện vọng...`);

    // 4. Tạo lại nguyện vọng cho từng sinh viên
    let count = 0;
    for (const student of students) {
        // Nguyện vọng 1: CNTT - Khối A00
        await prisma.application.create({
            data: {
                studentId: student.id,
                sessionId: session.id,
                majorId: majorCNTT.id,
                admissionMethod: 'A00',
                preferencePriority: 1,
                subjectScores: student.scores as any,
                admissionStatus: 'pending',
            },
        });
        count++;

        // Nguyện vọng 2: KHMT - Khối D01
        await prisma.application.create({
            data: {
                studentId: student.id,
                sessionId: session.id,
                majorId: majorKHMT.id,
                admissionMethod: 'D01',
                preferencePriority: 2,
                subjectScores: student.scores as any,
                admissionStatus: 'pending',
            },
        });
        count++;
    }

    console.log(`✅ Đã khôi phục thành công ${count} nguyện vọng mẫu.`);
}

main()
    .catch((e) => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
