/**
 * =========================================================================
 * NEFAB KAIZEN PORTAL - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * Phiên bản: 2.0 (Chuẩn hóa Canonical Categories & Passcode Auth)
 * =========================================================================
 * Các chức năng chính:
 * 1. doPost / doGet: Tiếp nhận và xử lý RESTful JSON request từ Web App.
 * 2. Xác thực Passcode: Cấp Token 6 giờ, chống brute-force (khóa 15 phút sau 5 lần sai).
 * 3. Chuẩn hóa dữ liệu (MỘT NGUỒN SỰ THẬT): Category (5 lĩnh vực), Department (15 bộ phận).
 * 4. Ghi nhận Kaizen vào Google Sheet & lưu trữ ảnh Base64 lên Google Drive.
 * 5. Thẩm định, Lọc, Phân trang, Thống kê Dashboard & Xuất CSV (UTF-8).
 * 6. Hàm bảo trì: migrateCategories() và testNormalizeCategory().
 * =========================================================================
 */

// -------------------------------------------------------------------------
// 1. HẰNG SỐ CHUẨN HÓA (CANONICAL VALUES - SINGLE SOURCE OF TRUTH)
// -------------------------------------------------------------------------

var CANONICAL_CATEGORIES = [
  'Cải tiến dụng cụ/ máy móc',
  'An toàn/ 5S',
  'Năng suất',
  'Chất lượng',
  'Chuỗi cung ứng'
];

var CANONICAL_DEPARTMENTS = [
  'Kinh doanh',
  'Nhân sự & Thương hiệu',
  'Sản xuất -Đài Loan',
  'Sản xuất- Giấy',
  'Sản xuất- Gỗ',
  'Sản xuất- Nhựa',
  'Tài chính - Kế toán',
  'Thiết kế',
  'Vận hành',
  'Vận hành - Bảo trì',
  'Vận hành - Chất lượng',
  'Vận hành - Kho',
  'Vận hành- CS',
  'Vận hành- Planning',
  'Vận hành- Pur'
];

var CANONICAL_SCOPES = ['Bắc Ninh', 'Đà Nẵng', 'Đồng Nai', 'Tất cả'];
var CANONICAL_COMPLETION = ['Hoàn thành', 'Chưa hoàn thành'];
var CANONICAL_QUARTERLY_AWARDS = ['Có', 'Không'];

// Cấu hình tên Sheet
var SHEET_NAME_KAIZEN = 'KaizenList';
var DRIVE_FOLDER_NAME = 'Nefab_Kaizen_Images';

// Thời gian hiệu lực Token (giây): 6 tiếng = 21600 giây
var TOKEN_TTL_SECONDS = 21600;
// Khóa IP/thiết bị sau 5 lần đăng nhập thất bại trong 15 phút (900 giây)
var MAX_FAILED_ATTEMPTS = 5;
var LOCKOUT_SECONDS = 900;

// -------------------------------------------------------------------------
// 2. HÀM CHUẨN HÓA CHUỖI (NORMALIZATION FUNCTIONS)
// -------------------------------------------------------------------------

/**
 * Loại bỏ dấu tiếng Việt để so khớp không dấu
 */
