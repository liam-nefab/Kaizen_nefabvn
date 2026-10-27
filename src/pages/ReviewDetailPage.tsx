import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SCOPES, Scope, CompletionStatus, QuarterlyAward } from '../constants/kaizen';
import { apiClient } from '../services/api';
import { KaizenItem } from '../types/kaizen';
import { formatVND } from '../services/imageCompression';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Lightbox } from '../components/common/Lightbox';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Trophy,
  ShieldCheck,
  Calendar,
  Building,
  Tag,
  DollarSign,
  Maximize2,
  Save,
  Trash2,
  User,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

const reviewSchema = z
  .object({
    scope: z.enum(['Bắc Ninh', 'Đà Nẵng', 'Đồng Nai', 'Tất cả']),
    owner: z.string().trim(),
    completion: z.enum(['Hoàn thành', 'Chưa hoàn thành']),
    implementDate: z.string().optional(),
    payMonth: z.string().optional(),
    reviewerNote: z.string().optional(),
    quarterlyAward: z.enum(['Có', 'Không']),
  })
  .superRefine((data, ctx) => {
    // Quy tắc nghiệp vụ 1: Hoàn thành bắt buộc có Ngày thực hiện
    if (data.completion === 'Hoàn thành' && (!data.implementDate || data.implementDate.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['implementDate'],
        message: 'Khi đánh dấu "Hoàn thành", bắt buộc phải chọn Ngày thực hiện',
      });
    }

    // Quy tắc nghiệp vụ 2: Tham dự giải quý = Có bắt buộc có Phụ trách thực thi và Tháng chi trả
    if (data.quarterlyAward === 'Có') {
      if (!data.owner || data.owner.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['owner'],
          message: 'Khi tham dự giải quý, bắt buộc phải có Phụ trách thực thi',
        });
      }
      if (!data.payMonth || data.payMonth.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['payMonth'],
          message: 'Khi tham dự giải quý, bắt buộc phải chọn Tháng chi trả',
        });
      }
    }
  });

type ReviewFormValues = z.infer<typeof reviewSchema>;

