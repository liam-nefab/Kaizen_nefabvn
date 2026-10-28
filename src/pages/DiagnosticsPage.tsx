import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, isMockMode } from '../services/api';
import { PingResponse } from '../services/api/types';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Key,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const DiagnosticsPage: React.FC = () => {
  const rawUrl = import.meta.env.VITE_APPS_SCRIPT_URL || '';
  const isMock = isMockMode;

  const maskUrl = (url: string) => {
    if (!url) return '(Chưa cấu hình VITE_APPS_SCRIPT_URL)';
    if (url.length < 35) return url;
    return url.slice(0, 32) + '...' + url.slice(-10);
  };

  const isDevModeUrl = rawUrl.includes('/dev');
  const hasUserPrefix = rawUrl.includes('/u/1/') || rawUrl.includes('/u/2/');

  // Ping state
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    durationMs: number;
    data?: PingResponse;
    error?: string;
  } | null>(null);

  // Test login state
  const [testPasscode, setTestPasscode] = useState('');
  const [isTestingLogin, setIsTestingLogin] = useState(false);
  const [loginTestResult, setLoginTestResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
  } | null>(null);

  const handlePing = async () => {
    setIsPinging(true);
    setPingResult(null);
    const start = performance.now();
    try {
      const data = await apiClient.ping();
      const durationMs = Math.round(performance.now() - start);
      setPingResult({ success: true, durationMs, data });
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      setPingResult({
        success: false,
        durationMs,
        error: err?.message || 'Không thể kết nối máy chủ',
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPasscode.trim()) return;

    setIsTestingLogin(true);
    setLoginTestResult(null);
    try {
      const res = await apiClient.login(testPasscode.trim(), 'Test Diagnostics');
      setLoginTestResult({ success: true, data: res });
    } catch (err: any) {
      setLoginTestResult({
        success: false,
        error: err?.message || 'Xác thực thất bại',
      });
    } finally {
      setIsTestingLogin(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F1FB] text-[#005EB8] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Kiểm tra & Chẩn đoán Kết nối (Diagnostics)
            </h1>
            <p className="text-xs text-slate-500">
              Kiểm tra tình trạng máy chủ Google Apps Script, URL triển khai và quyền truy cập
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs font-medium text-slate-600 hover:text-[#005EB8] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>

      {/* Thông tin môi trường cấu hình */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-[#005EB8]" />
          <span>Thông số môi trường hiện tại</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium mb-1">Chế độ hoạt động (VITE_USE_MOCK):</div>
            <div className="font-bold">
              {isMock ? (
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Mock Mode (Dữ liệu giả lập localStorage)
                </span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Live Mode (Google Apps Script Backend)
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium mb-1">URL Google Apps Script:</div>
            <div className="font-mono text-slate-800 break-all select-all font-semibold">
              {maskUrl(rawUrl)}
            </div>
          </div>
        </div>

        {/* Cảnh báo cấu hình URL sai lệch */}
        {isDevModeUrl && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>CẢNH BÁO: URL chứa đuôi "/dev"</span>
            </div>
            <p className="leading-relaxed">
              URL kết thúc bằng <code>/dev</code> chỉ hoạt động khi bạn đăng nhập tài khoản Google của chính mình trên trình duyệt. Công nhân hoặc thiết bị khác sẽ gặp lỗi trang HTML đăng nhập Google.
              <br />
              <strong>Cách khắc phục:</strong> Vào Apps Script &gt; <em>Triển khai (Deploy)</em> &gt; <em>Triển khai mới (New deployment)</em> &gt; Loại: <em>Ứng dụng web (Web app)</em> &gt; Ai có quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong>. Sau đó copy URL kết thúc bằng <code>/exec</code>.
            </p>
          </div>
        )}

        {hasUserPrefix && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>CẢNH BÁO: URL chứa tiền tố đa tài khoản (/u/1/ hoặc /u/2/)</span>
            </div>
            <p className="leading-relaxed">
              URL này gắn với phiên đăng nhập tài khoản cụ thể trên máy tính của bạn và sẽ bị lỗi 403 trên thiết bị người dùng khác. Hãy bỏ tiền tố <code>/u/1/</code> để trở thành URL chuẩn <code>https://script.google.com/macros/s/.../exec</code>.
            </p>
          </div>
        )}
      </div>

      {/* Công cụ Ping máy chủ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#005EB8]" />
            <span>Kiểm tra kết nối mạng (Ping Endpoint)</span>
          </h2>

          <button
            onClick={handlePing}
            disabled={isPinging}
            className="h-9 px-4 bg-[#005EB8] hover:bg-[#00488F] disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {isPinging ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span>Kiểm tra kết nối (Ping)</span>
              </>
            )}
          </button>
        </div>

        {pingResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              pingResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                {pingResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Kết nối THÀNH CÔNG (HTTP OK)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span>Kết nối THẤT BẠI</span>
                  </>
                )}
              </div>
              <span className="font-mono text-slate-600 text-[11px]">
                Độ trễ: {pingResult.durationMs}ms
              </span>
            </div>

            {pingResult.success && pingResult.data && (
              <div className="bg-white/80 p-3 rounded-lg border border-emerald-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div>Trạng thái: {pingResult.data.status}</div>
                <div>Thời gian server: {pingResult.data.time}</div>
                {pingResult.data.version && <div>Phiên bản: {pingResult.data.version}</div>}
              </div>
            )}

            {!pingResult.success && (
              <div className="space-y-2">
                <div className="font-semibold text-red-700">Chi tiết lỗi: {pingResult.error}</div>
                {pingResult.error?.includes('HTML') && (
                  <div className="p-3 bg-white rounded-lg border border-red-200 text-slate-700 leading-relaxed text-[11px]">
                    <div className="font-bold text-red-800 mb-1 flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>Hướng dẫn khắc phục quyền truy cập Apps Script:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 pl-1">
                      <li>Mở dự án Google Apps Script (script.google.com).</li>
                      <li>
                        Nhấn nút <strong>Triển khai (Deploy)</strong> ở góc trên bên phải &gt; chọn{' '}
                        <strong>Quản lý bản triển khai (Manage deployments)</strong>.
                      </li>
                      <li>
                        Chọn bản triển khai đang dùng, nhấn biểu tượng <strong>Cây bút (Chỉnh sửa)</strong>.
                      </li>
                      <li>
                        Mục <strong>Phiên bản (Version)</strong>: chọn <strong>Bản mới (New version)</strong>.
                      </li>
                      <li>
                        Mục <strong>Ai có quyền truy cập (Who has access)</strong>: chọn{' '}
                        <strong>Bất kỳ ai (Anyone)</strong>.
                      </li>
                      <li>Nhấn <strong>Triển khai (Deploy)</strong> và sao chép lại Web App URL.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thử nghiệm Đăng nhập */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-[#005EB8]" />
          <span>Thử nghiệm xác thực Passcode</span>
        </h2>

        <form onSubmit={handleTestLogin} className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            value={testPasscode}
            onChange={(e) => setTestPasscode(e.target.value)}
            placeholder="Nhập mã Passcode thử nghiệm..."
            className="flex-1 h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#005EB8] focus:bg-white"
          />
          <button
            type="submit"
            disabled={isTestingLogin}
            className="h-10 px-5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            {isTestingLogin ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <span>Kiểm tra mã Passcode</span>
            )}
          </button>
        </form>

        {loginTestResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              loginTestResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {loginTestResult.success ? (
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mã truy cập hợp lệ!</span>
                </div>
                <div className="font-mono text-[11px] text-slate-700">
                  Vai trò được cấp:{' '}
                  <span className="font-bold text-[#005EB8] uppercase">
                    {loginTestResult.data.role}
                  </span>
                  {' | '}
                  Hạn token:{' '}
                  {new Date(loginTestResult.data.expiresAt).toLocaleTimeString('vi-VN')}
                </div>
              </div>
            ) : (
              <div className="font-semibold text-red-700 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Lỗi: {loginTestResult.error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