function removeVietnameseAccents(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Chuẩn hóa Lĩnh vực (Category) về 1 trong 5 giá trị canonical
 * Xử lý: NFC, trim, gom nhiều dấu cách, chuẩn hóa khoảng trắng quanh dấu '/', không phân biệt hoa/thường/dấu.
 */
function normalizeCategory(raw) {
  if (!raw || typeof raw !== 'string') return null;

  var cleaned = raw
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/ '); // chuẩn hóa khoảng trắng quanh '/'

  var lower = cleaned.toLowerCase();
  var noAccent = removeVietnameseAccents(lower);

  // 1. Cải tiến dụng cụ/ máy móc
  if (
    noAccent.indexOf('dung cu') !== -1 ||
    noAccent.indexOf('may moc') !== -1 ||
    noAccent.indexOf('may') !== -1 ||
    noAccent.indexOf('tool') !== -1 ||
    noAccent.indexOf('machine') !== -1
  ) {
    return 'Cải tiến dụng cụ/ máy móc';
  }

  // 2. An toàn/ 5S
  if (
    noAccent.indexOf('an toan') !== -1 ||
    noAccent.indexOf('5s') !== -1 ||
    noAccent.indexOf('safety') !== -1
  ) {
    return 'An toàn/ 5S';
  }

  // 3. Năng suất
  if (
    noAccent.indexOf('nang suat') !== -1 ||
    noAccent.indexOf('productivity') !== -1
  ) {
    return 'Năng suất';
  }

  // 4. Chất lượng
  if (
    noAccent.indexOf('chat luong') !== -1 ||
    noAccent.indexOf('quality') !== -1
  ) {
    return 'Chất lượng';
  }

  // 5. Chuỗi cung ứng
  if (
    noAccent.indexOf('chuoi cung ung') !== -1 ||
    noAccent.indexOf('cung ung') !== -1 ||
    noAccent.indexOf('supply chain') !== -1
  ) {
    return 'Chuỗi cung ứng';
  }

  // So khớp trực tiếp mảng chuẩn
  for (var i = 0; i < CANONICAL_CATEGORIES.length; i++) {
    if (CANONICAL_CATEGORIES[i].toLowerCase() === lower) {
      return CANONICAL_CATEGORIES[i];
    }
  }

  return null;
}

/**
 * Chuẩn hóa Bộ phận (Department) về 1 trong 15 bộ phận canonical
 */
function normalizeDepartment(raw) {
  if (!raw || typeof raw !== 'string') return null;

  var cleaned = raw
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ');

  var lower = cleaned.toLowerCase();
  var simplified = lower.replace(/\s*-\s*/g, '-');

  for (var i = 0; i < CANONICAL_DEPARTMENTS.length; i++) {
    var dep = CANONICAL_DEPARTMENTS[i];
    if (dep.toLowerCase() === lower) {
      return dep;
    }
    if (dep.toLowerCase().replace(/\s*-\s*/g, '-') === simplified) {
      return dep;
    }
  }

  return null;
}

function normalizeScope(raw) {
  if (!raw) return 'Tất cả';
  var cleaned = String(raw).normalize('NFC').trim();
  for (var i = 0; i < CANONICAL_SCOPES.length; i++) {
    if (CANONICAL_SCOPES[i].toLowerCase() === cleaned.toLowerCase()) {
      return CANONICAL_SCOPES[i];
    }
  }
  return 'Tất cả';
}

function normalizeCompletion(raw) {
  if (!raw) return 'Chưa hoàn thành';
  var cleaned = String(raw).normalize('NFC').trim();
  for (var i = 0; i < CANONICAL_COMPLETION.length; i++) {
    if (CANONICAL_COMPLETION[i].toLowerCase() === cleaned.toLowerCase()) {
      return CANONICAL_COMPLETION[i];
    }
  }
  return 'Chưa hoàn thành';
}

function normalizeQuarterlyAward(raw) {
  if (!raw) return 'Không';
  var cleaned = String(raw).normalize('NFC').trim();
  return cleaned.toLowerCase() === 'có' || cleaned.toLowerCase() === 'co' ? 'Có' : 'Không';
}

// -------------------------------------------------------------------------
// 3. XỬ LÝ REQUEST: doPost & doGet
// -------------------------------------------------------------------------

function doGet(e) {
  return createJsonResponse({
    ok: true,
    data: {
      status: 'ok',
      message: 'Nefab Kaizen Portal API đang hoạt động bình thường.',
      time: new Date().toISOString(),
      version: '2.0-Nefab'
    }
  });
}

function doPost(e) {
  try {
    var rawText = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var req;
    try {
      req = JSON.parse(rawText);
    } catch (parseErr) {
      return createErrorResponse('Yêu cầu không đúng định dạng JSON', 400);
    }

    var action = req.action;
    var payload = req.payload || {};
    var token = req.token || null;

    // 1. PING: Kiểm tra kết nối không cần token
    if (action === 'ping') {
      return createJsonResponse({
        ok: true,
        data: {
          status: 'ok',
          time: new Date().toISOString(),
          version: '2.0-Nefab',
          configuredSheets: true
        }
      });
    }

    // 2. LOGIN: Xác thực Passcode
    if (action === 'login') {
      return handleLogin(payload);
    }

    // 3. SUBMIT: Nộp Kaizen mới (Public)
    if (action === 'submit') {
      return handleSubmit(payload);
    }

    // 4. TRACK: Tra cứu Kaizen công khai theo Mã + Mã NV
    if (action === 'track') {
      return handleTrack(payload);
    }

    // CÁC THAO TÁC CẦN XÁC THỰC (Reviewer hoặc Admin)
    var authUser = verifyToken(token);
    if (!authUser) {
      return createErrorResponse('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', 401);
    }

    // 5. LIST: Lấy danh sách Kaizen có bộ lọc & phân trang
    if (action === 'list') {
      return handleList(payload, authUser);
    }

    // 6. GET: Lấy chi tiết 1 Kaizen
    if (action === 'get') {
      return handleGet(payload, authUser);
    }

    // 7. REVIEW: Cập nhật kết quả thẩm định
    if (action === 'review') {
      return handleReview(payload, authUser);
    }

    // 8. STATS: Thống kê số liệu Dashboard
    if (action === 'stats') {
      return handleStats(payload, authUser);
    }

    // 9. EXPORT: Xuất nội dung CSV
    if (action === 'export') {
      return handleExport(payload, authUser);
    }

    // 10. DELETE: Xóa Kaizen (Chỉ Admin)
    if (action === 'delete') {
      if (authUser.role !== 'admin') {
        return createErrorResponse('Chỉ Quản trị viên (Admin) mới có quyền xóa ý tưởng Kaizen', 403);
      }
      return handleDelete(payload, authUser);
    }

    return createErrorResponse('Thao tác không được hỗ trợ: ' + action, 400);

  } catch (err) {
    Logger.log('Error in doPost: ' + err.toString());
    return createErrorResponse('Lỗi máy chủ nội bộ: ' + err.toString(), 500);
  }
}

// -------------------------------------------------------------------------
// 4. QUẢN LÝ XÁC THỰC PASSCODE & TOKEN (CHỐNG BRUTE FORCE)
// -------------------------------------------------------------------------

/**
 * Lấy Passcode từ Script Properties hoặc dùng giá trị mặc định an toàn
 */
function getSystemPasscodes() {
  var props = PropertiesService.getScriptProperties();
  var reviewerPass = props.getProperty('REVIEWER_PASSCODE') || 'nefab2026';
  var adminPass = props.getProperty('ADMIN_PASSCODE') || 'admin2026';
  return {
    reviewer: reviewerPass.trim(),
    admin: adminPass.trim()
  };
}

/**
 * Xử lý đăng nhập với Passcode
 */
function handleLogin(payload) {
  var passcode = (payload.passcode || '').trim();
  var name = (payload.name || '').trim();

  if (!passcode) {
    return createErrorResponse('Vui lòng nhập mã truy cập (Passcode)', 400);
  }

  var cache = CacheService.getScriptCache();
  var failKey = 'auth_failed_attempts';
  var lockKey = 'auth_is_locked_out';

  if (cache.get(lockKey)) {
    return createErrorResponse('Hệ thống đang tạm khóa do nhập sai mã quá 5 lần. Vui lòng thử lại sau 15 phút.', 429);
  }

  var passcodes = getSystemPasscodes();
  var role = null;

  if (passcode === passcodes.admin) {
    role = 'admin';
  } else if (passcode === passcodes.reviewer) {
    role = 'reviewer';
  }

  if (!role) {
    var attempts = parseInt(cache.get(failKey) || '0', 10) + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      cache.put(lockKey, 'true', LOCKOUT_SECONDS);
      cache.remove(failKey);
      return createErrorResponse('Bạn đã nhập sai mã 5 lần. Hệ thống tạm khóa 15 phút để bảo vệ an toàn.', 429);
    } else {
      cache.put(failKey, String(attempts), LOCKOUT_SECONDS);
      var remaining = MAX_FAILED_ATTEMPTS - attempts;
      return createErrorResponse('Mã truy cập không chính xác. Bạn còn ' + remaining + ' lần thử.', 401);
    }
  }

  // Đăng nhập thành công -> xóa lịch sử sai
  cache.remove(failKey);

  var token = Utilities.getUuid();
  var expiresAt = new Date().getTime() + TOKEN_TTL_SECONDS * 1000;
  var sessionData = JSON.stringify({
    token: token,
    role: role,
    name: name || (role === 'admin' ? 'Quản trị viên' : 'Thẩm định viên'),
    expiresAt: expiresAt
  });

  cache.put('token_' + token, sessionData, TOKEN_TTL_SECONDS);

  return createJsonResponse({
    ok: true,
    data: {
      token: token,
      role: role,
      name: name || (role === 'admin' ? 'Quản trị viên' : 'Thẩm định viên'),
      expiresAt: expiresAt
    }
  });
}

