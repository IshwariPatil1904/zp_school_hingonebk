import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import { Notice } from '../../types';
import { Bell, Search, Calendar, FileText, Download, Filter, Tag, Loader2 } from 'lucide-react';

export const NoticesPage: React.FC = () => {
  const { t, tBilingual, formatDate } = useLanguage();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [category, setCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (category !== 'ALL') params.category = category;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/public/notices', { params });
      if (res.data?.success) setNotices(res.data.data);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotices();
  };

  const categories = [
    { labelMr: 'सर्व सूचना', labelEn: 'All Notices', value: 'ALL' },
    { labelMr: 'शैक्षणिक', labelEn: 'Academic', value: 'ACADEMIC' },
    { labelMr: 'उपक्रम व कार्यक्रम', labelEn: 'Events', value: 'EVENT' },
    { labelMr: 'सर्वसाधारण', labelEn: 'General', value: 'GENERAL' },
    { labelMr: 'सुट्ट्या व सण', labelEn: 'Holidays', value: 'HOLIDAY' },
  ];

  return (
    <div className="py-10 bg-white dark:bg-dark-bg text-main-text dark:text-dark-text transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {/* Banner */}
        <div className="border-b border-border-green dark:border-dark-border pb-6">
          <Badge variant="green" size="md">
            {tBilingual('शालेय परिपत्रके व सूचना', 'Notices & Circulars')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main-text dark:text-dark-text mt-2">
            {tBilingual('अधिकृत सूचना फलक', 'Official Notice Board')}
          </h1>
          <p className="text-sm text-muted-text dark:text-dark-muted mt-1">
            {tBilingual(
              'प्रवेश प्रक्रिया, परीक्षा, सुट्ट्या, क्रीडा व शासकीय योजनांविषयी अधिकृत परिपत्रके',
              'Official announcements regarding admissions, examinations, vacations, sports, and government schemes'
            )}
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-light-green dark:bg-dark-secondary border border-border-green dark:border-dark-border">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-text dark:text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tBilingual('सूचनेचे शीर्षक किंवा विषय शोधा...', 'Search notice title or topic...')}
              className="w-full text-xs pl-9 pr-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
            />
          </form>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  category === c.value
                    ? 'bg-primary-green text-white shadow'
                    : 'bg-white dark:bg-dark-card text-main-text dark:text-dark-text hover:bg-light-green-hover dark:hover:bg-[#374151] border border-border-green dark:border-dark-border'
                }`}
              >
                {tBilingual(c.labelMr, c.labelEn)}
              </button>
            ))}
          </div>
        </div>

        {/* Notices Cards List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-green dark:text-emerald-400 animate-spin" />
              <span className="text-xs text-muted-text dark:text-dark-muted">
                {tBilingual('सूचना लोड होत आहेत...', 'Loading circulars and announcements...')}
              </span>
            </div>
          ) : notices.length > 0 ? (
            notices.map((n) => (
              <Card
                key={n._id}
                className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card hover:bg-light-green/20 dark:hover:bg-dark-secondary/50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {n.isImportant && (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase shadow-sm">
                        {tBilingual('महत्त्वाचे', 'Important')}
                      </span>
                    )}
                    <span className="text-[10px] font-bold bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 px-2.5 py-0.5 rounded uppercase">
                      {n.category}
                    </span>
                  </div>

                  <span className="text-xs text-muted-text dark:text-dark-muted font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-saffron-orange" />
                    {formatDate(n.date)}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-main-text dark:text-dark-text leading-snug">
                    {n.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-main-text/80 dark:text-dark-muted leading-relaxed mt-2 whitespace-pre-line">
                    {n.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-border-green dark:border-dark-border flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-muted-text dark:text-dark-muted font-medium">
                    {tBilingual('प्रसिद्धी:', 'Published by:')}{' '}
                    <strong className="text-main-text dark:text-dark-text">{n.publishedBy}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary-green dark:text-emerald-400 font-semibold bg-light-green dark:bg-dark-secondary px-2.5 py-1 rounded border border-border-green dark:border-dark-border">
                      <FileText className="w-3.5 h-3.5" />
                      {tBilingual('अधिकृत परिपत्रक', 'Official Circular')}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 border border-border-green dark:border-dark-border rounded-xl bg-light-green/20 dark:bg-dark-secondary/30 space-y-2">
              <Bell className="w-8 h-8 text-muted-text dark:text-dark-muted mx-auto" />
              <p className="text-xs font-semibold text-main-text dark:text-dark-text">
                {tBilingual(
                  'निवडलेल्या निकषांसाठी कोणतीही सूचना उपलब्ध नाही.',
                  'No circulars found matching the selected criteria.'
                )}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCategory('ALL');
                  setSearch('');
                }}
              >
                {tBilingual('सर्व सूचना पुन्हा पहा', 'Reset & View All')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
