import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Đang dọn dẹp và reset toàn bộ Cấu hình (Formulas & Quotas)...');

    // 1. Xóa dữ liệu cũ
    // Cần xóa SessionQuota trước vì có Foreign Key tới AdmissionFormula
    console.log('   - Xóa SessionQuota...');
    await prisma.sessionQuota.deleteMany({});

    console.log('   - Xóa AdmissionFormula...');
    await prisma.admissionFormula.deleteMany({});

    // 2. Tạo Formula chuẩn (Clean)
    console.log('🧪 Đang tạo 3 Công thức xét tuyển chuẩn...');

    // Formula 1: A00 Toán nhân đôi
    const f1 = await prisma.admissionFormula.create({
        data: {
            name: 'Khối A00 (Toán hệ số 2)',
            description: 'Dành cho các ngành kỹ thuật: Toánx2 + Lý + Hóa (+ Điểm ưu tiên tự động)',
            formula: 'math * 2 + physics + chemistry', // Đã tách priorityPoints để tính riêng theo quy chế
        }
    });

    // Formula 2: Trung bình 3 môn
    const f2 = await prisma.admissionFormula.create({
        data: {
            name: 'Xét tuyển Học bạ (Trung bình 3 môn)',
            description: 'Lấy điểm trung bình cộng 3 môn: (Toán + Lý + Anh) / 3',
            formula: '(math + physics + english) / 3',
        }
    });

    // Formula 3: Max (A00, D01)
    const f3 = await prisma.admissionFormula.create({
        data: {
            name: 'Tối ưu tổ hợp (A00 hoặc D01)',
            description: 'Tự động lấy điểm cao nhất giữa tổ hợp A00 và D01',
            formula: 'max(math + physics + chemistry, math + literature + english)',
        }
    });

    console.log('✅ Đã tạo 3 công thức.');

    // 3. Cấu hình Quota cho Đợt tuyển sinh Active
    const session = await prisma.admissionSession.findFirst({
        where: { status: 'active' },
    });

    if (!session) {
        console.log('⚠️ Không tìm thấy Đợt tuyển sinh Active. Chỉ reset công thức.');
        return;
    }

    const majors = await prisma.major.findMany();
    console.log(`📝 Đang cấu hình chỉ tiêu cho ${majors.length} ngành thuộc đợt "${session.name}"...`);

    for (const major of majors) {
        let selectedFormula = f1; // Default
        let targetQuota = 50;
        let minTotalScore = 15.0;
        let subjectCombinations = ['math', 'physics', 'chemistry']; // Default A00

        // Logic chọn công thức theo mã ngành (Giả lập)
        if (['7480201', '7480101'].includes(major.code)) {
            // CNTT, KHMT -> Dùng logic Max hoặc A00
            selectedFormula = f3;
            targetQuota = 100;
            minTotalScore = 20.0;
            subjectCombinations = ['math', 'physics', 'chemistry', 'literature', 'english']; // Cần đủ môn cho cả 2 tổ hợp
        } else {
            // Các ngành khác -> Dùng A00 hoặc TB
            selectedFormula = f1;
        }

        await prisma.sessionQuota.create({
            data: {
                sessionId: session.id,
                majorId: major.id,
                formulaId: selectedFormula.id,
                quota: targetQuota,
                conditions: {
                    minTotalScore: minTotalScore,
                    priorityBonus: { enabled: true, maxBonus: 2.75 },
                    minSubjectScores: {
                        math: 1.0, physics: 1.0, chemistry: 1.0, literature: 1.0, english: 1.0
                    },
                    subjectCombinations: [
                        ['math', 'physics', 'chemistry'],
                        ['math', 'literature', 'english']
                    ]
                }
            }
        });
    }

    console.log('✨ HOÀN TẤT RESET CẤU HÌNH (FORMULAS + QUOTAS) ✨');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
