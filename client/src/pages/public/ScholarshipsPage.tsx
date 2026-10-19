import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import { ScholarshipScheme } from '../../types';
import {
  Award,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const ScholarshipsPage: React.FC = () => {
  const { tBilingual, language } = useLanguage();
  const [scholarships, setScholarships] = useState<ScholarshipScheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/public/scholarships')
      .then((res) => {
        if (res.data?.success) setScholarships(res.data.data);
      })
      .catch((err) => console.error('Failed to load scholarships:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-10 bg-white dark:bg-dark-bg text-main-text dark:text-dark-text transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        {/* Banner */}
        <div className="border-b border-border-green dark:border-dark-border pb-6">
          <Badge variant="green" size="md">
            {tBilingual('शासकीय शिष्यवृत्ती योजना', 'Government Scholarship Schemes')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main-text dark:text-dark-text mt-2">
            {tBilingual('विद्यार्थी कल्याण व शिष्यवृत्ती सहाय्य', 'Student Welfare & Scholarship Benefits')}
          </h1>
          <p className="text-sm text-muted-text dark:text-dark-muted mt-1">
            {tBilingual(
              'महाराष्ट्र शासन, समाज कल्याण व आदिवासी विकास विभागामार्फत प्राथमिक शाळेतील विद्यार्थ्यांना उपलब्ध सर्व अधिकृत योजना',
              'Official financial assistance schemes administered by Government of Maharashtra Social Welfare & Tribal Development Departments'
            )}
          </p>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green dark:text-emerald-400 animate-spin" />
            <span className="text-xs text-muted-text dark:text-dark-muted">
              {tBilingual('शिष्यवृत्ती योजना लोड होत आहेत...', 'Loading scholarship schemes...')}
            </span>
          </div>
        ) : (
          /* Scholarships List */
          <div className="space-y-8">
            {scholarships.map((sch) => (
              <Card
                key={sch._id}
                className="border border-border-green dark:border-dark-border p-6 sm:p-8 space-y-6 bg-white dark:bg-dark-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-saffron-orange text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                        {sch.code}
                      </span>
                      <span className="text-xs font-semibold text-primary-green dark:text-emerald-400">
                        {tBilingual('शासकीय योजना', 'Government Scheme')}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-main-text dark:text-dark-text">
                      {language === 'mr'
                        ? sch.marathiName || sch.schemeName
                        : language === 'en'
                        ? sch.schemeName || sch.marathiName
                        : `${sch.marathiName || sch.schemeName} (${sch.schemeName || sch.marathiName})`}
                    </h2>
                    <p className="text-xs text-muted-text dark:text-dark-muted">
                      {tBilingual('अधिकृत योजना कोड:', 'Scheme Code:')} {sch.code}
                    </p>
                  </div>

                  <div className="text-left sm:text-right bg-light-green dark:bg-dark-secondary p-3 rounded-xl border border-border-green dark:border-dark-border shrink-0">
                    <span className="text-[11px] text-muted-text dark:text-dark-muted block">
                      {tBilingual('लाभाचे स्वरूप', 'Annual Benefit')}
                    </span>
                    <span className="text-base font-extrabold text-primary-green dark:text-emerald-400 block mt-0.5">
                      {sch.benefitAmount}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* 1. Target and Grades */}
                  <div className="p-4 rounded-xl bg-white dark:bg-dark-bg border border-border-green dark:border-dark-border space-y-2">
                    <h3 className="text-xs font-bold text-main-text dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                      {tBilingual('पात्र प्रवर्ग व इयत्ता', 'Target Category & Classes')}
                    </h3>
                    <div className="text-xs text-main-text dark:text-dark-text space-y-1">
                      <p>
                        <strong>{tBilingual('पात्र इयत्ता:', 'Eligible Classes:')}</strong> {sch.applicableGrades}
                      </p>
                      <p>
                        <strong>{tBilingual('लाभार्थी गट:', 'Target Group:')}</strong> {sch.beneficiaryGroup}
                      </p>
                    </div>
                  </div>

                  {/* 2. Eligibility Criteria */}
                  <div className="p-4 rounded-xl bg-white dark:bg-dark-bg border border-border-green dark:border-dark-border space-y-2">
                    <h3 className="text-xs font-bold text-main-text dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                      {tBilingual('पात्रता निकष', 'Eligibility Criteria')}
                    </h3>
                    <ul className="text-xs text-main-text/85 dark:text-dark-muted space-y-1">
                      {sch.eligibilityCriteria.map((crit, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-primary-green dark:text-emerald-400 font-bold">•</span>
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 3. Required Documents */}
                  <div className="p-4 rounded-xl bg-white dark:bg-dark-bg border border-border-green dark:border-dark-border space-y-2">
                    <h3 className="text-xs font-bold text-main-text dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-saffron-orange" />
                      {tBilingual('आवश्यक कागदपत्रे', 'Required Documents')}
                    </h3>
                    <ul className="text-xs text-main-text/85 dark:text-dark-muted space-y-1">
                      {sch.requiredDocuments.map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-saffron-orange font-bold">✓</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Application steps note */}
                <div className="p-4 rounded-xl bg-[#E2EFE7]/40 dark:bg-dark-secondary border border-primary-green/20 dark:border-emerald-500/30 text-xs text-main-text dark:text-dark-text space-y-1">
                  <span className="font-bold text-primary-green dark:text-emerald-400 block">
                    {tBilingual('अर्ज कसा करावा', 'How to Apply')}:
                  </span>
                  <p className="text-muted-text dark:text-dark-muted">{sch.applicationSteps}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* General Guidelines & MahaDBT Link */}
        <div className="bg-light-green dark:bg-dark-secondary p-6 sm:p-8 rounded-2xl border border-border-green dark:border-dark-border space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary-green dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-main-text dark:text-dark-text">
              {tBilingual('पालकांसाठी महत्त्वाची सूचना', 'Important Notice for Parents')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-text dark:text-dark-muted leading-relaxed">
            {tBilingual(
              'शाळेत शिकत असलेल्या सर्व पात्र विद्यार्थ्यांचे शिष्यवृत्ती अर्ज शाळा स्तरावर मुख्याध्यापक व वर्गशिक्षकांमार्फत भरून प्रमाणित केले जातात. पालकांनी केवळ बँक खाते पासबुक, आधार कार्ड आणि उत्पन्नाचा दाखला शाळेत जमा करणे आवश्यक आहे. शिष्यवृत्तीची रक्कम थेट विद्यार्थ्यांच्या किंवा पालकांच्या आधार संलग्न (DBT) बँक खात्यात जमा होते.',
              'Scholarship applications for all eligible enrolled students are submitted and verified directly at the school level by the Headmaster and Class Teachers. Parents only need to provide Aadhaar card, bank passbook, and income certificate. Benefits are credited directly to Aadhaar-seeded accounts via DBT.'
            )}
          </p>
          <div className="pt-1">
            <a
              href="https://mahadbt.maharashtra.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-green dark:text-saffron-orange hover:underline"
            >
              {tBilingual(
                'महाराष्ट्र शासन महाडीबीटी (MahaDBT) अधिकृत पोर्टल भेट द्या ↗',
                'Visit Maharashtra State MahaDBT Official Portal ↗'
              )}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
