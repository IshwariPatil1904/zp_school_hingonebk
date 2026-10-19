import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  ExternalLink,
  Download,
  Languages,
  Sparkles,
} from 'lucide-react';

export const AcademicsPage: React.FC = () => {
  const { tBilingual } = useLanguage();

  const defaultTextbooks = [
    { grade: 'इयत्ता १ ली', gradeEn: 'Class 1', subjectsMr: 'बालभारती मराठी, इंग्रजी, गणित, खेळू करू शिकू', subjectsEn: 'Marathi Balbharati, English, Mathematics, Art & Craft', url: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx' },
    { grade: 'इयत्ता २ री', gradeEn: 'Class 2', subjectsMr: 'बालभारती मराठी, इंग्रजी, गणित, खेळू करू शिकू', subjectsEn: 'Marathi Balbharati, English, Mathematics, Art & Craft', url: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx' },
    { grade: 'इयत्ता ३ री', gradeEn: 'Class 3', subjectsMr: 'बालभारती मराठी, इंग्रजी, गणित, परिसर अभ्यास भाग १ व २', subjectsEn: 'Marathi Balbharati, English, Mathematics, EVS Parts 1 & 2', url: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx' },
    { grade: 'इयत्ता ४ थी', gradeEn: 'Class 4', subjectsMr: 'बालभारती मराठी, इंग्रजी, गणित, परिसर अभ्यास (शिवछत्रपती इतिहास)', subjectsEn: 'Marathi Balbharati, English, Mathematics, EVS (Shivaji Maharaj History)', url: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx' },
    { grade: 'इयत्ता ५ वी', gradeEn: 'Class 5', subjectsMr: 'सुगमभारती हिंदी, मराठी, इंग्रजी, गणित, परिसर अभ्यास भाग १ व २', subjectsEn: 'Hindi Sugambharati, Marathi, English, Math, EVS 1 & 2', url: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx' },
    { grade: 'इयत्ता ६ वी', gradeEn: 'Class 6', subjectsMr: 'मराठी, हिंदी, इंग्रजी, सामान्य विज्ञान, गणित, इतिहास व नागरिकशास्त्र, भूगोल', subjectsEn: 'Marathi, Hindi, English, General Science, Math, History, Geography', url: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx' },
    { grade: 'इयत्ता ७ वी', gradeEn: 'Class 7', subjectsMr: 'मराठी, हिंदी, इंग्रजी, सामान्य विज्ञान, गणित, इतिहास व नागरिकशास्त्र, भूगोल', subjectsEn: 'Marathi, Hindi, English, General Science, Math, History, Geography', url: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx' },
  ];

  const [medium, setMedium] = useState('मराठी (सेमी-इंग्रजी सह)');
  const [grades, setGrades] = useState('१ ली ते ७ वी');
  const [textbooks, setTextbooks] = useState(defaultTextbooks);

  useEffect(() => {
    api
      .get('/public/profile')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const d = res.data.data;
          if (d.medium) setMedium(d.medium);
          if (d.grades) setGrades(d.grades);
          if (d.academics?.textbookLinks?.length) {
            const formatted = d.academics.textbookLinks.map((tb: any) => ({
              grade: tb.standard,
              gradeEn: tb.standard,
              subjectsMr: tb.subject,
              subjectsEn: tb.subject,
              url: tb.balbharatiUrl || 'https://cart.ebalbharati.in/BalBooks/ebook.aspx',
            }));
            setTextbooks(formatted);
          }
        }
      })
      .catch((err) => console.error('Failed to load dynamic academics:', err));
  }, []);

  return (
    <div className="py-10 bg-white dark:bg-dark-bg text-main-text dark:text-dark-text transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        {/* Banner */}
        <div className="border-b border-border-green dark:border-dark-border pb-6">
          <Badge variant="green" size="md">
            {tBilingual('शैक्षणिक अभ्यासक्रम', 'Academics & Curricula')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main-text dark:text-dark-text mt-2">
            {tBilingual('पायाभूत शिक्षण, अभ्यासक्रम व पाठ्यपुस्तके', 'Foundational Learning, Curricula & Textbooks')}
          </h1>
          <p className="text-sm text-muted-text dark:text-dark-muted mt-1">
            {tBilingual(
              'महाराष्ट्र राज्य पाठ्यपुस्तक निर्मिती व अभ्यासक्रम संशोधन मंडळ (बालभारती) मान्यताप्राप्त अधिकृत अभ्यासक्रम',
              'Approved curricula regulated by Maharashtra State Bureau of Textbook Production (Balbharati)'
            )}
          </p>
        </div>

        {/* Medium and Standards Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card">
            <div className="w-10 h-10 rounded-lg bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-main-text dark:text-dark-text">
              {tBilingual('माध्यम: मराठी (सेमी-इंग्रजी सह)', 'Medium: Marathi (with Semi-English)')}
            </h3>
            <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
              {tBilingual(
                'विद्यार्थ्यांच्या मातृभाषेतून (मराठी) संकल्पना स्पष्ट करण्यावर भर. सोबतच इयत्ता पहिलीपासून इंग्रजी व उच्च वर्गांसाठी सेमी-इंग्रजी (गणित व विज्ञान) मार्गदर्शन.',
                'Emphasis on mother tongue conceptual clarity, alongside foundational English from Grade 1 and Semi-English (Science and Mathematics) in upper grades.'
              )}
            </p>
          </Card>

          <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card">
            <div className="w-10 h-10 rounded-lg bg-[#FFF5E5] dark:bg-amber-950/40 text-saffron-orange flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-main-text dark:text-dark-text">
              {tBilingual('उपलब्ध इयत्ता: १ ली ते ७ वी', 'Grades Offered: Classes 1 to 7')}
            </h3>
            <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
              {tBilingual(
                'प्राथमिक (इयत्ता १ ली ते ५ वी) आणि उच्च प्राथमिक (इयत्ता ६ वी व ७ वी) सर्वसमावेशक वर्ग. प्रत्येक वर्गासाठी समर्पित शिक्षक व डिजिटल सहाय्य.',
                'Primary (Classes 1 to 5) and Upper Primary (Classes 6 & 7) inclusive education with appointed faculty and digital aids.'
              )}
            </p>
          </Card>

          <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card">
            <div className="w-10 h-10 rounded-lg bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-main-text dark:text-dark-text">
              {tBilingual('निपुण भारत (FLN) गुणवत्ता', 'NIPUN Bharat (FLN) Quality')}
            </h3>
            <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
              {tBilingual(
                'पायाभूत साक्षरता व संख्याज्ञान संपादन. विद्यार्थ्यांच्या वाचन, लेखन व गणितीय कौशल्यांचे नियमित मूल्यमापन व मार्गदर्शन.',
                'Targeted attainment of Foundational Literacy and Numeracy with periodic diagnostic assessments and personalized guidance.'
              )}
            </p>
          </Card>
        </div>

        {/* Verified Official Balbharati Textbooks Links */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Badge variant="orange" size="md">
                {tBilingual('अधिकृत पाठ्यपुस्तके', 'Balbharati Textbooks')}
              </Badge>
              <h2 className="text-2xl font-bold text-main-text dark:text-dark-text mt-1">
                {tBilingual('बालभारती अधिकृत ई-पुस्तके डाऊनलोड', 'Download Official Balbharati E-Books')}
              </h2>
              <p className="text-xs text-muted-text dark:text-dark-muted">
                {tBilingual(
                  'विद्यार्थी व पालकांसाठी महाराष्ट्र शासनाच्या ई-बालभारती पोर्टलवरून सर्व पुस्तके मोफत उपलब्ध आहेत.',
                  'Free textbooks downloadable in PDF directly from the Maharashtra Government e-Balbharati portal.'
                )}
              </p>
            </div>
            <a
              href="https://ebalbharati.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-primary-green hover:bg-dark-green text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition-colors"
            >
              <span>{tBilingual('अधिकृत eBalbharati पोर्टल ↗', 'Official eBalbharati Portal ↗')}</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {textbooks.map((tb, idx) => (
              <Card
                key={idx}
                className="border border-border-green dark:border-dark-border p-4 flex flex-col justify-between space-y-3 bg-white dark:bg-dark-card hover:bg-light-green/30 dark:hover:bg-dark-secondary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-primary-green dark:text-emerald-400">
                      {tBilingual(tb.grade, tb.gradeEn)}
                    </span>
                    <span className="text-[10px] font-bold bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 px-2 py-0.5 rounded">
                      {tBilingual('बालभारती अभ्यासक्रम', 'State Curriculum')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-text dark:text-dark-muted mt-1.5 leading-relaxed">
                    <strong>{tBilingual('विषय:', 'Subjects:')}</strong> {tBilingual(tb.subjectsMr, tb.subjectsEn)}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-green dark:border-dark-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-text dark:text-dark-muted">
                    {tBilingual('मोफत अधिकृत PDF ई-बुक', 'Free Official PDF E-Book')}
                  </span>
                  <a
                    href={tb.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-orange hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{tBilingual('डाऊनलोड करा', 'Download eBook')} ↗</span>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Daily Timetable & Schedule */}
        <div className="bg-light-green dark:bg-dark-secondary p-6 sm:p-8 rounded-2xl border border-border-green dark:border-dark-border space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-green dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-main-text dark:text-dark-text">
              {tBilingual('दैनंदिन शालेय वेळापत्रक व तासिका', 'Daily School Timetable & Hours')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
              <span className="font-bold text-primary-green dark:text-emerald-400 block">१०:०० AM - १०:३० AM</span>
              <span className="font-semibold text-main-text dark:text-dark-text block mt-1">
                {tBilingual('परिपाठ व राष्ट्रगीत', 'Assembly & National Anthem')}
              </span>
              <span className="text-muted-text dark:text-dark-muted text-[11px]">
                {tBilingual('प्रतिज्ञा, प्रार्थना, सुविचार, सामान्य ज्ञान', 'Pledge, prayer, thought of the day, news')}
              </span>
            </div>

            <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
              <span className="font-bold text-primary-green dark:text-emerald-400 block">१०:३० AM - ०१:१५ PM</span>
              <span className="font-semibold text-main-text dark:text-dark-text block mt-1">
                {tBilingual('सकाळची सत्रे (१ ते ४ तासिका)', 'Morning Sessions (Periods 1-4)')}
              </span>
              <span className="text-muted-text dark:text-dark-muted text-[11px]">
                {tBilingual('मराठी, गणित, इंग्रजी व विज्ञान', 'Marathi, Math, English & Science')}
              </span>
            </div>

            <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
              <span className="font-bold text-saffron-orange block">०१:१५ PM - ०२:०० PM</span>
              <span className="font-semibold text-main-text dark:text-dark-text block mt-1">
                {tBilingual('शालेय पोषण आहार (MDM)', 'Mid-Day Meal (PM POSHAN)')}
              </span>
              <span className="text-muted-text dark:text-dark-muted text-[11px]">
                {tBilingual('गरम भोजन, विश्रांती व स्वच्छता', 'Hot cooked lunch, rest and sanitation')}
              </span>
            </div>

            <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
              <span className="font-bold text-primary-green dark:text-emerald-400 block">०२:०० PM - ०५:०० PM</span>
              <span className="font-semibold text-main-text dark:text-dark-text block mt-1">
                {tBilingual('दुपारची सत्रे व क्रीडा तास', 'Afternoon Sessions & Sports')}
              </span>
              <span className="text-muted-text dark:text-dark-muted text-[11px]">
                {tBilingual('परिसर अभ्यास, हस्तकला व मैदानी खेळ', 'Social Studies, Art, Craft & Physical Education')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
