import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addBlockedColumnToExistingProjects() {
  console.log('🔍 Đang tìm các project...');

  const projects = await prisma.project.findMany({
    include: {
      columns: true,
    },
  });

  console.log(`📊 Tìm thấy ${projects.length} project(s)`);

  let addedCount = 0;
  let skippedCount = 0;

  for (const project of projects) {
    // Kiểm tra xem đã có cột "Dừng" chưa
    const hasBlockedColumn = project.columns.some((col) => col.name === 'Dừng');

    if (hasBlockedColumn) {
      console.log(`⏭️  Project "${project.name}" đã có cột "Dừng", bỏ qua`);
      skippedCount++;
      continue;
    }

    // Thêm cột "Dừng"
    await prisma.column.create({
      data: {
        projectId: project.id,
        name: 'Dừng',
        order: 4,
        color: '#ef4444',
      },
    });

    console.log(`✅ Đã thêm cột "Dừng" vào project "${project.name}"`);
    addedCount++;
  }

  console.log('\n📈 Tóm tắt:');
  console.log(`   ✅ Đã thêm: ${addedCount} cột`);
  console.log(`   ⏭️  Đã bỏ qua: ${skippedCount} project`);
  console.log(`   📊 Tổng cộng: ${projects.length} project`);
}

addBlockedColumnToExistingProjects()
  .then(() => {
    console.log('\n✨ Hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
