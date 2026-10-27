# Hướng dẫn Triển khai Hệ thống trên Azure Static Web Apps (SWA)

Hệ thống Nefab Kaizen Portal được kiến trúc tối ưu theo mô hình Serverless trên Microsoft Azure:
- **Frontend**: Single Page Application (React 18 + Vite) phân phối qua Azure CDN toàn cầu.
- **Backend API**: Azure Functions v4 (Node.js 20, TypeScript) tích hợp trực tiếp (Managed API).
- **Authentication**: Microsoft Entra ID (Azure AD) phân quyền Role `reviewer` và `admin`.
- **Database & Storage**: SharePoint Online List & Document Library qua Microsoft Graph API.

---

## 1. Kiến trúc Bảo mật & Phân quyền

```text
[Công nhân nhà máy]                [Reviewer / Admin Ban Kaizen]
(Mobile Web / Không cần login)      (Đăng nhập Entra ID @nefab.com)
            │                                     │
            ▼                                     ▼
 ┌──────────────────────────────────────────────────────────────┐
 │             Azure Static Web Apps (SWA Standard)             │
 │  - /submit, /track -> Anonymous                              │
 │  - /review, /dashboard -> AllowedRoles: ["reviewer","admin"] │
 └──────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │              Managed API (Azure Functions v4)                │
 │  - Decode x-ms-client-principal                              │
 │  - In-memory IP Rate Limiter & Honeypot                      │
 │  - Client Secret Credential (App-only auth)                  │
 └──────────────────────────────┬───────────────────────────────┘
                                │ Microsoft Graph (Sites.Selected)
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │                      SharePoint Online                       │
 │  - List "KaizenIdeas"                                        │
 │  - Document Library "KaizenImages"                           │
 └──────────────────────────────────────────────────────────────┘
```

---

## 2. Bước 1: Đăng ký Ứng dụng trong Microsoft Entra ID

1. Truy cập [Microsoft Entra Admin Center](https://entra.microsoft.com/) -> **App registrations** -> **New registration**:
   - **Name**: `Nefab-Kaizen-Backend`
   - **Supported account types**: Accounts in this organizational directory only (Single tenant).
2. Lấy **Application (client) ID** và **Directory (tenant) ID**.
3. Vào **Certificates & secrets** -> **New client secret**:
   - Sao chép giá trị bí mật (`Value`) để cấu hình `AZURE_CLIENT_SECRET`.
4. Vào **API permissions** -> **Add a permission** -> **Microsoft Graph** -> **Application permissions**:
   - Chọn `Sites.Selected`.
   - Nhấn **Grant admin consent for [Tenant]**.
5. Cấp quyền vào đúng Site SharePoint theo hướng dẫn tại `docs/sharepoint-setup.md`.

---

## 3. Bước 2: Tạo Azure Static Web Apps trên Azure Portal

1. Truy cập [Azure Portal](https://portal.azure.com/) -> **Create a resource** -> Tìm **Static Web App**.
2. **Basics**:
   - **Plan type**: Chọn **Standard** (Bắt buộc để hỗ trợ Custom Roles: `reviewer`, `admin`).
   - **Deployment details**: Chọn **GitHub**, đăng nhập tài khoản và chọn Repository chứa mã nguồn này.
3. **Build Presets**:
   - **App location**: `/`
   - **Api location**: `api`
   - **Output location**: `dist`
4. Nhấn **Review + create** -> Azure sẽ tự động tạo file GitHub Actions workflow `.github/workflows/azure-static-web-apps-*.yml`.

---

## 4. Bước 3: Cấu hình Biến môi trường (Application Settings)

Trên trang Static Web App trong Azure Portal:
1. Vào menu **Configuration** -> **Application settings**.
2. Thêm các khóa sau:

| Setting Name | Giá trị mẫu | Mục đích |
|---|---|---|
| `AZURE_TENANT_ID` | `00000000-0000-0000-0000-000000000000` | Tenant ID công ty Nefab |
| `AZURE_CLIENT_ID` | `11111111-1111-1111-1111-111111111111` | Client ID của App Registration |
| `AZURE_CLIENT_SECRET` | `Abc123xyz~secretValue` | Client Secret Entra ID |
| `SP_SITE_ID` | `yourcompany.sharepoint.com,guid1,guid2` | Site ID chứa SharePoint List |
| `SP_LIST_NAME` | `KaizenIdeas` | Tên danh sách lưu trữ |
| `SP_DRIVE_NAME` | `KaizenImages` | Tên thư viện lưu ảnh |

*Lưu ý: Không bao giờ commit các secret này vào Git.*

---

## 5. Bước 4: Phân quyền Role Reviewer và Admin cho Nhân sự

Trong Azure Static Web Apps:
1. Vào menu **Role management** -> **Invite**.
2. **Email address**: Nhập email của người thẩm định (VD: `reviewer@nefab.com`).
3. **Domain**: `aad` (Microsoft Entra ID).
4. **Role**:
   - Gõ `reviewer` cho các kỹ sư, tổ trưởng, chuyên viên thẩm định.
   - Gõ `admin` cho Ban Giám đốc và Quản trị viên hệ thống.
5. Sao chép Invitation URL và gửi cho nhân viên đăng nhập kích hoạt quyền lần đầu.

---

## 6. Chạy Thử nghiệm tại Local (SWA CLI)

Để kiểm thử toàn diện cả Frontend, Managed API và xác thực Entra ID tại máy tính phát triển:
```bash
# 1. Cài đặt Static Web Apps CLI và Azure Functions Core Tools
npm install -g @azure/static-web-apps-cli
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# 2. Cài đặt dependencies cho frontend và api
npm install
cd api && npm install && cd ..

# 3. Chạy frontend dev server
npm run dev

# 4. Trong terminal khác, khởi chạy SWA giả lập:
swa start http://localhost:3000 --api-location api
```
Truy cập `http://localhost:4280` để trải nghiệm luồng đăng nhập `/.auth/login/aad` cục bộ.