/**
 * Kiểm tra tính hợp lệ của Token
 */
function verifyToken(token) {
  if (!token) return null;
  var cache = CacheService.getScriptCache();
  var sessionRaw = cache.get('token_' + token);
  if (!sessionRaw) return null;
  try {
    var session = JSON.parse(sessionRaw);
    if (new Date().getTime() > session.expiresAt) {
      cache.remove('token_' + token);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

// -------------------------------------------------------------------------
// 5. LƯU TRỮ VÀ XỬ LÝ DỮ LIỆU GOOGLE SHEET / DRIVE
// -------------------------------------------------------------------------

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_KAIZEN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_KAIZEN);
    var headers = [
      'ID', 'Code', 'Submit Date', 'Topic', 'Employee ID', 'Department',
      'Idea Name', 'Category', 'Current State', 'Root Cause', 'Benefit',
      'Saving Amount', 'Before Image URL', 'After Image URL', 'Status',
      'Scope', 'Owner', 'Completion', 'Implement Date', 'Pay Month',
      'Reviewer Note', 'Quarterly Award', 'Reviewed By', 'Reviewed At',
      'Created At', 'Updated At'
    ];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#005EB8');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateDriveFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function saveBase64Image(base64Data, filename) {
  if (!base64Data || typeof base64Data !== 'string') return '';
  if (base64Data.indexOf('http') === 0) return base64Data;

  try {
    var parts = base64Data.split(',');
    var rawBase64 = parts.length > 1 ? parts[1] : parts[0];
    var mime = 'image/jpeg';
    if (parts[0].indexOf('image/png') !== -1) mime = 'image/png';
    else if (parts[0].indexOf('image/webp') !== -1) mime = 'image/webp';

    var decoded = Utilities.base64Decode(rawBase64);
    var blob = Utilities.newBlob(decoded, mime, filename);
    var folder = getOrCreateDriveFolder();
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return 'https://drive.google.com/uc?id=' + file.getId();
  } catch (e) {
    Logger.log('Không thể lưu ảnh Base64: ' + e.toString());
    return '';
  }
}

/**
 * Sinh mã Kaizen tự tăng theo năm: KZ-YYYY-XXXX (VD: KZ-2026-0001)
 */
function generateKaizenCode(sheet) {
  var currentYear = new Date().getFullYear();
  var prefix = 'KZ-' + currentYear + '-';
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return prefix + '0001';

  var codes = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  var maxSeq = 0;
  for (var i = 0; i < codes.length; i++) {
    var code = String(codes[i][0] || '');
    if (code.indexOf(prefix) === 0) {
      var seq = parseInt(code.substring(prefix.length), 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  var nextSeq = maxSeq + 1;
  var padded = ('0000' + nextSeq).slice(-4);
  return prefix + padded;
}

// -------------------------------------------------------------------------
// 6. CÁC HÀM NGHIỆP VỤ (BUSINESS LOGIC HANDLERS)
// -------------------------------------------------------------------------

function handleSubmit(payload) {
  if (payload.honeypot && payload.honeypot.trim() !== '') {
    return createJsonResponse({ ok: true, data: { id: 'spam', code: 'KZ-0000', message: 'OK' } });
  }

  var idempotencyKey = payload.idempotencyKey;
  var cache = CacheService.getScriptCache();
  if (idempotencyKey) {
    var cached = cache.get('idemp_' + idempotencyKey);
    if (cached) {
      return createJsonResponse({ ok: true, data: JSON.parse(cached) });
    }
  }

  var topic = (payload.topic || '').trim();
  var employeeId = (payload.employeeId || '').trim().toUpperCase();
  var rawDept = (payload.department || '').trim();
  var ideaName = (payload.ideaName || '').trim();
  var rawCat = (payload.category || '').trim();
  var currentState = (payload.currentState || '').trim();
  var rootCause = (payload.rootCause || '').trim();
  var benefit = (payload.benefit || '').trim();
  var submitDate = (payload.submitDate || '').trim();
  var savingAmount = parseFloat(payload.savingAmount) || 0;

  if (!topic || !employeeId || !rawDept || !ideaName || !rawCat || !currentState || !rootCause || !benefit || !submitDate) {
    return createErrorResponse('Vui lòng điền đầy đủ tất cả các trường bắt buộc', 400);
  }

  var category = normalizeCategory(rawCat);
  if (!category) {
    return createErrorResponse('Lĩnh vực cải tiến không hợp lệ: ' + rawCat, 400);
  }

  var department = normalizeDepartment(rawDept);
  if (!department) {
    return createErrorResponse('Bộ phận không hợp lệ: ' + rawDept, 400);
  }

  var sheet = getOrCreateSheet();
  var id = Utilities.getUuid();
  var code = generateKaizenCode(sheet);

  var beforeImageUrl = saveBase64Image(payload.beforeImage, code + '_before.jpg');
  var afterImageUrl = saveBase64Image(payload.afterImage, code + '_after.jpg');

  var nowIso = new Date().toISOString();

  var newRow = [
    id,
    code,
    submitDate,
    topic,
    employeeId,
    department,
    ideaName,
    category,
    currentState,
    rootCause,
    benefit,
    savingAmount,
    beforeImageUrl,
    afterImageUrl,
    'Mới',
    'Tất cả',
    '',
    'Chưa hoàn thành',
    '',
    '',
    '',
    'Không',
    '',
    '',
    nowIso,
    nowIso
  ];

  sheet.appendRow(newRow);

  var resData = {
    id: id,
    code: code,
    message: 'Ý tưởng Kaizen đã được ghi nhận thành công vào hệ thống Nefab!'
  };

  if (idempotencyKey) {
    cache.put('idemp_' + idempotencyKey, JSON.stringify(resData), 3600);
  }

  return createJsonResponse({ ok: true, data: resData });
}

function handleTrack(payload) {
  var code = (payload.code || '').trim().toUpperCase();
  var employeeId = (payload.employeeId || '').trim().toUpperCase();

  if (!code || !employeeId) {
    return createErrorResponse('Vui lòng nhập cả Mã Kaizen và Mã nhân viên', 400);
  }

  var sheet = getOrCreateSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({ ok: true, data: null });
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 26).getValues();

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var rowCode = String(r[1] || '').trim().toUpperCase();
    var rowEmpId = String(r[4] || '').trim().toUpperCase();

    if (rowCode === code && rowEmpId === employeeId) {
      return createJsonResponse({
        ok: true,
        data: {
          code: r[1],
          submitDate: r[2],
          topic: r[3],
          ideaName: r[6],
          department: r[5],
          category: r[7],
          status: r[14],
          completion: r[17],
          implementDate: r[18] || undefined,
          quarterlyAward: r[21]
        }
      });
    }
  }

  return createJsonResponse({ ok: true, data: null });
}

function handleList(payload, authUser) {
  var sheet = getOrCreateSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({
      ok: true,
      data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }
    });
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 26).getValues();
  var items = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    items.push(rowToKaizenItem(r));
  }

  if (payload.search && payload.search.trim() !== '') {
    var q = payload.search.toLowerCase().trim();
    items = items.filter(function(item) {
      return (
        item.code.toLowerCase().indexOf(q) !== -1 ||
        item.topic.toLowerCase().indexOf(q) !== -1 ||
        item.ideaName.toLowerCase().indexOf(q) !== -1 ||
        item.employeeId.toLowerCase().indexOf(q) !== -1 ||
        (item.owner && item.owner.toLowerCase().indexOf(q) !== -1)
      );
    });
  }

  if (payload.department && payload.department !== 'ALL') {
    var targetDept = normalizeDepartment(payload.department) || payload.department;
    items = items.filter(function(item) { return item.department === targetDept; });
  }

  if (payload.category && payload.category !== 'ALL') {
    var targetCat = normalizeCategory(payload.category) || payload.category;
    items = items.filter(function(item) { return item.category === targetCat; });
  }

  if (payload.status && payload.status !== 'ALL') {
    items = items.filter(function(item) { return item.status === payload.status; });
  }

  if (payload.completion && payload.completion !== 'ALL') {
    items = items.filter(function(item) { return item.completion === payload.completion; });
  }

  if (payload.scope && payload.scope !== 'ALL') {
    items = items.filter(function(item) { return item.scope === payload.scope; });
  }

  if (payload.startDate) {
    items = items.filter(function(item) { return item.submitDate >= payload.startDate; });
  }

  if (payload.endDate) {
    items = items.filter(function(item) { return item.submitDate <= payload.endDate; });
  }

  if (payload.quarterlyAwardOnly) {
    items = items.filter(function(item) { return item.quarterlyAward === 'Có'; });
  }

  items.sort(function(a, b) {
    return b.submitDate.localeCompare(a.submitDate);
  });

  var total = items.length;
  var page = parseInt(payload.page, 10) || 1;
  var pageSize = parseInt(payload.pageSize, 10) || 10;
  var totalPages = Math.ceil(total / pageSize) || 1;
  var startIndex = (page - 1) * pageSize;
  var pagedItems = items.slice(startIndex, startIndex + pageSize);

  return createJsonResponse({
    ok: true,
    data: {
      items: pagedItems,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages
    }
  });
}

