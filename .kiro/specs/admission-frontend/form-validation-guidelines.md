# Form Validation Guidelines - Ant Design + React Hook Form

## ⚠️ CRITICAL: Tránh lặp lại lỗi validation

### Vấn đề đã gặp (2026-01-22)

Form validation không hoạt động dù user đã nhập đúng thông tin. Nguyên nhân: **Sử dụng sai cách tích hợp react-hook-form với Ant Design components**.

---

## ✅ Quy tắc bắt buộc

### 1. LUÔN dùng `Controller` với Ant Design components

**❌ SAI - KHÔNG BAO GIỜ LÀM NHƯ VẦY:**
```tsx
import { Input } from 'antd';

<Input
  {...form.register('username')}
  placeholder="Enter username"
/>
```

**✅ ĐÚNG - LUÔN LÀM NHƯ VẦY:**
```tsx
import { Input } from 'antd';
import { Controller } from 'react-hook-form';

<Controller
  name="username"
  control={form.control}
  render={({ field }) => (
    <Input
      {...field}
      placeholder="Enter username"
    />
  )}
/>
```

### Tại sao?

- **`form.register()`** chỉ hoạt động với HTML native inputs (`<input>`, `<textarea>`, `<select>`)
- **Ant Design components** có cách xử lý `value` và `onChange` khác với HTML native
- Khi spread `{...form.register()}` vào Ant Design Input → event handlers bị conflict → form không nhận giá trị → validation fail

### 2. LUÔN import Controller

```tsx
import { Controller } from 'react-hook-form';
```

Nếu quên import, TypeScript sẽ báo lỗi: `Cannot find name 'Controller'`

---

## 📋 Template cho các loại input

### Input thông thường

```tsx
<Controller
  name="fieldName"
  control={form.control}
  render={({ field }) => (
    <Input
      {...field}
      placeholder="Enter value"
      status={form.formState.errors.fieldName ? 'error' : ''}
    />
  )}
/>
{form.formState.errors.fieldName && (
  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
    {form.formState.errors.fieldName.message}
  </div>
)}
```

### Input.Password

```tsx
<Controller
  name="password"
  control={form.control}
  render={({ field }) => (
    <Input.Password
      {...field}
      placeholder="Enter password"
      status={form.formState.errors.password ? 'error' : ''}
    />
  )}
/>
```

### Input.TextArea

```tsx
<Controller
  name="description"
  control={form.control}
  render={({ field }) => (
    <Input.TextArea
      {...field}
      placeholder="Enter description"
      rows={4}
      status={form.formState.errors.description ? 'error' : ''}
    />
  )}
/>
```

### Select

```tsx
<Controller
  name="status"
  control={form.control}
  render={({ field }) => (
    <Select {...field} style={{ width: '100%' }}>
      <Select.Option value="active">Active</Select.Option>
      <Select.Option value="inactive">Inactive</Select.Option>
    </Select>
  )}
/>
```

### InputNumber

**Lưu ý**: InputNumber cần xử lý `onChange` đặc biệt vì trả về `number`, không phải `event`

```tsx
<Controller
  name="displayOrder"
  control={form.control}
  render={({ field }) => (
    <InputNumber
      {...field}
      min={0}
      style={{ width: '100%' }}
      onChange={(value) => field.onChange(value || 0)}
    />
  )}
/>
```

Hoặc với Input type="number":

```tsx
<Controller
  name="priorityPoints"
  control={form.control}
  render={({ field }) => (
    <Input
      {...field}
      type="number"
      min={0}
      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
    />
  )}
/>
```

### DatePicker

```tsx
<Controller
  name="startDate"
  control={form.control}
  render={({ field }) => (
    <DatePicker
      {...field}
      style={{ width: '100%' }}
      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
    />
  )}
/>
```

### Input với custom onChange

Khi cần xử lý logic đặc biệt (auto-generate slug, toUpperCase, etc.):

```tsx
<Controller
  name="title"
  control={form.control}
  render={({ field }) => (
    <Input
      {...field}
      placeholder="Enter title"
      onChange={(e) => {
        field.onChange(e); // GỌI field.onChange TRƯỚC
        // Custom logic sau
        if (viewMode === 'create') {
          form.setValue('slug', generateSlug(e.target.value));
        }
      }}
    />
  )}
/>
```

**QUAN TRỌNG**: Luôn gọi `field.onChange(e)` trước khi thực hiện custom logic!

---

## 🌐 Hỗ trợ tiếng Việt

### Regex validation cho tên tiếng Việt

```typescript
import { z } from 'zod';

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .regex(
    /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+$/,
    'Name can only contain letters and spaces'
  );
```

### Regex cho tên vai trò (role name) - hỗ trợ tiếng Việt + số + ký tự đặc biệt

```typescript
const roleNameSchema = z
  .string()
  .min(3, 'Role name must be at least 3 characters')
  .regex(
    /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ_\s-]+$/,
    'Role name can only contain letters, numbers, underscores, hyphens, and spaces'
  );
```

---

## 🔧 FormModal & FormDrawer Configuration

### Validation mode

**LUÔN dùng `onChange` mode** để validation hoạt động real-time:

