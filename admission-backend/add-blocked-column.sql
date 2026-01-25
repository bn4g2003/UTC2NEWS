-- Script để thêm cột "Dừng" vào tất cả các project hiện có
-- Chạy script này trong PostgreSQL để cập nhật các project cũ

-- Thêm cột "Dừng" cho mỗi project (nếu chưa có)
INSERT INTO columns (id, "projectId", name, "order", color, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid() as id,
    p.id as "projectId",
    'Dừng' as name,
    4 as "order",
    '#ef4444' as color,
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM columns c 
    WHERE c."projectId" = p.id AND c.name = 'Dừng'
);

-- Kiểm tra kết quả
SELECT p.name as project_name, c.name as column_name, c."order", c.color
FROM projects p
JOIN columns c ON c."projectId" = p.id
ORDER BY p.name, c."order";
