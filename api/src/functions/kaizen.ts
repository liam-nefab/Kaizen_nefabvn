import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as z from 'zod';
import { getClientPrincipal, isAuthorizedReviewer, isAuthorizedAdmin } from '../services/auth';
import { checkRateLimit, validateImageMagicBytes } from '../services/rateLimiter';
import { getGraphClient, executeWithRetry, getSharePointIds, uploadImageToDrive } from '../services/graphClient';

// Schema validation Zod ở phía API (chống tin tưởng client)
const apiSubmitSchema = z.object({
  submitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày nộp không hợp lệ'),
  topic: z.string().trim().min(3).max(150),
  employeeId: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/),
  department: z.string().trim().min(1),
  ideaName: z.string().trim().min(5).max(150),
  category: z.string().trim().min(1),
  currentState: z.string().trim().min(10),
  rootCause: z.string().trim().min(10),
  benefit: z.string().trim().min(10),
  savingAmount: z.number().min(0).optional().nullable(),
  beforeImage: z.string().min(10, 'Thiếu ảnh trước'),
  afterImage: z.string().optional().nullable(),
  honeypot: z.string().optional(),
  idempotencyKey: z.string().min(5),
});

// Cache kiểm tra idempotency trong bộ nhớ
const idempotencyStore = new Map<string, { id: string; code: string }>();

/**
 * 1. POST /api/kaizen (Public - Anonymous)
 */
app.http('submitKaizen', {
  methods: ['POST'],
  route: 'kaizen',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // 1. Kiểm tra Rate Limiting theo IP
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown-ip';
      const rate = checkRateLimit(clientIp, 10, 3600000);
      if (!rate.allowed) {
        return {
          status: 429,
          jsonBody: {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Bạn đã gửi quá số lượng ý tưởng cho phép trong 1 giờ. Vui lòng thử lại sau.',
            },
          },
        };
      }

      const body = await request.json();
      const parsed = apiSubmitSchema.safeParse(body);
      if (!parsed.success) {
        return {
          status: 400,
          jsonBody: {
            error: {
              code: 'INVALID_INPUT',
              message: 'Dữ liệu không hợp lệ: ' + parsed.error.issues.map((i) => i.message).join(', '),
            },
          },
        };
      }

      const data = parsed.data;

      // 2. Kiểm tra honeypot chống bot
      if (data.honeypot && data.honeypot.trim() !== '') {
        context.warn(`Phát hiện bot spam từ IP: ${clientIp}`);
        return {
          status: 400,
          jsonBody: { error: { code: 'SPAM_DETECTED', message: 'Yêu cầu bị từ chối' } },
        };
      }

      // 3. Kiểm tra Idempotency chống gửi trùng
      if (idempotencyStore.has(data.idempotencyKey)) {
        const cached = idempotencyStore.get(data.idempotencyKey)!;
        return {
          status: 200,
          jsonBody: { id: cached.id, code: cached.code, message: 'Ý tưởng đã được tiếp nhận.' },
        };
      }

      // 4. Kiểm tra ảnh TRƯỚC (Base64 và Magic Bytes)
      const base64Data = data.beforeImage.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      if (imageBuffer.length > 15 * 1024 * 1024) {
        return {
          status: 400,
          jsonBody: { error: { code: 'IMAGE_TOO_LARGE', message: 'Dung lượng ảnh vượt quá 15 MB' } },
        };
      }

      const magicCheck = validateImageMagicBytes(imageBuffer);
      if (!magicCheck.valid) {
        return {
          status: 400,
          jsonBody: {
            error: { code: 'INVALID_IMAGE_TYPE', message: 'Tệp hình ảnh không hợp lệ (Chỉ hỗ trợ JPG/PNG/WEBP)' },
          },
        };
      }

      // 5. Sinh mã Kaizen tiếp theo: KZ-YYYY-NNNN
      const year = new Date().getFullYear();
      const { siteId, listId } = await getSharePointIds();
      const client = getGraphClient();

      // Đếm số lượng Kaizen trong năm để tạo số thứ tự
      const countRes = await executeWithRetry(() =>
        client
          .api(`/sites/${siteId}/lists/${listId}/items`)
          .filter(`startswith(fields/Title, 'KZ-${year}-')`)
          .select('id')
          .get()
      );
      const nextNum = (countRes.value?.length || 0) + 1;
      const code = `KZ-${year}-${String(nextNum).padStart(4, '0')}`;

      // 6. Upload ảnh TRƯỚC lên Document Library "KaizenImages"
      const beforeImageUrl = await uploadImageToDrive(code, 'before.jpg', imageBuffer, magicCheck.mimeType);

      // 7. Upload ảnh SAU (nếu có)
      let afterImageUrl = '';
      if (data.afterImage && data.afterImage.length > 50) {
        const afterBase64 = data.afterImage.replace(/^data:image\/\w+;base64,/, '');
        const afterBuffer = Buffer.from(afterBase64, 'base64');
        if (afterBuffer.length <= 15 * 1024 * 1024) {
          const afterCheck = validateImageMagicBytes(afterBuffer);
          if (afterCheck.valid) {
            afterImageUrl = await uploadImageToDrive(code, 'after.jpg', afterBuffer, afterCheck.mimeType);
          }
        }
      }

      // Tính quý
      const month = parseInt(data.submitDate.split('-')[1] || '1', 10);
      const quarter = `${data.submitDate.split('-')[0]}-Q${Math.ceil(month / 3)}`;

      // 8. Tạo Item trong SharePoint List "KaizenIdeas"
      const createRes = await executeWithRetry(() =>
        client.api(`/sites/${siteId}/lists/${listId}/items`).post({
          fields: {
            Title: code,
            SubmitDate: data.submitDate,
            Topic: data.topic,
            EmployeeId: data.employeeId.toUpperCase(),
            Department: data.department,
            IdeaName: data.ideaName,
            Category: data.category,
            CurrentState: data.currentState,
            RootCause: data.rootCause,
            Benefit: data.benefit,
            BeforeImageUrl: beforeImageUrl,
            AfterImageUrl: afterImageUrl,
            SavingAmount: data.savingAmount || 0,
            IdempotencyKey: data.idempotencyKey,
            Status: 'Mới',
            Quarter: quarter,
          },
        })
      );

      const newId = createRes.id;
      idempotencyStore.set(data.idempotencyKey, { id: newId, code });

      context.log(`Tiếp nhận Kaizen thành công: ${code} - Mã NV: ${data.employeeId}`);

      return {
        status: 201,
        jsonBody: {
          id: newId,
          code,
          message: 'Tiếp nhận ý tưởng Kaizen thành công!',
        },
      };
    } catch (err: any) {
      context.error('Lỗi khi tiếp nhận Kaizen:', err);
      return {
        status: 500,
        jsonBody: {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Đã xảy ra lỗi khi lưu ý tưởng vào SharePoint. Vui lòng thử lại sau.',
          },
        },
      };
    }
  },
});

