import { PrismaClient, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Đang xử lý dọn dẹp các Đợt tuyển sinh (Admissions Sessions)...');

    // 1. Tìm đợt tuyển sinh "chuẩn" để giữ lại
    // Ưu tiên đợt đang Active
    let keeperSession = await prisma.admissionSession.findFirst({
        where: { status: SessionStatus.active },
        orderBy: { createdAt: 'desc' } // Lấy cái mới nhất làm chuẩn
    });

    // Nếu không có, tạo mới
    if (!keeperSession) {
        console.log('⚠️ Không tìm thấy đợt tuyển sinh Active nào. Đang tạo mới...');
        const currentYear = new Date().getFullYear();
        keeperSession = await prisma.admissionSession.create({
            data: {
                name: `Tuyển sinh Khóa ${currentYear} - Đợt 1`,
                year: currentYear,
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                status: SessionStatus.active,
            },
        });
    }

    console.log(`🎯 Đợt tuyển sinh được chọn làm CHÍNH: ${keeperSession.name} (${keeperSession.id})`);

    // 2. Tìm tất cả các đợt tuyển sinh KHÁC cần xóa
    const sessionsToDelete = await prisma.admissionSession.findMany({
        where: {
            id: { not: keeperSession.id }
        }
    });

    if (sessionsToDelete.length === 0) {
        console.log('✅ Không có đợt tuyển sinh dư thừa nào.');
        return;
    }

    console.log(`found ${sessionsToDelete.length} đợt tuyển sinh dư thừa. Đang gộp dữ liệu...`);

    const sessionIdsToDelete = sessionsToDelete.map(s => s.id);

    // 3. Di chuyển Students sang đợt tuyển sinh CHÍNH
    const updatedStudents = await prisma.student.updateMany({
        where: { sessionId: { in: sessionIdsToDelete } },
        data: { sessionId: keeperSession.id }
    });
    console.log(`Moved ${updatedStudents.count} sinh viên về đợt chính.`);

    // 4. Di chuyển Applications sang đợt tuyển sinh CHÍNH
    // Lưu ý: Application có ràng buộc unique [studentId, sessionId, preferencePriority]
    // Nếu di chuyển mà gây trùng lặp thì phải xử lý (xóa cái cũ đi)

    // Cách đơn giản nhất: Lặp qua và update từng cái, nếu lỗi thì xóa cái đang bị duplicate ở session cũ
    const appsToMove = await prisma.application.findMany({
        where: { sessionId: { in: sessionIdsToDelete } }
    });

    let movedApps = 0;
    let deletedApps = 0;

    for (const app of appsToMove) {
        try {
            await prisma.application.update({
                where: { id: app.id },
                data: { sessionId: keeperSession.id }
            });
            movedApps++;
        } catch (e) {
            // Nếu lỗi (thường là duplicate unique constraint), nghĩa là sinh viên này đã có hồ sơ tương tự ở session chính rồi
            // Ta xóa hồ sơ dư thừa này đi
            await prisma.application.delete({ where: { id: app.id } });
            deletedApps++;
        }
    }
    console.log(`Applications: Đã di chuyển ${movedApps}, đã xóa ${deletedApps} bản ghi trùng lặp.`);

    // 5. Xóa các đợt tuyển sinh dư thừa
    // SessionQuota sẽ tự động cascade delete (dựa theo schema on delete cascade)
    const deletedSessions = await prisma.admissionSession.deleteMany({
        where: { id: { in: sessionIdsToDelete } }
    });
    console.log(`🗑️ Đã xóa ${deletedSessions.count} đợt tuyển sinh dư thừa.`);

    // 6. Đảm bảo SessionQuota cho đợt chính
    // Copy logic từ seed.ts để đảm bảo có quotas
    console.log('🔧 Đang kiểm tra và tái tạo Session Quotas cho đợt chính...');

    const majors = await prisma.major.findMany();
    const formulaA00 = await prisma.admissionFormula.findFirst({ where: { formula: { contains: 'math * 2' } } }); // Tìm công thức A00
    const formulaD01 = await prisma.admissionFormula.findFirst({ where: { formula: { contains: 'literature' } } }); // Tìm công thức D01
    // Fallback formula
    const defaultFormula = formulaA00 || formulaD01 || (await prisma.admissionFormula.findFirst());

    if (!defaultFormula) {
        console.log('⚠️ Không tìm thấy công thức tính điểm nào. Bỏ qua tạo Quota.');
    } else {
        for (const major of majors) {
            // Upsert quota
            await prisma.sessionQuota.upsert({
                where: {
                    sessionId_majorId: {
                        sessionId: keeperSession.id,
                        majorId: major.id
                    }
                },
                update: {}, // Đã tồn tại thì giữ nguyên
                create: {
                    sessionId: keeperSession.id,
                    majorId: major.id,
                    formulaId: defaultFormula.id,
                    quota: major.code === '7480201' ? 100 : 50,
                    conditions: {
                        minTotalScore: 18.0
                    }
                }
            });
        }
        console.log('✅ Đã cấu hình đầy đủ chỉ tiêu.');
    }

    console.log('✨ HOÀN TẤT DỌN DẸP ĐỢT TUYỂN SINH ✨');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
