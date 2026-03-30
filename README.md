# Nhân Viên Thị Trường (NVTT)

## Tổng quan
Ứng dụng web mobile-first dành cho nhân viên thị trường, hỗ trợ quản lý hồ sơ cá nhân và check-in/out với định vị + chụp ảnh có watermark.

## Tính năng đã hoàn thành

### 👤 Quản lý hồ sơ cá nhân
- Cập nhật thông tin CCCD (số, họ tên, ngày sinh, giới tính, địa chỉ, ngày cấp/hết hạn)
- Chụp/chọn ảnh mặt trước + mặt sau CCCD
- Cập nhật thông tin ngân hàng (tên ngân hàng, số tài khoản, tên chủ tài khoản)
- Đổi mật khẩu

### 📍 Check-in / Check-out
- **Check-in**: Lấy GPS tự động + chụp 2 ảnh xác nhận
- **Ảnh hoạt động**: 4 ảnh hoạt động bán hàng trong ngày
- **Check-out**: Lấy GPS + chụp 2 ảnh + nhập số lượng bán + ghi chú
- Tất cả ảnh đều được chèn **watermark thời gian + địa điểm**
- Lịch sử check-in theo ngày

### 🛡️ Quản trị viên (Admin)
- Quản lý danh sách nhân viên (thêm/vô hiệu hóa/kích hoạt)
- Reset mật khẩu nhân viên
- Xem báo cáo check-in theo ngày (có ảnh)

## Kiến trúc Module

```
src/
├── index.tsx              # Main app entry, kết nối routes
├── routes/
│   ├── auth.ts            # Đăng nhập, đăng xuất, đổi mật khẩu
│   ├── profile.ts         # Hồ sơ cá nhân, ảnh CCCD
│   ├── checkin.ts         # Check-in/out, ảnh hoạt động
│   └── admin.ts           # Quản lý nhân viên (admin only)
├── middleware/
│   └── auth.ts            # JWT auth middleware
└── lib/
    ├── crypto.ts           # Mã hóa, JWT, hash password
    └── response.ts         # Chuẩn hóa API response

public/static/js/
├── config.js              # Cấu hình toàn cục
├── api.js                 # HTTP client
├── toast.js               # Thông báo
├── modal.js               # Hộp thoại
├── camera.js              # Chụp ảnh, resize
├── geo.js                 # GPS, reverse geocoding
├── watermark.js           # Chèn thời gian/địa điểm lên ảnh
├── auth.js                # Đăng nhập UI
├── profile.js             # Hồ sơ UI
├── checkin.js             # Check-in/out UI
├── admin.js               # Admin panel UI
└── app.js                 # Router chính
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| POST | /api/auth/login | Đăng nhập |
| GET | /api/auth/me | Thông tin hiện tại |
| POST | /api/auth/change-password | Đổi mật khẩu |
| GET | /api/profile | Lấy hồ sơ |
| PUT | /api/profile | Cập nhật hồ sơ |
| POST | /api/profile/upload-cccd | Upload ảnh CCCD |
| POST | /api/checkin/start | Check-in |
| POST | /api/checkin/activity | Cập nhật ảnh hoạt động |
| POST | /api/checkin/end | Check-out |
| GET | /api/checkin/today | Dữ liệu hôm nay |
| GET | /api/checkin/history | Lịch sử |
| GET | /api/admin/users | Danh sách NV (admin) |
| POST | /api/admin/users | Tạo NV mới (admin) |
| GET | /api/admin/checkins | Báo cáo check-in (admin) |

## Tài khoản mặc định

| Vai trò | Username | Password |
|---------|----------|----------|
| Admin | admin | admin123 |
| Nhân viên | nhanvien01 | Staff@123 |

## Công nghệ

- **Backend**: Hono (TypeScript) + Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JS (module pattern) + Tailwind CSS CDN
- **Auth**: JWT (HMAC-SHA256 via Web Crypto API)
- **Ảnh**: Canvas API + watermark
- **GPS**: Geolocation API + Nominatim reverse geocoding

## Chạy local

```bash
npm install
npm run db:migrate:local   # Tạo bảng
npm run db:seed            # Dữ liệu mẫu
npm run build              # Build
pm2 start ecosystem.config.cjs  # Start server
# Mở http://localhost:3000
```

## Deploy lên Cloudflare Pages

```bash
# 1. Tạo D1 database production
npx wrangler d1 create webapp-production
# Cập nhật database_id trong wrangler.jsonc

# 2. Apply migration
npx wrangler d1 migrations apply webapp-production

# 3. Deploy
npm run deploy:prod
```

## Trạng thái

- ✅ API hoàn chỉnh và hoạt động
- ✅ Giao diện mobile-first
- ✅ Check-in/out với GPS và ảnh
- ✅ Watermark thời gian + địa điểm
- ✅ Admin panel
- ⏳ Deploy Cloudflare Pages (cần Cloudflare API key)
