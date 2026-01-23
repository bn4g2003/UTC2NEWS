# ✅ SỬA HIỂN THỊ QUOTAS - PHƯƠNG THỨC VÀ KHỐI/TỔ HỢP

## 📋 Yêu Cầu Đúng

Trong trang **Quotas** và bảng quotas trong **Filter**:

1. **Cột "Phương thức"**: Giữ nguyên hiển thị admission method
   - entrance_exam → "Thi đầu vào"
   - high_school_transcript → "Xét học bạ"
   - direct_admission → "Xét tuyển thẳng"

2. **Cột "Khối/Tổ hợp"**: Lấy từ `conditions.subjectCombinations`
   - Có thể có **nhiều tổ hợp** cho 1 quota
   - Ví dụ: A00, A01, D01 (hiển thị tất cả)

## 🔧 Đã Sửa

### 1. Quotas Page (`admission-frontend/app/(admin)/quotas/page.tsx`)

```typescript
{
  key: 'admissionMethod',
  title: 'Phương thức',
  dataIndex: 'admissionMethod',
  render: (_, quota) => {
    const methodLabels: Record<string, string> = {
      entrance_exam: 'Thi đầu vào',
      high_school_transcript: 'Xét học bạ',
      direct_admission: 'Xét tuyển thẳng',
    };
    return <Tag color="blue" variant="outlined">
      {methodLabels[quota.admissionMethod] || quota.admissionMethod}
    </Tag>;
  },
},
{
  key: 'subjectCombinations',
  title: 'Khối/Tổ hợp',
  dataIndex: 'conditions',
  render: (_, quota) => {
    const conditions = quota.conditions as any;
    if (!conditions?.subjectCombinations || conditions.subjectCombinations.length === 0) {
      return <span className="text-gray-400">Chưa cấu hình</span>;
    }
    
    // Map subject combinations to block codes
    const blockMap: Record<string, string> = {
      'math-physics-chemistry': 'A00',
      'math-physics-english': 'A01',
      'math-chemistry-biology': 'B00',
      'literature-history-geography': 'C00',
      'math-literature-english': 'D01',
      'math-chemistry-english': 'D07',
      'math-biology-english': 'D08',
      'math-geography-english': 'D09',
      'math-history-english': 'D10',
    };
    
    return (
      <div className="flex flex-wrap gap-1">
        {conditions.subjectCombinations.map((comb: any, idx: number) => {
          const combKey = Array.isArray(comb) ? comb.sort().join('-') : comb;
          const blockCode = blockMap[combKey] || combKey;
          return (
            <Tag key={idx} color="cyan">
              {blockCode}
            </Tag>
          );
        })}
      </div>
    );
  },
},
```

### 2. Filter Page - Quotas Table (`admission-frontend/app/(admin)/filter/page.tsx`)

Tương tự như Quotas page, áp dụng cho bảng quotas trong phần cấu hình.

### 3. Filter Page - Admitted Students Table

**GIỮ NGUYÊN** - Vì đây là dữ liệu thực tế của sinh viên:

```typescript
{
  title: 'Khối/Tổ hợp',
  dataIndex: 'admissionMethod',
  key: 'admissionMethod',
  width: 120,
  render: (method: string) => {
    // Display actual block code from student's application
    if (/^[A-Z]\d{2}$/i.test(method)) {
      return <Tag color="cyan">{method}</Tag>;
    }
    // ... other cases
  },
},
```

## 📊 Ví Dụ

### Quota Configuration

**Data:**
```json
{
  "majorId": "CNTT-id",
  "admissionMethod": "entrance_exam",
  "quota": 100,
  "conditions": {
    "subjectCombinations": [
      ["math", "physics", "chemistry"],
      ["math", "physics", "english"],
      ["math", "chemistry", "biology"],
      ["literature", "history", "geography"]
    ]
  }
}
```

**Hiển thị:**
| Ngành | Phương thức | Khối/Tổ hợp | Chỉ tiêu |
|-------|-------------|-------------|----------|
| CNTT | 🔵 Thi đầu vào | 🔵 A00 🔵 A01 🔵 B00 🔵 C00 | 100 |

### Student Application

**Data:**
```json
{
  "studentId": "xxx",
  "fullName": "Nguyễn Văn A",
  "majorCode": "CNTT",
  "admissionMethod": "A00",
  "calculatedScore": 25.5
}
```

**Hiển thị:**
| Họ tên | Ngành | Khối/Tổ hợp | Điểm |
|--------|-------|-------------|------|
| Nguyễn Văn A | CNTT | 🔵 A00 | 25.5 |

## 🎯 Logic Mapping

### Subject Combinations → Block Codes

```typescript
const blockMap: Record<string, string> = {
  'math-physics-chemistry': 'A00',
  'math-physics-english': 'A01',
  'math-chemistry-biology': 'B00',
  'literature-history-geography': 'C00',
  'math-literature-english': 'D01',
  'math-chemistry-english': 'D07',
  'math-biology-english': 'D08',
  'math-geography-english': 'D09',
  'math-history-english': 'D10',
};
```

**Lưu ý**: Subjects được sort trước khi join để đảm bảo match đúng:
- `['math', 'physics', 'chemistry']` → sort → `'chemistry-math-physics'`
- `['chemistry', 'math', 'physics']` → sort → `'chemistry-math-physics'`
- Cả 2 đều match với key trong blockMap

## 📝 Tóm Tắt

### Quotas Page & Filter Quotas Table

| Cột | Nguồn dữ liệu | Hiển thị |
|-----|---------------|----------|
| Phương thức | `quota.admissionMethod` | Thi đầu vào / Xét học bạ |
| Khối/Tổ hợp | `quota.conditions.subjectCombinations` | A00, A01, B00, C00 (nhiều tags) |

### Filter Admitted Students Table & Results Table

| Cột | Nguồn dữ liệu | Hiển thị |
|-----|---------------|----------|
| Khối/Tổ hợp | `application.admissionMethod` | A00 (1 tag duy nhất) |

## ✅ Kết Luận

**Quotas (Cấu hình):**
- Phương thức: entrance_exam, high_school_transcript
- Khối/Tổ hợp: Nhiều khối (A00, A01, B00, C00) từ conditions

**Applications (Dữ liệu thực tế):**
- Khối/Tổ hợp: 1 khối duy nhất (A00 hoặc D01) mà sinh viên đăng ký

Đây là logic đúng vì:
1. **Quota** định nghĩa các khối được chấp nhận
2. **Application** lưu khối cụ thể mà sinh viên chọn
