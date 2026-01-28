import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Đang cấu hình lại Chỉ tiêu & Điều kiện tuyển sinh (Quotas)...');

    // 1. Lấy đợt tuyển sinh Active
    const session = await prisma.admissionSession.findFirst({
        where: { status: 'active' },
    });

    if (!session) {
        console.error('❌ Không tìm thấy Đợt tuyển sinh đang hoạt động (Active). Vui lòng kiểm tra lại.');
        return;
    }

    console.log(`🎯 Đã chọn Đợt: ${session.name} (${session.id})`);

    // 2. Lấy danh sách ngành
    const majors = await prisma.major.findMany();
    if (majors.length === 0) {
        console.log('⚠️ Không tìm thấy ngành học nào.');
        return;
    }

    // 3. Lấy công thức xét tuyển
    // Cố gắng tìm công thức chuẩn A00 (Toán-Lý-Hóa) và D01 (Toán-Văn-Anh)
    // Nếu không tìm thấy code chính xác, tìm theo nội dung công thức
    let formulaA00 = await prisma.admissionFormula.findFirst({
        where: { name: { contains: 'A00' } }
    });

    let formulaD01 = await prisma.admissionFormula.findFirst({
        where: { name: { contains: 'D01' } }
    });

    // Fallback nếu chưa có công thức nào
    if (!formulaA00 || !formulaD01) {
        console.log('⚠️ Không tìm thấy công thức A00/D01 chuẩn. Đang lấy công thức đầu tiên làm mặc định.');
        formulaA00 = await prisma.admissionFormula.findFirst();
        formulaD01 = formulaA00;
    }

    if (!formulaA00) {
        console.error('❌ Hệ thống chưa có bất kỳ công thức tính điểm nào. Vui lòng Seed dữ liệu công thức trước.');
        return;
    }

    // 4. Xóa cấu hình cũ của đợt này
    console.log('🗑️  Đang xóa cấu hình chỉ tiêu (Quotas) cũ...');
    await prisma.sessionQuota.deleteMany({
        where: { sessionId: session.id }
    });

    // 5. Tạo cấu hình mới
    console.log('📝 Đang tạo cấu hình mới...');

    for (const major of majors) {
        // Logic giả định: 
        // - Ngành CNTT (7480201), KHMT (7480101): Dùng A00, Điểm sàn cao (20.0), Chỉ tiêu lớn
        // - Các ngành khác: Dùng D01, Điểm sàn thấp hơn (15.0), Chỉ tiêu nhỏ

        const isTechMajor = ['7480201', '7480101'].includes(major.code);

        const targetQuota = isTechMajor ? 100 : 50;
        const minTotalScore = isTechMajor ? 20.0 : 15.0; // Điểm sàn (đã bao gồm điểm ưu tiên theo logic mới)
        const formula = isTechMajor ? formulaA00 : formulaD01;

        // Định nghĩa tổ hợp môn để kiểm tra điểm liệt
        const subjectCombination = isTechMajor
            ? ['math', 'physics', 'chemistry']
            : ['math', 'literature', 'english'];

        await prisma.sessionQuota.create({
            data: {
                sessionId: session.id,
                majorId: major.id,
                formulaId: formula!.id,
                quota: targetQuota,
                conditions: {
                    // Điều kiện điểm sàn (Tổng điểm >= X)
                    minTotalScore: minTotalScore,

                    // Điều kiện điểm liệt (Không môn nào < 1.0)
                    minSubjectScores: {
                        math: 1.0,
                        literature: 1.0,
                        english: 1.0,
                        physics: 1.0,
                        chemistry: 1.0
                    },

                    // Cấu hình điểm ưu tiên
                    priorityBonus: {
                        enabled: true,    // BẬT tính điểm ưu tiên
                        maxBonus: 2.75    // Mức cộng tối đa (nếu muốn giới hạn)
                    },

                    // Tổ hợp môn hợp lệ (để tính tổng)
                    subjectCombinations: [subjectCombination]
                }
            }
        });

        console.log(`✅ ${major.code} - ${major.name}: Chỉ tiêu ${targetQuota}, Sàn ${minTotalScore}, Công thức ${formula?.name || 'Default'}`);
    }

    console.log('\n✨ HOÀN TẤT CẤU HÌNH CHỈ TIÊU TUYỂN SINH ✨');
    console.log('👉 Bây giờ bạn có thể thử Lọc ảo để thấy kết quả chính xác theo cấu hình mới.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
