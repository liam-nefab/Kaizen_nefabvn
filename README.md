# Nefab Kaizen Portal

**Nefab Kaizen Portal** là hệ thống web hoàn chỉnh, sẵn sàng production, được thiết kế đặc thù cho các nhà máy Nefab tại Việt Nam (Bắc Ninh, Đà Nẵng, Đồng Nai). Hệ thống hỗ trợ thu thập ý tưởng cải tiến từ công nhân trực tiếp, quy trình thẩm định đa cấp của Ban Kaizen và bảng phân tích số liệu trực quan cho Ban Giám đốc.

---

## 🌟 Tính Năng Nổi Bật

### 1. Dành cho Công Nhân Nhà Máy (Public Route - Không cần đăng nhập)
- **Truy cập công khai qua link `/submit`**: Công nhân dùng điện thoại thông minh quét mã QR tại xưởng để gửi ý tưởng mà không cần tài khoản Google hay Microsoft.
- **Thao tác tối giản & Siêu nhanh**:
  - Giao diện mobile-first, nút bấm lớn $\ge 48\text{px}$, cỡ chữ $\ge 16\text{px}$.
  - Hỗ trợ chụp trực tiếp từ camera điện thoại hoặc chọn từ thư viện ảnh.
  - Tự động nén ảnh phía client (Canvas, cạnh dài tối đa 1600px, JPEG ~0.8, dung lượng mục tiêu < 1.5 MB) giúp tiết kiệm 4G và tải cực nhanh.
- **Bảo vệ & Chống spam**:
  - Tích hợp trường ẩn Honeypot.
  - Khóa gửi trùng lặp qua Client Idempotency Key (UUID).
  - Giới hạn tần suất gửi theo IP (Rate limit 10 lượt/giờ/IP).
- **Tra cứu tiến độ minh bạch tại `/track`**:
  - Tra cứu chỉ bằng Mã Kaizen (VD: `KZ-2026-0001`) và Mã nhân viên (VD: `NF1024`).
  - Hiển thị tiến độ 3 bước trực quan: Tiếp nhận -> Ban Kaizen duyệt -> Áp dụng & Khen thưởng.

### 2. Dành cho Ban Thẩm Định & Quản Trị (Reviewer / Admin)
- **Xác thực Microsoft Entra ID (Azure AD)**: Đăng nhập bằng tài khoản email công ty `@nefab.com`.
- **Danh sách quản trị `/review`**:
  - Bảng dữ liệu phân trang, tìm kiếm tức thì.
  - Bộ lọc đa chiều: theo 15 bộ phận chuẩn hóa, 5 lĩnh vực trọng tâm, trạng thái xử lý, phạm vi áp dụng (Bắc Ninh, Đà Nẵng, Đồng Nai, Toàn quốc), Quý/Năm và lọc đề cử giải thưởng Quý.
- **Thẩm định chuyên sâu `/review/:id`**:
  - Giao diện song song: Đối chiếu thông tin gốc do công nhân gửi với ảnh Trước/Sau (tích hợp Lightbox phóng to).
  - Nghiệp vụ thẩm định chặt chẽ: Bắt buộc chọn ngày hoàn thành khi đánh dấu hoàn thành; bắt buộc có người phụ trách và tháng chi trả khi tham dự giải quý.
  - Tự động ghi nhận thông tin người thẩm định và thời điểm từ token Entra ID.
  - Quản trị viên (Admin) có quyền xóa ý tưởng.
- **Dashboard Thống kê `/dashboard`**:
  - 5 thẻ KPI tổng quan: Tổng Kaizen, Đã thẩm định, Tỷ lệ hoàn thành, Tổng tiền tiết kiệm làm lợi (VNĐ), Số Kaizen tham dự giải quý.
  - Biểu đồ Recharts: Xu hướng theo tháng, Xếp hạng đóng góp 15 bộ phận, Cơ cấu 5 lĩnh vực, Phân bố nhà máy.
  - Bảng vinh danh Top 10 cá nhân đóng góp nhiều nhất.
  - Nút xuất báo cáo Excel / CSV với **UTF-8 BOM** chuẩn tiếng Việt.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form, Zod, Recharts, Lucide React.
- **Backend**: Azure Functions v4 (Node.js 20, TypeScript).
- **Cơ sở dữ liệu & Lưu trữ**:
  - SharePoint Online List: `KaizenIdeas`.
  - SharePoint Document Library: `KaizenImages` (chế độ riêng tư, stream qua API).