/**
 * 2. GET /api/kaizen/track (Public - Tra cứu theo mã + mã NV)
 */
app.http('trackKaizen', {
  methods: ['GET'],
  route: 'kaizen/track',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const code = request.query.get('code')?.trim().toUpperCase();
      const employeeId = request.query.get('employeeId')?.trim().toUpperCase();

      if (!code || !employeeId) {
        return {
          status: 400,
          jsonBody: {
            error: { code: 'MISSING_PARAMS', message: 'Vui lòng cung cấp cả Mã Kaizen và Mã nhân viên' },
          },
        };
      }

      const { siteId, listId } = await getSharePointIds();
      const client = getGraphClient();

      const res = await executeWithRetry(() =>
        client
          .api(`/sites/${siteId}/lists/${listId}/items`)
          .expand('fields')
          .filter(`fields/Title eq '${code}' and fields/EmployeeId eq '${employeeId}'`)
          .get()
      );

      const item = res.value?.[0];
      if (!item) {
        return { status: 404, jsonBody: null };
      }

      const f = item.fields;
      return {
        status: 200,
        jsonBody: {
          code: f.Title,
          employeeId: f.EmployeeId,
          submitDate: f.SubmitDate,
          topic: f.Topic,
          ideaName: f.IdeaName,
          department: f.Department,
          category: f.Category,
          status: f.Status,
          completion: f.Completion,
          implementDate: f.ImplementDate,
          quarterlyAward: f.QuarterlyAward,
        },
      };
    } catch (err: any) {
      context.error('Lỗi tra cứu Kaizen:', err);
      return {
        status: 500,
        jsonBody: { error: { code: 'INTERNAL_ERROR', message: 'Lỗi tra cứu hệ thống' } },
      };
    }
  },
});

