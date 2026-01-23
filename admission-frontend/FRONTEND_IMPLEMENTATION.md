# Frontend Implementation - Quota Conditions UI

## ✅ Đã Hoàn Thành

Xây dựng UI để quản lý chỉ tiêu và cấu hình điều kiện tuyển sinh.

---

## 📁 Files Created

```
admission-frontend/
└── app/(admin)/
    └── quotas/
        ├── page.tsx                      # Main quotas management page
        ├── QuotaConditionsModal.tsx      # Conditions configuration modal
        ├── schema.ts                     # Zod validation schemas
        └── README.md                     # Documentation
```

---

## 🎯 Features

### 1. Quotas Management Page (`/quotas`)

**Features**:
- ✅ List all quotas với DataGrid
- ✅ Create/Edit/Delete quotas
- ✅ Configure conditions per quota
- ✅ View quota details
- ✅ Filter và search

**Components Used**:
- `DataGrid` - Display quotas table
- `FormModal` - Create/Edit quota
- `ConfirmDialog` - Delete confirmation
- `QuotaConditionsModal` - Configure conditions

### 2. Quota Conditions Modal

**Configurable Fields**:
- ✅ Điểm tổng tối thiểu (minTotalScore)
- ✅ Điểm tối thiểu từng môn (minSubjectScores)
- ✅ Môn bắt buộc (requiredSubjects)
- ✅ Tổ hợp môn (subjectCombinations)
- ✅ Điểm ưu tiên (priorityBonus)

**UI Features**:
- Dynamic form fields
- Add/Remove subjects
- Visual feedback
- Validation
- Info tooltips

### 3. Filter Page (Already Exists)

**Features**:
- ✅ Select session
- ✅ Run virtual filter
- ✅ Progress tracking
- ✅ Results display
- ✅ Cancel operation

---

## 🎨 UI Components

### DataGrid Columns

| Column | Description |
|--------|-------------|
| Đợt tuyển sinh | Session name + year |
| Ngành | Major name + code |
| Phương thức | Admission method |
| Chỉ tiêu | Quota number |
| Điều kiện | Conditions summary |
| Thao tác | Actions (Settings, Edit, Delete) |

### Conditions Form Sections

1. **Điểm tổng tối thiểu**
   - Input: Number (0-30)
   - Placeholder: "Ví dụ: 18.0"

2. **Điểm tối thiểu từng môn**
   - Select subject + Input score
   - Display: List of subject-score pairs
   - Actions: Add, Remove

3. **Môn bắt buộc**
   - Select subject
   - Display: Tags
   - Actions: Add, Remove

4. **Tổ hợp môn**
   - Build combination: Select multiple subjects
   - Display: List of combinations
   - Actions: Add subject, Save combination, Remove

5. **Điểm ưu tiên**
   - Checkbox: Enable/Disable
   - Input: Max bonus (0-5)

---

## 📊 Data Flow

### Load Quotas
```
Page Load
  ↓
Fetch Sessions, Majors, Quotas
  ↓
Display in DataGrid
```

### Create Quota
```
Click "Thêm chỉ tiêu"
  ↓
Open FormModal
  ↓
Fill form (session, major, method, quota)
  ↓
Submit → API POST /programs/quotas
  ↓
Reload data
```

### Configure Conditions
```
Click Settings icon
  ↓
Open QuotaConditionsModal
  ↓
Configure conditions
  ↓
Submit → API PUT /programs/quotas/:id
  ↓
Reload data
```

### Run Filter
```
Select session
  ↓
Click "Run Filter"
  ↓
API POST /filter/run/:sessionId
  ↓
Show progress
  ↓
Display results
```

---

## 🔧 API Integration

### Endpoints Used

| Method | Endpoint | Usage |
|--------|----------|-------|
| GET | `/programs/quotas` | List quotas |
| POST | `/programs/quotas` | Create quota |
| PUT | `/programs/quotas/:id` | Update quota/conditions |
| DELETE | `/programs/quotas/:id` | Delete quota |
| GET | `/programs/sessions` | List sessions |
| GET | `/programs/majors` | List majors |
| POST | `/filter/run/:sessionId` | Run filter |
| GET | `/filter/results/:sessionId` | Get results |

### API Client

Generated using `openapi-typescript-codegen`:

```bash
npm run generate-api
```

