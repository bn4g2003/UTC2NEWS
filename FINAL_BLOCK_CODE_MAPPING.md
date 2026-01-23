# ✅ HOÀN TẤT: MAPPING KHỐI/TỔ HỢP TRONG TẤT CẢ TRANG

## 📋 Tổng Quan

Đã cập nhật tất cả các trang để hiển thị **Khối/Tổ hợp** (A00, A01, etc.) một cách nhất quán:

1. ✅ **Results** - Danh sách thí sinh trúng tuyển
2. ✅ **Filter** - Lọc ảo và danh sách trúng tuyển
3. ✅ **Quotas** - Quản lý chỉ tiêu

## 🔧 Giải Pháp

### 1. Tạo Helper Function (`src/lib/block-code-mapper.ts`)

```typescript
export function getBlockCode(subjects: string[] | string): string {
  if (typeof subjects === 'string') {
    return subjects;
  }

  const sorted = [...subjects].sort().join('-');
  
  const blockMap: Record<string, string> = {
    'chemistry-math-physics': 'A00',
    'english-math-physics': 'A01',
    'biology-chemistry-math': 'B00',
    'geography-history-literature': 'C00',
    'english-literature-math': 'D01',
    'chemistry-english-math': 'D07',
    'biology-english-math': 'D08',
    'english-geography-math': 'D09',
    'english-history-math': 'D10',
  };

  return blockMap[sorted] || sorted;
}
```

**Tính năng:**
- ✅ Tự động sort subjects để đảm bảo match đúng
- ✅ Hỗ trợ cả array và string input
- ✅ Fallback về original string nếu không tìm thấy mapping

### 2. Áp Dụng Trong Các Trang

#### Quotas Page

```typescript
import { getBlockCode } from '@/lib/block-code-mapper';

{
  key: 'subjectCombinations',
  title: 'Khối/Tổ hợp',
  dataIndex: 'conditions',
  render: (_, quota) => {
    const conditions = quota.conditions as any;
    if (!conditions?.subjectCombinations) {
      return <span className="text-gray-400">Chưa cấu hình</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {conditions.subjectCombinations.map((comb: any, idx: number) => (
          <Tag key={idx} color="cyan">
            {getBlockCode(comb)}
          </Tag>
        ))}
      </div>
    );
  },
}
```

#### Filter Page (Quotas Table)

Tương tự như Quotas page.

#### Filter Page & Results Page (Admitted Students)

```typescript
{
  title: 'Khối/Tổ hợp',
  dataIndex: 'admissionMethod',
  key: 'admissionMethod',
  render: (method: string) => {
    // Already a block code from application data
    return <Tag color="cyan">{method}</Tag>;
  },
}
```

## 📊 Ví Dụ Mapping

### Input: Subject Combinations

```json
{
  "subjectCombinations": [
    ["math", "physics", "chemistry"],
    ["physics", "math", "english"],
    ["chemistry", "biology", "math"]
  ]
}
```

### Output: Block Codes

```
🔵 A00  🔵 A01  🔵 B00
```

### Các Trường Hợp Đặc Biệt

| Input | Sorted | Output |
|-------|--------|--------|
| `["math", "physics", "chemistry"]` | `chemistry-math-physics` | A00 |
| `["chemistry", "physics", "math"]` | `chemistry-math-physics` | A00 |
| `["physics", "chemistry", "math"]` | `chemistry-math-physics` | A00 |
| `["math", "english", "physics"]` | `english-math-physics` | A01 |
| `["unknown", "subjects", "combo"]` | `combo-subjects-unknown` | combo-subjects-unknown |

**Lưu ý**: Thứ tự input không quan trọng vì function tự động sort!

## 🎯 Kết Quả Cuối Cùng

### Quotas Page

| Ngành | Phương thức | Khối/Tổ hợp | Chỉ tiêu | Điều kiện |
|-------|-------------|-------------|----------|-----------|
| CNTT | 🔵 Thi đầu vào | 🔵 A00 🔵 A01 🔵 B00 🔵 C00 | 100 | Điểm sàn: ≥15 |
| KTPM | 🔵 Xét học bạ | 🔵 D01 🔵 D07 🔵 D08 | 50 | Điểm sàn: ≥18 |