function handleGet(payload, authUser) {
  var id = payload.id;
  if (!id) return createErrorResponse('Thiếu ID ý tưởng Kaizen', 400);

  var sheet = getOrCreateSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return createJsonResponse({ ok: true, data: null });

  var data = sheet.getRange(2, 1, lastRow - 1, 26).getValues();
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (r[0] === id || r[1] === id) {
      return createJsonResponse({ ok: true, data: rowToKaizenItem(r) });
    }
  }

  return createJsonResponse({ ok: true, data: null });
}

function handleReview(payload, authUser) {
  var id = payload.id;
  var review = payload.review || {};
  var reviewerName = authUser.name || authUser.role;

  if (!id) return createErrorResponse('Thiếu ID ý tưởng Kaizen', 400);

  var scope = normalizeScope(review.scope);
  var completion = normalizeCompletion(review.completion);
  var quarterlyAward = normalizeQuarterlyAward(review.quarterlyAward);
  var implementDate = (review.implementDate || '').trim();
  var owner = (review.owner || '').trim();
  var payMonth = (review.payMonth || '').trim();
  var reviewerNote = (review.reviewerNote || '').trim();

  if (completion === 'Hoàn thành' && !implementDate) {
    return createErrorResponse('Khi chọn hoàn thành là "Hoàn thành", bắt buộc phải nhập Ngày thực hiện', 400);
  }

  if (quarterlyAward === 'Có') {
    if (!owner) return createErrorResponse('Nếu tham dự giải quý, bắt buộc phải có Phụ trách thực thi', 400);
    if (!payMonth) return createErrorResponse('Nếu tham dự giải quý, bắt buộc phải có Tháng chi trả', 400);
  }

  var sheet = getOrCreateSheet();
  var lastRow = sheet.getLastRow();
  var rowIndex = -1;

  var ids = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id || ids[i][1] === id) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex === -1) {
    return createErrorResponse('Không tìm thấy ý tưởng Kaizen để thẩm định', 404);
  }

  var nowIso = new Date().toISOString();

  sheet.getRange(rowIndex, 15).setValue('Đã thẩm định');
  sheet.getRange(rowIndex, 16).setValue(scope);
  sheet.getRange(rowIndex, 17).setValue(owner);
  sheet.getRange(rowIndex, 18).setValue(completion);
  sheet.getRange(rowIndex, 19).setValue(implementDate);
  sheet.getRange(rowIndex, 20).setValue(payMonth);
  sheet.getRange(rowIndex, 21).setValue(reviewerNote);
  sheet.getRange(rowIndex, 22).setValue(quarterlyAward);
  sheet.getRange(rowIndex, 23).setValue(reviewerName);
  sheet.getRange(rowIndex, 24).setValue(nowIso);
  sheet.getRange(rowIndex, 26).setValue(nowIso);

  var updatedRow = sheet.getRange(rowIndex, 1, 1, 26).getValues()[0];
  return createJsonResponse({ ok: true, data: rowToKaizenItem(updatedRow) });
}