export const ReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [item, setItem] = useState<KaizenItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lightbox xem ảnh
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
  });

  const watchCompletion = watch('completion');
  const watchQuarterlyAward = watch('quarterlyAward');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    apiClient
      .getKaizenById(id)
      .then((data) => {
        if (!data) {
          toastError('Không tìm thấy bản ghi Kaizen');
          navigate('/review');
          return;
        }
        setItem(data);
        reset({
          scope: (data.scope as Scope) || 'Bắc Ninh',
          owner: data.owner || '',
          completion: (data.completion as CompletionStatus) || 'Chưa hoàn thành',
          implementDate: data.implementDate || '',
          payMonth: data.payMonth || '',
          reviewerNote: data.reviewerNote || '',
          quarterlyAward: (data.quarterlyAward as QuarterlyAward) || 'Không',
        });
      })
      .catch(() => {
        toastError('Lỗi tải thông tin Kaizen');
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate, reset, toastError]);

  const onSaveReview = async (formData: ReviewFormValues) => {
    if (!item) return;
    setIsSaving(true);
    try {
      const reviewerEmail = user?.userDetails || 'reviewer@nefab.com';
      const updated = await apiClient.reviewKaizen(
        item.id,
        {
          scope: formData.scope as Scope,
          owner: formData.owner,
          completion: formData.completion,
          implementDate: formData.implementDate || undefined,
          payMonth: formData.payMonth || undefined,
          reviewerNote: formData.reviewerNote || undefined,
          quarterlyAward: formData.quarterlyAward,
        },
        reviewerEmail
      );

      setItem(updated);
      success('Đã lưu kết quả thẩm định Kaizen thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu thẩm định';
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !window.confirm(`Xác nhận xóa ý tưởng ${item.code}?`)) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteKaizen(item.id);
      success('Đã xóa ý tưởng Kaizen');
      navigate('/review');
    } catch {
      toastError('Không thể xóa ý tưởng');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-[#005EB8] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Đang tải chi tiết Kaizen...</span>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/review"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="font-bold text-[#005EB8] text-base">{item.code}</span>
              <span>·</span>
              <span>Mã NV: {item.employeeId}</span>
              <span>·</span>
              <span>{item.department}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 line-clamp-1">
              {item.ideaName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {item.status === 'Đã thẩm định' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã thẩm định ({item.reviewedBy || 'Nội bộ'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              Chờ thẩm định (Mới)
            </span>
          )}

          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
              title="Xóa ý tưởng (Quyền Admin)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid 2 cột song song: Thông tin người nộp (Trái) & Form Thẩm định (Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Dữ liệu gốc người nộp (Read-only) + Ảnh trước/sau */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card thông tin chi tiết */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Nội dung do công nhân gửi
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Ngày gửi: {item.submitDate} ({item.quarter || '2026'})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Mã nhân viên</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {item.employeeId}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Bộ phận</span>
                <span className="font-semibold text-slate-900 text-sm">{item.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Lĩnh vực Kaizen</span>
                <span className="font-medium text-slate-800">{item.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Tiết kiệm ước tính</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {item.savingAmount ? formatVND(item.savingAmount) : 'Chưa ước tính'}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100 text-xs sm:text-sm">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Chủ đề:</span>
                <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  {item.topic}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  1. Hiện trạng trước cải tiến:
                </span>
                <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
                  {item.currentState}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">2. Nguyên nhân gốc rễ:</span>
                <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
                  {item.rootCause}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">3. Lợi ích mang lại:</span>
                <p className="text-slate-700 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200/80 leading-relaxed whitespace-pre-wrap">
                  {item.benefit}
                </p>
              </div>
            </div>
          </div>

          {/* Card hình ảnh trước & sau */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-[#005EB8]" />
              Hình ảnh thực tế nhà xưởng (Nhấn để phóng to)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ảnh TRƯỚC */}
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Hình ảnh TRƯỚC cải tiến
                </span>
                <div
                  onClick={() => {
                    setLightboxUrl(item.beforeImageUrl);
                    setLightboxTitle(`Ảnh TRƯỚC: ${item.ideaName}`);
                  }}
                  className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group h-48 sm:h-56"
                >
                  <img
                    src={item.beforeImageUrl}
                    alt="Ảnh trước cải tiến"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                    <Maximize2 className="w-4 h-4" />
                    <span>Xem phóng to</span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    TRƯỚC
                  </div>
                </div>
              </div>

              {/* Ảnh SAU */}
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Hình ảnh SAU cải tiến
                </span>
                {item.afterImageUrl ? (
                  <div
                    onClick={() => {
                      setLightboxUrl(item.afterImageUrl!);
                      setLightboxTitle(`Ảnh SAU: ${item.ideaName}`);
                    }}
                    className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group h-48 sm:h-56"
                  >
                    <img
                      src={item.afterImageUrl}
                      alt="Ảnh sau cải tiến"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                      <Maximize2 className="w-4 h-4" />
                      <span>Xem phóng to</span>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-emerald-700/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      SAU
                    </div>
                  </div>
                ) : (
                  <div className="h-48 sm:h-56 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
                    <span>Chưa có ảnh sau</span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      (Người nộp chưa tải lên ảnh sau cải tiến)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Form Thẩm định dành cho Reviewer / Admin */}
        <div className="lg:col-span-5 space-y-6 sticky top-20">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-[#005EB8]" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Ban Thẩm định Kaizen</h2>
                <p className="text-[11px] text-slate-500">
                  Phê duyệt phạm vi, người phụ trách và xét giải thưởng quý
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSaveReview)} className="space-y-4">
              {/* 1. Phạm vi thực hiện */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phạm vi thực hiện <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('scope')}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
                >
                  {SCOPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.scope && (
                  <p className="text-xs text-red-500 mt-1">{errors.scope.message}</p>
                )}
              </div>

              {/* 2. Phụ trách thực thi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phụ trách thực thi{' '}
                  {watchQuarterlyAward === 'Có' && (
                    <span className="text-red-500">* (Bắt buộc nếu giải quý)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="VD: Trần Văn Mạnh (Xưởng Gỗ Bắc Ninh)"
                    {...register('owner')}
                    className={`w-full h-11 pl-9 pr-3 rounded-xl border bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] ${
                      errors.owner ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
                {errors.owner && (
                  <p className="text-xs text-red-500 mt-1">{errors.owner.message}</p>
                )}
              </div>

              {/* 3. Kiểm tra hoàn thành */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kiểm tra hoàn thành <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold transition-all ${
                      watchCompletion === 'Hoàn thành'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      value="Hoàn thành"
                      {...register('completion')}
                      className="hidden"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hoàn thành</span>
                  </label>

                  <label
                    className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold transition-all ${
                      watchCompletion === 'Chưa hoàn thành'
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      value="Chưa hoàn thành"
                      {...register('completion')}
                      className="hidden"
                    />
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Chưa hoàn thành</span>
                  </label>
                </div>
              </div>

              {/* 4. Ngày thực hiện (bắt buộc nếu Hoàn thành) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ngày thực hiện{' '}
                  {watchCompletion === 'Hoàn thành' && (
                    <span className="text-red-500">* (Bắt buộc khi hoàn thành)</span>
                  )}
                </label>
                <input
                  type="date"
                  {...register('implementDate')}
                  className={`w-full h-11 px-3 rounded-xl border bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] ${
                    errors.implementDate ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.implementDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.implementDate.message}</p>
                )}
              </div>

              {/* 5. Tháng chi trả thưởng */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tháng chi trả thưởng (yyyy-MM){' '}
                  {watchQuarterlyAward === 'Có' && (
                    <span className="text-red-500">* (Bắt buộc nếu giải quý)</span>
                  )}
                </label>
                <input
                  type="month"
                  {...register('payMonth')}
                  className={`w-full h-11 px-3 rounded-xl border bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] ${
                    errors.payMonth ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.payMonth && (
                  <p className="text-xs text-red-500 mt-1">{errors.payMonth.message}</p>
                )}
              </div>

              {/* 7. Chọn tham dự giải quý */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chọn tham dự giải quý Nefab <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold transition-all ${
                      watchQuarterlyAward === 'Có'
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      value="Có"
                      {...register('quarterlyAward')}
                      className="hidden"
                    />
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Có tham dự</span>
                  </label>

                  <label
                    className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold transition-all ${
                      watchQuarterlyAward === 'Không'
                        ? 'border-slate-400 bg-slate-100 text-slate-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      value="Không"
                      {...register('quarterlyAward')}
                      className="hidden"
                    />
                    <span>Không tham dự</span>
                  </label>
                </div>
              </div>

              {/* 6. Ghi chú khác */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú thẩm định khác
                </label>
                <textarea
                  rows={3}
                  placeholder="Ý kiến đánh giá, hiệu quả thực tế, yêu cầu cải tiến thêm..."
                  {...register('reviewerNote')}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
                />
              </div>

              {/* Review metadata info */}
              {item.reviewedAt && (
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-200/80">
                  <span>Thẩm định bởi: </span>
                  <strong className="text-slate-800">{item.reviewedBy}</strong>
                  <span className="block mt-0.5">
                    Thời gian: {new Date(item.reviewedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-12 rounded-xl bg-[#005EB8] hover:bg-[#00488F] disabled:bg-slate-300 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu thẩm định...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu kết quả thẩm định</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lightbox Component */}
      <Lightbox
        isOpen={!!lightboxUrl}
        onClose={() => setLightboxUrl(null)}
        imageUrl={lightboxUrl || ''}
        title={lightboxTitle}
        subtitle={`Mã: ${item.code}`}
      />
    </div>
  );
};
