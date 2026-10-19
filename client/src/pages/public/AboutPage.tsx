import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import { SchoolProfile } from '../../types';
import {
  Building2,
  Users2,
  Landmark,
  CheckCircle2,
  Award,
  Calendar,
  BookOpen,
  Target,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { tBilingual } = useLanguage();
  const [profile, setProfile] = useState<SchoolProfile | null>(null);

  useEffect(() => {
    api.get('/public/profile').then((res) => {
      if (res.data?.success) setProfile(res.data.data);
    });
  }, []);

  return (
    <div className="py-10 bg-white dark:bg-dark-bg text-main-text dark:text-dark-text transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
        {/* Banner */}
        <div className="border-b border-border-green dark:border-dark-border pb-8">
          <Badge variant="green" size="md">
            {tBilingual('शाळेविषयी सविस्तर माहिती', 'About Our School')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main-text dark:text-dark-text mt-2">
            {tBilingual('जि. प. प्राथमिक शाळा, हिंगोणे बु.', 'Zilla Parishad Primary School, Hingone BK')}
          </h1>
          <p className="text-base text-muted-text dark:text-dark-muted mt-1">
            {tBilingual(
              'जि. प. प्राथमिक शाळा, हिंगोणे बु. • तालुका धरणगाव, जिल्हा जळगाव • UDISE: 27030804501',
              'Zilla Parishad Primary School, Hingone BK • Taluka Dharangaon, District Jalgaon • UDISE: 27030804501'
            )}
          </p>
        </div>

        {/* History & Establishment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-2xl font-bold text-main-text dark:text-dark-text">
              {tBilingual('शाळेचा गौरवशाली इतिहास', 'Our Glorious History Since 1962')}
            </h2>
            <p className="text-sm text-main-text/85 dark:text-dark-muted leading-relaxed">
              {tBilingual(
                'जिल्हा परिषद प्राथमिक शाळा हिंगोणे बु. ची स्थापना १ जुलै १९६२ रोजी झाली. स्वातंत्र्यप्राप्तीनंतरच्या कालखंडात ग्रामीण भागातील शेतकरी, शेतमजूर आणि कष्टकरी कुटुंबातील बालकांना दर्जेदार प्राथमिक शिक्षणाची दालने खुली करून देण्याच्या उद्देशाने या ज्ञानमंदिराची मुहूर्तमेढ रोवली गेली.',
                'ZP Primary School Hingone BK was established on 1st July 1962 to provide quality elementary education to children of agricultural and hardworking rural families.'
              )}
            </p>
            <p className="text-sm text-main-text/85 dark:text-dark-muted leading-relaxed">
              {tBilingual(
                'गेल्या ६ दशकांपासून या शाळेने गुणवत्तापूर्ण शिक्षण देत अनेक गुणवंत विद्यार्थी, शिक्षक, अधिकारी, व्यावसायिक व आदर्श शेतकरी घडवले आहेत. आज ही शाळा आधुनिक डिजिटल शिक्षण, समृद्ध ग्रंथालय, क्रीडांगण व पर्यावरण संवर्धनात तालुक्यात आदर्श मानली जाते.',
                'Over the past six decades, the school has nurtured generations of achievers, professionals, teachers, and responsible citizens, known today for digital education, sports, and green initiatives.'
              )}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-light-green dark:bg-dark-secondary border border-border-green dark:border-dark-border">
                <div className="text-[11px] text-muted-text dark:text-dark-muted font-semibold">
                  {tBilingual('स्थापना वर्ष', 'Establishment Year')}
                </div>
                <div className="text-xl font-black text-primary-green dark:text-emerald-400 mt-0.5">१९६२ (1962)</div>
                <div className="text-[10px] text-muted-text dark:text-dark-muted">
                  {tBilingual('६४ वर्षांचा इतिहास', '64 Years of Excellence')}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-light-green dark:bg-dark-secondary border border-border-green dark:border-dark-border">
                <div className="text-[11px] text-muted-text dark:text-dark-muted font-semibold">
                  {tBilingual('अध्ययन माध्यम', 'Instruction Medium')}
                </div>
                <div className="text-xl font-black text-primary-green dark:text-emerald-400 mt-0.5">
                  {tBilingual('मराठी माध्यम', 'Marathi Medium')}
                </div>
                <div className="text-[10px] text-muted-text dark:text-dark-muted">
                  {tBilingual('सेमी-इंग्रजी सह', 'With Semi-English')}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-light-green dark:bg-dark-secondary border border-border-green dark:border-dark-border">
                <div className="text-[11px] text-muted-text dark:text-dark-muted font-semibold">
                  {tBilingual('इयत्ता विस्तार', 'Class Range')}
                </div>
                <div className="text-xl font-black text-primary-green dark:text-emerald-400 mt-0.5">
                  {tBilingual('१ ली ते ७ वी', 'Classes 1 to 7')}
                </div>
                <div className="text-[10px] text-muted-text dark:text-dark-muted">
                  {tBilingual('१००% मोफत शिक्षण', '100% Free Education')}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border-2 border-border-green dark:border-dark-border shadow-card-hover bg-light-green dark:bg-dark-card">
              <img src="/imgs/school2.jpg" alt="School Classroom Wing" className="w-full h-80 object-cover" />
              <div className="p-3 bg-light-green dark:bg-dark-card text-center text-xs font-semibold text-main-text dark:text-dark-text border-t border-border-green dark:border-dark-border">
                {tBilingual('शाळेची प्रशस्त वर्गखोली इमारत व व्हरांडा', 'Spacious School Classrooms & Verandah')}
              </div>
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-[#E2EFE7]/30 dark:bg-dark-card">
            <div className="w-10 h-10 rounded-lg bg-primary-green text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-main-text dark:text-dark-text">
              {tBilingual('आमची दृष्टी', 'Our Vision')}
            </h3>
            <p className="text-xs sm:text-sm text-main-text/85 dark:text-dark-muted leading-relaxed">
              {tBilingual(
                '"ग्रामीण भागातील प्रत्येक बालकाला आधुनिक डिजिटल कौशल्यांसह दर्जेदार, मूल्यधिष्ठित आणि गुणवत्तापूर्ण प्राथमिक शिक्षण देऊन स्वावलंबी, संवेदनशील आणि सशक्त नागरिक घडवणे."',
                '"To empower every rural child with modern digital skills, value-grounded primary education, nurturing self-reliant, empathetic and capable citizens."'
              )}
            </p>
          </Card>

          <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-[#FFF5E5]/50 dark:bg-dark-card">
            <div className="w-10 h-10 rounded-lg bg-saffron-orange text-white flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-main-text dark:text-dark-text">
              {tBilingual('आमचे ध्येय', 'Our Mission')}
            </h3>
            <p className="text-xs sm:text-sm text-main-text/85 dark:text-dark-muted leading-relaxed">
              {tBilingual(
                '"पायाभूत साक्षरता व संख्याज्ञान (FLN) साध्य करणे, शंभर टक्के विद्यार्थ्यांची उपस्थिती टिकवणे, पर्यावरण संवर्धन, क्रीडा व कलागुणांना वाव देणे आणि सर्वसमावेशक मोफत शिक्षणाची हमी देणे."',
                '"Achieving Foundational Literacy & Numeracy (FLN), sustaining 100% attendance, environmental care, nurturing athletic and creative talents with inclusive free education."'
              )}
            </p>
          </Card>
        </div>

        {/* Principal's Message Section */}
        <div className="bg-light-green/60 dark:bg-dark-secondary p-6 sm:p-8 rounded-2xl border border-border-green dark:border-dark-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-3 flex justify-center">
              <img
                src="/imgs/principal.jpeg"
                alt="Headmaster Shri. S. R. Patil"
                className="w-48 h-56 rounded-xl object-cover object-top shadow border-2 border-white dark:border-[#374151]"
              />
            </div>
            <div className="lg:col-span-9 space-y-3">
              <Badge variant="orange" size="sm">
                {tBilingual('मुख्याध्यापकांचा संदेश', "Headmaster's Message")}
              </Badge>
              <h3 className="text-xl font-bold text-main-text dark:text-dark-text">
                {tBilingual('श्री. एस. आर. पाटील • मुख्याध्यापक', 'Shri. S. R. Patil • Headmaster')}
              </h3>
              <p className="text-xs sm:text-sm text-main-text/85 dark:text-dark-muted leading-relaxed">
                {profile?.headmaster.message ||
                  tBilingual(
                    'जि. प. प्राथमिक शाळा हिंगोणे बु. येथे आम्ही ग्रामीण भागातील प्रत्येक बालकाच्या सुप्त गुणांना वाव देणारे आनंददायी, संस्कारक्षम व डिजिटल शिक्षण देण्यास कटिबद्ध आहोत. १००% मोफत पोषण आहार, मोफत पाठ्यपुस्तके, भव्य क्रीडांगण व उच्चविद्याविभूषित शिक्षकांच्या मार्गदर्शनाखाली आमचे विद्यार्थी प्रगतीपथावर आहेत.',
                    'At ZP Primary School Hingone BK, we are committed to joyful, value-rich and digital elementary education. Under qualified faculty guidance, children thrive with 100% free mid-day meals, free textbooks and sports facilities.'
                  )}
              </p>
              <div className="text-xs font-semibold text-primary-green dark:text-emerald-400">
                {tBilingual(
                  'पात्रता: M.A., D.Ed. • शैक्षणिक सेवेतील प्रदीर्घ २२ वर्षांचा अनुभव',
                  'Qualification: M.A., D.Ed. • 22 Years of Dedicated Educational Service'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Facts Grid */}
        <div className="space-y-4">
          <div>
            <Badge variant="green" size="md">
              {tBilingual('शाळेची ठळक वैशिष्ट्ये', 'Quick Facts')}
            </Badge>
            <h2 className="text-2xl font-bold text-main-text dark:text-dark-text mt-1">
              {tBilingual('अधिकृत शालेय सांख्यिकी व सुविधा', 'Official School Statistics & Amenities')}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {profile?.quickFacts.map((fact, index) => (
              <div key={index} className="p-4 bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border shadow-card">
                <span className="text-xs text-muted-text dark:text-dark-muted block">{fact.label}</span>
                <span className="text-base font-bold text-primary-green dark:text-emerald-400 block mt-1">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Infrastructure Gallery Strip */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-main-text dark:text-dark-text">
            {tBilingual('शालेय परिसर व भौतिक पायाभूत सुविधा', 'Campus Infrastructure & Facilities')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl overflow-hidden border border-border-green dark:border-dark-border shadow-card bg-white dark:bg-dark-card">
              <img src="/imgs/school1.jpg" alt="Main Building" className="w-full h-52 object-cover" />
              <div className="p-3 text-xs font-semibold text-main-text dark:text-dark-text">
                {tBilingual('मुख्य प्रशासकीय इमारत व राष्ट्रध्वज स्तंभ', 'Main Administrative Building & Flag Pole')}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border-green dark:border-dark-border shadow-card bg-white dark:bg-dark-card">
              <img src="/imgs/playground.jpg" alt="Sports Playground" className="w-full h-52 object-cover" />
              <div className="p-3 text-xs font-semibold text-main-text dark:text-dark-text">
                {tBilingual('१.२ एकर भव्य समतल खेळाचे मैदान (कबड्डी, खो-खो)', '1.2 Acre Level Sports Playground (Kabaddi, Kho-Kho)')}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border-green dark:border-dark-border shadow-card bg-white dark:bg-dark-card">
              <img src="/imgs/school3.jpg" alt="School Gate" className="w-full h-52 object-cover" />
              <div className="p-3 text-xs font-semibold text-main-text dark:text-dark-text">
                {tBilingual('शाळेचे मुख्य प्रवेशद्वार, संरक्षक भिंत व परिसर', 'Main Entrance Gate & Secure Boundary Wall')}
              </div>
            </div>
          </div>
        </div>

        {/* School Management Committee (SMC) */}
        <div className="bg-light-green dark:bg-dark-secondary p-6 sm:p-8 rounded-2xl border border-border-green dark:border-dark-border space-y-4">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-primary-green dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-main-text dark:text-dark-text">
              {tBilingual('शाळा व्यवस्थापन समिती', 'School Management Committee (SMC)')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-text dark:text-dark-muted leading-relaxed">
            {tBilingual(
              'बालकांचा मोफत व सक्तीच्या शिक्षणाचा अधिकार अधिनियम २००९ (RTE) अंतर्गत स्थापन झालेली समिती शाळेच्या भौतिक, आर्थिक व शैक्षणिक पारदर्शकतेसाठी सक्रिय कार्य करते.',
              'Constituted under the Right to Education Act 2009 (RTE), the SMC actively ensures transparency in governance, infrastructure development, and student welfare.'
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs">
            <div className="bg-white dark:bg-dark-card p-3.5 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
              <span className="font-bold text-main-text dark:text-dark-text block">
                {tBilingual('अध्यक्ष', 'President')}
              </span>
              <span className="text-muted-text dark:text-dark-muted text-[11px] block mt-0.5">
                {tBilingual('मा. अध्यक्ष, शाळा व्यवस्थापन समिती', 'Hon. President, SMC')}
              </span>
            </div>
            <div className="bg-white dark:bg-dark-card p-3.5 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
              <span className="font-bold text-main-text dark:text-dark-text block">
                {tBilingual('सचिव', 'Secretary')}
              </span>
              <span className="text-muted-text dark:text-dark-muted text-[11px] block mt-0.5">
                {tBilingual('श्री. एस. आर. पाटील (मुख्याध्यापक)', 'Shri. S. R. Patil (Principal)')}
              </span>
            </div>
            <div className="bg-white dark:bg-dark-card p-3.5 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
              <span className="font-bold text-main-text dark:text-dark-text block">
                {tBilingual('पालक प्रतिनिधी', 'Parent Members')}
              </span>
              <span className="text-muted-text dark:text-dark-muted text-[11px] block mt-0.5">
                {tBilingual('माता-पालक व सन्माननीय ग्रामस्थ', 'Elected Parent Guardians')}
              </span>
            </div>
            <div className="bg-white dark:bg-dark-card p-3.5 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
              <span className="font-bold text-main-text dark:text-dark-text block">
                {tBilingual('स्थानिक संस्था प्रतिनिधी', 'Local Body Rep')}
              </span>
              <span className="text-muted-text dark:text-dark-muted text-[11px] block mt-0.5">
                {tBilingual('ग्रामपंचायत हिंगोणे बु. सदस्य', 'Gram Panchayat Hingone BK Member')}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link to="/admissions">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {tBilingual('प्रवेश प्रक्रिया पहा व ऑनलाइन अर्ज करा', 'Explore Admissions & Apply Online')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