function handleDelete(payload, authUser) {
  var id = payload.id;
  if (!id) return createErrorResponse('Thiếu ID ý tưởng Kaizen', 400);

  var sheet = getOrCreateSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return createJsonResponse({ ok: true, data: false });

  var ids = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id || ids[i][1] === id) {
      sheet.deleteRow(i + 2);
      return createJsonResponse({ ok: true, data: true });
    }
  }

  return createJsonResponse({ ok: true, data: false });
}

function handleStats(payload, authUser) {
  var sheet = getOrCreateSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({
      ok: true,
      data: {
        total: 0,
        thisMonth: 0,
        completed: 0,
        inReview: 0,
        quarterlyAwards: 0,
        estimatedSavings: 0,
        byDepartment: [],
        byCategory: [],
        byMonth: []
      }
    });
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 26).getValues();
  var items = [];
  for (var i = 0; i < data.length; i++) {
    items.push(rowToKaizenItem(data[i]));
  }

  if (payload.department && payload.department !== 'ALL') {
    var d = normalizeDepartment(payload.department) || payload.department;
    items = items.filter(function(it) { return it.department === d; });
  }
  if (payload.category && payload.category !== 'ALL') {
    var c = normalizeCategory(payload.category) || payload.category;
    items = items.filter(function(it) { return it.category === c; });
  }

  var now = new Date();
  var curMonthStr = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);

  var total = items.length;
  var thisMonth = 0;
  var completed = 0;
  var inReview = 0;
  var quarterlyAwards = 0;
  var estimatedSavings = 0;

  var deptMap = {};
  var catMap = {};
  CANONICAL_CATEGORIES.forEach(function(cat) { catMap[cat] = 0; });
  CANONICAL_DEPARTMENTS.forEach(function(dep) { deptMap[dep] = 0; });

  for (var j = 0; j < items.length; j++) {
    var item = items[j];
    if (item.submitDate && item.submitDate.indexOf(curMonthStr) === 0) {
      thisMonth++;
    }
    if (item.completion === 'Hoàn thành') {
      completed++;
    } else {
      inReview++;
    }
    if (item.quarterlyAward === 'Có') {
      quarterlyAwards++;
    }
    if (item.savingAmount) {
      estimatedSavings += Number(item.savingAmount) || 0;
    }

    var dept = item.department;
    deptMap[dept] = (deptMap[dept] || 0) + 1;

    var cat = item.category;
    catMap[cat] = (catMap[cat] || 0) + 1;
  }

  var byDepartment = Object.keys(deptMap).map(function(k) {
    return { name: k, count: deptMap[k] };
  }).filter(function(x) { return x.count > 0; });

  var byCategory = CANONICAL_CATEGORIES.map(function(k) {
    return { name: k, count: catMap[k] || 0 };
  });

  return createJsonResponse({
    ok: true,
    data: {
      total: total,
      thisMonth: thisMonth,
      completed: completed,
      inReview: inReview,
      quarterlyAwards: quarterlyAwards,
      estimatedSavings: estimatedSavings,
      byDepartment: byDepartment,
      byCategory: byCategory,
      byMonth: []
    }
  });
}

