import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import { AdmissionConfirmation, AdmissionSubmission } from '../../types';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Search,
  BookOpen,
  Calendar,
  Send,
  User,
  Phone,
  Home,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const AdmissionsPage: React.FC = () => {
  const { tBilingual, t } = useLanguage();

  const [formData, setFormData] = useState<AdmissionSubmission>({
    studentName: '',
    gender: 'Male',
    dateOfBirth: '',
    gradeApplying: 'इयत्ता १ ली',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    residentialAddress: '',
    previousSchool: '',
  });

  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<AdmissionConfirmation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Status lookup state
  const [lookupNo, setLookupNo] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Dynamic admissions configuration from CMS
  const [admissionsConfig, setAdmissionsConfig] = useState<any>(null);

  React.useEffect(() => {
    api
      .get('/public/profile')
      .then((res) => {
        if (res.data?.success && res.data.data?.admissionsConfig) {
          setAdmissionsConfig(res.data.data.admissionsConfig);
        }
      })
      .catch((err) => console.error('Failed to load admission config:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.studentName.trim()) {
      setFormError(tBilingual('कृपया विद्यार्थ्याचे पूर्ण नाव टाकावे.', 'Please enter student full name.'));
      return;
    }
    if (!formData.dateOfBirth) {
      setFormError(tBilingual('कृपया विद्यार्थ्याची जन्म तारीख निवडावी.', 'Please select student date of birth.'));
      return;
    }
    if (!formData.parentName.trim()) {
      setFormError(tBilingual('कृपया पालकांचे पूर्ण नाव टाकावे.', 'Please enter parent/guardian full name.'));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.parentPhone.trim())) {
      setFormError(
        tBilingual(
          'कृपया वैध १० अंकी मोबाईल क्रमांक टाकावा (उदा. 9823456789).',
          'Please enter a valid 10-digit mobile number (e.g. 9823456789).'
        )
      );
      return;
    }
    if (!formData.residentialAddress.trim()) {
      setFormError(tBilingual('कृपया निवासी पत्ता टाकावा.', 'Please enter residential address.'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/public/admissions', formData);
      if (res.data?.success) {
        setConfirmation(res.data.data);
        // Reset form
        setFormData({
          studentName: '',
          gender: 'Male',
          dateOfBirth: '',
          gradeApplying: 'इयत्ता १ ली',
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          residentialAddress: '',
          previousSchool: '',
        });
      }
    } catch (err: any) {
      setFormError(
        err.message ||
          tBilingual(
            'प्रवेश अर्ज नोंदवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
            'An error occurred while submitting admission application. Please try again.'
          )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);

    if (!lookupNo.trim()) {
      setLookupError(tBilingual('कृपया अर्ज क्रमांक प्रविष्ट करा.', 'Please enter application tracking number.'));
      return;
    }

    setLookupLoading(true);
    try {
      const res = await api.get(`/public/admissions/status/${lookupNo.trim()}`);
      if (res.data?.success) {
        setLookupResult(res.data.data);
      }
    } catch (err: any) {
      setLookupError(
        err.message || tBilingual('अर्ज क्रमांक सापडला नाही.', 'Application tracking number not found.')
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="py-10 bg-white dark:bg-dark-bg text-main-text dark:text-dark-text transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        {/* Banner */}
        <div className="border-b border-border-green dark:border-dark-border pb-6">
          <Badge variant="orange" size="md">
            {tBilingual('शैक्षणिक प्रवेश २०२६-२७', 'Admissions Open 2026-27')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main-text dark:text-dark-text mt-2">
            {tBilingual('नवीन विद्यार्थी ऑनलाईन प्रवेश नोंदणी', 'Online Student Admission Registration')}
          </h1>
          <p className="text-sm text-muted-text dark:text-dark-muted mt-1 max-w-3xl leading-relaxed">
            {tBilingual(
              'मोफत व सक्तीचे शिक्षण हक्क कायदा (RTE) अंतर्गत इयत्ता १ ली ते ७ वी करिता प्रवेश प्रक्रिया. कोणतीही प्रवेश फी, डोनेशन अथवा परीक्षा नाही.',
              'Elementary admissions for Classes 1 to 7 under the Right to Education Act. 100% free with no entrance tests or capitation fees.'
            )}
          </p>
        </div>

        {/* 1. Admission Guidelines & Available Grades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card">
            <div className="w-10 h-10 rounded-lg bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-main-text dark:text-dark-text">
              {tBilingual('उपलब्ध वर्ग', 'Available Classes')}
            </h3>
            <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
              {tBilingual(
                'इयत्ता १ ली ते ७ वी. मराठी माध्यम सह सेमी-इंग्रजी मार्गदर्शन. कोणत्याही वर्गासाठी कोणतीही प्रवेश फी आकारली जात नाही.',
                'Classes 1 to 7. Marathi medium with Semi-English guidance. Zero tuition or admission fees.'
              )}
            </p>
          </Card>

          <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card">
            <div className="w-10 h-10 rounded-lg bg-[#FFF5E5] dark:bg-amber-950/40 text-saffron-orange flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-main-text dark:text-dark-text">
              {tBilingual('वयोमर्यादा निकष', 'Age Criteria')}
            </h3>
            <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
              {tBilingual(
                'इयत्ता पहिलीच्या प्रवेशासाठी ३१ डिसेंबर २०२६ रोजी बालकाचे वय पूर्ण ६ वर्षे असणे आवश्यक आहे (शासन निर्णयानुसार).',
                'For Class 1 admission, the child must have completed 6 years of age as of 31st December 2026 as per Maharashtra government norms.'
              )}
            </p>
          </Card>

          <Card className="border border-border-green dark:border-dark-border p-6 space-y-3 bg-white dark:bg-dark-card">
            <div className="w-10 h-10 rounded-lg bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-main-text dark:text-dark-text">
              {tBilingual('मोफत शासकीय लाभ', 'Free Government Benefits')}
            </h3>
            <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
              {tBilingual(
                'मोफत पाठ्यपुस्तके, २ मोफत गणवेश संच, दररोज गरम सकस पोषण आहार (MDM), आणि नियमित आरोग्य तपासणी.',
                'Free textbooks, two uniform sets, hot cooked mid-day meal, and regular pediatric health checkups.'
              )}
            </p>
          </Card>
        </div>

        {/* 2. Required Documents Checklist */}
        <div className="bg-light-green dark:bg-dark-secondary p-6 sm:p-8 rounded-2xl border border-border-green dark:border-dark-border space-y-4">
          <h2 className="text-lg font-bold text-main-text dark:text-dark-text">
            {tBilingual('प्रवेशासाठी आवश्यक कागदपत्रे', 'Required Documents for Admission')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { mr: 'जन्म दाखला', en: 'Birth Certificate' },
              { mr: 'विद्यार्थी आधार कार्ड झेरॉक्स', en: 'Student Aadhaar Card Copy' },
              { mr: 'पालकांचे आधार व बँक पासबुक', en: 'Parent Aadhaar & Bank Passbook' },
              { mr: '२ पासपोर्ट आकाराचे रंगीत फोटो', en: '2 Passport-size Color Photos' },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-dark-card p-3.5 rounded-xl border border-border-green dark:border-dark-border flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-primary-green dark:text-emerald-400 shrink-0" />
                <span className="text-main-text dark:text-dark-text">{tBilingual(doc.mr, doc.en)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Online Admission Form and Reference Lookup Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Application Form */}
          <div className="lg:col-span-8">
            <Card className="border border-border-green dark:border-dark-border p-6 sm:p-8 space-y-6 bg-white dark:bg-dark-card">
              <div>
                <Badge variant="orange" size="sm">
                  {tBilingual('नवीन प्रवेश नोंदणी अर्ज', 'New Admission Registration')}
                </Badge>
                <h2 className="text-xl font-bold text-main-text dark:text-dark-text mt-1">
                  {tBilingual('ऑनलाइन प्रवेश अर्ज', 'Online Admission Form')}
                </h2>
                <p className="text-xs text-muted-text dark:text-dark-muted">
                  {admissionsConfig?.processDescription ||
                    tBilingual(
                      'खालील सर्व माहिती काळजीपूर्वक भरावी. अर्ज सादर केल्यानंतर आपणास युनिक संदर्भ क्रमांक (Application No.) प्राप्त होईल.',
                      'Please complete all details accurately. Upon submission, an instant tracking reference number will be generated.'
                    )}
                </p>
              </div>

              {admissionsConfig && admissionsConfig.isFormOpen === false ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>{tBilingual('सध्या ऑनलाइन प्रवेश अर्ज प्रक्रिया स्थगित आहे', 'Online Admissions Temporarily Closed')}</span>
                  </div>
                  <p>
                    {tBilingual(
                      `शैक्षणिक वर्ष ${admissionsConfig.academicYear || '२०२६-२७'} साठी ऑनलाइन प्रवेश अर्ज स्वीकारणे तात्पुरते बंद ठेवण्यात आले आहे. अधिक माहितीसाठी कृपया थेट शाळेच्या कार्यालयाशी संपर्क साधावा.`,
                      `Online admissions for academic year ${admissionsConfig.academicYear || '2026-27'} are currently closed. Please contact school office for assistance.`
                    )}
                  </p>
                </div>
              ) : (
                <>
                  {formError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Student Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                          {tBilingual('विद्यार्थ्याचे पूर्ण नाव', 'Student Full Name')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.studentName}
                          onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                          placeholder={tBilingual('उदा. पाटील वेदांत सचिन', 'e.g. Patil Vedant Sachin')}
                          className="w-full text-xs px-3 py-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                          {tBilingual('लिंग', 'Gender')} *
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                          className="w-full text-xs px-3 py-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                        >
                          <option value="Male">{tBilingual('मुलगा', 'Boy (Male)')}</option>
                          <option value="Female">{tBilingual('मुलगी', 'Girl (Female)')}</option>
                          <option value="Other">{tBilingual('इतर', 'Other')}</option>
                        </select>
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                          {tBilingual('जन्म तारीख', 'Date of Birth')} *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full text-xs px-3 py-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                        />
                      </div>

                      {/* Grade Applying For */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                          {tBilingual('प्रवेश घ्यावयाची इयत्ता', 'Standard Applying For')} *
                        </label>
                        <select
                          value={formData.gradeApplying}
                          onChange={(e) => setFormData({ ...formData, gradeApplying: e.target.value })}
                          className="w-full text-xs px-3 py-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                        >
                          <option value="इयत्ता १ ली">{tBilingual('इयत्ता १ ली', 'Class 1')}</option>
                          <option value="इयत्ता २ री">{tBilingual('इयत्ता २ री', 'Class 2')}</option>
                          <option value="इयत्ता ३ री">{tBilingual('इयत्ता ३ री', 'Class 3')}</option>
                          <option value="इयत्ता ४ थी">{tBilingual('इयत्ता ४ थी', 'Class 4')}</option>
                          <option value="इयत्ता ५ वी">{tBilingual('इयत्ता ५ वी', 'Class 5')}</option>
                          <option value="इयत्ता ६ वी">{tBilingual('इयत्ता ६ वी', 'Class 6')}</option>
                          <option value="इयत्ता ७ वी">{tBilingual('इयत्ता ७ वी', 'Class 7')}</option>
                        </select>
                      </div>

                      {/* Parent Name */}
                      <div>
                        <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                          {tBilingual('पालक / आई-वडिलांचे नाव', 'Parent / Guardian Name')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.parentName}
                          onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                          placeholder={tBilingual('उदा. सचिन तुकाराम पाटील', 'e.g. Sachin Tukaram Patil')}
                          className="w-full text-xs px-3 py-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                        />
                      </div>

                      {/* Parent Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                          {tBilingual('मोबाईल क्रमांक', 'Mobile Phone Number')} *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.parentPhone}
                          onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                          placeholder="9823456789"
                          maxLength={10}
                          className="w-full text-xs px-3 py-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                        />
                      </div>

                      {/* Previous School */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                          {tBilingual('यापूर्वीचे अंगणवाडी किंवा शाळेचे नाव (ऐच्छिक)', 'Previous Anganwadi or School (Optional)')}
                        </label>
                        <input
                          type="text"
                          value={formData.previousSchool}
                          onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                          placeholder={tBilingual('उदा. अंगणवाडी क्र. २, हिंगोणे बु.', 'e.g. Anganwadi No. 2, Hingone BK')}
                          className="w-full text-xs px-3 py-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                        />
                      </div>

                      {/* Residential Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                          {tBilingual('निवासी पत्ता', 'Residential Address')} *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={formData.residentialAddress}
                          onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                          placeholder={tBilingual('मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव', 'At Post Hingone BK, Tal. Dharangaon, Dist. Jalgaon')}
                          className="w-full text-xs px-3 py-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full font-bold shadow-md"
                        isLoading={loading}
                        rightIcon={<Send className="w-4 h-4" />}
                      >
                        {tBilingual('प्रवेश अर्ज सबमिट करा', 'Submit Admission Application')}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </Card>
          </div>

          {/* Reference Lookup Side Panel */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-border-green dark:border-dark-border p-6 space-y-4 bg-white dark:bg-dark-card">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-main-text dark:text-dark-text">
                  {tBilingual('अर्जाची स्थिती तपासा', 'Track Application Status')}
                </h3>
              </div>
              <p className="text-xs text-muted-text dark:text-dark-muted">
                {tBilingual(
                  'आपणास मिळालेला संदर्भ क्रमांक (उदा. ADM-2026-0001) टाकून अर्जाची सद्यस्थिती तपासा.',
                  'Enter your application tracking number (e.g. ADM-2026-0001) to verify processing state.'
                )}
              </p>

              {lookupError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg">
                  {lookupError}
                </div>
              )}

              <form onSubmit={handleLookup} className="space-y-3">
                <input
                  type="text"
                  required
                  value={lookupNo}
                  onChange={(e) => setLookupNo(e.target.value)}
                  placeholder="ADM-2026-XXXX"
                  className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg font-mono uppercase bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                />

                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  isLoading={lookupLoading}
                >
                  {tBilingual('स्थिती शोधा', 'Check Status')}
                </Button>
              </form>

              {lookupResult && (
                <div className="p-4 bg-light-green dark:bg-dark-secondary border border-border-green dark:border-dark-border rounded-xl text-xs space-y-2 mt-3 animate-in fade-in">
                  <div className="flex justify-between">
                    <span className="text-muted-text dark:text-dark-muted">{tBilingual('अर्ज क्रमांक:', 'Application No:')}</span>
                    <span className="font-mono font-bold text-primary-green dark:text-emerald-400">{lookupResult.applicationNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text dark:text-dark-muted">{tBilingual('विद्यार्थी नाव:', 'Student Name:')}</span>
                    <span className="font-semibold text-main-text dark:text-dark-text">{lookupResult.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text dark:text-dark-muted">{tBilingual('इयत्ता:', 'Standard:')}</span>
                    <span>{lookupResult.gradeApplying}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border-green dark:border-dark-border">
                    <span className="text-muted-text dark:text-dark-muted font-semibold">{tBilingual('सद्यस्थिती:', 'Status:')}</span>
                    <span className="bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 font-bold px-2 py-0.5 rounded text-[11px]">
                      {lookupResult.status === 'Pending' ? tBilingual('प्रलंबित', 'Pending') : lookupResult.status}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* School Help Box */}
            <Card className="border border-border-green dark:border-dark-border p-6 space-y-2 bg-[#E2EFE7]/30 dark:bg-dark-card">
              <span className="text-xs font-bold text-primary-green dark:text-emerald-400">
                {tBilingual('प्रवेश साहाय्य कक्ष', 'Admission Help Desk')}
              </span>
              <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
                {tBilingual(
                  'ऑनलाइन अर्जाबाबत काही अडचण असल्यास शाळेत सकाळी १० ते ५ या वेळेत प्रत्यक्ष येऊन विनामूल्य अर्ज भरून घेऊ शकता.',
                  'For offline admission or document assistance, please visit the school office Monday to Friday from 10:00 AM to 5:00 PM.'
                )}
              </p>
              <div className="text-xs font-semibold text-main-text dark:text-dark-text pt-1">
                📞 {tBilingual('संपर्क:', 'Contact:')} +91 98234 56789
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Receipt */}
      {confirmation && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border-4 border-primary-green/20 dark:border-dark-border animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <Badge variant="green" size="md">
                {tBilingual('प्रवेश अर्ज यशस्वी!', 'Application Submitted Successfully!')}
              </Badge>
              <h3 className="text-xl font-black text-main-text dark:text-dark-text">
                {tBilingual('ऑनलाइन प्रवेश नोंदणी पावती', 'Online Admission Registration Slip')}
              </h3>
              <p className="text-xs text-muted-text dark:text-dark-muted">
                {tBilingual('जि. प. प्राथमिक शाळा, हिंगोणे बु. • शैक्षणिक सत्र २०२६-२७', 'ZP Primary School Hingone BK • Academic Session 2026-27')}
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-light-green dark:bg-dark-secondary p-4 rounded-xl border border-border-green dark:border-dark-border text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-border-green dark:border-dark-border">
                <span className="text-muted-text dark:text-dark-muted font-semibold">
                  {tBilingual('नोंदणी संदर्भ क्रमांक:', 'Application Reference No:')}
                </span>
                <span className="text-sm font-black text-primary-green dark:text-emerald-400 font-mono">
                  {confirmation.applicationNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-text dark:text-dark-muted">{tBilingual('विद्यार्थ्याचे नाव:', 'Student Name:')}</span>
                <span className="font-semibold text-main-text dark:text-dark-text">{confirmation.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-text dark:text-dark-muted">{tBilingual('प्रवेश इयत्ता:', 'Standard:')}</span>
                <span className="font-semibold text-main-text dark:text-dark-text">{confirmation.gradeApplying}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-text dark:text-dark-muted">{tBilingual('पालकांचे नाव:', 'Parent / Guardian:')}</span>
                <span className="text-main-text dark:text-dark-text">{confirmation.parentName}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border-green dark:border-dark-border">
                <span className="text-muted-text dark:text-dark-muted">{tBilingual('अर्ज स्थिती:', 'Status:')}</span>
                <span className="bg-saffron-orange/20 text-saffron-orange font-bold px-2 py-0.5 rounded text-[11px]">
                  {tBilingual('प्रलंबित - कागदपत्र पडताळणी', 'Pending - Verification Underway')}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-text dark:text-dark-muted text-center leading-relaxed">
              {tBilingual(
                'कृपया हा संदर्भ क्रमांक नोंदवून ठेवावा. मूळ कागदपत्रांसह शाळेत प्रत्यक्ष येऊन पडताळणी पूर्ण करावी.',
                'Please preserve this reference tracking number. Visit the school office with original documents for verification.'
              )}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={printReceipt}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                {tBilingual('पावती प्रिंट करा', 'Print Slip')}
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => setConfirmation(null)}
              >
                {tBilingual('पूर्ण झाले', 'Done')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