### Filter Page - Quotas Table

Tương tự như Quotas page.

### Filter Page - Admitted Students

| STT | Họ tên | Ngành | Khối/Tổ hợp | Nguyện vọng | Điểm |
|-----|--------|-------|-------------|-------------|------|
| 1 | Nguyễn Văn A | CNTT | 🔵 A00 | 🔵 NV1 | 25.5 |
| 2 | Trần Thị B | KTPM | 🔵 D01 | 🔵 NV2 | 22.0 |

### Results Page

| Student ID | Họ tên | Ngành | Khối/Tổ hợp | Preference | Điểm |
|------------|--------|-------|-------------|------------|------|
| xxx | Nguyễn Văn A | CNTT | 🔵 A00 | NV1 | 25.5 |
| yyy | Trần Thị B | KTPM | 🔵 D01 | NV2 | 22.0 |

## 📝 Mapping Table

### Khối A (Khoa học tự nhiên)

| Block | Subjects | Vietnamese |
|-------|----------|------------|
| A00 | Math, Physics, Chemistry | Toán, Lý, Hóa |
| A01 | Math, Physics, English | Toán, Lý, Anh |

### Khối B (Sinh học)

| Block | Subjects | Vietnamese |
|-------|----------|------------|
| B00 | Math, Chemistry, Biology | Toán, Hóa, Sinh |

### Khối C (Khoa học xã hội)

| Block | Subjects | Vietnamese |
|-------|----------|------------|
| C00 | Literature, History, Geography | Văn, Sử, Địa |

### Khối D (Toán + Ngoại ngữ)

| Block | Subjects | Vietnamese |
|-------|----------|------------|
| D01 | Math, Literature, English | Toán, Văn, Anh |
| D07 | Math, Chemistry, English | Toán, Hóa, Anh |
| D08 | Math, Biology, English | Toán, Sinh, Anh |
| D09 | Math, Geography, English | Toán, Địa, Anh |
| D10 | Math, History, English | Toán, Sử, Anh |

## 🔍 So Sánh Trước/Sau

### Trước Khi Sửa

**Quotas:**
```
Khối/Tổ hợp: math-physics-chemistry, english-math-physics
```
❌ Khó đọc, dài dòng

**Filter:**
```
Phương thức: entrance_exam
Khối/Tổ hợp: -
```
❌ Không hiển thị thông tin hữu ích

### Sau Khi Sửa

**Quotas:**
```
Phương thức: Thi đầu vào
Khối/Tổ hợp: A00, A01
```
✅ Rõ ràng, ngắn gọn

**Filter:**
```
Phương thức: Thi đầu vào
Khối/Tổ hợp: A00, A01, B00, C00
```
✅ Hiển thị đầy đủ các khối được chấp nhận

## ✅ Lợi Ích

1. **Dễ đọc**: A00 thay vì "math-physics-chemistry"
2. **Nhất quán**: Tất cả trang đều dùng block codes
3. **Tiết kiệm không gian**: Tags ngắn gọn
4. **Dễ hiểu**: Người VN quen với khối A00, D01
5. **Maintainable**: Helper function tập trung, dễ cập nhật

## 🔗 Files Đã Thay Đổi

1. ✅ `admission-frontend/src/lib/block-code-mapper.ts` - Helper function
2. ✅ `admission-frontend/app/(admin)/quotas/page.tsx` - Quotas page
3. ✅ `admission-frontend/app/(admin)/filter/page.tsx` - Filter page
4. ✅ `admission-frontend/app/(admin)/results/page.tsx` - Results page (đã sửa trước đó)
5. ✅ `admission-backend/src/result/result-export.service.ts` - Excel export (đã sửa trước đó)

## 🎉 Hoàn Tất

Tất cả các trang đã được cập nhật để hiển thị block codes (A00, A01, etc.) thay vì tên môn học. Code sạch, dễ maintain, và nhất quán trên toàn bộ ứng dụng!