function handleExport(payload, authUser) {
  var sheet = getOrCreateSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({ ok: true, data: '' });
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 26).getValues();
  var headers = [
    'Mã Kaizen', 'Ngày nộp', 'Chủ đề', 'Mã NV', 'Bộ phận', 'Tên ý tưởng',
    'Lĩnh vực cải tiến', 'Hiện trạng', 'Nguyên nhân', 'Lợi ích',
    'Tiết kiệm (VNĐ)', 'Trạng thái', 'Phạm vi', 'Phụ trách', 'Hoàn thành',
    'Ngày thực hiện', 'Tháng chi trả', 'Giải quý', 'Người thẩm định', 'Ngày thẩm định', 'Ghi chú'
  ];

  var rows = [headers.map(escapeCsv).join(',')];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var rowValues = [
      r[1],
      r[2],
      r[3],
      r[4],
      r[5],
      r[6],
      r[7],
      r[8],
      r[9],
      r[10],
      r[11],
      r[14],
      r[15],
      r[16],
      r[17],
      r[18],
      r[19],
      r[21],
      r[22],
      r[23],
      r[20]
    ];
    rows.push(rowValues.map(escapeCsv).join(','));
  }

  return createJsonResponse({ ok: true, data: rows.join('\r\n') });
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  var str = String(val).replace(/"/g, '""');
  return '"' + str + '"';
}

