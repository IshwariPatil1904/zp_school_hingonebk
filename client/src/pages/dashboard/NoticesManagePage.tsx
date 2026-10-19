import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Bell, Plus, Calendar } from 'lucide-react';
import { api } from '../../lib/api';
import { Notice } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

export const NoticesManagePage: React.FC = () => {
  const { tBilingual } = useLanguage();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    api.get('/public/notices').then((res) => {
      if (res.data?.success) setNotices(res.data.data);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-main-text dark:text-dark-text">
            {tBilingual('सूचना फलक व्यवस्थापन', 'School Notice Board Management')}
          </h2>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual('सर्व पालक, शिक्षक व विद्यार्थ्यांसाठी परिपत्रके', 'Official circulars and announcements for parents, staff, and students')}
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          {tBilingual('नवीन सूचना जोडा', 'Publish New Notice')}
        </Button>
      </div>

      <div className="space-y-3">
        {notices.map((n) => (
          <Card
            key={n._id}
            className="border border-border-green dark:border-dark-border dark:bg-dark-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-[#E2EFE7] dark:bg-emerald-950/50 text-primary-green dark:text-emerald-400 px-2 py-0.5 rounded">
                  {n.category}
                </span>
                <span className="text-xs text-muted-text dark:text-dark-muted font-mono">
                  {new Date(n.date).toLocaleDateString('mr-IN')}
                </span>
              </div>
              <h3 className="font-bold text-sm text-main-text dark:text-dark-text">{n.title}</h3>
              <p className="text-xs text-muted-text dark:text-dark-muted max-w-3xl">{n.content}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs bg-light-green dark:bg-dark-secondary text-main-text dark:text-dark-text px-2.5 py-1 rounded border border-border-green dark:border-dark-border">
                {n.publishedBy}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