Services:
- `ProgramsService` - Quotas, Sessions, Majors
- `FilterService` - Run filter, Get results

---

## 🎯 User Flows

### Flow 1: Create Quota with Conditions

1. Navigate to `/quotas`
2. Click "Thêm chỉ tiêu"
3. Select session, major, method
4. Enter quota number
5. Click "Lưu"
6. Click Settings icon on new quota
7. Configure conditions
8. Click "Lưu điều kiện"

### Flow 2: Run Filter

1. Navigate to `/filter`
2. Select session
3. Click "Run Filter"
4. Wait for completion
5. View results

### Flow 3: Edit Conditions

1. Navigate to `/quotas`
2. Find quota
3. Click Settings icon
4. Modify conditions
5. Click "Lưu điều kiện"

---

## 🎨 Styling

### Theme
- Primary color: Blue (#1890ff)
- Success: Green (#52c41a)
- Error: Red (#ff4d4f)
- Warning: Orange (#faad14)

### Components
- Cards for sections
- Buttons with icons
- Tags for subjects
- Progress bars
- Alerts for info/errors

---

## ✅ Validation

### Quota Form
```typescript
{
  sessionId: required,
  majorId: required,
  admissionMethod: required,
  quota: required, min 1
}
```

### Conditions Form
```typescript
{
  minTotalScore: optional, 0-30,
  minSubjectScores: optional, 0-10 per subject,
  requiredSubjects: optional, array,
  subjectCombinations: optional, array of arrays,
  priorityBonus: {
    enabled: boolean,
    maxBonus: 0-5
  }
}
```

---

## 🧪 Testing Checklist

### Quotas Page
- [ ] Load quotas list
- [ ] Create new quota
- [ ] Edit quota
- [ ] Delete quota
- [ ] Open conditions modal
- [ ] Save conditions
- [ ] Validation errors
- [ ] Empty states
- [ ] Loading states

### Conditions Modal
- [ ] Add min subject score
- [ ] Remove min subject score
- [ ] Add required subject
- [ ] Remove required subject
- [ ] Build subject combination
- [ ] Save combination
- [ ] Remove combination
- [ ] Toggle priority bonus
- [ ] Set max bonus
- [ ] Submit form
- [ ] Cancel form

### Filter Page
- [ ] Select session
- [ ] Run filter
- [ ] View progress
- [ ] Cancel filter
- [ ] View results
- [ ] Reset

---

## 📱 Responsive Design

### Desktop (>1024px)
- Full DataGrid
- Side-by-side forms
- Modal width: 800px

### Tablet (768-1024px)
- Scrollable DataGrid
- Stacked forms
- Modal width: 90%

### Mobile (<768px)
- Card-based layout
- Vertical forms
- Full-width modal

---

## 🔒 Permissions

Required permissions:
- `quotas:read` - View quotas
- `quotas:create` - Create quotas
- `quotas:update` - Update quotas
- `quotas:delete` - Delete quotas
- `filter:run` - Run filter

---

## 🚀 Usage

### Development

```bash
cd admission-frontend
npm run dev
```

Navigate to:
- http://localhost:3000/quotas
- http://localhost:3000/filter

### Build

```bash
npm run build
npm run start
```

---

## 📚 Documentation

- [Quotas Page README](./app/(admin)/quotas/README.md)
- [Filter Page README](./app/(admin)/filter/README.md)
- [Backend Algorithm](../admission-backend/docs/virtual-filter-algorithm.md)
- [Conditions Guide](../admission-backend/docs/QUOTA_CONDITIONS_GUIDE.md)

---

## 🎉 Summary

Frontend UI đã hoàn thành với:

✅ **Quotas Management**
- CRUD operations
- DataGrid display
- Form validation

✅ **Conditions Configuration**
- Comprehensive modal
- Dynamic fields
- Visual feedback

✅ **Filter Execution**
- Session selection
- Progress tracking
- Results display

✅ **Integration**
- API client generated
- Services configured
- Error handling

---

## 🔜 Next Steps (Optional)

- [ ] Add bulk operations
- [ ] Export quotas to Excel
- [ ] Import quotas from Excel
- [ ] Conditions templates
- [ ] Duplicate quota
- [ ] Audit log
- [ ] Advanced filters
- [ ] Charts and graphs

---

## 📞 Support

- Backend API: http://localhost:3000/api
- Frontend: http://localhost:3000
- Documentation: See README files in each folder
