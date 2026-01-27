import { PrismaClient, SessionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu quá trình Seeding dữ liệu hệ thống (Tiếng Việt)...');

  // 1. Tạo các quyền hệ thống (Permissions)
  console.log('🔑 Đang tạo danh sách quyền hạn...');
  const permissions = [
    // Quản lý người dùng
    { name: 'users:create', description: 'Tạo tài khoản người dùng mới' },
    { name: 'users:read', description: 'Xem thông tin người dùng' },
    { name: 'users:update', description: 'Cập nhật thông tin người dùng' },
    { name: 'users:delete', description: 'Xóa tài khoản người dùng' },
    { name: 'users:update_status', description: 'Kích hoạt/Khóa người dùng' },
    { name: 'users:update_password', description: 'Thay đổi mật khẩu người dùng' },
    { name: 'roles:create', description: 'Tạo vai trò mới' },
    { name: 'roles:read', description: 'Xem danh sách vai trò' },
    { name: 'roles:update', description: 'Cập nhật vai trò' },
    { name: 'roles:delete', description: 'Xóa vai trò' },
    { name: 'roles:assign', description: 'Gán vai trò cho người dùng' },
    { name: 'permissions:read', description: 'Xem danh sách quyền' },
    { name: 'permissions:assign', description: 'Gán quyền cho vai trò' },

    // Quản lý sinh viên & Nguyện vọng
    { name: 'students:create', description: 'Tạo hồ sơ thí sinh' },
    { name: 'students:read', description: 'Xem thông tin thí sinh' },
    { name: 'students:update', description: 'Cập nhật hồ sơ thí sinh' },
    { name: 'students:delete', description: 'Xóa hồ sơ thí sinh' },
    { name: 'preferences:manage', description: 'Quản lý nguyện vọng của thí sinh' },

    // Quản lý Đào tạo & Tuyển sinh
    { name: 'majors:create', description: 'Tạo ngành học mới' },
    { name: 'majors:read', description: 'Xem danh sách ngành học' },
    { name: 'majors:update', description: 'Cập nhật thông tin ngành' },
    { name: 'majors:delete', description: 'Xóa ngành học' },
    { name: 'admission_sessions:create', description: 'Tạo đợt tuyển sinh mới' },
    { name: 'admission_sessions:read', description: 'Xem danh sách đợt tuyển sinh' },
    { name: 'admission_sessions:update', description: 'Cập nhật đợt tuyển sinh' },
    { name: 'admission_sessions:delete', description: 'Xóa đợt tuyển sinh' },
    { name: 'quotas:create', description: 'Cấu hình chỉ tiêu tuyển sinh' },
    { name: 'quotas:read', description: 'Xem chỉ tiêu & điều kiện' },
    { name: 'quotas:update', description: 'Cập nhật chỉ tiêu' },
    { name: 'quotas:delete', description: 'Xóa cấu hình chỉ tiêu' },
    { name: 'formulas:manage', description: 'Quản lý công thức tính điểm' },

    // Vận hành Dữ liệu
    { name: 'import:execute', description: 'Thực hiện Import dữ liệu từ Excel' },
    { name: 'filter:execute', description: 'Chạy thuật toán lọc ảo trúng tuyển' },
    { name: 'results:read', description: 'Xem kết quả trúng tuyển' },
    { name: 'results:export', description: 'Xuất kết quả (Excel/PDF)' },

    // Truyền thông & Thông báo
    { name: 'emails:send', description: 'Gửi thông báo email' },
    { name: 'emails:read', description: 'Xem trạng thái gửi email' },

    // Nội dung CMS
    { name: 'posts:create', description: 'Tạo bài viết mới' },
    { name: 'posts:read', description: 'Xem bài viết' },
    { name: 'posts:update', description: 'Cập nhật bài viết' },
    { name: 'posts:delete', description: 'Xóa bài viết' },
    { name: 'posts:publish', description: 'Phê duyệt/Xuất bản bài viết' },
    { name: 'categories:create', description: 'Tạo danh mục nội dung' },
    { name: 'categories:read', description: 'Xem danh mục' },
    { name: 'media:upload', description: 'Tải lên tệp tin media' },

    // Cấu hình hệ thống
    { name: 'config:read', description: 'Xem cấu hình hệ thống' },
    { name: 'config:update', description: 'Cập nhật cấu hình hệ thống' },
  ];

  const createdPermissions: any[] = [];
  for (const p of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: p.name },
      update: { description: p.description },
      create: p,
    });
    createdPermissions.push(created);
  }
  console.log(`✅ Đã nạp ${createdPermissions.length} quyền.`);

  // 2. Tạo vai trò Admin
  console.log('👥 Đang tạo vai trò Quản trị viên...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { description: 'Quản trị viên toàn quyền hệ thống' },
    create: {
      name: 'admin',
      description: 'Quản trị viên toàn quyền hệ thống',
    },
  });

  // Gán tất cả quyền cho Admin
  for (const p of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }
  console.log('✅ Đã gán toàn quyền cho vai trò Admin.');

  // 3. Tạo tài khoản Admin mặc định
  console.log('👤 Đang tạo tài khoản Admin...');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { fullName: 'Quản trị viên Hệ thống' },
    create: {
      username: 'admin',
      email: 'admin@admission.edu.vn',
      fullName: 'Quản trị viên Hệ thống',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });
  console.log(`✅ Admin User: admin / ${adminPassword}`);

  // 4. Tạo Ngành học thực tế
  console.log('🎓 Đang tạo danh sách ngành học...');
  const majorsData = [
    { code: '7480201', name: 'Công nghệ thông tin', description: 'Ngành học về phần mềm, mạng máy tính và bảo mật' },
    { code: '7480101', name: 'Khoa học máy tính', description: 'Tập trung vào thuật toán và trí tuệ nhân tạo' },
    { code: '7520103', name: 'Kỹ thuật cơ khí', description: 'Thiết kế và vận hành các hệ thống máy móc' },
    { code: '7520201', name: 'Kỹ thuật điện', description: 'Kỹ thuật điện và năng lượng tái tạo' },
    { code: '7340101', name: 'Quản trị kinh doanh', description: 'Quản lý doanh nghiệp và khởi nghiệp' },
  ];

  const majors: any[] = [];
  for (const m of majorsData) {
    const created = await prisma.major.upsert({
      where: { code: m.code },
      update: { name: m.name, description: m.description },
      create: { ...m, subjectCombinations: JSON.stringify(['A00', 'A01', 'D01']) },
    });
    majors.push(created);
  }
  console.log(`✅ Đã nạp ${majors.length} ngành học.`);

  // 5. Tạo Công thức tính điểm
  console.log('🧪 Đang tạo công thức tính điểm...');
  const formulasData = [
    {
      name: 'Toán nhân đôi (Khối A00)',
      formula: 'math * 2 + physics + chemistry + priorityPoints',
      description: 'Dành cho các ngành kỹ thuật: Toánx2 + Lý + Hóa + Điểm ưu tiên',
    },
    {
      name: 'Lấy cao nhất giữa các khối (A, D)',
      formula: 'max(math+physics+chemistry, math+literature+english) + priorityPoints',
      description: 'Lấy tổng điểm cao nhất giữa tổ hợp A00 và D01',
    },
    {
      name: 'Trung bình 3 môn',
      formula: '(math + physics + english) / 3 + priorityPoints',
      description: 'Lấy điểm trung bình cộng 3 môn',
    },
  ];

  const formulas: any[] = [];
  for (const f of formulasData) {
    const created = await prisma.admissionFormula.create({ data: f });
    formulas.push(created);
  }
  console.log(`✅ Đã nạp ${formulas.length} công thức.`);

  // 6. Tạo Đợt tuyển sinh
  console.log('📅 Đang tạo đợt tuyển sinh...');
  const currentYear = new Date().getFullYear();
  const session = await prisma.admissionSession.create({
    data: {
      name: `Tuyển sinh Khóa ${currentYear} - Đợt 1`,
      year: currentYear,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      status: SessionStatus.active,
    },
  });
  console.log(`✅ Đợt tuyển sinh: ${session.name}`);

  // 7. Tạo Chỉ tiêu (Quotas) & ĐIỀU KIỆN
  console.log('📊 Đang cấu hình chỉ tiêu tuyển sinh...');
  for (const major of majors) {
    await prisma.sessionQuota.create({
      data: {
        sessionId: session.id,
        majorId: major.id,
        formulaId: formulas[1].id, // Mặc định lấy cao nhất các khối
        quota: major.code === '7480201' ? 100 : 50, // CNTT lấy 100, ngành khác 50
        conditions: {
          minTotalScore: 18.0,
          minSubjectScores: { math: 5.0 },
          requiredSubjects: ['math'],
          subjectCombinations: [['math', 'physics', 'chemistry'], ['math', 'literature', 'english']]
        },
      },
    });
  }
  console.log('✅ Đã cấu hình chỉ tiêu cho tất cả các ngành.');

  // 8. Tạo Thí sinh mẫu
  console.log('👨‍🎓 Đang tạo hồ sơ thí sinh mẫu...');
  const studentsData = [
    { fullName: 'Nguyễn Văn Nam', idCard: '079102345678', points: 0.5 },
    { fullName: 'Trần Thị Thu Thảo', idCard: '079102345679', points: 0.0 },
    { fullName: 'Lê Hoàng Long', idCard: '079102345680', points: 1.5 },
    { fullName: 'Phạm Minh Đức', idCard: '079102345681', points: 0.0 },
    { fullName: 'Vũ Hải Yến', idCard: '079102345682', points: 0.75 },
  ];

  const students: any[] = [];
  for (const s of studentsData) {
    const created = await prisma.student.create({
      data: {
        idCard: s.idCard,
        fullName: s.fullName,
        email: `${s.idCard}@student.edu.vn`,
        dateOfBirth: new Date('2006-01-01'), // Thí sinh thường 18 tuổi
        priorityPoints: s.points,
        sessionId: session.id,
        scores: {
          math: 8.0 + Math.random() * 2,
          physics: 7.0 + Math.random() * 2,
          chemistry: 6.0 + Math.random() * 2,
          literature: 7.0 + Math.random() * 2,
          english: 8.5,
        },
      },
    });
    students.push(created);
  }

  // 9. Tạo Nguyện vọng (Preferences)
  console.log('📝 Đang tạo nguyện vọng cho thí sinh...');
  for (const student of students) {
    // Mỗi em 2 nguyện vọng
    await prisma.application.create({
      data: {
        studentId: student.id,
        sessionId: session.id,
        majorId: majors[0].id, // CNTT
        admissionMethod: 'A00',
        preferencePriority: 1,
        subjectScores: student.scores,
        admissionStatus: 'pending',
      },
    });

    await prisma.application.create({
      data: {
        studentId: student.id,
        sessionId: session.id,
        majorId: majors[1].id, // KHMT
        admissionMethod: 'D01',
        preferencePriority: 2,
        subjectScores: student.scores,
        admissionStatus: 'pending',
      },
    });
  }

  console.log('\n✨ QUÁ TRÌNH SEEDING HOÀN TẤT THÀNH CÔNG! ✨');
  console.log('------------------------------------------------');
  console.log('Thông tin quản trị:');
  console.log(`- Tài khoản: admin`);
  console.log(`- Mật khẩu : ${adminPassword}`);
  console.log('------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
