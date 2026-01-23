# Quotas Management Page

## Overview

Trang quản lý chỉ tiêu tuyển sinh với khả năng cấu hình điều kiện chi tiết.

## Features

### 1. Quota Management
- ✅ Tạo/Sửa/Xóa chỉ tiêu
- ✅ Liên kết với đợt tuyển sinh và ngành
- ✅ Chọn phương thức tuyển sinh

### 2. Conditions Configuration
- ✅ Điểm tổng tối thiểu
- ✅ Điểm tối thiểu từng môn
- ✅ Môn bắt buộc
- ✅ Tổ hợp môn được phép
- ✅ Cấu hình điểm ưu tiên

## Components

### QuotasPage (`page.tsx`)
Main page component với:
- DataGrid hiển thị danh sách quotas
- CRUD operations
- Integration với API

### QuotaConditionsModal (`QuotaConditionsModal.tsx`)
Modal cấu hình điều kiện với:
- Form nhập điều kiện
- Dynamic fields
- Validation
- Preview

### Schema (`schema.ts`)
Zod schemas cho validation:
- `quotaSchema`: Validate quota data
- `quotaConditionsSchema`: Validate conditions

## Usage

### Access
Navigate to: `/quotas`

### Create Quota
1. Click "Thêm chỉ tiêu"
2. Chọn đợt tuyển sinh, ngành, phương thức
3. Nhập số lượng chỉ tiêu
4. Click "Lưu"

### Configure Conditions
1. Click icon Settings (⚙️) trên quota
2. Cấu hình các điều kiện:
   - Điểm tổng tối thiểu
   - Điểm tối thiểu từng môn
   - Môn bắt buộc
   - Tổ hợp môn
   - Điểm ưu tiên
3. Click "Lưu điều kiện"

## Conditions Structure

```typescript
{
  minTotalScore?: number;              // 0-30
  minSubjectScores?: {                 // 0-10 per subject
    [subject: string]: number;
  };
  requiredSubjects?: string[];         // Array of subject codes
  subjectCombinations?: string[][];    // Array of combinations
  priorityBonus?: {
    enabled: boolean;
    maxBonus: number;                  // 0-5
  };
}
```

## Example Conditions

### Basic (CNTT)
```json
{
  "minTotalScore": 18.0,
  "minSubjectScores": {
    "math": 5.0,
    "physics": 4.0,
    "chemistry": 4.0
  },
  "requiredSubjects": ["math", "physics", "chemistry"],
  "priorityBonus": {
    "enabled": true,
    "maxBonus": 2.0
  }
}
```

### Advanced (KTPM)
```json
{
  "minTotalScore": 20.0,
  "minSubjectScores": {
    "math": 6.0,
    "physics": 5.0,
    "chemistry": 5.0
  },
  "subjectCombinations": [
    ["math", "physics", "chemistry"],
    ["math", "physics", "english"]
  ],
  "priorityBonus": {
    "enabled": true,
    "maxBonus": 1.5
  }
}
```

## API Integration

### Endpoints Used
- `GET /programs/quotas` - List quotas
- `POST /programs/quotas` - Create quota
- `PUT /programs/quotas/:id` - Update quota
- `DELETE /programs/quotas/:id` - Delete quota
- `GET /programs/sessions` - List sessions
- `GET /programs/majors` - List majors

## Validation Rules

### Quota
- sessionId: Required
- majorId: Required
- admissionMethod: Required
- quota: Required, min 1

### Conditions
- minTotalScore: 0-30
- minSubjectScores: 0-10 per subject
- priorityBonus.maxBonus: 0-5

## UI/UX Features

### DataGrid
- Sortable columns
- Responsive design
- Loading states
- Empty states

### Conditions Modal
- Step-by-step configuration
- Visual feedback
- Validation messages
- Info tooltips

### Actions
- Quick edit conditions (Settings icon)
- Edit quota (Edit icon)
- Delete quota (Trash icon)

## Permissions

Required permissions:
- `quotas:read` - View quotas
- `quotas:create` - Create quotas
- `quotas:update` - Update quotas
- `quotas:delete` - Delete quotas

## Testing

### Manual Testing
1. Create quota without conditions
2. Add conditions to existing quota
3. Edit conditions
4. Delete quota
5. Verify validation

### Test Cases
- [ ] Create quota with all fields
- [ ] Update quota conditions
- [ ] Delete quota
- [ ] Validation errors
- [ ] Empty states
- [ ] Loading states

## Notes

- Conditions are optional
- All conditions must be satisfied for eligibility
- minTotalScore is checked BEFORE priority bonus
- Subject combinations allow multiple valid combinations
- Priority bonus can be disabled per quota

## Future Enhancements

- [ ] Bulk import quotas
- [ ] Conditions templates
- [ ] Duplicate quota
- [ ] Export quotas
- [ ] Audit log
- [ ] Conditions preview/test
