# Hướng dẫn Thiết lập SharePoint cho Nefab Kaizen Portal

Tài liệu này hướng dẫn chi tiết cách khởi tạo SharePoint List `KaizenIdeas`, Document Library `KaizenImages`, và cấp quyền truy cập ứng dụng (App-only với quyền `Sites.Selected`) qua Microsoft Graph API.

---

## 1. Yêu cầu tiên quyết
- Quyền **SharePoint Administrator** hoặc **Site Owner** trên Site SharePoint của Nefab (VD: `https://yourcompany.sharepoint.com/sites/NefabVietnam`).
- Cài đặt module **PnP.PowerShell** trên máy tính:
  ```powershell
  Install-Module -Name PnP.PowerShell -Scope CurrentUser
  ```

---

## 2. Chạy Script Tự động tạo List và Library
Mở PowerShell và chạy:
```powershell
# 1. Kết nối đến Site SharePoint của công ty
Connect-PnPOnline -Url "https://yourcompany.sharepoint.com/sites/NefabVietnam" -Interactive

# 2. Chạy script tạo cấu trúc
.\scripts\create-sharepoint-list.ps1
```

---

## 3. Bảng Ánh xạ Schema Cột (Internal ASCII Name)

| Tên hiển thị (Tiếng Việt) | Internal Name (ASCII) | Kiểu dữ liệu | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| **Mã Kaizen** | `Title` | Single Line Text | Có | API sinh dạng `KZ-YYYY-NNNN` |
| **Ngày nộp** | `SubmitDate` | Date and Time | Có | Định dạng YYYY-MM-DD |
| **Chủ đề** | `Topic` | Single Line Text | Có | Tối đa 150 ký tự |
| **Mã số nhân viên** | `EmployeeId` | Single Line Text | Có | Trim, in hoa (VD: `NF1024`) |
| **Bộ phận** | `Department` | Choice | Có | 15 giá trị chuẩn hóa |
| **Tên ý tưởng Kaizen** | `IdeaName` | Single Line Text | Có | Tối đa 150 ký tự |
| **Lĩnh vực Kaizen** | `Category` | Choice | Có | 5 giá trị trọng tâm |
| **Hiện trạng** | `CurrentState` | Multiple Lines | Có | Tối thiểu 10 ký tự |
| **Nguyên nhân** | `RootCause` | Multiple Lines | Có | Tối thiểu 10 ký tự |
| **Lợi ích** | `Benefit` | Multiple Lines | Có | Tối thiểu 10 ký tự |
| **URL Ảnh Trước** | `BeforeImageUrl` | Multiple Lines | Có | Đường dẫn ảnh trong `KaizenImages` |
| **URL Ảnh Sau** | `AfterImageUrl` | Multiple Lines | Không | Đường dẫn ảnh sau |
| **Số tiền tiết kiệm** | `SavingAmount` | Number | Không | VNĐ, không âm |
| **Idempotency Key** | `IdempotencyKey` | Single Line Text | Có | UUID chống gửi trùng |
| **Trạng thái** | `Status` | Choice | Có | `Mới` / `Đã thẩm định` |
| **Phạm vi** | `Scope` | Choice | Không | `Bắc Ninh` / `Đà Nẵng` / `Đồng Nai` / `Tất cả` |
| **Phụ trách thực thi** | `Owner` | Single Line Text | Không | Họ tên & Bộ phận thực thi |
| **Kiểm tra hoàn thành** | `Completion` | Choice | Không | `Hoàn thành` / `Chưa hoàn thành` |
| **Ngày thực hiện** | `ImplementDate` | Date and Time | Không | Bắt buộc khi Hoàn thành |
| **Tháng chi trả** | `PayMonth` | Single Line Text | Không | Định dạng `YYYY-MM` |
| **Ghi chú thẩm định** | `ReviewerNote` | Multiple Lines | Không | Nhận xét của Reviewer |
| **Chọn tham dự giải quý** | `QuarterlyAward` | Choice | Không | `Có` / `Không` |
| **Người thẩm định** | `ReviewedBy` | Single Line Text | Không | Email tài khoản Entra ID |
| **Thời điểm thẩm định** | `ReviewedAt` | Date and Time | Không | ISO 8601 UTC |
| **Quý** | `Quarter` | Single Line Text | Không | Tự tính (VD: `2026-Q4`) |

---

## 4. Cấu trúc Thư viện Ảnh "KaizenImages"
Mỗi khi có ý tưởng nộp lên, API tự động tạo folder theo Mã Kaizen:
```text
KaizenImages/
  ├── KZ-2026-0001/
  │     ├── before.jpg
  │     └── after.jpg
  ├── KZ-2026-0002/
  │     └── before.jpg
```
Thư viện này để chế độ **Private**, nhân viên thông thường không truy cập trực tiếp URL. Trình duyệt xem ảnh qua API proxy stream ảnh bảo mật.

---

## 5. Cấp quyền `Sites.Selected` cho App Registration
Để tuân thủ nguyên tắc Least Privilege (không cấp quyền `Sites.ReadWrite.All` trên toàn tenant):
1. Đăng ký App Registration trong Entra ID với API Permission: `Microsoft Graph -> Application -> Sites.Selected`.
2. Dùng PnP PowerShell cấp quyền chỉ trên đúng Site của Nefab:
   ```powershell
   Grant-PnPAzureADAppSitePermission `
     -AppId "<AZURE_CLIENT_ID>" `
     -DisplayName "Nefab-Kaizen-Backend" `
     -Permissions Write `
     -Site "https://yourcompany.sharepoint.com/sites/NefabVietnam"
   ```
3. Lấy `SP_SITE_ID`:
   Truy cập Graph Explorer hoặc chạy:
   ```powershell
   $web = Get-PnPWeb -Includes Id
   $site = Get-PnPSite -Includes Id
   # SP_SITE_ID có dạng: <tenant_domain>,<site_id>,<web_id>
   ```
4. Điền `SP_SITE_ID` vào App Settings của Azure Functions.
