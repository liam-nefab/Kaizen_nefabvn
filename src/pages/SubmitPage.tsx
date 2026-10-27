import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DEPARTMENTS,
  CATEGORIES,
  Department,
  Category,
} from '../constants/kaizen';
import { apiClient } from '../services/api';
import { compressImage, formatFileSize, formatVND } from '../services/imageCompression';
import { useToast } from '../components/common/Toast';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Building2,
  FileText,
  DollarSign,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// Tạo UUID đơn giản cho idempotencyKey
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Lấy ngày hôm nay định dạng YYYY-MM-DD
function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Zod schema kiểm tra tính hợp lệ nghiêm ngặt theo yêu cầu
const kaizenSchema = z.object({
  submitDate: z
    .string()
    .min(1, 'Vui lòng chọn ngày nộp')
    .refine((val) => {
      const selected = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return selected <= today;
    }, 'Không được chọn ngày trong tương lai'),
  topic: z
    .string()
    .trim()
    .min(3, 'Chủ đề tối thiểu 3 ký tự')
    .max(150, 'Chủ đề tối đa 150 ký tự'),
  employeeId: z
    .string()
    .trim()
    .min(3, 'Mã nhân viên từ 3 đến 20 ký tự')
    .max(20, 'Mã nhân viên từ 3 đến 20 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã nhân viên chỉ chứa chữ và số (VD: NF1024)'),
  department: z.enum([
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
    'Vận hành- Pur',
  ]),
  ideaName: z
    .string()
    .trim()
    .min(5, 'Tên ý tưởng tối thiểu 5 ký tự')
    .max(150, 'Tên ý tưởng tối đa 150 ký tự'),
  category: z.enum([
    'Cải tiến dụng cụ/ máy móc',
    'An toàn/ 5S',
    'Năng suất',
    'Chất lượng',
    'Chuỗi cung ứng',
  ]),
  currentState: z
    .string()
    .trim()
    .min(10, 'Hiện trạng tối thiểu 10 ký tự'),
  rootCause: z
    .string()
    .trim()
    .min(10, 'Nguyên nhân tối thiểu 10 ký tự'),
  benefit: z
    .string()
    .trim()
    .min(10, 'Lợi ích tối thiểu 10 ký tự'),
  savingAmount: z
    .union([z.number().min(0, 'Số tiền tiết kiệm phải lớn hơn hoặc bằng 0'), z.nan()])
    .optional()
    .nullable(),
  honeypot: z.string().optional(),
});

type FormValues = z.infer<typeof kaizenSchema>;

