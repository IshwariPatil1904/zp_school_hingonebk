import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import { PublicTeacher } from '../../types';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const TeachersPage: React.FC = () => {
  const { tBilingual, localizeTeacher } = useLanguage();
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/public/teachers')
      .then((res) => {
        if (res.data?.success) setTeachers(res.data.data);
      })
      .catch((err) => console.error('Failed to load teachers:', err))
      .finally(() => setLoading(false));
  }, []);

  const uniqueTeachers = useMemo(() => {
    const seen = new Set<string>();
    return teachers
      .filter((t) => {
        const key = t.name?.trim().toLowerCase();
        if (!key || seen.has(key) || /audit/i.test(key)) return false;
        seen.add(key);
        return true;
      })
      .map((t) => localizeTeacher(t));
  }, [teachers, localizeTeacher]);

  return (
    <div className="py-10 bg-white dark:bg-dark-bg text-main-text dark:text-dark-text transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        {/* Banner */}
        <div className="border-b border-border-green dark:border-dark-border pb-6">
          <Badge variant="green" size="md">
            {tBilingual('आमचे शिक्षक वृंद', 'Our Dedicated Teachers')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main-text dark:text-dark-text mt-2">
            {tBilingual('प्रशिक्षित, अनुभवी व समर्पित शिक्षक', 'Qualified, Experienced & Dedicated Educators')}
          </h1>
          <p className="text-sm text-muted-text dark:text-dark-muted mt-1">
            {tBilingual(
              'महाराष्ट्र शासन मान्यताप्राप्त, उच्च पदवीधर शिक्षक - ग्रामीण बालकांच्या प्रगतीसाठी अविरत कार्यरत',
              'Government approved elementary educators committed to nurturing rural youth with care'
            )}
          </p>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green dark:text-emerald-400 animate-spin" />
            <span className="text-xs text-muted-text dark:text-dark-muted">
              {tBilingual('शिक्षक यादी लोड होत आहे...', 'Loading teaching faculty roster...')}
            </span>
          </div>
        ) : (
          /* Teachers Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueTeachers.map((teach) => (
              <Card
                key={teach._id}
                className="border border-border-green dark:border-dark-border p-6 space-y-4 bg-white dark:bg-dark-card hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-light-green dark:bg-[#18251F] border-2 border-primary-green dark:border-emerald-500/40 flex items-center justify-center text-primary-green dark:text-emerald-400 font-bold text-xl shrink-0 shadow">
                      {teach.avatar ? (
                        <img src={teach.avatar} alt={teach.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <span>{teach.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-main-text dark:text-dark-text">{teach.name}</h3>
                      <p className="text-xs text-primary-green dark:text-emerald-400 font-semibold mt-0.5">{teach.designation}</p>
                      <span className="inline-block mt-1 bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                        {teach.role === 'principal'
                          ? tBilingual('मुख्याध्यापक', 'Headmaster')
                          : tBilingual('प्राथमिक शिक्षक', 'Primary Teacher')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs pt-3 border-t border-border-green dark:border-dark-border">
                    <div>
                      <span className="text-muted-text dark:text-dark-muted font-semibold block">
                        {tBilingual('शैक्षणिक पात्रता:', 'Qualification:')}
                      </span>
                      <span className="text-main-text dark:text-dark-text font-medium">{teach.qualification}</span>
                    </div>

                    <div>
                      <span className="text-muted-text dark:text-dark-muted font-semibold block">
                        {tBilingual('सेवा अनुभव:', 'Experience:')}
                      </span>
                      <span className="text-main-text dark:text-dark-text font-medium">
                        {teach.experienceYears} {tBilingual('वर्षे शैक्षणिक सेवा', 'Years of Educational Service')}
                      </span>
                    </div>

                    {teach.assignedClasses && teach.assignedClasses.length > 0 && (
                      <div>
                        <span className="text-muted-text dark:text-dark-muted font-semibold block mb-1">
                          {tBilingual('जबाबदारी वर्ग:', 'Assigned Classes:')}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {teach.assignedClasses.map((cls: string, idx: number) => (
                            <span
                              key={idx}
                              className="bg-light-green dark:bg-dark-secondary text-primary-green dark:text-emerald-400 px-2 py-0.5 rounded text-[11px] font-semibold border border-border-green dark:border-dark-border"
                            >
                              {cls}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {teach.subjectSpecialization && teach.subjectSpecialization.length > 0 && (
                      <div>
                        <span className="text-muted-text dark:text-dark-muted font-semibold block mb-1">
                          {tBilingual('विषय मार्गदर्शन:', 'Subject Specialization:')}
                        </span>
                        <span className="text-main-text dark:text-dark-text font-medium">
                          {teach.subjectSpecialization.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border-green dark:border-dark-border flex items-center gap-1.5 text-[11px] text-primary-green dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-primary-green dark:text-emerald-400 shrink-0" />
                  <span>{tBilingual('शासकीय मान्यताप्राप्त शिक्षक', 'Government Approved Educator')}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
