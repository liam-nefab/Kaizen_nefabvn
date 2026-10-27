<#
.SYNOPSIS
    Khởi tạo tự động SharePoint List "KaizenIdeas" và Document Library "KaizenImages"
    cho hệ thống Nefab Kaizen Portal bằng PnP.PowerShell.
.DESCRIPTION
    Script này tạo đầy đủ schema cột nội bộ ASCII, các giá trị Choice (15 bộ phận, 5 lĩnh vực, 4 phạm vi)
    và cấp quyền cho Azure Entra ID App Registration.
.EXAMPLE
    Connect-PnPOnline -Url "https://yourcompany.sharepoint.com/sites/NefabVietnam" -Interactive
    .\scripts\create-sharepoint-list.ps1
#>

[CmdletBinding()]
param(
    [string]$ListName = "KaizenIdeas",
    [string]$LibraryName = "KaizenImages"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  NEFAB KAIZEN PORTAL - SHAREPOINT SETUP " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Kiểm tra kết nối SharePoint Online
try {
    $ctx = Get-PnPContext
    if (-not $ctx) {
        Write-Error "Chưa kết nối SharePoint. Hãy chạy 'Connect-PnPOnline -Url <SiteUrl> -Interactive' trước."
        exit 1
    }
    Write-Host "Đã kết nối site: $($ctx.Url)" -ForegroundColor Green
} catch {
    Write-Error "Lỗi context SharePoint: $_"
    exit 1
}

# 2. Khởi tạo Document Library "KaizenImages"
Write-Host "`n[1/3] Đang kiểm tra thư viện tài liệu '$LibraryName'..." -ForegroundColor Yellow
$library = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue
if (-not $library) {
    Write-Host "Đang tạo Document Library '$LibraryName'..." -ForegroundColor Cyan
    $library = New-PnPList -Title $LibraryName -Template DocumentLibrary -EnableVersioning
    Write-Host "Đã tạo thư viện '$LibraryName' thành công." -ForegroundColor Green
} else {
    Write-Host "Thư viện '$LibraryName' đã tồn tại." -ForegroundColor Gray
}

# 3. Khởi tạo SharePoint List "KaizenIdeas"
Write-Host "`n[2/3] Đang kiểm tra SharePoint List '$ListName'..." -ForegroundColor Yellow
$list = Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue
if (-not $list) {
    Write-Host "Đang tạo SharePoint List '$ListName'..." -ForegroundColor Cyan
    $list = New-PnPList -Title $ListName -Template GenericList -EnableVersioning
    Write-Host "Đã tạo danh sách '$ListName' thành công." -ForegroundColor Green
} else {
    Write-Host "Danh sách '$ListName' đã tồn tại." -ForegroundColor Gray
}

# 4. Định nghĩa danh sách 15 Bộ phận & 5 Lĩnh vực & 4 Phạm vi
$departments = @(
    "Kinh doanh",
    "Nhân sự & Thương hiệu",
    "Sản xuất -Đài Loan",
    "Sản xuất- Giấy",
    "Sản xuất- Gỗ",
    "Sản xuất- Nhựa",
    "Tài chính - Kế toán",
    "Thiết kế",
    "Vận hành",
    "Vận hành - Bảo trì",
    "Vận hành - Chất lượng",
    "Vận hành - Kho",
    "Vận hành- CS",
    "Vận hành- Planning",
    "Vận hành- Pur"
)

$categories = @(
    "Cải tiến dụng cụ/ máy móc",
    "An toàn/ 5S",
    "Năng suất",
    "Chất lượng",
    "Chuỗi cung ứng"
)

$scopes = @(
    "Bắc Ninh",
    "Đà Nẵng",
    "Đồng Nai",
    "Tất cả"
)

# 5. Thêm các trường (Columns) theo đúng Internal Name ASCII
Write-Host "`n[3/3] Đang tạo các cột dữ liệu theo Schema..." -ForegroundColor Yellow

function Add-CustomField {
    param(
        [string]$DisplayName,
        [string]$InternalName,
        [string]$Type,
        [bool]$Required = $false,
        [string[]]$Choices = @()
    )

    $field = Get-PnPField -List $ListName -Identity $InternalName -ErrorAction SilentlyContinue
    if (-not $field) {
        Write-Host "  + Tạo cột: $DisplayName ($InternalName) [$Type]" -ForegroundColor Cyan
        switch ($Type) {
            "Text" {
                Add-PnPField -List $ListName -DisplayName $DisplayName -InternalName $InternalName -Type Text -AddToDefaultView
            }
            "Note" {
                Add-PnPField -List $ListName -DisplayName $DisplayName -InternalName $InternalName -Type Note -AddToDefaultView
            }
            "DateTime" {
                Add-PnPField -List $ListName -DisplayName $DisplayName -InternalName $InternalName -Type DateTime -AddToDefaultView
            }
            "Number" {
                Add-PnPField -List $ListName -DisplayName $DisplayName -InternalName $InternalName -Type Number -AddToDefaultView
            }
            "Choice" {
                Add-PnPField -List $ListName -DisplayName $DisplayName -InternalName $InternalName -Type Choice -Choices $Choices -AddToDefaultView
            }
        }
    } else {
        Write-Host "  = Cột $InternalName đã tồn tại" -ForegroundColor Gray
    }
}

# Các trường do người nộp gửi
Add-CustomField -DisplayName "Ngày nộp" -InternalName "SubmitDate" -Type "DateTime" -Required $true
Add-CustomField -DisplayName "Chủ đề" -InternalName "Topic" -Type "Text" -Required $true
Add-CustomField -DisplayName "Mã số nhân viên" -InternalName "EmployeeId" -Type "Text" -Required $true
Add-CustomField -DisplayName "Bộ phận" -InternalName "Department" -Type "Choice" -Choices $departments -Required $true
Add-CustomField -DisplayName "Tên ý tưởng Kaizen" -InternalName "IdeaName" -Type "Text" -Required $true
Add-CustomField -DisplayName "Lĩnh vực Kaizen" -InternalName "Category" -Type "Choice" -Choices $categories -Required $true
Add-CustomField -DisplayName "Hiện trạng" -InternalName "CurrentState" -Type "Note" -Required $true
Add-CustomField -DisplayName "Nguyên nhân" -InternalName "RootCause" -Type "Note" -Required $true
Add-CustomField -DisplayName "Lợi ích" -InternalName "Benefit" -Type "Note" -Required $true
Add-CustomField -DisplayName "URL Ảnh Trước" -InternalName "BeforeImageUrl" -Type "Note" -Required $true
Add-CustomField -DisplayName "URL Ảnh Sau" -InternalName "AfterImageUrl" -Type "Note"
Add-CustomField -DisplayName "Số tiền tiết kiệm" -InternalName "SavingAmount" -Type "Number"
Add-CustomField -DisplayName "Idempotency Key" -InternalName "IdempotencyKey" -Type "Text"

# Các trường do Reviewer thẩm định
Add-CustomField -DisplayName "Trạng thái" -InternalName "Status" -Type "Choice" -Choices @("Mới", "Đã thẩm định")
Add-CustomField -DisplayName "Phạm vi" -InternalName "Scope" -Type "Choice" -Choices $scopes
Add-CustomField -DisplayName "Phụ trách thực thi" -InternalName "Owner" -Type "Text"
Add-CustomField -DisplayName "Kiểm tra hoàn thành" -InternalName "Completion" -Type "Choice" -Choices @("Hoàn thành", "Chưa hoàn thành")
Add-CustomField -DisplayName "Ngày thực hiện" -InternalName "ImplementDate" -Type "DateTime"
Add-CustomField -DisplayName "Tháng chi trả" -InternalName "PayMonth" -Type "Text"
Add-CustomField -DisplayName "Ghi chú thẩm định" -InternalName "ReviewerNote" -Type "Note"
Add-CustomField -DisplayName "Chọn tham dự giải quý" -InternalName "QuarterlyAward" -Type "Choice" -Choices @("Có", "Không")
Add-CustomField -DisplayName "Người thẩm định" -InternalName "ReviewedBy" -Type "Text"
Add-CustomField -DisplayName "Thời điểm thẩm định" -InternalName "ReviewedAt" -Type "DateTime"
Add-CustomField -DisplayName "Quý" -InternalName "Quarter" -Type "Text"

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host " HOÀN TẤT THIẾT LẬP SHAREPOINT LIST VÀ THƯ VIỆN ẢNH NEFAB! " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