/**
 * 3. GET /api/kaizen (Reviewer/Admin - Danh sách có phân trang và lọc)
 */
app.http('getKaizens', {
  methods: ['GET'],
  route: 'kaizen',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const principal = getClientPrincipal(request);
      if (!isAuthorizedReviewer(principal)) {
        return {
          status: 403,
          jsonBody: { error: { code: 'FORBIDDEN', message: 'Yêu cầu quyền Reviewer hoặc Admin' } },
        };
      }

      const { siteId, listId } = await getSharePointIds();
      const client = getGraphClient();

      const page = parseInt(request.query.get('page') || '1', 10);
      const pageSize = parseInt(request.query.get('pageSize') || '10', 10);

      const res = await executeWithRetry(() =>
        client
          .api(`/sites/${siteId}/lists/${listId}/items`)
          .expand('fields')
          .top(500)
          .get()
      );

      let items = (res.value || []).map((i: any) => ({
        id: i.id,
        code: i.fields.Title,
        submitDate: i.fields.SubmitDate,
        topic: i.fields.Topic,
        employeeId: i.fields.EmployeeId,
        department: i.fields.Department,
        ideaName: i.fields.IdeaName,
        category: i.fields.Category,
        currentState: i.fields.CurrentState,
        rootCause: i.fields.RootCause,
        benefit: i.fields.Benefit,
        beforeImageUrl: i.fields.BeforeImageUrl,
        afterImageUrl: i.fields.AfterImageUrl,
        savingAmount: i.fields.SavingAmount,
        status: i.fields.Status,
        scope: i.fields.Scope,
        owner: i.fields.Owner,
        completion: i.fields.Completion,
        implementDate: i.fields.ImplementDate,
        payMonth: i.fields.PayMonth,
        reviewerNote: i.fields.ReviewerNote,
        quarterlyAward: i.fields.QuarterlyAward,
        reviewedBy: i.fields.ReviewedBy,
        reviewedAt: i.fields.ReviewedAt,
        quarter: i.fields.Quarter,
      }));

      // Lọc in-memory trên tập kết quả
      const department = request.query.get('department');
      if (department && department !== 'ALL') items = items.filter((i: any) => i.department === department);

      const category = request.query.get('category');
      if (category && category !== 'ALL') items = items.filter((i: any) => i.category === category);

      const status = request.query.get('status');
      if (status && status !== 'ALL') items = items.filter((i: any) => i.status === status);

      const scope = request.query.get('scope');
      if (scope && scope !== 'ALL') items = items.filter((i: any) => i.scope === scope);

      const search = request.query.get('search')?.toLowerCase().trim();
      if (search) {
        items = items.filter(
          (i: any) =>
            i.code.toLowerCase().includes(search) ||
            i.topic.toLowerCase().includes(search) ||
            i.ideaName.toLowerCase().includes(search) ||
            i.employeeId.toLowerCase().includes(search)
        );
      }

      const total = items.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const paged = items.slice((page - 1) * pageSize, page * pageSize);

      return {
        status: 200,
        jsonBody: { items: paged, total, page, pageSize, totalPages },
      };
    } catch (err: any) {
      context.error('Lỗi lấy danh sách Kaizen:', err);
      return {
        status: 500,
        jsonBody: { error: { code: 'INTERNAL_ERROR', message: 'Lỗi lấy danh sách từ SharePoint' } },
      };
    }
  },
});

/**
 * 4. GET /api/kaizen/{id} (Reviewer/Admin - Chi tiết)
 */