function rowToKaizenItem(r) {
  return {
    id: String(r[0] || ''),
    code: String(r[1] || ''),
    submitDate: String(r[2] || ''),
    topic: String(r[3] || ''),
    employeeId: String(r[4] || ''),
    department: normalizeDepartment(String(r[5] || '')) || String(r[5] || ''),
    ideaName: String(r[6] || ''),
    category: normalizeCategory(String(r[7] || '')) || String(r[7] || ''),
    currentState: String(r[8] || ''),
    rootCause: String(r[9] || ''),
    benefit: String(r[10] || ''),
    savingAmount: parseFloat(r[11]) || 0,
    beforeImage: String(r[12] || ''),
    afterImage: String(r[13] || '') || undefined,
    status: String(r[14] || 'Mới'),
    scope: normalizeScope(r[15]),
    owner: String(r[16] || ''),
    completion: normalizeCompletion(r[17]),
    implementDate: String(r[18] || '') || undefined,
    payMonth: String(r[19] || '') || undefined,
    reviewerNote: String(r[20] || '') || undefined,
    quarterlyAward: normalizeQuarterlyAward(r[21]),
    reviewedBy: String(r[22] || '') || undefined,
    reviewedAt: String(r[23] || '') || undefined,
    createdAt: String(r[24] || ''),
    updatedAt: String(r[25] || '')
  };
}

