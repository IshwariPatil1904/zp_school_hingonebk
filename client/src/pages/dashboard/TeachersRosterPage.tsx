import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { api } from '../../lib/api';
import { TeacherData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Users2,
  UserPlus,
  ShieldCheck,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Eye,
  EyeOff,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HeartPulse,
  Award,
  FileText,
  Calendar,
  MapPin,
  Building2,
  UserCheck,
  Sparkles,
  Filter,
  Search,
  RefreshCw,
  X,
  Lock,
  Briefcase,
  Activity,
  KeyRound,
  IdCard,
} from 'lucide-react';

export const TeachersRosterPage: React.FC = () => {
  const { user, isPrincipal } = useAuth();
  const { t, tBilingual, language } = useLanguage();

  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedExp, setSelectedExp] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Teacher for Detailed View / Modal
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'health'>('personal');
  const [showAadhaar, setShowAadhaar] = useState(false);

  // Edit Teacher State (Principal or Self)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<TeacherData>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Add Teacher Modal (Principal Only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeacherData, setNewTeacherData] = useState({
    name: '',
    gender: 'Female',
    dateOfBirth: '1988-06-15',
    bloodGroup: 'B+',
    contactPhone: '',
    email: '',
    aadhaarNumber: '',
    residentialAddress: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव - ४२५१०५',
    employeeId: '',
    designation: 'प्राथमिक शिक्षक (Primary Teacher)',
    qualification: 'B.A., B.Ed.',
    joiningDate: '2016-06-15',
    assignedClasses: ['वर्ग १ ली', 'वर्ग २ री'],
    subjectSpecialization: ['मराठी', 'गणित'],
    experienceYears: 8,
    medicalFitness: 'Fit',
    emergencyContactName: '',
    emergencyContactPhone: '',
    createLoginAccount: true,
    username: '',
    password: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Fetch Teachers
  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedSubject !== 'ALL') params.subject = selectedSubject;
      if (selectedExp === '5+') params.minExp = 5;
      if (selectedExp === '10+') params.minExp = 10;
      if (selectedExp === '15+') params.minExp = 15;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/portal/teachers', { params });
      if (res.data?.success) {
        setTeachers(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch teachers:', err);
      setError(err.response?.data?.message || 'शिक्षकांची यादी आणताना त्रुटी उद्भवली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [selectedSubject, selectedExp]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeachers();
  };

  // Open Detailed Modal
  const openTeacherDetails = (teacher: TeacherData) => {
    setSelectedTeacher(teacher);
    setEditFormData({ ...teacher });
    setIsEditMode(false);
    setShowAadhaar(false);
    setActiveTab('personal');
    setIsDetailOpen(true);
  };

  // Save Teacher Updates (Principal full update OR Teacher permitted fields)
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setSaveLoading(true);
    setError(null);
    try {
      const res = await api.put(`/portal/teachers/${selectedTeacher._id}`, editFormData);
      if (res.data?.success) {
        setSuccessMessage(res.data.message || 'शिक्षकांचे तपशील यशस्वीरीत्या अद्ययावत केले!');
        setSelectedTeacher(res.data.data);
        setIsEditMode(false);
        fetchTeachers();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Update teacher error:', err);
      setError(err.response?.data?.message || 'माहिती अद्ययावत करताना त्रुटी आली.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Add New Teacher (Principal only)
  const handleAddTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    if (!newTeacherData.name || !newTeacherData.employeeId || !newTeacherData.email) {
      setAddError('कृपया नाव, सेवाार्थ ओळख क्र. आणि ईमेल भरा.');
      setAddLoading(false);
      return;
    }

    if (newTeacherData.createLoginAccount && (!newTeacherData.username || !newTeacherData.password)) {
      setAddError('स्टाफ लॉगिन तयार करण्यासाठी युझरनेम व पासवर्ड आवश्यक आहे.');
      setAddLoading(false);
      return;
    }

    try {
      const res = await api.post('/portal/teachers', newTeacherData);
      if (res.data?.success) {
        setSuccessMessage(`नवीन शिक्षक '${res.data.data?.name}' यशस्वीरीत्या नोंदणीकृत झाले.`);
        setIsAddModalOpen(false);
        fetchTeachers();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Register teacher error:', err);
      setAddError(err.response?.data?.message || 'शिक्षक नोंदणी करताना त्रुटी आली.');
    } finally {
      setAddLoading(false);
    }
  };

  // Quick stats
  const stats = useMemo(() => {
    const total = teachers.length;
    const avgExp =
      total > 0
        ? Math.round(teachers.reduce((acc, t) => acc + (t.experienceYears || 0), 0) / total)
        : 0;
    const linkedAccounts = teachers.filter((t) => t.linkedUserId).length;
    return { total, avgExp, linkedAccounts };
  }, [teachers]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-saffron-orange text-white uppercase tracking-wider">
              {isPrincipal ? tBilingual('मुख्याध्यापक विशेष अधिकार', 'Principal Authority') : tBilingual('कर्मचारी यादी', 'Staff Roster')}
            </span>
            <span className="text-xs text-muted-text dark:text-dark-muted font-medium">
              {tBilingual('जि. प. प्राथमिक शाळा हिंगोणे बु.', 'ZP Primary School Hingone BK')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-main-text dark:text-dark-text mt-1">
            {tBilingual('शिक्षक व कर्मचारी यादी', 'Teacher Staff Roster')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-dark-muted">
            {tBilingual(
              'मान्यताप्राप्त प्राथमिक शिक्षक, सेवानिहाय तपशील, विषय विशेषीकरण व संपर्क माहिती',
              'Approved faculty profiles, qualifications, subject assignments, and contact details'
            )}
          </p>
        </div>

        {isPrincipal && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="shadow-sm"
          >
            {tBilingual('नवीन शिक्षक नोंदणी', 'Add New Teacher')}
          </Button>
        )}
      </div>

      {/* Global Notifications */}
      {successMessage && (
        <div className="p-3 bg-[#E2EFE7] dark:bg-emerald-950/40 border border-primary-green/30 dark:border-emerald-700 text-primary-green dark:text-emerald-400 text-xs sm:text-sm rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs sm:text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-card border border-border-green dark:border-dark-border rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-light-green dark:bg-dark-secondary text-primary-green dark:text-emerald-400 flex items-center justify-center font-bold">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-text dark:text-dark-muted block">
              {tBilingual('एकूण शिक्षक', 'Total Faculty')}
            </span>
            <span className="text-xl font-bold text-main-text dark:text-dark-text">
              {stats.total} {tBilingual('शिक्षक', 'Teachers')}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border-green dark:border-dark-border rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-[#FFF8E7] dark:bg-amber-950/40 text-saffron-orange flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-text dark:text-dark-muted block">
              {tBilingual('सरासरी अनुभव', 'Avg. Experience')}
            </span>
            <span className="text-xl font-bold text-main-text dark:text-dark-text">
              {stats.avgExp} {tBilingual('वर्षे', 'Years')}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border-green dark:border-dark-border rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-[#E2EFE7] dark:bg-emerald-950/50 text-primary-green dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-text dark:text-dark-muted block">
              {tBilingual('सक्रिय पोर्टल खाती', 'Active Portal Logins')}
            </span>
            <span className="text-xl font-bold text-main-text dark:text-dark-text">
              {stats.linkedAccounts} {tBilingual('कर्मचारी', 'Staff')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-muted-text dark:text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={tBilingual(
                'शिक्षकांचे नाव, सेवाार्थ ओळख क्रमांक (Sevaarth ID) किंवा पदवी शोधा...',
                'Search teacher name, Sevaarth ID, or qualification...'
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text placeholder-muted-text dark:placeholder-dark-muted"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            {/* Subject Filter */}
            <div className="flex items-center gap-1.5 bg-light-green/60 dark:bg-dark-secondary px-2.5 py-1.5 rounded-lg border border-border-green dark:border-dark-border">
              <BookOpen className="w-3.5 h-3.5 text-primary-green dark:text-saffron-orange" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent text-xs font-medium text-main-text dark:text-dark-text focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-dark-card">{tBilingual('सर्व विषय', 'All Subjects')}</option>
                <option value="मराठी" className="dark:bg-dark-card">{tBilingual('मराठी', 'Marathi')}</option>
                <option value="गणित" className="dark:bg-dark-card">{tBilingual('गणित', 'Math')}</option>
                <option value="इंग्रजी" className="dark:bg-dark-card">{tBilingual('इंग्रजी', 'English')}</option>
                <option value="विज्ञान" className="dark:bg-dark-card">{tBilingual('विज्ञान', 'Science')}</option>
                <option value="सामाजिक शास्त्रे" className="dark:bg-dark-card">{tBilingual('सामाजिक शास्त्रे', 'Social Studies')}</option>
                <option value="कला व कार्यानुभव" className="dark:bg-dark-card">{tBilingual('कला व कार्यानुभव', 'Arts & Craft')}</option>
                <option value="शारीरिक शिक्षण" className="dark:bg-dark-card">{tBilingual('शारीरिक शिक्षण', 'Physical Education')}</option>
              </select>
            </div>

            {/* Experience Filter */}
            <div className="flex items-center gap-1.5 bg-light-green/60 dark:bg-dark-secondary px-2.5 py-1.5 rounded-lg border border-border-green dark:border-dark-border">
              <GraduationCap className="w-3.5 h-3.5 text-primary-green dark:text-saffron-orange" />
              <select
                value={selectedExp}
                onChange={(e) => setSelectedExp(e.target.value)}
                className="bg-transparent text-xs font-medium text-main-text dark:text-dark-text focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-dark-card">{tBilingual('सर्व अनुभव', 'All Experience')}</option>
                <option value="5+" className="dark:bg-dark-card">{tBilingual('५+ वर्षे अनुभव', '5+ Years Experience')}</option>
                <option value="10+" className="dark:bg-dark-card">{tBilingual('१०+ वर्षे अनुभव', '10+ Years Experience')}</option>
                <option value="15+" className="dark:bg-dark-card">{tBilingual('१५+ वर्षे अनुभव', '15+ Years Experience')}</option>
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchTeachers}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              {tBilingual('रिफ्रेश', 'Refresh')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Teachers Roster Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-text dark:text-dark-muted text-sm bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-green dark:text-saffron-orange" />
          <span>{tBilingual('शिक्षक माहिती लोड होत आहे...', 'Loading faculty records...')}</span>
        </div>
      ) : teachers.length === 0 ? (
        <div className="p-12 text-center text-muted-text dark:text-dark-muted text-sm bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border">
          <Users2 className="w-8 h-8 text-muted-text/50 dark:text-dark-muted/50 mx-auto mb-2" />
          <p className="font-medium text-main-text dark:text-dark-text">
            {tBilingual('कोणतेही शिक्षक आढळले नाहीत.', 'No teachers found.')}
          </p>
          <p className="text-xs mt-1">
            {tBilingual('कृपया शोध निकष किंवा फिल्टर्स बदलून पुन्हा प्रयत्न करा.', 'Try adjusting your search criteria or filters.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((t) => {
            const hasLogin = !!t.linkedUserId;
            return (
              <Card
                key={t._id}
                className="border border-border-green dark:border-dark-border dark:bg-dark-card hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Card Header: Avatar & Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-green text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-main-text dark:text-dark-text leading-tight">{t.name}</h3>
                        <p className="text-xs text-muted-text dark:text-dark-muted">{t.designation}</p>
                        <span className="text-[10px] font-mono font-bold text-primary-green dark:text-emerald-400 bg-[#E2EFE7] dark:bg-emerald-950/50 px-2 py-0.5 rounded mt-0.5 inline-block">
                          {t.employeeId}
                        </span>
                      </div>
                    </div>

                    <Badge variant={t.isActive ? 'green' : 'neutral'} size="sm">
                      {t.isActive ? tBilingual('सक्रिय', 'Active') : tBilingual('अक्रिय', 'Inactive')}
                    </Badge>
                  </div>

                  {/* Summary details */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs pt-3 border-t border-border-green dark:border-dark-border">
                    <div>
                      <span className="text-muted-text dark:text-dark-muted block text-[11px]">
                        {tBilingual('पात्रता:', 'Qualification:')}
                      </span>
                      <span className="text-main-text dark:text-dark-text font-semibold">{t.qualification}</span>
                    </div>

                    <div>
                      <span className="text-muted-text dark:text-dark-muted block text-[11px]">
                        {tBilingual('अनुभव:', 'Experience:')}
                      </span>
                      <span className="text-main-text dark:text-dark-text font-semibold">
                        {t.experienceYears} {tBilingual('वर्षे', 'Years')}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-text dark:text-dark-muted block text-[11px]">
                        {tBilingual('मोबाईल क्र.:', 'Mobile Phone:')}
                      </span>
                      <span className="text-main-text dark:text-dark-text font-medium">{t.contactPhone}</span>
                    </div>

                    <div>
                      <span className="text-muted-text dark:text-dark-muted block text-[11px]">
                        {tBilingual('रक्तगट:', 'Blood Group:')}
                      </span>
                      <span className="text-main-text dark:text-dark-text font-bold text-red-600 dark:text-red-400">{t.bloodGroup}</span>
                    </div>
                  </div>

                  {/* Subjects & Classes */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-muted-text dark:text-dark-muted block text-[11px] font-semibold">
                      {tBilingual('अध्यापन विषय:', 'Teaching Subjects:')}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {t.subjectSpecialization && t.subjectSpecialization.length > 0 ? (
                        t.subjectSpecialization.map((subj, idx) => (
                          <span
                            key={idx}
                            className="bg-light-green dark:bg-dark-secondary text-primary-green dark:text-emerald-400 border border-border-green dark:border-dark-border px-2 py-0.5 rounded text-[11px] font-medium"
                          >
                            {subj}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-text dark:text-dark-muted">
                          {tBilingual('सर्व प्राथमिक विषय', 'All primary subjects')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Classes */}
                  <div className="space-y-1.5">
                    <span className="text-muted-text dark:text-dark-muted block text-[11px] font-semibold">
                      {tBilingual('जबाबदारी वर्ग:', 'Assigned Classes:')}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {t.assignedClasses && t.assignedClasses.length > 0 ? (
                        t.assignedClasses.map((cls, idx) => (
                          <span
                            key={idx}
                            className="bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text border border-border-green dark:border-dark-border px-2 py-0.5 rounded text-[11px] font-semibold"
                          >
                            {cls}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-text dark:text-dark-muted">
                          {tBilingual('वर्ग १ ते ७', 'Classes 1 to 7')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Login Account Indicator */}
                  <div className="pt-2 border-t border-border-green dark:border-dark-border flex items-center justify-between text-xs">
                    <span className="text-muted-text dark:text-dark-muted text-[11px]">
                      {tBilingual('स्टाफ लॉगिन:', 'Staff Login:')}
                    </span>
                    {hasLogin ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary-green dark:text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> @{t.linkedUserId?.username}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-text dark:text-dark-muted italic">
                        {tBilingual('खाते तयार नाही', 'No account linked')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: View Profile Button */}
                <div className="px-5 py-3 bg-[#F4F7F4]/50 dark:bg-dark-secondary/50 border-t border-border-green dark:border-dark-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-text dark:text-dark-muted">
                    {tBilingual('रुजू:', 'Joined:')} {new Date(t.joiningDate).toLocaleDateString('mr-IN')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTeacherDetails(t)}
                    leftIcon={<FileText className="w-3.5 h-3.5 text-primary-green dark:text-saffron-orange" />}
                  >
                    {tBilingual('सविस्तर प्रोफाइल', 'View Profile')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TEACHER DETAILED PROFILE & EDIT MODAL                 */}
      {/* ======================================================== */}
      {isDetailOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-3xl w-full border border-border-green dark:border-dark-border shadow-2xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-dark-green text-white p-5 flex items-center justify-between border-b border-border-green dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-saffron-orange text-white font-extrabold flex items-center justify-center text-xl shadow">
                  {selectedTeacher.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedTeacher.name}</h3>
                    <Badge variant="orange" size="sm">
                      {selectedTeacher.employeeId}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/80">{selectedTeacher.designation}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPrincipal && !isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  >
                    {tBilingual('संपादित करा', 'Edit')}
                  </Button>
                )}
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border-green dark:border-dark-border bg-light-green/40 dark:bg-dark-secondary px-5 pt-3 gap-3">
              <button
                onClick={() => setActiveTab('personal')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'personal'
                    ? 'border-saffron-orange text-primary-green dark:text-saffron-orange'
                    : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text'
                }`}
              >
                <IdCard className="w-4 h-4" />
                <span>{tBilingual('१. वैयक्तिक माहिती', '1. Personal Details')}</span>
              </button>

              <button
                onClick={() => setActiveTab('professional')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'professional'
                    ? 'border-saffron-orange text-primary-green dark:text-saffron-orange'
                    : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>{tBilingual('२. व्यावसायिक तपशील', '2. Professional Details')}</span>
              </button>

              <button
                onClick={() => setActiveTab('health')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'health'
                    ? 'border-saffron-orange text-primary-green dark:text-saffron-orange'
                    : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                <span>{tBilingual('३. आरोग्य व आपत्कालीन', '3. Health & Emergency')}</span>
              </button>
            </div>

            {/* Form & Tab Content */}
            <form onSubmit={handleSaveTeacher}>
              <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
                {/* TAB 1: PERSONAL DETAILS */}
                {activeTab === 'personal' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          शिक्षकांचे पूर्ण नाव (Full Name) *
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="text"
                            required
                            value={editFormData.name || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          लिंग (Gender)
                        </label>
                        {isEditMode && isPrincipal ? (
                          <select
                            value={editFormData.gender || 'Female'}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, gender: e.target.value as any })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                          >
                            <option value="Female">महिला (Female)</option>
                            <option value="Male">पुरुष (Male)</option>
                            <option value="Other">इतर (Other)</option>
                          </select>
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.gender === 'Female' ? 'महिला' : 'पुरुष'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          जन्मतारीख (Date of Birth)
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="date"
                            value={
                              editFormData.dateOfBirth
                                ? new Date(editFormData.dateOfBirth).toISOString().split('T')[0]
                                : ''
                            }
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, dateOfBirth: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {new Date(selectedTeacher.dateOfBirth).toLocaleDateString('mr-IN')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          रक्तगट (Blood Group)
                        </label>
                        {isEditMode ? (
                          <select
                            value={editFormData.bloodGroup || 'B+'}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, bloodGroup: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                          >
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        ) : (
                          <p className="text-sm font-bold text-red-600 bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.bloodGroup}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          मोबाईल क्रमांक (Contact Phone) *
                        </label>
                        {isEditMode ? (
                          <input
                            type="tel"
                            required
                            value={editFormData.contactPhone || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, contactPhone: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.contactPhone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          ईमेल पत्ता (Official Email) *
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="email"
                            required
                            value={editFormData.email || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-main-text">
                            आधार क्रमांक (Aadhaar Number)
                          </label>
                          {isPrincipal && (
                            <button
                              type="button"
                              onClick={() => setShowAadhaar(!showAadhaar)}
                              className="text-[10px] text-primary-green hover:underline flex items-center gap-1 font-semibold"
                            >
                              {showAadhaar ? (
                                <>
                                  <EyeOff className="w-3 h-3" /> लपवा (Mask)
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" /> पहा (Unmask)
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="text"
                            value={editFormData.aadhaarNumber || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green font-mono"
                          />
                        ) : (
                          <p className="text-sm font-mono font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green flex items-center justify-between">
                            <span>
                              {showAadhaar
                                ? selectedTeacher.aadhaarNumber
                                : `•••• •••• ${selectedTeacher.aadhaarNumber.slice(-4)}`}
                            </span>
                            <Lock className="w-3.5 h-3.5 text-muted-text" />
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-main-text mb-1">
                        निवासी पत्ता (Residential Address)
                      </label>
                      {isEditMode ? (
                        <textarea
                          rows={2}
                          value={editFormData.residentialAddress || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, residentialAddress: e.target.value })
                          }
                          className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                        />
                      ) : (
                        <p className="text-sm text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                          {selectedTeacher.residentialAddress}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: PROFESSIONAL DETAILS */}
                {activeTab === 'professional' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          सेवाार्थ ओळख क्र. (Sevaarth / Employee ID) *
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="text"
                            required
                            value={editFormData.employeeId || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, employeeId: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green font-mono uppercase"
                          />
                        ) : (
                          <p className="text-sm font-mono font-bold text-primary-green bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.employeeId}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          हुद्दा व पद (Designation)
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="text"
                            value={editFormData.designation || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, designation: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.designation}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          शैक्षणिक पात्रता (Qualification)
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="text"
                            value={editFormData.qualification || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, qualification: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.qualification}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          शाळा रुजू दिनांक (Joining Date)
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="date"
                            value={
                              editFormData.joiningDate
                                ? new Date(editFormData.joiningDate).toISOString().split('T')[0]
                                : ''
                            }
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, joiningDate: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {new Date(selectedTeacher.joiningDate).toLocaleDateString('mr-IN')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          एकूण सेवा अनुभव (Years of Experience)
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={editFormData.experienceYears || 0}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                experienceYears: Number(e.target.value),
                              })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.experienceYears} वर्षे
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          स्टाफ लॉगिन खाते (Linked User Account)
                        </label>
                        <div className="bg-light-green/40 px-3 py-2 rounded-lg border border-border-green flex items-center justify-between text-xs">
                          {selectedTeacher.linkedUserId ? (
                            <span className="font-mono text-primary-green font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4" /> @{selectedTeacher.linkedUserId.username} (सक्रिय)
                            </span>
                          ) : (
                            <span className="text-muted-text italic">कोणतेही लॉगिन खाते जोडलेले नाही</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Classes and Subjects */}
                    <div className="pt-2 border-t border-border-green space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          नेमून दिलेले वर्ग (Assigned Classes)
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="text"
                            placeholder="स्वल्पविरामाने वेगळे करा (उदा. वर्ग १ ली, वर्ग २ री 'अ')"
                            value={editFormData.assignedClasses?.join(', ') || ''}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                assignedClasses: e.target.value.split(',').map((s) => s.trim()),
                              })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1.5 bg-light-green/40 p-3 rounded-lg border border-border-green">
                            {selectedTeacher.assignedClasses?.map((cls, idx) => (
                              <span
                                key={idx}
                                className="bg-white text-primary-green font-semibold border border-border-green px-2.5 py-1 rounded text-xs"
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          अध्यापन विषय (Subject Specialization)
                        </label>
                        {isEditMode && isPrincipal ? (
                          <input
                            type="text"
                            placeholder="स्वल्पविरामाने वेगळे करा (उदा. मराठी, गणित, इंग्रजी)"
                            value={editFormData.subjectSpecialization?.join(', ') || ''}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                subjectSpecialization: e.target.value.split(',').map((s) => s.trim()),
                              })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1.5 bg-light-green/40 p-3 rounded-lg border border-border-green">
                            {selectedTeacher.subjectSpecialization?.map((subj, idx) => (
                              <span
                                key={idx}
                                className="bg-primary-green text-white font-medium px-2.5 py-1 rounded text-xs"
                              >
                                {subj}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: HEALTH & EMERGENCY */}
                {activeTab === 'health' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          वैद्यकीय पात्रता दर्जा (Medical Fitness)
                        </label>
                        {isEditMode && isPrincipal ? (
                          <select
                            value={editFormData.medicalFitness || 'Fit'}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, medicalFitness: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                          >
                            <option value="Fit">सक्षम (Fit)</option>
                            <option value="Under Observation">निरीक्षणाखाली (Under Observation)</option>
                            <option value="Exempted">सूट दिलेले (Exempted)</option>
                          </select>
                        ) : (
                          <p className="text-sm font-semibold text-primary-green bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.medicalFitness || 'Fit'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          रक्तगट (Blood Group)
                        </label>
                        <p className="text-sm font-bold text-red-600 bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                          {selectedTeacher.bloodGroup}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          आपत्कालीन संपर्क व्यक्ती (Emergency Contact Name)
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={editFormData.emergencyContactName || ''}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                emergencyContactName: e.target.value,
                              })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.emergencyContactName || 'उपलब्ध नाही'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-main-text mb-1">
                          आपत्कालीन संपर्क फोन (Emergency Phone)
                        </label>
                        {isEditMode ? (
                          <input
                            type="tel"
                            value={editFormData.emergencyContactPhone || ''}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                emergencyContactPhone: e.target.value,
                              })
                            }
                            className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        ) : (
                          <p className="text-sm font-medium text-main-text bg-light-green/40 px-3 py-2 rounded-lg border border-border-green">
                            {selectedTeacher.emergencyContactPhone || 'उपलब्ध नाही'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-[#F4F7F4] dark:bg-dark-secondary p-4 border-t border-border-green dark:border-dark-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailOpen(false)}
                >
                  {tBilingual('बंद करा', 'Close')}
                </Button>

                {isEditMode && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditMode(false)}
                    >
                      {tBilingual('रद्द करा', 'Cancel')}
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={saveLoading}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      {tBilingual('बदल जतन करा', 'Save Changes')}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ADD NEW TEACHER MODAL (PRINCIPAL ONLY)                 */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-2xl w-full border border-border-green dark:border-dark-border shadow-2xl my-8 overflow-hidden">
            <div className="bg-dark-green text-white p-5 flex items-center justify-between border-b border-border-green dark:border-dark-border">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-saffron-orange" />
                <div>
                  <h3 className="text-lg font-bold">नवीन शिक्षक नोंदणी (Register New Faculty)</h3>
                  <p className="text-xs text-white/80">प्राथमिक शिक्षक तपशील व कर्मचारी पोर्टल खाते निर्मिती</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddTeacherSubmit}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <h4 className="text-xs font-bold text-primary-green uppercase tracking-wider pb-1 border-b border-border-green">
                  १. वैयक्तिक तपशील (Personal Details)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-main-text mb-1">
                      शिक्षकांचे पूर्ण नाव (Teacher Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. सौ. अनिता रमेश पाटील"
                      value={newTeacherData.name}
                      onChange={(e) => setNewTeacherData({ ...newTeacherData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-main-text mb-1">लिंग (Gender) *</label>
                    <select
                      value={newTeacherData.gender}
                      onChange={(e) => setNewTeacherData({ ...newTeacherData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                    >
                      <option value="Female">महिला (Female)</option>
                      <option value="Male">पुरुष (Male)</option>
                      <option value="Other">इतर (Other)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-main-text mb-1">
                      मोबाईल क्रमांक (Mobile Number) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="९८२३४५६७८९"
                      value={newTeacherData.contactPhone}
                      onChange={(e) =>
                        setNewTeacherData({ ...newTeacherData, contactPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-main-text mb-1">
                      ईमेल पत्ता (Official Email) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="anita.patil@zphingone.edu.in"
                      value={newTeacherData.email}
                      onChange={(e) =>
                        setNewTeacherData({ ...newTeacherData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-main-text mb-1">
                      आधार क्रमांक (Aadhaar Number)
                    </label>
                    <input
                      type="text"
                      placeholder="१२ अंकी आधार क्र."
                      value={newTeacherData.aadhaarNumber}
                      onChange={(e) =>
                        setNewTeacherData({ ...newTeacherData, aadhaarNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-main-text mb-1">रक्तगट (Blood Group)</label>
                    <select
                      value={newTeacherData.bloodGroup}
                      onChange={(e) =>
                        setNewTeacherData({ ...newTeacherData, bloodGroup: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                    >
                      <option value="B+">B+</option>
                      <option value="A+">A+</option>
                      <option value="O+">O+</option>
                      <option value="AB+">AB+</option>
                      <option value="B-">B-</option>
                      <option value="A-">A-</option>
                      <option value="O-">O-</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-primary-green uppercase tracking-wider pt-2 pb-1 border-b border-border-green">
                  २. व्यावसायिक तपशील (Professional Details)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-main-text mb-1">
                      सेवाार्थ ओळख क्रमांक (Sevaarth ID) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="SEV-2018-0912"
                      value={newTeacherData.employeeId}
                      onChange={(e) =>
                        setNewTeacherData({ ...newTeacherData, employeeId: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-main-text mb-1">
                      शैक्षणिक पात्रता (Qualification) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="M.A., B.Ed."
                      value={newTeacherData.qualification}
                      onChange={(e) =>
                        setNewTeacherData({ ...newTeacherData, qualification: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-main-text mb-1">
                      अनुभव वर्षे (Experience Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="45"
                      value={newTeacherData.experienceYears}
                      onChange={(e) =>
                        setNewTeacherData({
                          ...newTeacherData,
                          experienceYears: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-main-text mb-1">
                      शाळा रुजू दिनांक (Joining Date)
                    </label>
                    <input
                      type="date"
                      value={newTeacherData.joiningDate}
                      onChange={(e) =>
                        setNewTeacherData({ ...newTeacherData, joiningDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>
                </div>

                {/* Account Linking Checkbox */}
                <div className="pt-3 border-t border-border-green">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="createLoginAccount"
                      checked={newTeacherData.createLoginAccount}
                      onChange={(e) =>
                        setNewTeacherData({
                          ...newTeacherData,
                          createLoginAccount: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary-green rounded border-border-green focus:ring-primary-green"
                    />
                    <label
                      htmlFor="createLoginAccount"
                      className="text-xs font-bold text-main-text cursor-pointer flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-saffron-orange" />
                      कर्मचारी पोर्टल लॉगिन खाते तयार करा (Create Staff Portal Login)
                    </label>
                  </div>

                  {newTeacherData.createLoginAccount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-light-green/60 p-3 rounded-lg border border-border-green mt-2">
                      <div>
                        <label className="block font-semibold text-main-text mb-1">
                          लॉगिन युझरनेम (Username) *
                        </label>
                        <input
                          type="text"
                          required={newTeacherData.createLoginAccount}
                          placeholder="उदा. patil.anita"
                          value={newTeacherData.username}
                          onChange={(e) =>
                            setNewTeacherData({ ...newTeacherData, username: e.target.value.toLowerCase() })
                          }
                          className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-main-text mb-1">
                          प्रारंभिक पासवर्ड (Initial Password) *
                        </label>
                        <input
                          type="password"
                          required={newTeacherData.createLoginAccount}
                          placeholder="किमान ८ अक्षरे"
                          value={newTeacherData.password}
                          onChange={(e) =>
                            setNewTeacherData({ ...newTeacherData, password: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="bg-[#F4F7F4] p-4 border-t border-border-green flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  रद्द करा (Cancel)
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={addLoading}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  शिक्षक नोंदणी पूर्ण करा (Register Teacher)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersRosterPage;