app.http('getKaizenById', {
  methods: ['GET'],
  route: 'kaizen/{id}',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const principal = getClientPrincipal(request);
      if (!isAuthorizedReviewer(principal)) {
        return {
          status: 403,
          jsonBody: { error: { code: 'FORBIDDEN', message: 'Yêu cầu quyền Reviewer hoặc Admin' } },
        };
      }

      const id = request.params.id;
      const { siteId, listId } = await getSharePointIds();
      const client = getGraphClient();

      const res = await executeWithRetry(() =>
        client.api(`/sites/${siteId}/lists/${listId}/items/${id}`).expand('fields').get()
      );

      const f = res.fields;
      return {
        status: 200,
        jsonBody: {
          id: res.id,
          code: f.Title,
          submitDate: f.SubmitDate,
          topic: f.Topic,
          employeeId: f.EmployeeId,
          department: f.Department,
          ideaName: f.IdeaName,
          category: f.Category,
          currentState: f.CurrentState,
          rootCause: f.RootCause,
          benefit: f.Benefit,
          beforeImageUrl: f.BeforeImageUrl,
          afterImageUrl: f.AfterImageUrl,
          savingAmount: f.SavingAmount,
          status: f.Status,
          scope: f.Scope,
          owner: f.Owner,
          completion: f.Completion,
          implementDate: f.ImplementDate,
          payMonth: f.PayMonth,
          reviewerNote: f.ReviewerNote,
          quarterlyAward: f.QuarterlyAward,
          reviewedBy: f.ReviewedBy,
          reviewedAt: f.ReviewedAt,
          quarter: f.Quarter,
        },
      };
    } catch (err: any) {
      return {
        status: 404,
        jsonBody: { error: { code: 'NOT_FOUND', message: 'Không tìm thấy bản ghi Kaizen' } },
      };
    }
  },
});

/**
 * 5. PATCH /api/kaizen/{id}/review (Reviewer/Admin - Lưu thẩm định)
 */
app.http('reviewKaizen', {
  methods: ['PATCH'],
  route: 'kaizen/{id}/review',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const principal = getClientPrincipal(request);
      if (!isAuthorizedReviewer(principal)) {
        return {
          status: 403,
          jsonBody: { error: { code: 'FORBIDDEN', message: 'Yêu cầu quyền Reviewer hoặc Admin' } },
        };
      }

      const id = request.params.id;
      const body = (await request.json()) as any;

      // Validate nghiệp vụ
      if (body.completion === 'Hoàn thành' && !body.implementDate) {
        return {
          status: 400,
          jsonBody: {
            error: { code: 'VALIDATION_ERROR', message: 'Khi hoàn thành, bắt buộc phải có Ngày thực hiện' },
          },
        };
      }

      if (body.quarterlyAward === 'Có' && (!body.owner || !body.payMonth)) {
        return {
          status: 400,
          jsonBody: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Khi tham dự giải quý, bắt buộc phải có Phụ trách thực thi và Tháng chi trả',
            },
          },
        };
      }

      const { siteId, listId } = await getSharePointIds();
      const client = getGraphClient();
      const reviewerEmail = principal?.userDetails || 'reviewer@nefab.com';

      await executeWithRetry(() =>
        client.api(`/sites/${siteId}/lists/${listId}/items/${id}/fields`).patch({
          Status: 'Đã thẩm định',
          Scope: body.scope,
          Owner: body.owner,
          Completion: body.completion,
          ImplementDate: body.implementDate || null,
          PayMonth: body.payMonth || null,
          ReviewerNote: body.reviewerNote || null,
          QuarterlyAward: body.quarterlyAward,
          ReviewedBy: reviewerEmail,
          ReviewedAt: new Date().toISOString(),
        })
      );

      context.log(`Thẩm định thành công Kaizen ID: ${id} bởi ${reviewerEmail}`);

      return {
        status: 200,
        jsonBody: { message: 'Lưu kết quả thẩm định thành công' },
      };
    } catch (err: any) {
      context.error('Lỗi thẩm định:', err);
      return {
        status: 500,
        jsonBody: { error: { code: 'INTERNAL_ERROR', message: 'Không thể cập nhật thẩm định' } },
      };
    }
  },
});

/**
 * 6. DELETE /api/kaizen/{id} (Admin only)
 */
app.http('deleteKaizen', {
  methods: ['DELETE'],
  route: 'kaizen/{id}',
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const principal = getClientPrincipal(request);
      if (!isAuthorizedAdmin(principal)) {
        return {
          status: 403,
          jsonBody: { error: { code: 'FORBIDDEN', message: 'Chỉ Quản trị viên (Admin) mới có quyền xóa' } },
        };
      }

      const id = request.params.id;
      const { siteId, listId } = await getSharePointIds();
      const client = getGraphClient();

      await executeWithRetry(() => client.api(`/sites/${siteId}/lists/${listId}/items/${id}`).delete());

      context.log(`Đã xóa Kaizen ID: ${id}`);
      return { status: 204 };
    } catch (err: any) {
      return {
        status: 500,
        jsonBody: { error: { code: 'INTERNAL_ERROR', message: 'Không thể xóa bản ghi' } },
      };
    }
  },
});
