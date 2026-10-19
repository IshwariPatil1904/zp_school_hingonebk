import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Landmark,
  Award,
  FileBadge,
  FileSpreadsheet,
  GraduationCap,
  UserPlus,
  Settings,
  Globe,
  LogOut,
  ExternalLink,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  marathi: string;
  path: string;
  icon: any;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isPrincipal } = useAuth();
  const { tBilingual } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Principal Sidebar items
  const principalNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      marathi: 'डॅशबोर्ड',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Students',
      marathi: 'विद्यार्थी',
      path: '/dashboard/students',
      icon: Users,
    },
    {
      label: 'Teachers',
      marathi: 'शिक्षक',
      path: '/dashboard/teachers',
      icon: UserCheck,
    },
    {
      label: 'Funds',
      marathi: 'निधी',
      path: '/dashboard/funds',
      icon: Landmark,
    },
    {
      label: 'Scholarships',
      marathi: 'शिष्यवृत्ती',
      path: '/dashboard/scholarships',
      icon: Award,
    },
    {
      label: 'Certificates',
      marathi: 'प्रमाणपत्रे',
      path: '/dashboard/certificates',
      icon: FileBadge,
    },
    {
      label: 'Reports',
      marathi: 'अहवाल',
      path: '/dashboard/reports',
      icon: FileSpreadsheet,
    },
    {
      label: 'Promotion',
      marathi: 'विद्यार्थी उत्तीर्ण प्रक्रिया',
      path: '/dashboard/promotion',
      icon: GraduationCap,
    },
    {
      label: 'Admissions',
      marathi: 'प्रवेश',
      path: '/dashboard/admissions',
      icon: UserPlus,
    },
    {
      label: 'My Profile',
      marathi: 'माझे प्रोफाइल',
      path: '/dashboard/profile',
      icon: Settings,
    },
    {
      label: 'Public Website Management',
      marathi: 'संकेतस्थळ व्यवस्थापन',
      path: '/dashboard/website',
      icon: Globe,
    },
  ];

  // Teacher Sidebar items
  const teacherNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      marathi: 'डॅशबोर्ड',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Students',
      marathi: 'विद्यार्थी',
      path: '/dashboard/students',
      icon: Users,
    },
    {
      label: 'Reports',
      marathi: 'अहवाल',
      path: '/dashboard/reports',
      icon: FileSpreadsheet,
    },
    {
      label: 'Funds',
      marathi: 'निधी',
      path: '/dashboard/funds',
      icon: Landmark,
    },
    {
      label: 'Scholarships',
      marathi: 'शिष्यवृत्ती',
      path: '/dashboard/scholarships',
      icon: Award,
    },
    {
      label: 'Certificates',
      marathi: 'प्रमाणपत्रे',
      path: '/dashboard/certificates',
      icon: FileBadge,
    },
    {
      label: 'My Profile',
      marathi: 'माझे प्रोफाइल',
      path: '/dashboard/profile',
      icon: Settings,
    },
  ];

  const currentNavItems = isPrincipal ? principalNavItems : teacherNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-dark-green text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xl border-r border-[#103D27]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 bg-primary-green shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-saffron-orange flex flex-col items-center justify-center text-white font-extrabold text-xs shadow">
              <span className="text-[9px] leading-none">जि.प.</span>
              <span className="text-xs leading-none mt-0.5">ZP</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-none">
                ZP Hingone BK
              </span>
              <span className="text-[11px] text-white/80 font-medium mt-1 leading-none">
                {tBilingual('कर्मचारी पोर्टल', 'Staff Portal')}
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white lg:hidden hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Staff Role Badge Header */}
        <div className="px-4 py-2.5 bg-[#103D27] text-white/90 text-xs flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-saffron-orange" />
            <span className="text-[11px] font-semibold">
              {isPrincipal ? tBilingual('मुख्याध्यापक', 'Principal') : tBilingual('वर्गशिक्षक', 'Teacher')}
            </span>
          </div>
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase',
              isPrincipal
                ? 'bg-saffron-orange text-white'
                : 'bg-primary-green text-white border border-white/20'
            )}
          >
            {user?.role || 'Staff'}
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative',
                    isActive
                      ? 'bg-primary-green text-white font-semibold shadow-inner border-l-4 border-saffron-orange'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-saffron-orange' : 'text-white/70 group-hover:text-white'
                      )}
                    />
                    <div className="flex flex-col text-left">
                      <span className="leading-tight text-xs font-semibold">
                        {tBilingual(item.marathi, item.label)}
                      </span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Actions */}
        <div className="p-3 border-t border-white/10 bg-[#103D27] shrink-0">
          {/* Public Portal link */}
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-1.5 mb-2 text-xs text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <ExternalLink className="w-3.5 h-3.5 text-saffron-orange" /> {tBilingual('सार्वजनिक संकेतस्थळ', 'Public Website')}
            </span>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/70">Live</span>
          </Link>

          {/* User Profile */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={cn(
                  'w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow',
                  isPrincipal ? 'bg-saffron-orange' : 'bg-primary-green border border-white/30'
                )}
              >
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.name || 'Staff User'}
                </span>
                <span className="text-[10px] text-white/60 truncate">
                  {user?.designation || user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="सुरक्षित लॉगआउट (Logout)"
              className="p-1.5 rounded-lg text-white/70 hover:text-red-300 hover:bg-white/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