export const SubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Quản lý ảnh Trước và Sau
  const [beforeImageBase64, setBeforeImageBase64] = useState<string | null>(null);
  const [beforeImageMeta, setBeforeImageMeta] = useState<{ name: string; size: number } | null>(null);
  const [beforeImageError, setBeforeImageError] = useState<string | null>(null);
  const [isCompressingBefore, setIsCompressingBefore] = useState(false);

  const [afterImageBase64, setAfterImageBase64] = useState<string | null>(null);
  const [afterImageMeta, setAfterImageMeta] = useState<{ name: string; size: number } | null>(null);
  const [isCompressingAfter, setIsCompressingAfter] = useState(false);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIdempotencyKey(generateUUID());
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(kaizenSchema),
    defaultValues: {
      submitDate: getTodayString(),
      topic: '',
      employeeId: '',
      department: DEPARTMENTS[0],
      ideaName: '',
      category: CATEGORIES[0],
      currentState: '',
      rootCause: '',
      benefit: '',
      savingAmount: null,
      honeypot: '',
    },
  });

  const selectedCategory = watch('category');
  const watchSaving = watch('savingAmount');

  // Xử lý nén ảnh Trước
  const handleBeforeImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setBeforeImageError('Dung lượng ảnh vượt quá 15 MB. Vui lòng chọn ảnh nhỏ hơn.');
      toastError('Dung lượng ảnh vượt quá 15 MB');
      return;
    }

    setBeforeImageError(null);
    setIsCompressingBefore(true);
    try {
      const result = await compressImage(file, 1600, 0.8);
      setBeforeImageBase64(result.dataUrl);
      setBeforeImageMeta({
        name: file.name,
        size: result.compressedSize,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xử lý ảnh';
      setBeforeImageError(msg);
      toastError(msg);
    } finally {
      setIsCompressingBefore(false);
    }
  };

  // Xử lý nén ảnh Sau (tùy chọn)
  const handleAfterImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toastError('Dung lượng ảnh sau vượt quá 15 MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setIsCompressingAfter(true);
    try {
      const result = await compressImage(file, 1600, 0.8);
      setAfterImageBase64(result.dataUrl);
      setAfterImageMeta({
        name: file.name,
        size: result.compressedSize,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xử lý ảnh';
      toastError(msg);
    } finally {
      setIsCompressingAfter(false);
    }
  };

  const removeBeforeImage = () => {
    setBeforeImageBase64(null);
    setBeforeImageMeta(null);
    if (beforeInputRef.current) beforeInputRef.current.value = '';
  };

  const removeAfterImage = () => {
    setAfterImageBase64(null);
    setAfterImageMeta(null);
    if (afterInputRef.current) afterInputRef.current.value = '';
  };

  const onSubmit = async (data: FormValues) => {
    // Kiểm tra bắt buộc có ảnh TRƯỚC
    if (!beforeImageBase64) {
      setBeforeImageError('Vui lòng chụp hoặc tải lên Hình ảnh TRƯỚC (Bắt buộc)');
      const el = document.getElementById('before-image-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.submitKaizen({
        submitDate: data.submitDate,
        topic: data.topic,
        employeeId: data.employeeId.toUpperCase(),
        department: data.department as Department,
        ideaName: data.ideaName,
        category: data.category as Category,
        currentState: data.currentState,
        rootCause: data.rootCause,
        benefit: data.benefit,
        savingAmount: data.savingAmount || null,
        beforeImage: beforeImageBase64,
        afterImage: afterImageBase64 || null,
        honeypot: data.honeypot,
        idempotencyKey,
      });

      // Điều hướng tới trang cảm ơn thành công
      navigate('/submit/success', {
        state: {
          id: res.id,
          code: res.code,
          ideaName: data.ideaName,
          employeeId: data.employeeId.toUpperCase(),
          submitDate: data.submitDate,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi ý tưởng. Vui lòng thử lại';
      toastError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs font-bold text-[#005EB8] uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Phiếu đăng ký sáng kiến cải tiến</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Gửi ý tưởng Kaizen
        </h1>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Dành cho toàn bộ người lao động nhà máy Nefab Việt Nam. Mọi đóng góp dù nhỏ nhất đều được Ban thẩm định ghi nhận và đánh giá công bằng.
        </p>

        {/* Note bar */}
        <div className="mt-4 p-3 bg-[#E8F1FB] border border-[#B8D5F5] rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
          <AlertCircle className="w-4 h-4 text-[#005EB8] shrink-0 mt-0.5" />
          <span>
            Các trường có dấu <span className="text-red-600 font-bold">*</span> là bắt buộc. Ảnh chụp sẽ được tự động nén để tiết kiệm 4G/Wifi điện thoại.
          </span>
        </div>
      </div>

      {/* Form chính */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Honeypot chống bot ẩn */}
        <input
          type="text"
          {...register('honeypot')}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* SECTION 1: Thông tin nhân viên & Bộ phận */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-[#005EB8]" />
            <h2 className="text-lg font-bold text-slate-900">1. Thông tin người nộp & Bộ phận</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1. Ngày nộp */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Ngày nộp <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                max={getTodayString()}
                {...register('submitDate')}
                className={`w-full h-12 px-3.5 rounded-xl border bg-slate-50 text-slate-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] transition-all ${
                  errors.submitDate ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.submitDate && (
                <p className="text-xs text-red-500 mt-1">{errors.submitDate.message}</p>
              )}
            </div>

            {/* 3. Mã số nhân viên */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mã số nhân viên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: NF1024"
                {...register('employeeId')}
                onChange={(e) => setValue('employeeId', e.target.value.toUpperCase())}
                className={`w-full h-12 px-3.5 rounded-xl border bg-slate-50 text-slate-900 text-base uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] transition-all ${
                  errors.employeeId ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              <p className="text-[11px] text-slate-500 mt-1">Dùng để tra cứu trạng thái và nhận tiền thưởng</p>
              {errors.employeeId && (
                <p className="text-xs text-red-500 mt-1">{errors.employeeId.message}</p>
              )}
            </div>
          </div>

          {/* 4. Bộ phận */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Bộ phận công tác <span className="text-red-500">*</span>
            </label>
            <select
              {...register('department')}
              className={`w-full h-12 px-3.5 rounded-xl border bg-slate-50 text-slate-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] transition-all ${
                errors.department ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>
            )}
          </div>

          {/* 2. Chủ đề */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Chủ đề Kaizen <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={150}
              placeholder="VD: Cải tiến gá dao xẻ băng carton / Tối ưu layout 5S xưởng gỗ"
              {...register('topic')}
              className={`w-full h-12 px-3.5 rounded-xl border bg-slate-50 text-slate-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] transition-all ${
                errors.topic ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.topic && (
              <p className="text-xs text-red-500 mt-1">{errors.topic.message}</p>
            )}
          </div>
        </div>

        {/* SECTION 2: Chi tiết ý tưởng & Lĩnh vực */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-[#005EB8]" />
            <h2 className="text-lg font-bold text-slate-900">2. Nội dung cải tiến Kaizen</h2>
          </div>

          {/* 5. Tên ý tưởng */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên ý tưởng Kaizen <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={150}
              placeholder="VD: Thiết kế giá trượt an toàn có cữ chặn tự động cho chuyền cắt xẻ"
              {...register('ideaName')}
              className={`w-full h-12 px-3.5 rounded-xl border bg-slate-50 text-slate-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] transition-all ${
                errors.ideaName ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.ideaName && (
              <p className="text-xs text-red-500 mt-1">{errors.ideaName.message}</p>
            )}
          </div>

          {/* 6. Lĩnh vực Kaizen (5 lựa chọn - Thẻ radio lớn dễ bấm trên mobile) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Lĩnh vực Kaizen <span className="text-red-500">*</span>
            </label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = field.value === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => field.onChange(cat)}
                        className={`min-h-[50px] px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#005EB8] bg-[#E8F1FB] text-[#005EB8] font-bold shadow-xs'
                            : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cat}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#005EB8] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* 7. Hiện trạng */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Hiện trạng trước khi cải tiến <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả khó khăn, thao tác chậm, nguy cơ mất an toàn hoặc lãng phí hiện tại..."
              {...register('currentState')}
              className={`w-full p-3.5 rounded-xl border bg-slate-50 text-slate-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] transition-all ${
                errors.currentState ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.currentState && (
              <p className="text-xs text-red-500 mt-1">{errors.currentState.message}</p>
            )}
          </div>

          {/* 8. Nguyên nhân */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nguyên nhân gốc rễ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Tại sao vấn đề trên lại phát sinh? Do thiếu dụng cụ, thao tác thủ công, hay layout chưa hợp lý?..."
              {...register('rootCause')}
              className={`w-full p-3.5 rounded-xl border bg-slate-50 text-slate-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] transition-all ${
                errors.rootCause ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.rootCause && (
              <p className="text-xs text-red-500 mt-1">{errors.rootCause.message}</p>
            )}
          </div>

          {/* 9. Lợi ích */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Lợi ích mang lại sau khi áp dụng <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Giúp an toàn hơn, rút ngắn bao nhiêu phút thao tác, giảm phế phẩm hay làm lợi gì cho công ty?..."
              {...register('benefit')}
              className={`w-full p-3.5 rounded-xl border bg-slate-50 text-slate-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] transition-all ${
                errors.benefit ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.benefit && (
              <p className="text-xs text-red-500 mt-1">{errors.benefit.message}</p>
            )}
          </div>

          {/* 12. Số tiền tiết kiệm (Tùy chọn) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Số tiền tiết kiệm ước tính (VNĐ) <span className="text-xs text-slate-400 font-normal">(Tùy chọn)</span>
              </label>
              {watchSaving && !isNaN(Number(watchSaving)) && Number(watchSaving) > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {formatVND(Number(watchSaving))}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100000"
                placeholder="VD: 5000000"
                {...register('savingAmount', { valueAsNumber: true })}
                className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] transition-all"
              />
              <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
            {errors.savingAmount && (
              <p className="text-xs text-red-500 mt-1">{errors.savingAmount.message}</p>
            )}
          </div>
        </div>

        {/* SECTION 3: Hình ảnh minh chứng Trước & Sau */}
        <div id="before-image-section" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Camera className="w-5 h-5 text-[#005EB8]" />
            <h2 className="text-lg font-bold text-slate-900">3. Hình ảnh minh chứng</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 10. Hình ảnh TRƯỚC (BẮT BUỘC) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-800">
                  Hình ảnh TRƯỚC <span className="text-red-500">* (Bắt buộc)</span>
                </label>
                {beforeImageMeta && (
                  <span className="text-xs text-slate-500">
                    {formatFileSize(beforeImageMeta.size)}
                  </span>
                )}
              </div>

              {beforeImageBase64 ? (
                <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group">
                  <img
                    src={beforeImageBase64}
                    alt="Ảnh trước cải tiến"
                    className="w-full h-52 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={removeBeforeImage}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
                      title="Xóa ảnh"
                      aria-label="Xóa ảnh trước"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="truncate max-w-[180px]">{beforeImageMeta?.name}</span>
                    <button
                      type="button"
                      onClick={() => beforeInputRef.current?.click()}
                      className="text-[#005EB8] font-semibold hover:underline"
                    >
                      Đổi ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => beforeInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
                    beforeImageError
                      ? 'border-red-400 bg-red-50/50'
                      : 'border-slate-300 hover:border-[#005EB8] hover:bg-blue-50/30 bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#E8F1FB] text-[#005EB8] flex items-center justify-center mb-3">
                    {isCompressingBefore ? (
                      <div className="w-6 h-6 border-2 border-[#005EB8] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                  <span className="font-semibold text-slate-800 text-sm">
                    {isCompressingBefore ? 'Đang nén ảnh...' : 'Chụp ảnh hoặc Chọn từ thư viện'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Chấp nhận JPG, PNG, WEBP, HEIC (Tối đa 15 MB)
                  </span>
                </div>
              )}

              <input
                ref={beforeInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleBeforeImageChange}
                className="hidden"
              />
              {beforeImageError && (
                <p className="text-xs text-red-500 mt-1.5">{beforeImageError}</p>
              )}
            </div>

            {/* 11. Hình ảnh SAU (TÙY CHỌN) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-800">
                  Hình ảnh SAU <span className="text-xs text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                {afterImageMeta && (
                  <span className="text-xs text-slate-500">
                    {formatFileSize(afterImageMeta.size)}
                  </span>
                )}
              </div>

              {afterImageBase64 ? (
                <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group">
                  <img
                    src={afterImageBase64}
                    alt="Ảnh sau cải tiến"
                    className="w-full h-52 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={removeAfterImage}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
                      title="Xóa ảnh"
                      aria-label="Xóa ảnh sau"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="truncate max-w-[180px]">{afterImageMeta?.name}</span>
                    <button
                      type="button"
                      onClick={() => afterInputRef.current?.click()}
                      className="text-[#005EB8] font-semibold hover:underline"
                    >
                      Đổi ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => afterInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#005EB8] hover:bg-blue-50/30 bg-slate-50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px]"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
                    {isCompressingAfter ? (
                      <div className="w-6 h-6 border-2 border-[#005EB8] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <span className="font-semibold text-slate-800 text-sm">
                    {isCompressingAfter ? 'Đang nén ảnh...' : 'Tải ảnh kết quả sau cải tiến (nếu có)'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Có thể bổ sung sau khi Ban thẩm định triển khai
                  </span>
                </div>
              )}

              <input
                ref={afterInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleAfterImageChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Nút gửi lớn dễ bấm trên mobile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Bằng việc gửi biểu mẫu, bạn xác nhận sáng kiến do chính mình đề xuất.
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isCompressingBefore || isCompressingAfter}
            className="w-full sm:w-auto min-w-[220px] h-12 px-8 rounded-xl bg-[#005EB8] hover:bg-[#00488F] disabled:bg-slate-300 text-white font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang tiếp nhận...</span>
              </>
            ) : (
              <>
                <Lightbulb className="w-5 h-5" />
                <span>Gửi ý tưởng Kaizen</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
