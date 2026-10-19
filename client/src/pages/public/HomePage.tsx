import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Utensils,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Landmark,
  UserCheck,
  FileText,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import { Notice, SchoolProfile, PublicTeacher, ScholarshipScheme } from '../../types';

export const HomePage: React.FC = () => {
  const { t, tBilingual, language, formatDate, localizeTeacher } = useLanguage();
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [scholarships, setScholarships] = useState<ScholarshipScheme[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [profRes, notRes, teachRes, schRes] = await Promise.all([
          api.get('/public/profile'),
          api.get('/public/notices'),
          api.get('/public/teachers'),
          api.get('/public/scholarships'),
        ]);
        if (profRes.data?.success) setProfile(profRes.data.data);
        if (notRes.data?.success) setNotices(profRes.data.success ? notRes.data.data.slice(0, 4) : []);
        if (teachRes.data?.success) setTeachers(teachRes.data.data.slice(0, 4));
        if (schRes.data?.success) setScholarships(schRes.data.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load home data:', err);
      }
    };
    fetchHomeData();
  }, []);

  const displayTeachers = useMemo(() => {
    const seen = new Set<string>();
    return teachers
      .filter((t) => {
        const key = t.name?.trim().toLowerCase();
        if (!key || seen.has(key) || /audit/i.test(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4)
      .map((t) => localizeTeacher(t));
  }, [teachers, localizeTeacher]);

  return (
    <div className="bg-white dark:bg-dark-bg text-main-text dark:text-dark-text transition-colors duration-200">
      {/* 1. HERO SECTION (Dark-Green #103D27 with real school image) */}
      <section className="relative bg-hero-green text-white overflow-hidden py-12 lg:py-20 border-b-4 border-saffron-orange">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#FFA500_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading & Credentials */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-saffron-orange/20 border border-saffron-orange/40 text-saffron-orange text-xs font-semibold px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {tBilingual(
                    'शासकीय मान्यताप्राप्त डिजिटल आदर्श प्राथमिक शाळा',
                    'Government Recognized Digital Model Primary School'
                  )}
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                  {tBilingual('जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.', 'Zilla Parishad Primary School, Hingone BK')}
                </h1>
                <p className="text-xl sm:text-2xl text-saffron-orange font-bold font-sans">
                  {tBilingual('गुणवत्तापूर्ण प्राथमिक शिक्षण केंद्र', 'Center for Quality Primary Education')}
                </p>
                <p className="text-sm sm:text-base text-white/85 font-medium leading-relaxed max-w-2xl pt-2">
                  {tBilingual(
                    'ता. धरणगाव, जि. जळगाव • स्थापन: १९६२ • माध्यम: मराठी • इयत्ता १ ली ते ७ वी. गुणवत्तापूर्ण पायाभूत शिक्षण, संस्कार, क्रीडा व आनंददायी वातावरणात प्रत्येक ग्रामीण बालकाचा सर्वांगीण विकास!',
                    'Tal. Dharangaon, Dist. Jalgaon • Estd: 1962 • Medium: Marathi • Classes 1 to 7. Quality foundational education, values, sports and holistic child development in a joyful rural environment.'
                  )}
                </p>
              </div>

              {/* Quick Credentials Badges */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-md border border-white/20 font-medium font-mono">
                  🏫 UDISE: 27030804501
                </span>
                <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-md border border-white/20 font-medium">
                  🥗 {tBilingual('१००% मोफत शालेय पोषण आहार (PM POSHAN)', '100% Free Mid-Day Meal Scheme (PM POSHAN)')}
                </span>
                <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-md border border-white/20 font-medium">
                  🌳 {tBilingual('माझी शाळा, हरित शाळा उपक्रम', 'My School, Green School Initiative')}
                </span>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-wrap gap-3.5 pt-3">
                <Link to="/admissions">
                  <Button variant="primary" size="lg" rightIcon={<ChevronRight className="w-4 h-4" />}>
                    {tBilingual('ऑनलाइन प्रवेश अर्ज करा', 'Apply for Admission')}
                  </Button>
                </Link>
                <Link to="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {tBilingual('शाळेविषयी सविस्तर', 'About Our School')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Real School Image (school1.jpg) */}
            <div className="lg:col-span-5">
              <div className="relative group">
                <div className="absolute -inset-2 bg-saffron-orange/40 rounded-2xl blur-sm group-hover:bg-saffron-orange/60 transition duration-300" />
                <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-dark-green">
                  <img
                    src="/imgs/school1.jpg"
                    alt="ZP Primary School Hingone BK Campus"
                    className="w-full h-80 sm:h-96 object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white">
                    <span className="bg-saffron-orange text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {tBilingual('मुख्य शाळा परिसर', 'School Campus')}
                    </span>
                    <h2 className="text-sm font-semibold mt-1">
                      {tBilingual('मुख्य शाळा इमारत व राष्ट्रध्वज स्तंभ, हिंगोणे बु.', 'Main School Building & Flag Post, Hingone BK')}
                    </h2>
                    <p className="text-xs text-white/80">
                      {tBilingual('स्वच्छ, निसर्गरम्य व सुरक्षित शैक्षणिक वातावरण', 'Clean, green and secure learning environment')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK FACTS STRIP */}
      <section className="bg-light-green dark:bg-dark-secondary py-8 border-b border-border-green dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-3 bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border shadow-card">
              <div className="text-xl sm:text-2xl font-black text-primary-green dark:text-emerald-400">१४८+</div>
              <div className="text-[11px] font-semibold text-main-text dark:text-dark-text uppercase mt-0.5">
                {tBilingual('एकूण विद्यार्थी', 'Total Students')}
              </div>
              <div className="text-[10px] text-muted-text dark:text-dark-muted">
                {tBilingual('इयत्ता १ ली ते ७ वी', 'Classes 1 to 7')}
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border shadow-card">
              <div className="text-xl sm:text-2xl font-black text-saffron-orange">०६</div>
              <div className="text-[11px] font-semibold text-main-text dark:text-dark-text uppercase mt-0.5">
                {tBilingual('प्रशिक्षित शिक्षक', 'Trained Teachers')}
              </div>
              <div className="text-[10px] text-muted-text dark:text-dark-muted">
                {tBilingual('पदवीधर शिक्षक वृंद', 'Qualified Faculty')}
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border shadow-card">
              <div className="text-xl sm:text-2xl font-black text-primary-green dark:text-emerald-400">१००%</div>
              <div className="text-[11px] font-semibold text-main-text dark:text-dark-text uppercase mt-0.5">
                {tBilingual('पोषण आहार', 'Mid-Day Meal')}
              </div>
              <div className="text-[10px] text-muted-text dark:text-dark-muted">
                {tBilingual('गरम ताजी खिचडी व पोषण', 'Daily Hot Nutritious Meal')}
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border shadow-card">
              <div className="text-xl sm:text-2xl font-black text-saffron-orange">१.२ एकर</div>
              <div className="text-[11px] font-semibold text-main-text dark:text-dark-text uppercase mt-0.5">
                {tBilingual('क्रीडांगण', 'Playground')}
              </div>
              <div className="text-[10px] text-muted-text dark:text-dark-muted">
                {tBilingual('मैदानी खेळांची सुविधा', 'Sports Equipment & Field')}
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border shadow-card">
              <div className="text-xl sm:text-2xl font-black text-primary-green dark:text-emerald-400">५ स्टार</div>
              <div className="text-[11px] font-semibold text-main-text dark:text-dark-text uppercase mt-0.5">
                {tBilingual('स्वच्छ शाळा', 'Clean Campus')}
              </div>
              <div className="text-[10px] text-muted-text dark:text-dark-muted">Swachh Vidyalaya</div>
            </div>

            <div className="p-3 bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border shadow-card">
              <div className="text-xl sm:text-2xl font-black text-saffron-orange">१९६२</div>
              <div className="text-[11px] font-semibold text-main-text dark:text-dark-text uppercase mt-0.5">
                {tBilingual('स्थापना वर्ष', 'Estd Year')}
              </div>
              <div className="text-[10px] text-muted-text dark:text-dark-muted">
                {tBilingual('६ दशकांची परंपरा', '6 Decades Legacy')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HEADMASTER MESSAGE (principal.jpeg) */}
      <section className="py-14 bg-white dark:bg-dark-bg border-b border-border-green dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-64 sm:w-72 rounded-2xl overflow-hidden shadow-card-hover border-4 border-white dark:border-[#374151] ring-2 ring-primary-green/20 bg-light-green dark:bg-dark-card">
                <img
                  src="/imgs/principal.jpeg"
                  alt="Headmaster Shri. S. R. Patil"
                  className="w-full h-80 object-cover object-top"
                />
                <div className="p-3 bg-primary-green text-white text-center">
                  <h3 className="font-bold text-sm">
                    {tBilingual('श्री. एस. आर. पाटील', 'Shri. S. R. Patil')}
                  </h3>
                  <p className="text-xs text-white/80">
                    {tBilingual('मुख्याध्यापक • जि. प. शाळा हिंगोणे बु.', 'Principal • ZP School Hingone BK')}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <Badge variant="orange" size="md">
                {tBilingual('मुख्याध्यापकांचे मनोगत', "Headmaster's Message")}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-main-text dark:text-dark-text tracking-tight">
                {tBilingual(
                  '"ज्ञान, संस्कार आणि आधुनिक कौशल्यांची सांगड घालून ग्रामीण बालकांना घडवणारी शाळा!"',
                  '"Empowering rural minds by blending knowledge, values, and modern digital skills!"'
                )}
              </h2>
              <p className="text-sm sm:text-base text-main-text/85 dark:text-dark-muted leading-relaxed">
                {tBilingual(
                  'जि. प. प्राथमिक शाळा हिंगोणे बु. येथे शिक्षण घेत असलेल्या प्रत्येक बालकाचा सर्वांगीण विकास हेच आमचे ध्येय आहे. शाळेमध्ये डिजिटल शिक्षण साहित्य, वाचनालय, सुसज्ज खेळाचे मैदान, मोफत पाठ्यपुस्तके व गणवेश, आणि नियमित आरोग्य तपासणीची सुविधा उपलब्ध आहे.',
                  'At ZP Primary School Hingone BK, holistic growth of every child is our prime mission. The school provides digital learning tools, library, equipped sports playground, free uniforms, textbooks, and routine health checks.'
                )}
              </p>
              <p className="text-sm text-muted-text dark:text-dark-muted leading-relaxed">
                {tBilingual(
                  "पर्यावरण संरक्षणासाठी 'माझी शाळा, हरित शाळा' अंतर्गत वृक्षारोपण, स्वच्छता मोहीम, आणि विविध सांस्कृतिक उपक्रमांमधून मुलांमध्ये आत्मविश्वास निर्माण केला जातो.",
                  "Under the 'My School, Green School' environmental initiative, students develop leadership and confidence through tree plantation, campus cleanliness, and active cultural pursuits."
                )}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link to="/about">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    {tBilingual('शाळा इतिहास व माहिती वाचा', 'Read School History & Vision')}
                  </Button>
                </Link>
                <Link to="/teachers">
                  <Button variant="outline" size="sm" rightIcon={<UserCheck className="w-3.5 h-3.5" />}>
                    {tBilingual('आमचे शिक्षक वृंद भेटा', 'Meet Our Teaching Staff')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACADEMIC HIGHLIGHTS */}
      <section className="py-14 bg-light-green/40 dark:bg-dark-secondary/60 border-b border-border-green dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Badge variant="green" size="md">
                {tBilingual('पायाभूत शिक्षण', 'Academic Highlights')}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-main-text dark:text-dark-text mt-1">
                {tBilingual('गुणवत्तापूर्ण अभ्यासक्रम व अध्ययन सुविधा', 'Quality Curricula & Modern Facilities')}
              </h2>
            </div>
            <Link to="/academics">
              <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                {tBilingual('सर्व शैक्षणिक माहिती पहा', 'Explore Academics')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card">
              <div className="w-10 h-10 rounded-lg bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-main-text dark:text-dark-text">
                {tBilingual('इयत्ता १ ली ते ७ वी अभ्यासक्रम', 'Classes 1 to 7 Curriculum')}
              </h3>
              <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
                {tBilingual(
                  'महाराष्ट्र राज्य पाठ्यपुस्तक निर्मिती व संशोधन मंडळ (बालभारती) द्वारे निर्धारित अधिकृत अभ्यासक्रम. मराठी व सेमी-इंग्रजी माध्यमातून अध्ययन.',
                  'Official state curricula approved by Maharashtra Balbharati. Taught in Marathi medium with dedicated Semi-English coaching.'
                )}
              </p>
              <a
                href="https://ebalbharati.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-green dark:text-saffron-orange hover:underline pt-1"
              >
                {tBilingual('अधिकृत बालभारती ई-बुक्स पहा ↗', 'Official Balbharati E-Books ↗')}
              </a>
            </Card>

            <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card">
              <div className="w-10 h-10 rounded-lg bg-[#FFF5E5] dark:bg-amber-950/40 text-saffron-orange flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-main-text dark:text-dark-text">
                {tBilingual('निपुण भारत (FLN) अभियान', 'NIPUN Bharat (FLN) Mission')}
              </h3>
              <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
                {tBilingual(
                  'पायाभूत साक्षरता व संख्याज्ञान संपादन. प्रत्येक बालकाला इयत्ता तिसरीपर्यंत अर्थ समजून वाचन व गणितातील मूलभूत क्रिया आत्मसात करण्याची हमी.',
                  'Foundational Literacy and Numeracy assurance. Ensuring every student acquires reading comprehension and core math competence.'
                )}
              </p>
              <div className="text-xs font-semibold text-saffron-orange pt-1">
                {tBilingual('१००% कृतीयुक्त व आनंददायी शिक्षण', '100% Activity Based Joyful Learning')}
              </div>
            </Card>

            <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card">
              <div className="w-10 h-10 rounded-lg bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-main-text dark:text-dark-text">
                {tBilingual('डिजिटल वर्गखोल्या व सायन्स लॅब', 'Digital Classrooms & Science Tools')}
              </h3>
              <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
                {tBilingual(
                  'स्मार्ट स्क्रीन, ऑडिओ-व्हिज्युअल शैक्षणिक ॲनिमेशन, सामान्य ज्ञान स्पर्धा, आणि प्रात्यक्षिक विज्ञानाचे प्रयोग.',
                  'Smart screens, interactive audiovisual animations, general knowledge quizzes, and hands-on science experiments.'
                )}
              </p>
              <div className="text-xs font-semibold text-primary-green dark:text-emerald-400 pt-1">
                {tBilingual('ग्रामीण भागात डिजिटल क्रांती', 'Digital Learning in Rural Education')}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. APPROVED TEACHERS HIGHLIGHTS */}
      <section className="py-14 bg-white dark:bg-dark-bg border-b border-border-green dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Badge variant="orange" size="md">
                {tBilingual('आमचे मार्गदर्शक', 'Our Educators')}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-main-text dark:text-dark-text mt-1">
                {tBilingual('उच्चशिक्षित व समर्पित शिक्षक वृंद', 'Dedicated & Qualified Teaching Staff')}
              </h2>
              <p className="text-xs text-muted-text dark:text-dark-muted mt-0.5">
                {tBilingual('शासकीय मान्यताप्राप्त प्राथमिक शिक्षक', 'Government Appointed Elementary Educators')}
              </p>
            </div>
            <Link to="/teachers">
              <Button variant="primary" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                {tBilingual('सर्व शिक्षक प्रोफाइल पहा', 'View All Faculty')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayTeachers.map((teach) => (
              <Card
                key={teach._id}
                className="border border-border-green dark:border-dark-border p-4 text-center space-y-3 bg-white dark:bg-dark-card hover:shadow-card-hover transition-all"
              >
                <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-light-green dark:bg-[#18251F] border-2 border-primary-green/30 flex items-center justify-center text-primary-green dark:text-emerald-400 font-bold text-xl shadow">
                  {teach.avatar ? (
                    <img src={teach.avatar} alt={teach.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <span>{teach.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-main-text dark:text-dark-text">{teach.name}</h3>
                  <p className="text-xs text-primary-green dark:text-emerald-400 font-semibold mt-0.5">{teach.designation}</p>
                  <p className="text-[11px] text-muted-text dark:text-dark-muted mt-1">{teach.qualification}</p>
                </div>
                <div className="pt-2 border-t border-border-green dark:border-dark-border flex items-center justify-center gap-1 text-[11px] text-muted-text dark:text-dark-muted font-medium">
                  <span>
                    {tBilingual('अनुभव:', 'Experience:')} {teach.experienceYears} {tBilingual('वर्षे', 'Years')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. LATEST NOTICES & ANNOUNCEMENTS */}
      <section className="py-14 bg-light-green/30 dark:bg-dark-secondary/40 border-b border-border-green dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Badge variant="green" size="md">
                {tBilingual('शालेय परिपत्रके', 'Notices & Circulars')}
              </Badge>
              <h2 className="text-2xl font-bold text-main-text dark:text-dark-text mt-1">
                {tBilingual('ताज्या सूचना व घोषणा', 'Latest Announcements')}
              </h2>
            </div>
            <Link to="/notices">
              <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                {tBilingual('सर्व सूचना पहा', 'View All Notices')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((n) => (
              <Card key={n._id} className="border border-border-green dark:border-dark-border p-5 space-y-2 bg-white dark:bg-dark-card">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 px-2 py-0.5 rounded">
                    {n.category}
                  </span>
                  <span className="text-xs text-muted-text dark:text-dark-muted font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-saffron-orange" />
                    {formatDate(n.date)}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-main-text dark:text-dark-text leading-snug">
                  {n.title}
                </h3>
                <p className="text-xs text-muted-text dark:text-dark-muted line-clamp-2">{n.content}</p>
                <div className="pt-2 text-[11px] text-primary-green dark:text-emerald-400 font-semibold flex items-center justify-between">
                  <span>
                    {tBilingual('प्रसिद्धी:', 'Published by:')} {n.publishedBy}
                  </span>
                  <Link to="/notices" className="hover:underline flex items-center gap-0.5">
                    {tBilingual('वाचा', 'Read')} <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SCHOLARSHIPS PREVIEW */}
      <section className="py-14 bg-white dark:bg-dark-bg border-b border-border-green dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Badge variant="orange" size="md">
                {tBilingual('शासकीय योजना', 'Government Schemes')}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-main-text dark:text-dark-text mt-1">
                {tBilingual('विद्यार्थी शिष्यवृत्ती योजना', 'Student Scholarships & Welfare')}
              </h2>
              <p className="text-xs text-muted-text dark:text-dark-muted mt-0.5">
                {tBilingual('मोफत शिक्षण, उपस्थिती भत्ता व थेट लाभ साहाय्य', 'Direct DBT transfers, attendance allowance and fee waivers')}
              </p>
            </div>
            <Link to="/scholarships">
              <Button variant="primary" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                {tBilingual('सर्व शिष्यवृत्ती योजना पहा', 'View All Schemes')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scholarships.map((s) => (
              <Card
                key={s._id}
                className="border border-border-green dark:border-dark-border p-5 space-y-3 flex flex-col justify-between bg-white dark:bg-dark-card"
              >
                <div>
                  <span className="text-[10px] font-bold text-saffron-orange bg-saffron-light dark:bg-amber-950/40 px-2 py-0.5 rounded font-mono">
                    {s.code}
                  </span>
                  <h3 className="font-bold text-sm text-main-text dark:text-dark-text mt-2 leading-snug">
                    {language === 'mr'
                      ? s.marathiName || s.schemeName
                      : language === 'en'
                      ? s.schemeName || s.marathiName
                      : `${s.marathiName || s.schemeName} (${s.schemeName || s.marathiName})`}
                  </h3>
                  <div className="text-xs font-semibold text-primary-green dark:text-emerald-400 mt-1">
                    {s.benefitAmount}
                  </div>
                  <p className="text-[11px] text-muted-text dark:text-dark-muted mt-2 line-clamp-2">
                    {tBilingual('पात्रता:', 'Eligibility:')} {s.beneficiaryGroup} ({s.applicableGrades})
                  </p>
                </div>
                <Link
                  to="/scholarships"
                  className="pt-2 border-t border-border-green dark:border-dark-border text-xs font-semibold text-primary-green dark:text-saffron-orange hover:underline flex items-center justify-between"
                >
                  <span>{tBilingual('कागदपत्रे व अर्ज पद्धत पहा', 'View Criteria & Documents')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. ADMISSION CTA BANNER */}
      <section className="py-14 bg-hero-green text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center space-y-5">
          <Badge variant="orange" size="md">
            {tBilingual('शैक्षणिक सत्र २०२६-२७ नवीन प्रवेश सुरू', 'Academic Session 2026-27 Admissions Open')}
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
            {tBilingual(
              'आपल्या पाल्याच्या उज्ज्वल भविष्यासाठी आजच हिंगोणे बु. शाळेत प्रवेश निश्चित करा!',
              'Secure your child’s bright future today at ZP Primary School, Hingone BK!'
            )}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
            {tBilingual(
              'इयत्ता १ ली ते ७ वी मधील सर्व विद्यार्थ्यांसाठी १००% मोफत प्रवेश, मोफत पाठ्यपुस्तके, मोफत गणवेश, आणि सकस पोषण आहार. ऑनलाइन अर्ज करा व तात्काळ अर्ज क्रमांक मिळवा.',
              '100% free elementary education (Classes 1 to 7), free textbooks, school uniforms, and hot midday meals. Apply online and receive your instant application number.'
            )}
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link to="/admissions">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                {tBilingual('ऑनलाइन प्रवेश अर्ज भरा', 'Apply Online Now')}
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                {tBilingual('शाळेशी संपर्क साधा', 'Contact School Office')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