```typescript
const form = useForm<T>({
  resolver: zodResolver(schema),
  defaultValues: initialValues,
  mode: 'onChange', // ✅ Real-time validation
  reValidateMode: 'onChange',
  shouldUnregister: false,
  criteriaMode: 'all',
});
```

**KHÔNG dùng `onSubmit` mode** - user sẽ không thấy lỗi khi đang nhập.

### Error handling

Hiển thị error message khi validation fail:

```typescript
const handleSubmit = form.handleSubmit(
  async (data) => {
    // Success handler
    await onSubmit(data);
    message.success('Operation completed successfully');
  },
  (validationErrors) => {
    // Error handler - hiển thị lỗi đầu tiên
    const firstError = Object.values(validationErrors)[0];
    if (firstError?.message) {
      message.error(firstError.message as string);
    } else {
      message.error('Please check the form for errors');
    }
  }
);
```

---

## 🚫 Lỗi thường gặp

### 1. Quên import Controller

```
Error: Cannot find name 'Controller'
```

**Fix**: Thêm import
```tsx
import { Controller } from 'react-hook-form';
```

### 2. Dùng form.register() với Ant Design

```tsx
// ❌ SAI
<Input {...form.register('username')} />
```

**Fix**: Dùng Controller
```tsx
// ✅ ĐÚNG
<Controller
  name="username"
  control={form.control}
  render={({ field }) => <Input {...field} />}
/>
```

### 3. InputNumber không nhận giá trị

```tsx
// ❌ SAI - spread field trực tiếp
<InputNumber {...field} />
```

**Fix**: Xử lý onChange riêng
```tsx
// ✅ ĐÚNG
<InputNumber
  {...field}
  onChange={(value) => field.onChange(value || 0)}
/>
```

### 4. Custom onChange không cập nhật form

```tsx
// ❌ SAI - không gọi field.onChange
<Input
  {...field}
  onChange={(e) => {
    // Custom logic only
    form.setValue('slug', generateSlug(e.target.value));
  }}
/>
```

**Fix**: Gọi field.onChange trước
```tsx
// ✅ ĐÚNG
<Input
  {...field}
  onChange={(e) => {
    field.onChange(e); // Gọi trước
    form.setValue('slug', generateSlug(e.target.value));
  }}
/>
```

### 5. Space component không render

```tsx
// ❌ SAI
<Space orientation="vertical" />
```

**Fix**: Dùng prop đúng
```tsx
// ✅ ĐÚNG
<Space direction="vertical" />
```

---

## ✅ Checklist khi tạo form mới

- [ ] Import `Controller` từ 'react-hook-form'
- [ ] Wrap tất cả Ant Design inputs với `Controller`
- [ ] Sử dụng `mode: 'onChange'` trong useForm config
- [ ] Xử lý error message trong handleSubmit
- [ ] Test với dữ liệu tiếng Việt có dấu
- [ ] Kiểm tra validation real-time khi nhập
- [ ] Test cả create và edit mode
- [ ] Verify không có TypeScript errors
- [ ] Build thành công (`npm run build`)

---

## 📚 Tham khảo

### Các trang đã implement đúng

Tham khảo các trang sau làm mẫu:

1. **Roles Page** - `app/(admin)/roles/page.tsx`
   - Implement đúng từ đầu
   - Có PermissionsSelector component
   - Dùng FormDrawer cho edit

2. **Users Page** - `app/(admin)/users/page.tsx`
   - Đã được sửa và hoạt động tốt
   - Hỗ trợ tiếng Việt cho fullName
   - Có password validation

3. **Students Page** - `app/(admin)/students/page.tsx`
   - Nhiều loại input khác nhau
   - Có number input với validation
   - Dùng FormDrawer

### Files liên quan

- FormModal: `src/components/admin/FormModal/FormModal.tsx`
- FormDrawer: `src/components/admin/FormDrawer/FormDrawer.tsx`
- Validation helpers: `src/lib/validation.ts`

---

## 🔄 Lịch sử thay đổi

### 2026-01-22: Controller Fix
- **Vấn đề**: Form validation không hoạt động với Ant Design
- **Nguyên nhân**: Dùng `form.register()` thay vì `Controller`
- **Giải pháp**: Chuyển tất cả 7 trang admin sang dùng Controller
- **Kết quả**: 23 fields đã được sửa, build thành công
- **Files**: Users, Students, Sessions, Programs, Posts, FAQs, Categories

---

## 💡 Best Practices

1. **Luôn dùng Controller với UI libraries** (Ant Design, Material-UI, etc.)
2. **Chỉ dùng form.register() với HTML native inputs** (`<input>`, `<textarea>`, `<select>`)
3. **Test validation với tiếng Việt** để đảm bảo regex đúng
4. **Validation mode onChange** cho UX tốt hơn
5. **Hiển thị error messages** rõ ràng cho user
6. **Custom onChange phải gọi field.onChange** trước khi thực hiện logic riêng
7. **Build trước khi commit** để catch lỗi TypeScript sớm

---

**Tạo bởi**: Kiro AI Assistant  
**Ngày**: 2026-01-22  
**Mục đích**: Tránh lặp lại lỗi validation trong tương lai
