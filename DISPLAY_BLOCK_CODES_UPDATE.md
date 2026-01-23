# ✅ CẬP NHẬT HIỂN THỊ KHỐI/TỔ HỢP TRONG TẤT CẢ TRANG

## 📋 Yêu Cầu

Hiển thị **Khối/Tổ hợp** (A00, D01, etc.) thay vì "Phương thức" (entrance_exam, high_school_transcript) trong các trang:
1. ✅ Results (Kết quả tuyển sinh)
2. ✅ Filter (Lọc ảo)
3. ✅ Quotas (Quản lý chỉ tiêu)

## 🔧 Thay Đổi

### 1. Results Page (`admission-frontend/app/(admin)/results/page.tsx`)

**Trước:**
- Không có cột "Khối/Tổ hợp"
- Không có cột "Preference"

**Sau:**
```typescript
{
  title: 'Khối/Tổ hợp',
  dataIndex: 'admissionMethod',
  key: 'admissionMethod',
  width: 120,
  align: 'center',
},
{
  title: 'Preference',
  dataIndex: 'preference',
  key: 'preference',
  width: 100,
  align: 'center',
  render: (pref: number) => `NV${pref}`,
},
```

### 2. Filter Page (`admission-frontend/app/(admin)/filter/page.tsx`)

**Trước:**
- 2 cột riêng: "Phương thức" và "Khối/Tổ hợp"
- Parse format `method|block`

**Sau:**
- 1 cột duy nhất: "Khối/Tổ hợp"
- Tự động detect format và hiển thị đúng

```typescript
{
  title: 'Khối/Tổ hợp',
  dataIndex: 'admissionMethod',
  key: 'admissionMethod',
  width: 120,
  render: (method: string) => {
    // Check if it's a block code (A00, D01, etc.)
    if (/^[A-Z]\d{2}$/i.test(method)) {
      return <Tag color="cyan">{method}</Tag>;
    }
    // Handle method|block format
    if (method.includes('|')) {
      const parts = method.split('|');
      return parts[1] ? <Tag color="cyan">{parts[1]}</Tag> : <Tag color="blue">{parts[0]}</Tag>;
    }
    // Otherwise it's an admission method name
    const methodLabels: Record<string, string> = {
      entrance_exam: 'Thi đầu vào',
      high_school_transcript: 'Xét học bạ',
      direct_admission: 'Xét tuyển thẳng',
    };
    return <Tag color="blue">{methodLabels[method] || method}</Tag>;
  },
},
```

**Áp dụng cho:**
- Bảng danh sách thí sinh trúng tuyển
- Bảng chỉ tiêu trong phần cấu hình

### 3. Quotas Page (`admission-frontend/app/(admin)/quotas/page.tsx`)

**Trước:**
- 2 cột riêng: "Phương thức" và "Khối/Tổ hợp"
- Parse format `method|block`

**Sau:**
- 1 cột duy nhất: "Khối/Tổ hợp"
- Logic tương tự Filter page

```typescript
{
  key: 'admissionMethod',
  title: 'Khối/Tổ hợp',
  dataIndex: 'admissionMethod',
  render: (_, quota) => {
    const method = quota.admissionMethod;
    // Auto-detect and display correctly
    if (/^[A-Z]\d{2}$/i.test(method)) {
      return <Tag color="cyan">{method}</Tag>;
    }
    if (method.includes('|')) {
      const parts = method.split('|');
      return parts[1] ? <Tag color="cyan">{parts[1]}</Tag> : <Tag color="blue">{parts[0]}</Tag>;
    }
    const methodLabels: Record<string, string> = {
      entrance_exam: 'Thi đầu vào',
      high_school_transcript: 'Xét học bạ',
      direct_admission: 'Xét tuyển thẳng',
    };
    return <Tag color="blue">{methodLabels[method] || method}</Tag>;
  },
},
```

### 4. Backend - Result Export Service

**Excel Header:**
```typescript
const headers = [
  'Student ID',
  'ID Card',
  'Full Name',
  'Major Code',
  'Major Name',
  'Khối/Tổ hợp',      // ✅ Changed from "Admission Method"
  'Final Score',
  'Ranking',
  'Preference',
];
```

## 📊 Logic Hiển Thị

### Auto-Detection Logic

Code tự động detect 3 format:

