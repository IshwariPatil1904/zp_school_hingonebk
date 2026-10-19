import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Loader2 } from 'lucide-react';

export const StaffDashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const { tBilingual } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111827] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-green dark:text-saffron-orange animate-spin" />
        <p className="text-sm text-muted-text dark:text-dark-muted font-medium">
          {tBilingual('शाळा व्यवस्थापन पोर्टल लोड होत आहे...', 'Loading School Management Portal...')}
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Derive dynamic header title based on route and selected language mode
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/dashboard') {
      return {
        title: tBilingual('एकूण आढावा', 'Staff Overview'),
        subtitle: tBilingual('जि. प. प्राथमिक शाळा, हिंगोणे बु. - डॅशबोर्ड', 'Zilla Parishad Primary School Hingone BK - Executive Dashboard'),
      };
    }
    if (path.includes('students')) {
      return {
        title: tBilingual('विद्यार्थी नोंदवही', 'Student Management'),
        subtitle: tBilingual('विद्यार्थी नोंदणी, प्रोफाइल व हजेरी तपशील', 'Manage student enrollments, profiles, and attendance'),
      };
    }
    if (path.includes('teachers')) {
      return {
        title: tBilingual('शिक्षक कर्मचारी यादी', 'Teacher Staff Roster'),
        subtitle: tBilingual('शासकीय शिक्षक, शैक्षणिक पात्रता व वर्ग जबाबदारी', 'Approved teaching staff, qualifications, and class assignments'),
      };
    }
    if (path.includes('funds') || path.includes('finances')) {
      return {
        title: tBilingual('शालेय निधी व खर्च व्यवस्थापन', 'School Funds & Ledger'),
        subtitle: tBilingual('प्राप्त शासकीय अनुदान, प्रत्यक्ष खर्च व हिशोब ताळेबंद', 'Grants allocated, utilized funds, and expense ledger'),
      };
    }
    if (path.includes('scholarships')) {
      return {
        title: tBilingual('शासकीय शिष्यवृत्ती', 'Government Scholarships'),
        subtitle: tBilingual('सावित्रीबाई फुले, सुवर्ण महोत्सव व लाभार्थी यादी', 'State DBT schemes, automated eligibility engine and approvals'),
      };
    }
    if (path.includes('certificates')) {
      return {
        title: tBilingual('प्रमाणपत्र व्यवस्थापन', 'Certificates & Documents'),
        subtitle: tBilingual('बोनाफाईड, शाळा सोडल्याचा दाखला (TC) व निर्गम उतारा', 'Issue and verify Bonafide, Leaving TC, and Nirgam Utara'),
      };
    }
    if (path.includes('reports')) {
      return {
        title: tBilingual('अहवाल व सांख्यिकी', 'Reports & Analytics'),
        subtitle: tBilingual('विद्यार्थी, निधी व शिक्षक सांख्यिकी डेटा एक्सपोर्ट', 'Download Excel, CSV, and PDF educational records'),
      };
    }
    if (path.includes('promotion')) {
      return {
        title: tBilingual('वार्षिक वर्ग पदोन्नती', 'Annual Student Promotion'),
        subtitle: tBilingual('पुढील शैक्षणिक वर्षात वर्गोन्नती व इतिहास नोंदवही', 'Promote enrolled students to the next grade level'),
      };
    }
    if (path.includes('admissions')) {
      return {
        title: tBilingual('प्रवेश अर्ज छाननी', 'Admissions Applications Review'),
        subtitle: tBilingual('ऑनलाईन प्रवेश अर्जांची पडताळणी व अधिकृत नोंदणी', 'Review and approve online admission applications'),
      };
    }
    if (path.includes('website')) {
      return {
        title: tBilingual('संकेतस्थळ व्यवस्थापन', 'Public Website Management'),
        subtitle: tBilingual('शाळेची माहिती, परिपत्रके व छायाचित्र दालन', 'Publish circulars, announcements, and school content'),
      };
    }
    if (path.includes('profile') || path.includes('settings')) {
      return {
        title: tBilingual('माझे प्रोफाइल व पासवर्ड', 'Staff Profile & Security'),
        subtitle: tBilingual('वैयक्तिक संपर्क माहिती व पासवर्ड व्यवस्थापन', 'View account details and change credentials'),
      };
    }
    if (path.includes('attendance')) {
      return {
        title: tBilingual('दैनंदिन हजेरी', 'Daily Attendance'),
        subtitle: tBilingual('वर्गातील विद्यार्थ्यांची दैनंदिन हजेरी नोंदवा', 'Mark and review classroom daily student attendance'),
      };
    }
    if (path.includes('mdm')) {
      return {
        title: tBilingual('शालेय पोषण आहार', 'Mid-Day Meal Program'),
        subtitle: tBilingual('दैनिक धान्य वाटप, लाभार्थी संख्या व मेनू नोंद', 'Daily ration allocation and nutrition logs'),
      };
    }
    return {
      title: tBilingual('कर्मचारी पोर्टल', 'Staff Portal'),
      subtitle: tBilingual('जि. प. शाळा हिंगोणे बु.', 'Hingone BK ZP School System'),
    };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-[#F4F7F4]/40 dark:bg-[#111827] flex text-main-text dark:text-dark-text transition-colors duration-200">
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Workspace Area (Clean workspace with dark support) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <DashboardHeader
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
