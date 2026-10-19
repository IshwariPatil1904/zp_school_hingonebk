import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { StaffDashboardLayout } from './components/layout/StaffDashboardLayout';
import { RoleGuard } from './components/common/RoleGuard';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { GalleryPage } from './pages/public/GalleryPage';
import { AcademicsPage } from './pages/public/AcademicsPage';
import { TeachersPage } from './pages/public/TeachersPage';
import { NoticesPage } from './pages/public/NoticesPage';
import { ScholarshipsPage } from './pages/public/ScholarshipsPage';
import { AdmissionsPage } from './pages/public/AdmissionsPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/public/LoginPage';

// Dashboard pages
import { DashboardOverviewPage } from './pages/dashboard/DashboardOverviewPage';
import { StudentsPage } from './pages/dashboard/StudentsPage';
import { AttendancePage } from './pages/dashboard/AttendancePage';
import { MdmPage } from './pages/dashboard/MdmPage';
import { TeachersRosterPage } from './pages/dashboard/TeachersRosterPage';
import { FinancesPage } from './pages/dashboard/FinancesPage';
import { ScholarshipsManagePage } from './pages/dashboard/ScholarshipsManagePage';
import { CertificatesPage } from './pages/dashboard/CertificatesPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { PromotionPage } from './pages/dashboard/PromotionPage';
import { AdmissionsManagePage } from './pages/dashboard/AdmissionsManagePage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { WebsiteManagePage } from './pages/dashboard/WebsiteManagePage';
import { NoticesManagePage } from './pages/dashboard/NoticesManagePage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="academics" element={<AcademicsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="notices" element={<NoticesPage />} />
            <Route path="scholarships" element={<ScholarshipsPage />} />
            <Route path="admissions" element={<AdmissionsPage />} />
            <Route path="admission" element={<Navigate to="/admissions" replace />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>

          {/* Protected Staff Dashboard Routes */}
          <Route path="/dashboard" element={<StaffDashboardLayout />}>
            <Route index element={<DashboardOverviewPage />} />
            <Route path="students" element={<StudentsPage />} />

            {/* Principal Only Protected Routes */}
            <Route
              path="teachers"
              element={
                <RoleGuard allowedRoles={['principal']}>
                  <TeachersRosterPage />
                </RoleGuard>
              }
            />

            {/* Funds / Finances (Read-only for Teacher, Manage for Principal) */}
            <Route path="funds" element={<FinancesPage />} />
            <Route path="finances" element={<Navigate to="/dashboard/funds" replace />} />

            {/* Scholarships */}
            <Route path="scholarships" element={<ScholarshipsManagePage />} />

            {/* Certificates */}
            <Route path="certificates" element={<CertificatesPage />} />

            {/* Reports */}
            <Route path="reports" element={<ReportsPage />} />

            {/* Promotion (Principal Only) */}
            <Route
              path="promotion"
              element={
                <RoleGuard allowedRoles={['principal']}>
                  <PromotionPage />
                </RoleGuard>
              }
            />

            {/* Admissions Review (Principal Only) */}
            <Route
              path="admissions"
              element={
                <RoleGuard allowedRoles={['principal']}>
                  <AdmissionsManagePage />
                </RoleGuard>
              }
            />

            {/* My Profile */}
            <Route path="profile" element={<SettingsPage />} />
            <Route path="settings" element={<Navigate to="/dashboard/profile" replace />} />

            {/* Public Website Management (Principal Only) */}
            <Route
              path="website"
              element={
                <RoleGuard allowedRoles={['principal']}>
                  <WebsiteManagePage />
                </RoleGuard>
              }
            />
            <Route path="public-management" element={<Navigate to="/dashboard/website" replace />} />

            {/* Additional Modules */}
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="mdm" element={<MdmPage />} />
            <Route path="notices" element={<NoticesManagePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