1. **Block Code** (A00, D01, B00, etc.)
   - Pattern: `^[A-Z]\d{2}$`
   - Display: `<Tag color="cyan">A00</Tag>`

2. **Method|Block Format** (entrance_exam|A00)
   - Pattern: Contains `|`
   - Display: Block part nếu có, otherwise method part

3. **Method Name** (entrance_exam, high_school_transcript)
   - Pattern: Không match 2 cái trên
   - Display: Translated label

### Ví Dụ

| Input | Output |
|-------|--------|
| `A00` | 🔵 A00 (cyan tag) |
| `D01` | 🔵 D01 (cyan tag) |
| `entrance_exam\|A00` | 🔵 A00 (cyan tag) |
| `entrance_exam` | 🔵 Thi đầu vào (blue tag) |
| `high_school_transcript` | 🔵 Xét học bạ (blue tag) |

## 🎯 Kết Quả

### Trước khi sửa:

**Quotas Page:**
| Ngành | Phương thức | Khối/Tổ hợp | Chỉ tiêu |
|-------|-------------|-------------|----------|
| CNTT | Thi đầu vào | - | 40 |

**Filter Page:**
| Họ tên | Ngành | Phương thức | Khối/Tổ hợp | Điểm |
|--------|-------|-------------|-------------|------|
| Nguyễn Văn A | CNTT | Thi đầu vào | - | 25.5 |

### Sau khi sửa:

**Quotas Page:**
| Ngành | Khối/Tổ hợp | Chỉ tiêu |
|-------|-------------|----------|
| CNTT | **A00** | 40 |

**Filter Page:**
| Họ tên | Ngành | Khối/Tổ hợp | Nguyện vọng | Điểm |
|--------|-------|-------------|-------------|------|
| Nguyễn Văn A | CNTT | **A00** | NV1 | 25.5 |

**Results Page:**
| Họ tên | Ngành | Khối/Tổ hợp | Preference | Điểm |
|--------|-------|-------------|------------|------|
| Nguyễn Văn A | CNTT | **A00** | NV1 | 25.5 |

## 📝 Lưu Ý

### Tại sao chỉ hiển thị Khối/Tổ hợp?

1. **Rõ ràng hơn**: Block code (A00) cho biết ngay tổ hợp môn (Toán-Lý-Hóa)
2. **Phù hợp VN**: Sinh viên quen với khối thi (A00, D01) hơn là "entrance_exam"
3. **Tiết kiệm không gian**: 1 cột thay vì 2 cột
4. **Dễ hiểu**: Không cần giải thích "Thi đầu vào" là gì

### Mapping Khối → Phương thức (Internal)

Mapping này chỉ dùng nội bộ trong filter logic:

```typescript
A00, A01, B00, C00 → entrance_exam
D01, D07, D08, D09, D10 → high_school_transcript
```

User không cần biết mapping này, chỉ thấy block code.

### Backward Compatibility

Code hỗ trợ cả 3 format:
- ✅ Block code only: `A00`
- ✅ Method|Block: `entrance_exam|A00`
- ✅ Method only: `entrance_exam`

Nên không cần migrate data, code tự động detect và hiển thị đúng.

## ✅ Hoàn Tất

Tất cả 3 trang đã được cập nhật:
- ✅ Results: Thêm cột "Khối/Tổ hợp" và "Preference"
- ✅ Filter: Gộp 2 cột thành 1 cột "Khối/Tổ hợp"
- ✅ Quotas: Gộp 2 cột thành 1 cột "Khối/Tổ hợp"
- ✅ Excel Export: Header "Khối/Tổ hợp"

## 🔗 Files Đã Thay Đổi

1. `admission-frontend/app/(admin)/results/page.tsx`
   - Thêm cột "Khối/Tổ hợp" và "Preference"

2. `admission-frontend/app/(admin)/filter/page.tsx`
   - Gộp 2 cột thành 1 cột "Khối/Tổ hợp"
   - Thêm auto-detection logic
   - Áp dụng cho cả bảng admitted students và bảng quotas

3. `admission-frontend/app/(admin)/quotas/page.tsx`
   - Gộp 2 cột thành 1 cột "Khối/Tổ hợp"
   - Thêm auto-detection logic

4. `admission-backend/src/result/result-export.service.ts`
   - Đổi header Excel: "Admission Method" → "Khối/Tổ hợp"
