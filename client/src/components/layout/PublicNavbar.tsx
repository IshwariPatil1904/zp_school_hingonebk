import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Lock,
  User as UserIcon,
  Phone,
  Mail,
  Award,
  Landmark,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageThemeSelector } from '../common/LanguageThemeSelector';
import { cn } from '../../lib/utils';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { t, tBilingual } = useLanguage();

  const navLinks = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.about'), path: '/about' },
    { label: t('nav.academics'), path: '/academics' },
    { label: t('nav.teachers'), path: '/teachers' },
    { label: t('nav.notices'), path: '/notices' },
    { label: t('nav.gallery'), path: '/gallery' },
    { label: t('nav.scholarships'), path: '/scholarships' },
    { label: t('nav.admissions'), path: '/admissions' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top Govt Administrative Strip */}
      <div className="bg-[#103D27] text-white/90 text-xs py-1.5 px-4 sm:px-8 border-b border-[#176638]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <Landmark className="w-3.5 h-3.5 text-saffron-orange" />
              {tBilingual('महाराष्ट्र शासन • शालेय शिक्षण व क्रीडा विभाग', 'Govt of Maharashtra • School Education Dept')}
            </span>
            <span className="hidden md:inline-block text-white/40">|</span>
            <span className="hidden md:inline-flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-saffron-orange" />
              {tBilingual('जिल्हा परिषद, जळगाव', 'Zilla Parishad, Jalgaon')}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-white/85">
            <span className="hidden lg:inline-flex items-center gap-1">
              <Phone className="w-3 h-3 text-saffron-orange" /> +91 98234 56789
            </span>
            <span className="bg-saffron-orange/20 text-saffron-orange px-2 py-0.5 rounded font-mono font-bold">
              UDISE: 27030804501
            </span>

            {/* Language & Theme Controls in Header */}
            <div className="pl-1">
              <LanguageThemeSelector variant="public" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Dark-Green Header (#176638) */}
      <div className="bg-primary-green text-white px-4 sm:px-8 py-3 transition-all duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & School Name */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none shrink-0">
            {/* Orange ZP Logo Badge (#FFA500) */}
            <div className="w-12 h-12 rounded-xl bg-saffron-orange flex flex-col items-center justify-center text-white font-extrabold shadow-md shrink-0 border-2 border-white/30 group-hover:scale-105 transition-transform">
              <span className="text-[10px] tracking-tighter leading-none text-white/95 uppercase font-semibold">जि. प.</span>
              <span className="text-sm font-black tracking-tight leading-none mt-0.5">ZP</span>
            </div>

            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white leading-tight">
                {tBilingual('जि. प. प्राथमिक शाळा, हिंगोणे बु.', 'Zilla Parishad Primary School, Hingone BK')}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 font-medium tracking-wide">
                {tBilingual('जि. प. प्राथमिक शाळा, हिंगोणे बु. • ता. धरणगाव, जि. जळगाव', 'Z.P. Primary School, Hingone BK • Tal. Dharangaon, Dist. Jalgaon')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'relative px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 rounded-md',
                    active
                      ? 'text-saffron-orange font-bold bg-black/15 shadow-inner'
                      : 'text-white hover:text-saffron-orange hover:bg-white/10'
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-saffron-orange rounded-full animate-in fade-in" />
                  )}
                </Link>
              );
            })}

            {/* Staff Portal CTA */}
            <div className="ml-2 pl-2 border-l border-white/20">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 bg-saffron-orange hover:bg-saffron-hover text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all duration-150"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  {t('nav.portal')}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 bg-saffron-orange hover:bg-saffron-hover text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all duration-150"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 xl:hidden">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-saffron-orange text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
              >
                <UserIcon className="w-3.5 h-3.5" />
                {t('nav.portal')}
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-saffron-orange text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                {t('nav.login')}
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white hover:bg-white/10 rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-dark-green text-white px-4 py-3 border-t border-white/10 space-y-1 shadow-2xl">
          <div className="pb-3 mb-2 border-b border-white/15 flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">Language & Theme:</span>
            <LanguageThemeSelector variant="public" />
          </div>
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-md text-xs font-medium transition-colors',
                  active
                    ? 'bg-saffron-orange text-white font-bold'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
