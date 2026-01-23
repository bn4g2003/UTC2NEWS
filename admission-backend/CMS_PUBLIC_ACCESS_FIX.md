# CMS Public Access Fix

## Vấn đề đã sửa

### 1. Lỗi 401 Unauthorized trên trang public
**Nguyên nhân:** Controller CMS có `@UseGuards(JwtAuthGuard, PermissionsGuard)` ở cấp class, khiến TẤT CẢ endpoints đều yêu cầu authentication, kể cả các endpoint public như GET posts và categories.

**Giải pháp:** Di chuyển guards xuống từng endpoint riêng lẻ, chỉ áp dụng cho các endpoint cần authentication (POST, PUT, DELETE).

### 2. Thiếu fields trong Post model
**Nguyên nhân:** Database thiếu các trường `excerpt` và `featuredImage` mà frontend đang gửi.

**Giải pháp:** 
- Cập nhật Prisma schema thêm 2 trường mới
- Cập nhật DTOs (CreatePostDto, UpdatePostDto)
- Tạo migration để cập nhật database

## Các thay đổi đã thực hiện

### 1. Backend - CMS Controller (`src/cms/cms.controller.ts`)
- ✅ Xóa `@UseGuards` và `@ApiBearerAuth` ở cấp class
- ✅ Thêm guards riêng cho từng endpoint cần authentication:
  - POST, PUT, DELETE endpoints: Có `@UseGuards(JwtAuthGuard, PermissionsGuard)`
  - GET endpoints: Không có guards (public access)

### 2. Prisma Schema (`prisma/schema.prisma`)
- ✅ Thêm `excerpt String?` vào Post model
- ✅ Thêm `featuredImage String?` vào Post model

### 3. DTOs
- ✅ Cập nhật `CreatePostDto` thêm excerpt và featuredImage
- ✅ `UpdatePostDto` tự động kế thừa từ CreatePostDto

### 4. Database Migration
- ✅ Tạo migration: `20260122063410_add_excerpt_and_featured_image_to_posts`
- ✅ Migration đã được apply thành công

## Endpoints hiện tại

### Public Endpoints (không cần authentication)
- `GET /api/cms/categories` - Lấy tất cả categories
- `GET /api/cms/categories/:id` - Lấy category theo ID
- `GET /api/cms/posts` - Lấy tất cả posts (có thể filter published=true)
- `GET /api/cms/posts/:id` - Lấy post theo ID
- `GET /api/cms/faqs` - Lấy tất cả FAQs
- `GET /api/cms/faqs/:id` - Lấy FAQ theo ID
- `GET /api/cms/media` - Lấy tất cả media files
- `GET /api/cms/media/:id` - Lấy media file theo ID

### Protected Endpoints (cần authentication + permissions)
- `POST /api/cms/categories` - Tạo category (requires: categories:create)
- `PUT /api/cms/categories/:id` - Cập nhật category (requires: categories:update)
- `DELETE /api/cms/categories/:id` - Xóa category (requires: categories:delete)
- `POST /api/cms/posts` - Tạo post (requires: posts:create)
- `PUT /api/cms/posts/:id` - Cập nhật post (requires: posts:update)
- `DELETE /api/cms/posts/:id` - Xóa post (requires: posts:delete)
- `POST /api/cms/faqs` - Tạo FAQ (requires: faqs:create)
- `PUT /api/cms/faqs/:id` - Cập nhật FAQ (requires: faqs:update)
- `DELETE /api/cms/faqs/:id` - Xóa FAQ (requires: faqs:delete)
- `POST /api/cms/media` - Upload media (requires: media:upload)
- `DELETE /api/cms/media/:id` - Xóa media (requires: media:delete)

## Cách restart backend

```bash
# Dừng backend hiện tại (Ctrl+C trong terminal đang chạy)
# Hoặc kill process:
# taskkill /F /PID <process_id>

# Chạy lại backend
cd admission-backend
npm run start:dev
```

## Kiểm tra sau khi restart

1. **Trang public `/tin-tuc` nên load được posts** - Không còn lỗi 401
2. **Trang public `/nganh-tuyen-sinh` nên load được majors** - Không còn lỗi 401
3. **Upload ảnh trong admin** - Vẫn cần authentication (đúng như thiết kế)
4. **Tạo/sửa posts** - Có thể thêm excerpt và featured image

## Lưu ý về Upload ảnh

Upload ảnh vẫn yêu cầu:
- ✅ Authentication (JWT token)
- ✅ Permission: `media:upload`
- ✅ File field name: `'file'`
- ✅ Supported types: images (jpeg, jpg, png, gif, webp) và PDF
- ✅ Max size: 10MB

Nếu vẫn gặp lỗi 400 khi upload, kiểm tra:
1. User đã login chưa?
2. User có permission `media:upload` chưa?
3. File có đúng định dạng và kích thước không?
