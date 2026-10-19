import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CalendarCheck, Save, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const AttendancePage: React.FC = () => {
  const { tBilingual } = useLanguage();
  const [selectedClass, setSelectedClass] = useState('इयत्ता १ ली');
  const [saved, setSaved] = useState(false);

  const sampleStudents = [
    { roll: 1, gr: '1421', name: 'पाटील वेदांत सचिन', present: true },
    { roll: 2, gr: '1422', name: 'शिंदे समृद्धी राहुल', present: true },
    { roll: 3, gr: '1423', name: 'चौधरी मयंक अनिल', present: false },
    { roll: 4, gr: '1424', name: 'बोरसे वैष्णवी विजय', present: true },
    { roll: 5, gr: '1425', name: 'पाटील आर्यन ज्ञानेश्वर', present: true },
  ];

  const classList = [
    { mr: 'इयत्ता १ ली', en: 'Class 1' },
    { mr: 'इयत्ता २ री', en: 'Class 2' },
    { mr: 'इयत्ता ३ री', en: 'Class 3' },
    { mr: 'इयत्ता ४ थी', en: 'Class 4' },
    { mr: 'इयत्ता ५ वी', en: 'Class 5' },
    { mr: 'इयत्ता ६ वी', en: 'Class 6' },
    { mr: 'इयत्ता ७ वी', en: 'Class 7' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-main-text dark:text-dark-text">
            {tBilingual('दैनंदिन विद्यार्थी हजेरी नोंदवही', 'Daily Student Attendance Register')}
          </h2>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual('दिनांक:', 'Date:')} {new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setSaved(true)}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {tBilingual('हजेरी सेव्ह करा', 'Save Attendance')}
        </Button>
      </div>

      {saved && (
        <div className="p-3 bg-[#E2EFE7] dark:bg-emerald-950/40 border border-primary-green/30 dark:border-emerald-600/40 text-primary-green dark:text-emerald-400 text-xs rounded-xl flex items-center justify-between">
          <span className="font-semibold">
            {tBilingual('हजेरी यशस्वीरीत्या सेव्ह केली गेली आहे!', 'Attendance has been saved successfully!')}
          </span>
          <button onClick={() => setSaved(false)} className="text-[11px] underline">
            {tBilingual('बंद करा', 'Close')}
          </button>
        </div>
      )}

      {/* Class selector */}
      <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-main-text dark:text-dark-text">
          {tBilingual('वर्ग निवडा:', 'Select Class:')}
        </span>
        {classList.map((c) => (
          <button
            key={c.mr}
            onClick={() => setSelectedClass(c.mr)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedClass === c.mr
                ? 'bg-primary-green text-white shadow'
                : 'bg-light-green dark:bg-dark-secondary text-main-text dark:text-dark-text hover:bg-light-green-hover dark:hover:bg-[#25382D] border border-border-green dark:border-dark-border'
            }`}
          >
            {tBilingual(c.mr, c.en)}
          </button>
        ))}
      </Card>

      {/* Attendance Table */}
      <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card p-0 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-green dark:border-dark-border bg-light-green dark:bg-dark-secondary text-main-text dark:text-dark-text font-bold">
              <th className="py-3 px-4">{tBilingual('हजेरी क्र.', 'Roll No.')}</th>
              <th className="py-3 px-4">{tBilingual('जनरल रजिस्टर क्र.', 'G.R. No.')}</th>
              <th className="py-3 px-4">{tBilingual('विद्यार्थ्याचे नाव', 'Student Name')}</th>
              <th className="py-3 px-4 text-center">{tBilingual('उपस्थिती स्थिती', 'Attendance Status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-green dark:divide-dark-border">
            {sampleStudents.map((st) => (
              <tr key={st.roll} className="hover:bg-light-green/30 dark:hover:bg-dark-secondary/40 transition-colors">
                <td className="py-3 px-4 font-bold text-main-text dark:text-dark-text">{st.roll}</td>
                <td className="py-3 px-4 font-mono text-muted-text dark:text-dark-muted">{st.gr}</td>
                <td className="py-3 px-4 font-medium text-main-text dark:text-dark-text">{st.name}</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      st.present
                        ? 'bg-[#E2EFE7] dark:bg-emerald-950/50 text-primary-green dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {st.present ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {st.present ? tBilingual('हजर', 'Present') : tBilingual('गैरहजर', 'Absent')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
