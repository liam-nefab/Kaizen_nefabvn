import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  Camera,
  Trophy,
  ArrowRight,
  Search,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Layers,
  Wrench,
  Clock,
  Award,
} from 'lucide-react';
import { apiClient } from '../services/api';
import { KaizenStats } from '../types/kaizen';
import { formatVND } from '../services/imageCompression';
import heroPlantImage from '../assets/images/hero_nefab_plant_1793080719672.jpg';
import awardImage from '../assets/images/kaizen_award_showcase_1793080719888.jpg';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<KaizenStats | null>(null);

  useEffect(() => {
    apiClient.getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#E8F1FB] border border-[#B8D5F5] px-3 py-1.5 rounded-full text-xs font-semibold text-[#005EB8]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nefab Continuous Improvement 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Mỗi ý tưởng nhỏ, <br />
                <span className="text-[#005EB8]">tạo bước tiến lớn</span> cho nhà máy
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Cổng thu thập và tôn vinh sáng kiến Kaizen dành riêng cho công nhân viên Nefab Việt Nam. Gửi nhanh ngay trên điện thoại, không cần tài khoản, ghi nhận và khen thưởng minh bạch.
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  to="/submit"
                  className="h-12 px-6 rounded-xl bg-[#005EB8] hover:bg-[#00488F] text-white font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5"
                >
                  <Lightbulb className="w-5 h-5" />
                  <span>Gửi ý tưởng Kaizen ngay</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  to="/track"
                  className="h-12 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Search className="w-4 h-4 text-slate-500" />
                  <span>Tra cứu trạng thái ý tưởng</span>
                </Link>
              </div>

              {/* Trust highlights */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Gửi ẩn danh công khai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#005EB8] shrink-0" />
                  <span>Chỉ mất 2 phút</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Xét thưởng hàng tháng</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md group">
                <img
                  src={heroPlantImage}
                  alt="Không gian cải tiến Kaizen nhà máy Nefab"
                  className="w-full h-[320px] sm:h-[380px] object-cover group-hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex flex-col justify-end p-5 text-white">
                  <span className="text-xs uppercase font-bold tracking-widest text-amber-300">
                    Bảng Kaizen Lean Manufacturing
                  </span>
                  <p className="text-sm font-semibold mt-1">
                    Nhà máy Bắc Ninh · Đà Nẵng · Đồng Nai
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Hơn 30+ sáng kiến đã thẩm định và ứng dụng thành công trong năm 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Overview Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-[#005EB8]" />
                <span>Tổng số Kaizen</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {stats?.totalCount || 30}
              </div>
              <p className="text-xs text-slate-500">Đã tiếp nhận toàn hệ thống</p>
            </div>

            <div className="space-y-1 pt-4 lg:pt-0 lg:pl-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Đã thẩm định</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tabular-nums">
                {stats?.reviewedCount || 25}
              </div>
              <p className="text-xs text-slate-500">
                Tỷ lệ hoàn thành: {stats?.completionRate || 80}%
              </p>
            </div>

            <div className="space-y-1 pt-4 lg:pt-0 lg:pl-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Tiết kiệm làm lợi</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono tabular-nums">
                {formatVND(stats?.totalSavings || 580000000)}
              </div>
              <p className="text-xs text-slate-500">Ước tính giá trị làm lợi cho công ty</p>
            </div>

            <div className="space-y-1 pt-4 lg:pt-0 lg:pl-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Đề cử giải quý</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#005EB8] font-mono tabular-nums">
                {stats?.quarterlyAwardCount || 16}
              </div>
              <p className="text-xs text-slate-500">Sáng kiến xuất sắc vào vòng chung khảo</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps Simple Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold text-[#005EB8] uppercase tracking-wider bg-[#E8F1FB] px-2.5 py-1 rounded-md">
            Quy trình 3 bước đơn giản
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Làm thế nào để gửi một ý tưởng Kaizen?
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Thiết kế tối ưu cho công nhân thao tác nhanh gọn bằng điện thoại ngay tại chuyền
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative">
            <div className="w-12 h-12 rounded-xl bg-[#E8F1FB] text-[#005EB8] flex items-center justify-center font-bold text-xl mb-4">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bước 1</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Chụp ảnh hiện trạng</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bật camera điện thoại chụp lại vị trí máy móc, dụng cụ, nguy cơ an toàn hoặc điểm lãng phí cần cải tiến. Hệ thống tự động nén nhẹ ảnh.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl mb-4">
              <Lightbulb className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bước 2</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Mô tả giải pháp & Lợi ích</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Điền mã nhân viên, chọn bộ phận và tóm tắt ngắn gọn: Nguyên nhân là gì? Đã cải tiến ra sao? Giúp tiết kiệm thời gian hoặc chi phí thế nào?
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bước 3</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Thẩm định & Nhận thưởng</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nhận ngay mã Kaizen để tra cứu kết quả. Ban thẩm định đánh giá hàng tháng, chi trả thưởng và xét giải thưởng Kaizen xuất sắc của Quý.
            </p>
          </div>
        </div>
      </section>

      {/* 5 Kaizen Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-[#005EB8] uppercase tracking-wider">
                Định hướng cải tiến
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                5 Lĩnh vực trọng tâm Kaizen tại Nefab
              </h2>
            </div>
            <button
              onClick={() => navigate('/submit')}
              className="text-sm font-semibold text-[#005EB8] hover:text-[#00488F] flex items-center gap-1.5"
            >
              <span>Xem mẫu đơn và nộp ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#005EB8]/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#005EB8] flex items-center justify-center mb-3">
                <Wrench className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Cải tiến dụng cụ/ máy</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Đồ gá cơ khí, dao cắt, kẹp định vị khuôn, hỗ trợ thao tác nhanh cho thợ.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">An toàn / 5S</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kẻ vạch lối đi, chống va chạm xe nâng, thông gió, che chắn bảo hộ lao động.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-amber-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Năng suất lao động</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rút ngắn thời gian chuyển đổi mã hàng, giảm thao tác thừa, tối ưu layout.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-purple-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Chất lượng sản phẩm</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chống móp thùng carton, ngừa lệch góc, đảm bảo thẩm mỹ bao bì xuất khẩu.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-teal-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Chuỗi cung ứng</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Xếp tối đa tải trọng xe tải, tái sử dụng vật liệu, giảm hao hụt kho bãi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recognition & Annual Award Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#005EB8] rounded-2xl overflow-hidden shadow-md text-white grid grid-cols-1 md:grid-cols-12 items-center">
          <div className="p-8 md:p-10 md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Giải thưởng Kaizen Quý & Năm 2026</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tôn vinh tinh thần đổi mới của công nhân viên
            </h3>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Mỗi sáng kiến được Ban thẩm định phê duyệt áp dụng sẽ được nhận tiền thưởng khích lệ trong tháng. Các ý tưởng xuất sắc nhất sẽ được đề cử giải Nhất - Nhì - Ba quý với phần thưởng giá trị cao từ Tổng Giám đốc.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/submit"
                className="h-11 px-5 rounded-xl bg-white text-[#005EB8] hover:bg-slate-100 font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Nộp ý tưởng để tham dự giải</span>
              </Link>
              <Link
                to="/track"
                className="h-11 px-5 rounded-xl bg-[#00488F] text-white hover:bg-[#003B75] font-semibold text-sm flex items-center gap-2 transition-colors border border-white/20"
              >
                <span>Kiểm tra trạng thái đã nộp</span>
              </Link>
            </div>
          </div>

          <div className="md:col-span-5 h-full min-h-[260px] relative">
            <img
              src={awardImage}
              alt="Giải thưởng vinh danh Kaizen Nefab"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
