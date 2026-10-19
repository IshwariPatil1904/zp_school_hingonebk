import React, { useState, useRef, useEffect } from 'react';
import { Globe, Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';
import { useLanguage, LanguageMode, LANGUAGE_OPTIONS } from '../../i18n/LanguageContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

interface LanguageThemeSelectorProps {
  variant?: 'public' | 'dashboard';
  compact?: boolean;
}

export const LanguageThemeSelector: React.FC<LanguageThemeSelectorProps> = ({
  variant = 'public',
  compact = false,
}) => {
  const { language, setLanguage } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangLabel =
    LANGUAGE_OPTIONS.find((opt) => opt.id === language)?.label || 'English';

  const themeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: language === 'mr' ? 'प्रकाशित' : language === 'en' ? 'Light' : 'प्रकाशित (Light)', icon: Sun },
    { id: 'dark', label: language === 'mr' ? 'गडद' : language === 'en' ? 'Dark' : 'गडद (Dark)', icon: Moon },
    { id: 'system', label: language === 'mr' ? 'प्रणालीनुसार' : language === 'en' ? 'System' : 'प्रणालीनुसार (System)', icon: Monitor },
  ];

  const CurrentThemeIcon =
    theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  // Visual variants
  const isPublic = variant === 'public';

  const buttonBaseClass = isPublic
    ? 'bg-black/20 hover:bg-black/35 text-white border-white/20'
    : 'bg-white dark:bg-[#1F2937] text-main-text dark:text-dark-text border-border-green dark:border-dark-border hover:bg-light-green dark:hover:bg-[#374151]';

  const menuBaseClass = isPublic
    ? 'bg-[#14532D] text-white border border-[#176638] shadow-2xl'
    : 'bg-white dark:bg-[#1F2937] text-main-text dark:text-dark-text border border-border-green dark:border-dark-border shadow-xl';

  const menuItemHoverClass = isPublic
    ? 'hover:bg-white/10 text-white'
    : 'hover:bg-light-green dark:hover:bg-[#374151] text-main-text dark:text-dark-text';

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* 1. Language Selector Dropdown */}
      <div className="relative" ref={langRef}>
        <button
          type="button"
          onClick={() => {
            setLangMenuOpen(!langMenuOpen);
            setThemeMenuOpen(false);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-saffron-orange shadow-sm',
            buttonBaseClass
          )}
          title={language === 'mr' ? 'भाषा निवडा' : language === 'en' ? 'Select Language' : 'भाषा निवडा (Select Language)'}
          aria-haspopup="true"
          aria-expanded={langMenuOpen}
        >
          <Globe className="w-3.5 h-3.5 text-saffron-orange shrink-0" />
          <span className={cn('tracking-tight whitespace-nowrap', compact && 'hidden md:inline')}>
            {currentLangLabel}
          </span>
          <ChevronDown
            className={cn(
              'w-3 h-3 opacity-75 transition-transform duration-200',
              langMenuOpen && 'rotate-180'
            )}
          />
        </button>

        {langMenuOpen && (
          <div
            className={cn(
              'absolute right-0 mt-1.5 w-48 rounded-xl py-1 z-50 animate-in fade-in zoom-in-95',
              menuBaseClass
            )}
            role="menu"
          >
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-saffron-orange border-b border-white/10 dark:border-white/10">
              {language === 'mr' ? 'भाषा' : language === 'en' ? 'Language' : 'भाषा (Language)'}
            </div>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = language === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setLanguage(opt.id);
                    setLangMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors',
                    menuItemHoverClass,
                    isSelected && 'font-bold bg-saffron-orange/15 text-saffron-orange'
                  )}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-saffron-orange opacity-80" />
                    {opt.name}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-saffron-orange" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Theme Selector Dropdown */}
      <div className="relative" ref={themeRef}>
        <button
          type="button"
          onClick={() => {
            setThemeMenuOpen(!themeMenuOpen);
            setLangMenuOpen(false);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-saffron-orange shadow-sm',
            buttonBaseClass
          )}
          title={language === 'mr' ? 'थीम निवडा' : language === 'en' ? 'Select Theme' : 'थीम निवडा (Select Theme)'}
          aria-haspopup="true"
          aria-expanded={themeMenuOpen}
        >
          <CurrentThemeIcon className="w-3.5 h-3.5 text-saffron-orange shrink-0" />
          <span className={cn('tracking-tight whitespace-nowrap', compact && 'hidden md:inline')}>
            {themeOptions.find((o) => o.id === theme)?.label || 'Theme'}
          </span>
          <ChevronDown
            className={cn(
              'w-3 h-3 opacity-75 transition-transform duration-200',
              themeMenuOpen && 'rotate-180'
            )}
          />
        </button>

        {themeMenuOpen && (
          <div
            className={cn(
              'absolute right-0 mt-1.5 w-44 rounded-xl py-1 z-50 animate-in fade-in zoom-in-95',
              menuBaseClass
            )}
            role="menu"
          >
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-saffron-orange border-b border-white/10 dark:border-white/10">
              {language === 'mr' ? 'थीम' : language === 'en' ? 'Theme' : 'थीम (Theme)'}
            </div>
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setThemeMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors',
                    menuItemHoverClass,
                    isSelected && 'font-bold bg-saffron-orange/15 text-saffron-orange'
                  )}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-saffron-orange" />
                    {opt.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-saffron-orange" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
