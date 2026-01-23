# ✅ CẬP NHẬT HIỂN THỊ KHỐI/TỔ HỢP TRONG KẾT QUẢ

## 📋 Yêu Cầu

Trong "Danh sách thí sinh trúng tuyển", cột "Phương thức" cần hiển thị **Khối/Tổ hợp** (A00, D01, etc.) thay vì admission method (entrance_exam, high_school_transcript).

## ✅ Đã Thực Hiện

### 1. Frontend - Results Page (`admission-frontend/app/(admin)/results/page.tsx`)

#### Thêm field `admissionMethod` vào interface:

```typescript
interface ResultRecord {
  id: string;
  studentId: string;
  fullName: string;
  idCardNumber: string;
  program: string;
  programCode: string;
  admissionMethod: string;  // ✅ THÊM MỚI
  score: number;
  ranking: number;
  preference: number;        // ✅ THÊM MỚI
  status: 'accepted' | 'rejected' | 'pending';
}
```

#### Map dữ liệu từ API:

```typescript
const formattedResults: ResultRecord[] = data.map((item: any) => ({
  id: `${item.studentId}-${item.majorCode}`,
  studentId: item.studentId,
  fullName: item.fullName,
  idCardNumber: item.idCard,
  program: item.majorName,
  programCode: item.majorCode,
  admissionMethod: item.admissionMethod,  // ✅ Map từ API
  score: item.finalScore,
  ranking: item.ranking,
  preference: item.preference,            // ✅ Map từ API
  status: 'accepted',
}));
```

#### Thêm 2 cột mới vào bảng:

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

### 2. Backend - Result Export Service (`admission-backend/src/result/result-export.service.ts`)

#### Đổi tên header Excel:

```typescript
const headers = [
  'Student ID',
  'ID Card',
  'Full Name',
  'Major Code',
  'Major Name',
  'Khối/Tổ hợp',      // ✅ ĐỔI TÊN từ "Admission Method"
  'Final Score',
  'Ranking',
  'Preference',
];
```

**Lưu ý**: Dữ liệu `admissionMethod` đã được lưu đúng là block code (A00, D01, etc.) trong database, không cần thay đổi logic backend.

## 📊 Kết Quả

### Trước khi sửa:

**Bảng hiển thị:**
| Student ID | Full Name | Program | Score | Ranking | Status |
|------------|-----------|---------|-------|---------|--------|
| xxx | Nguyễn Văn A | CNTT | 25.5 | 1 | Accepted |

**Excel export:**
| Student ID | ID Card | Full Name | Major Code | Major Name | Admission Method | Final Score | Ranking | Preference |
|------------|---------|-----------|------------|------------|------------------|-------------|---------|------------|
| xxx | 001234567890 | Nguyễn Văn A | CNTT | Công nghệ thông tin | A00 | 25.5 | 1 | 1 |

### Sau khi sửa:

**Bảng hiển thị:**
| Student ID | Full Name | Program | Khối/Tổ hợp | Preference | Score | Ranking | Status |
|------------|-----------|---------|-------------|------------|-------|---------|--------|
| xxx | Nguyễn Văn A | CNTT | A00 | NV1 | 25.5 | 1 | Accepted |

**Excel export:**
| Student ID | ID Card | Full Name | Major Code | Major Name | Khối/Tổ hợp | Final Score | Ranking | Preference |
|------------|---------|-----------|------------|------------|-------------|-------------|---------|------------|
| xxx | 001234567890 | Nguyễn Văn A | CNTT | Công nghệ thông tin | A00 | 25.5 | 1 | 1 |

## 🎯 Ý Nghĩa Các Cột

1. **Khối/Tổ hợp**: Hiển thị block code mà sinh viên đăng ký (A00, A01, D01, etc.)
   - A00: Toán, Lý, Hóa
   - A01: Toán, Lý, Anh
   - D01: Toán, Văn, Anh
   - B00: Toán, Hóa, Sinh
   - C00: Văn, Sử, Địa

2. **Preference**: Hiển thị nguyện vọng trúng tuyển (NV1, NV2, NV3, etc.)
   - NV1: Nguyện vọng 1
   - NV2: Nguyện vọng 2
   - NV3: Nguyện vọng 3

## 📝 Lưu Ý

### Dữ liệu trong Database

`application.admissionMethod` lưu **block code** (A00, D01, etc.), KHÔNG phải admission method (entrance_exam, high_school_transcript).

Mapping giữa block code và admission method được thực hiện trong filter service:
- A00, A01, B00, C00 → `entrance_exam`
- D01, D07, D08, D09, D10 → `high_school_transcript`

### Hiển thị cho User

Người dùng (sinh viên, admin) chỉ thấy **block code** (A00, D01), không thấy admission method (entrance_exam, high_school_transcript) vì:
1. Block code rõ ràng hơn (biết ngay tổ hợp môn)
2. Phù hợp với cách đăng ký tuyển sinh VN
3. Dễ hiểu cho sinh viên

### Sử dụng Internal

Admission method (entrance_exam, high_school_transcript) chỉ dùng nội bộ trong:
1. Filter logic - để group applications theo phương thức
2. Quota management - để quản lý chỉ tiêu theo phương thức
3. Score calculation - để tính điểm theo công thức khác nhau

## ✅ Hoàn Tất

Bây giờ:
- ✅ Bảng results hiển thị cột "Khối/Tổ hợp" với block code
- ✅ Bảng results hiển thị cột "Preference" với nguyện vọng
- ✅ File Excel export có header "Khối/Tổ hợp" thay vì "Admission Method"
- ✅ Dữ liệu hiển thị đúng block code (A00, D01, etc.)

## 🔗 Files Đã Thay Đổi

1. `admission-frontend/app/(admin)/results/page.tsx`
   - Thêm `admissionMethod` và `preference` vào interface
   - Thêm 2 cột mới vào bảng
   - Map dữ liệu từ API

2. `admission-backend/src/result/result-export.service.ts`
   - Đổi header Excel từ "Admission Method" → "Khối/Tổ hợp"
