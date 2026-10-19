import React from 'react';
import { Menu, Bell, Search, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageThemeSelector } from '../common/LanguageThemeSelector';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick, title, subtitle }) => {
  const { user, logout } = useAuth();
  const { t, tBilingual } = useLanguage();

  return (
    <header className="h-16 bg-white dark:bg-[#1F2937] border-b border-border-green dark:border-[#374151] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-200">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-main-text dark:text-dark-text hover:bg-light-green dark:hover:bg-[#374151] rounded-lg lg:hidden focus:outline-none shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-primary-green dark:text-saffron-orange" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-main-text dark:text-dark-text leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-text dark:text-dark-muted hidden sm:block truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Actions: Search + Language/Theme Selector + DB Badge + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search bar */}
        <div className="relative hidden xl:block">
          <Search className="w-4 h-4 text-muted-text dark:text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('common.search_placeholder')}
            className="w-52 pl-9 pr-3 py-1.5 text-xs bg-light-green/60 dark:bg-[#111827] border border-border-green dark:border-[#374151] rounded-lg text-main-text dark:text-dark-text placeholder-muted-text dark:placeholder-dark-muted focus:bg-white dark:focus:bg-[#1F2937] focus:outline-none focus:ring-1 focus:ring-primary-green"
          />
        </div>

        {/* Language & Theme Controls */}
        <LanguageThemeSelector variant="dashboard" compact />

        {/* Database Connected Badge */}
        <div className="hidden md:inline-flex items-center gap-1.5 bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-primary-green/20 dark:border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary-green dark:text-emerald-400" />
          <span>{tBilingual('डेटाबेस जोडला', 'DB Online')}</span>
        </div>

        {/* Notification bell */}
        <button
          className="p-2 text-main-text dark:text-dark-text hover:bg-light-green dark:hover:bg-[#374151] rounded-lg relative text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-white transition-colors"
          title={tBilingual('सूचना', 'Notifications')}
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-saffron-orange rounded-full absolute top-2 right-2 ring-2 ring-white dark:ring-[#1F2937]" />
        </button>

        {/* User preview */}
        <div className="flex items-center gap-2 pl-2 border-l border-border-green dark:border-[#374151]">
          <div className="w-8 h-8 rounded-full bg-primary-green text-white font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden 2xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-main-text dark:text-dark-text leading-tight">{user?.name}</span>
            <span className="text-[10px] text-muted-text dark:text-dark-muted uppercase font-medium">{user?.role}</span>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 text-muted-text dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
            title={t('nav.logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
