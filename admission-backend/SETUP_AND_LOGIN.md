# Setup và Đăng nhập

## 1. Khởi tạo Database

Trước khi đăng nhập, bạn cần seed database để tạo user admin mặc định:

```bash
cd admission-backend

# Chạy migrations (nếu chưa chạy)
npx prisma migrate dev

# Seed database với dữ liệu mặc định
npx prisma db seed
```
npx ts-node prisma/vectorize.ts

## 2. Thông tin đăng nhập mặc định

Sau khi seed database, bạn có thể đăng nhập với:

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin123456` |
| **Email** | `admin@admission.edu.vn` |
| **Role** | Administrator (full permissions) |

## 3. Đăng nhập vào hệ thống

1. Mở trình duyệt và truy cập: **http://localhost:3001/login**
2. Nhập thông tin:
   - Tên đăng nhập: `admin`
   - Mật khẩu: `admin123456`
3. Click "Đăng nhập"

## 4. Thay đổi mật khẩu admin

Để thay đổi mật khẩu admin mặc định:

### Cách 1: Thông qua biến môi trường (khuyến nghị cho production)

Thêm vào file `.env`:
```env
ADMIN_PASSWORD=your-secure-password-here
```

Sau đó chạy lại seed:
```bash
npx prisma db seed
```

### Cách 2: Thông qua UI (sau khi đăng nhập)

1. Đăng nhập với tài khoản admin
2. Vào trang "Users" hoặc "Profile"
3. Thay đổi mật khẩu

## 5. Tạo user mới

Sau khi đăng nhập với tài khoản admin, bạn có thể:

1. Tạo roles mới với permissions tùy chỉnh
2. Tạo users mới và gán roles cho họ
3. Quản lý permissions cho từng role

## 6. Troubleshooting

### Lỗi: "Invalid credentials"

**Nguyên nhân**: Database chưa được seed hoặc mật khẩu không đúng

**Giải pháp**:
```bash
# Kiểm tra xem database đã có dữ liệu chưa
npx prisma studio

# Nếu chưa có, chạy seed
npx prisma db seed
```

### Lỗi: "Cannot connect to database"

**Nguyên nhân**: PostgreSQL chưa chạy hoặc connection string không đúng

**Giải pháp**:
```bash
# Kiểm tra PostgreSQL đang chạy
# Windows: Services -> PostgreSQL
# Linux/Mac: sudo systemctl status postgresql

# Hoặc chạy với Docker
docker-compose up -d postgres
```

### Lỗi: "CORS policy"

**Nguyên nhân**: Backend chưa được restart sau khi cấu hình CORS

**Giải pháp**:
```bash
# Restart backend
cd admission-backend
npm run start:dev
```

## 7. Kiểm tra hệ thống

### Kiểm tra backend đang chạy:
```bash
curl http://localhost:3000/api
```

### Kiểm tra API docs:
Mở trình duyệt: http://localhost:3000/api/docs

### Test login API:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

Nếu thành công, bạn sẽ nhận được response với `accessToken`.

## 8. Ports Summary

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3001 | http://localhost:3001 |
| Backend API | 3000 | http://localhost:3000/api |
| Swagger Docs | 3000 | http://localhost:3000/api/docs |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |

## 9. Development Workflow

```bash
# Terminal 1: Backend
cd admission-backend
npm run start:dev

# Terminal 2: Frontend
cd admission-frontend
npm run dev

# Terminal 3: Database (nếu dùng Docker)
docker-compose up -d
```

Sau đó truy cập: **http://localhost:3001/login**
