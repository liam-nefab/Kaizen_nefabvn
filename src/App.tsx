import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MockRoleBar } from './components/common/MockRoleBar';

import { HomePage } from './pages/HomePage';
import { SubmitPage } from './pages/SubmitPage';
import { SubmitSuccessPage } from './pages/SubmitSuccessPage';
import { TrackPage } from './pages/TrackPage';
import { ReviewListPage } from './pages/ReviewListPage';
import { ReviewDetailPage } from './pages/ReviewDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-slate-800 font-sans selection:bg-[#005EB8] selection:text-white">
            {/* Top Navigation */}
            <Header />

            {/* Main Content Area */}
            <main className="flex-1">
              <Routes>
                {/* Public Routes (Không yêu cầu đăng nhập) */}
                <Route path="/" element={<HomePage />} />
                <Route path="/submit" element={<SubmitPage />} />
                <Route path="/submit/success" element={<SubmitSuccessPage />} />
                <Route path="/track" element={<TrackPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/diagnostics" element={<DiagnosticsPage />} />

                {/* Protected Routes (Yêu cầu quyền Reviewer/Admin qua Passcode) */}
                <Route
                  path="/review"
                  element={
                    <ProtectedRoute>
                      <ReviewListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review/:id"
                  element={
                    <ProtectedRoute>
                      <ReviewDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Not Found Friendly Page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* Thanh chuyển nhanh vai trò demo (Chỉ hiển thị khi bật chế độ Mock) */}
            <MockRoleBar />
          </div>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}