// -------------------------------------------------------------------------
// 7. HELPER JSON RESPONSE
// -------------------------------------------------------------------------

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message, code) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: false,
    error: {
      code: code || 400,
      message: message
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------------------
// 8. BẢO TRÌ DỮ LIỆU CŨ & UNIT TESTS (CHẠY TRỰC TIẾP TRONG APPS SCRIPT)
// -------------------------------------------------------------------------

/**
 * Hàm di chuyển và chuẩn hóa dữ liệu cũ trong Sheet (MIGRATE CATEGORIES)
 * Chạy 1 lần trong Apps Script Editor để làm sạch toàn bộ dữ liệu lịch sử
 */
function migrateCategories() {
  var sheet = getOrCreateSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('Sheet chưa có dữ liệu để chuẩn hóa.');
    return;
  }

  var range = sheet.getRange(2, 1, lastRow - 1, 26);
  var values = range.getValues();
  var updatedCount = 0;

  for (var i = 0; i < values.length; i++) {
    var rowNum = i + 2;
    var rowUpdated = false;

    // Cột 6: Department (Index 5)
    var rawDept = String(values[i][5] || '');
    var normDept = normalizeDepartment(rawDept);
    if (normDept && normDept !== rawDept) {
      sheet.getRange(rowNum, 6).setValue(normDept);
      Logger.log('Dòng ' + rowNum + ': Chuẩn hóa Department từ "' + rawDept + '" -> "' + normDept + '"');
      rowUpdated = true;
    }

    // Cột 8: Category (Index 7)
    var rawCat = String(values[i][7] || '');
    var normCat = normalizeCategory(rawCat);
    if (normCat && normCat !== rawCat) {
      sheet.getRange(rowNum, 8).setValue(normCat);
      Logger.log('Dòng ' + rowNum + ': Chuẩn hóa Category từ "' + rawCat + '" -> "' + normCat + '"');
      rowUpdated = true;
    }

    if (rowUpdated) {
      updatedCount++;
    }
  }

  Logger.log('=== HOÀN TẤT MIGRATE: Đã quét ' + values.length + ' dòng, chuẩn hóa thành công ' + updatedCount + ' dòng. ===');
}

/**
 * Unit Test kiểm tra normalizeCategory với các biến thể ký tự & Unicode
 */
function testNormalizeCategory() {
  var testCases = [
    { input: 'Cải tiến dụng cụ/máy móc', expected: 'Cải tiến dụng cụ/ máy móc' },
    { input: 'Cải tiến dụng cụ / máy móc', expected: 'Cải tiến dụng cụ/ máy móc' },
    { input: 'cải tiến dụng cụ/ máy móc', expected: 'Cải tiến dụng cụ/ máy móc' },
    { input: '  Cải tiến dụng cụ/  máy móc  ', expected: 'Cải tiến dụng cụ/ máy móc' },
    { input: 'Cải tiến dụng cụ/ máy móc'.normalize('NFD'), expected: 'Cải tiến dụng cụ/ máy móc' },
    { input: 'an toàn/5s', expected: 'An toàn/ 5S' },
    { input: 'An toàn / 5S', expected: 'An toàn/ 5S' },
    { input: 'nang suat', expected: 'Năng suất' },
    { input: 'Chat Luong', expected: 'Chất lượng' },
    { input: 'chuoi cung ung', expected: 'Chuỗi cung ứng' }
  ];

  var passed = 0;
  for (var i = 0; i < testCases.length; i++) {
    var tc = testCases[i];
    var actual = normalizeCategory(tc.input);
    if (actual === tc.expected) {
      Logger.log('[PASS] Test #' + (i + 1) + ': "' + tc.input + '" -> "' + actual + '"');
      passed++;
    } else {
      Logger.log('[FAIL] Test #' + (i + 1) + ': Input: "' + tc.input + '", Kỳ vọng: "' + tc.expected + '", Nhận được: "' + actual + '"');
    }
  }

  Logger.log('=== KẾT QUẢ TEST: ' + passed + '/' + testCases.length + ' test cases thành công! ===');
}