- **Xác thực & Bảo mật**:
  - Azure Static Web Apps Authentication (Microsoft Entra ID).
  - Microsoft Graph API với App-only permission (`Sites.Selected`).

---

## 📂 Cấu Trúc Thư Mục

```text
├── api/                           # Azure Functions v4 Backend (Node.js 20 + TypeScript)
│   ├── src/
│   │   ├── config.ts              # Đọc biến môi trường
│   │   ├── functions/
│   │   │   └── kaizen.ts          # Các API endpoints: /api/kaizen, /api/stats, /api/export...
│   │   └── services/
│   │       ├── auth.ts            # Giải mã header x-ms-client-principal
│   │       ├── graphClient.ts     # Gọi Microsoft Graph API (Retry 429, cache ID)
│   │       └── rateLimiter.ts     # In-memory IP rate limiter & Magic bytes check
│   ├── host.json
│   ├── local.settings.example.json
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── deploy-azure.md            # Hướng dẫn triển khai Azure Static Web Apps
│   └── sharepoint-setup.md        # Hướng dẫn thiết lập SharePoint List & Permissions
├── scripts/
│   └── create-sharepoint-list.ps1 # Script PowerShell tự động tạo schema SharePoint
├── src/
│   ├── assets/images/             # Hình ảnh chụp thực tế nhà máy & giải thưởng
│   ├── components/common/         # Header, Footer, Logo, Toast, Lightbox, MockRoleBar
│   ├── constants/kaizen.ts        # 15 bộ phận, 5 lĩnh vực, 4 phạm vi, màu thương hiệu Nefab
│   ├── context/AuthContext.tsx    # Context xác thực Entra ID và Giả lập vai trò
│   ├── pages/                     # HomePage, SubmitPage, TrackPage, ReviewList, ReviewDetail, Dashboard
│   ├── routes/ProtectedRoute.tsx  # Bảo vệ route yêu cầu role Reviewer/Admin
│   ├── services/
│   │   ├── api/                   # Dual client: MockApiClient và HttpApiClient
│   │   │   ├── httpApiClient.ts
│   │   │   ├── mockApiClient.ts
│   │   │   ├── mockData.ts        # 30 bản ghi mẫu tiếng Việt thực tế
│   │   │   └── types.ts
│   │   └── imageCompression.ts    # Nén ảnh canvas cạnh 1600px < 1.5MB
│   ├── types/kaizen.ts            # Định nghĩa kiểu dữ liệu TypeScript
│   ├── App.tsx
│   └── main.tsx
├── staticwebapp.config.json       # Định tuyến SWA, phân quyền roles và bảo mật CSP
└── package.json
```

---

## 🚀 Khởi Chạy Local

### 1. Chế độ Xem trước Độc lập (Demo Mode)
Hệ thống tích hợp sẵn `MockApiClient` với 30 bản ghi Kaizen mẫu phản ánh thực tế sản xuất tại 3 nhà máy Nefab:
```bash
npm install
npm run dev
```
Mở trình duyệt tại `http://localhost:3000`. Bạn có thể dùng thanh công cụ ghim dưới màn hình để chuyển nhanh giữa các vai trò: **Công nhân (Public)**, **Reviewer**, **Admin**.

### 2. Chạy với Azure Static Web Apps CLI & API Thật
```bash
# Terminal 1: Chạy Vite dev server
npm run dev

# Terminal 2: Chạy SWA CLI tích hợp Azure Functions
swa start http://localhost:3000 --api-location api
```
Truy cập `http://localhost:4280`.

---

## 📋 Danh Sách 15 Bộ Phận Chuẩn Hóa
1. Kinh doanh
2. Nhân sự & Thương hiệu
3. Sản xuất -Đài Loan
4. Sản xuất- Giấy
5. Sản xuất- Gỗ
6. Sản xuất- Nhựa
7. Tài chính - Kế toán
8. Thiết kế
9. Vận hành
10. Vận hành - Bảo trì
11. Vận hành - Chất lượng
12. Vận hành - Kho
13. Vận hành- CS
14. Vận hành- Planning
15. Vận hành- Pur

---

## 🔒 Bản quyền & Giấy phép
© 2026 Nefab Group. Hệ thống sáng kiến Kaizen nhà máy.
