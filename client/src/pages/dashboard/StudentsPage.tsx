import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { StudentData } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Save,
  Phone,
  Home,
  GraduationCap,
  Landmark,
  HeartPulse,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { isPrincipal, isTeacher, user } = useAuth();
  const { t, tBilingual, language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Table & Filter States
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(12);

  // Filters
  const [search, setSearch] = useState('');
  const [standardFilter, setStandardFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [myClassesOnly, setMyClassesOnly] = useState(false);

  // Profile Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<StudentData>>({});
  const [unmaskAadhaar, setUnmaskAadhaar] = useState(false);
  const [unmaskBank, setUnmaskBank] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // New Admission Modal State (Principal Only)
  const [newAdmissionOpen, setNewAdmissionOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState<Partial<StudentData>>({
    name: '',
    gender: 'मुलगा',
    currentStandard: 'इयत्ता १ ली',
    division: 'A',
    category: 'OBC',
    motherTongue: 'मराठी',
    religion: 'हिंदू',
    caste: 'लेवा पाटील',
    bloodGroup: 'B+',
    fatherName: '',
    motherName: '',
    guardianName: '',
    parentsOccupation: 'शेतकरी / शेतमजूर',
    annualFamilyIncome: 45000,
    isBpl: false,
    minorityStatus: 'None',
    houseNumber: 'घर क्र. १',
    village: 'हिंगोणे बु.',
    taluka: 'धरणगाव',
    district: 'जळगाव',
    pincode: '425105',
    primaryPhone: '',
    dateOfBirth: '2020-05-15',
    studentType: 'Fresher',
    mediumOfInstruction: 'मराठी',
    bankName: 'बँक ऑफ महाराष्ट्र',
    bankAccountNumber: '',
    bankIfsc: 'MAHB0000412',
    isCwsn: false,
    heightCm: 110,
    weightKg: 18,
  });

  const fetchStudents = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      standard: standardFilter,
      division: divisionFilter,
      gender: genderFilter,
      category: categoryFilter,
      myClassesOnly: myClassesOnly.toString(),
    });

    api
      .get(`/portal/students?${params.toString()}`)
      .then((res) => {
        if (res.data?.success) {
          setStudents(res.data.data);
          setTotalStudents(res.data.total);
          setTotalPages(res.data.totalPages);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [page, limit, standardFilter, divisionFilter, genderFilter, categoryFilter, myClassesOnly]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Open detailed profile modal
  const openStudentProfile = async (studentId: string) => {
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    setIsEditing(false);
    setUnmaskAadhaar(false);
    setUnmaskBank(false);

    try {
      const res = await api.get(`/portal/students/${studentId}`);
      if (res.data?.success) {
        setSelectedStudent(res.data.data);
        setEditFormData(res.data.data);
        setModalOpen(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error loading student profile');
    }
  };

  // Toggle Unmasking
  const toggleAadhaarUnmask = async () => {
    if (!unmaskAadhaar && selectedStudent) {
      try {
        const res = await api.get(`/portal/students/${selectedStudent._id}?unmasked=true`);
        if (res.data?.success) {
          setSelectedStudent((prev) => (prev ? { ...prev, aadhaarNumber: res.data.data.aadhaarNumber } : null));
          setEditFormData((prev) => ({ ...prev, aadhaarNumber: res.data.data.aadhaarNumber }));
          setUnmaskAadhaar(true);
        }
      } catch (err) {
        setUnmaskAadhaar(!unmaskAadhaar);
      }
    } else {
      setUnmaskAadhaar(false);
    }
  };

  const toggleBankUnmask = async () => {
    if (!unmaskBank && selectedStudent) {
      try {
        const res = await api.get(`/portal/students/${selectedStudent._id}?unmasked=true`);
        if (res.data?.success) {
          setSelectedStudent((prev) => (prev ? { ...prev, bankAccountNumber: res.data.data.bankAccountNumber } : null));
          setEditFormData((prev) => ({ ...prev, bankAccountNumber: res.data.data.bankAccountNumber }));
          setUnmaskBank(true);
        }
      } catch (err) {
        setUnmaskBank(!unmaskBank);
      }
    } else {
      setUnmaskBank(false);
    }
  };

  // Save edited profile
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSavingStudent(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await api.put(`/portal/students/${selectedStudent._id}`, editFormData);
      if (res.data?.success) {
        setSaveSuccessMsg('विद्यार्थी माहिती यशस्वीरीत्या अद्ययावत केली (Changes saved to MongoDB)');
        setSelectedStudent(res.data.data);
        setIsEditing(false);
        fetchStudents();
      }
      setSavingStudent(false);
    } catch (err: any) {
      setSaveErrorMsg(err.response?.data?.message || 'विद्यार्थी माहिती जतन करताना त्रुटी आली.');
      setSavingStudent(false);
    }
  };

  // Handle new student admission submission (Principal Only)
  const handleNewAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudent(true);

    try {
      const res = await api.post('/portal/students', newStudentData);
      if (res.data?.success) {
        alert(res.data.message);
        setNewAdmissionOpen(false);
        fetchStudents();
      }
      setSavingStudent(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'प्रवेश नोंदणी अयशस्वी.');
      setSavingStudent(false);
    }
  };

  // Check if teacher can edit this specific student
  const canEditStudent =
    isPrincipal ||
    (isTeacher &&
      user?.teacherProfile?.assignedClasses?.includes(selectedStudent?.currentStandard || ''));

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-card p-5 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-green dark:text-emerald-400 uppercase tracking-wider">
              {tBilingual('विद्यार्थी माहिती प्रणाली', 'Student Information System')}
            </span>
            <span className="text-muted-text dark:text-dark-muted">•</span>
            <span className="text-xs text-muted-text dark:text-dark-muted">SARAL & UDISE+ Synchronized</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-main-text dark:text-dark-text mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-green dark:text-emerald-400" />
            {tBilingual('विद्यार्थी नोंदवही', 'Student Directory & Profiles')}
          </h2>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual(
              'इयत्ता १ ली ते ७ वी मधील सर्व विद्यार्थ्यांची संपूर्ण माहिती, जात प्रवर्ग, पत्ता, SARAL व बँक तपशील.',
              'Comprehensive student profiles, social categories, SARAL ID, attendance and bank records.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isTeacher && (
            <Button
              variant={myClassesOnly ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setMyClassesOnly(!myClassesOnly);
                setPage(1);
              }}
            >
              {myClassesOnly
                ? tBilingual('सर्व वर्ग पहा', 'Show All Classes')
                : tBilingual('माझे वर्ग', 'My Classes')}
            </Button>
          )}

          {isPrincipal && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setNewAdmissionOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              {tBilingual('नवीन प्रवेश नोंदवा', 'New Admission')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border-green dark:border-dark-border p-4 bg-white dark:bg-dark-card shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-muted-text dark:text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Search by name, GR No, SARAL ID, phone...'
                  : language === 'bilingual'
                  ? 'विद्यार्थ्याचे नाव, रजिस्टर नं. (Search name, GR, SARAL)...'
                  : 'विद्यार्थ्याचे नाव, रजिस्टर नंबर (GR), SARAL ID, फोन...'
              }
              className="w-full text-xs pl-9 pr-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-[#F4F7F4]/40 dark:bg-dark-bg/60 text-main-text dark:text-dark-text focus:bg-white dark:focus:bg-dark-bg focus:outline-none focus:ring-1 focus:ring-primary-green"
            />
          </div>

          {/* Standard Filter */}
          <div>
            <select
              value={standardFilter}
              onChange={(e) => {
                setStandardFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-main-text dark:text-dark-text font-medium"
            >
              <option value="ALL">{tBilingual('सर्व इयत्ता', 'All Standards')}</option>
              <option value="इयत्ता १ ली">{tBilingual('इयत्ता १ ली', 'Class 1')}</option>
              <option value="इयत्ता २ री">{tBilingual('इयत्ता २ री', 'Class 2')}</option>
              <option value="इयत्ता ३ री">{tBilingual('इयत्ता ३ री', 'Class 3')}</option>
              <option value="इयत्ता ४ थी">{tBilingual('इयत्ता ४ थी', 'Class 4')}</option>
              <option value="इयत्ता ५ वी">{tBilingual('इयत्ता ५ वी', 'Class 5')}</option>
              <option value="इयत्ता ६ वी">{tBilingual('इयत्ता ६ वी', 'Class 6')}</option>
              <option value="इयत्ता ७ वी">{tBilingual('इयत्ता ७ वी', 'Class 7')}</option>
            </select>
          </div>

          {/* Division Filter */}
          <div>
            <select
              value={divisionFilter}
              onChange={(e) => {
                setDivisionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-main-text dark:text-dark-text font-medium"
            >
              <option value="ALL">{tBilingual('सर्व तुकड्या', 'All Divisions')}</option>
              <option value="A">{tBilingual('तुकडी अ', 'Division A')}</option>
              <option value="B">{tBilingual('तुकडी ब', 'Division B')}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-main-text dark:text-dark-text font-medium"
            >
              <option value="ALL">{tBilingual('सर्व प्रवर्ग', 'All Categories')}</option>
              <option value="General">{tBilingual('खुला', 'General')}</option>
              <option value="OBC">{tBilingual('इतर मागासवर्गीय (OBC)', 'Other Backward Class (OBC)')}</option>
              <option value="SC">{tBilingual('अनुसूचित जाती (SC)', 'Scheduled Caste (SC)')}</option>
              <option value="ST">{tBilingual('अनुसूचित जमाती (ST)', 'Scheduled Tribe (ST)')}</option>
              <option value="NT">{tBilingual('भटक्या जमाती (NT)', 'Nomadic Tribe (NT)')}</option>
              <option value="SBC">{tBilingual('विशेष मागास (SBC)', 'Special Backward Class (SBC)')}</option>
            </select>
          </div>
        </div>

        {/* Gender Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-green/50 dark:border-dark-border/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-text dark:text-dark-muted">{tBilingual('लिंग', 'Gender')}:</span>
            {[
              { val: 'ALL', mr: 'सर्व', en: 'All' },
              { val: 'मुलगा', mr: 'मुलगा', en: 'Boy' },
              { val: 'मुलगी', mr: 'मुलगी', en: 'Girl' },
            ].map((g) => (
              <button
                key={g.val}
                onClick={() => {
                  setGenderFilter(g.val);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  genderFilter === g.val
                    ? 'bg-primary-green text-white shadow-sm'
                    : 'bg-[#F4F7F4] dark:bg-dark-bg/80 text-main-text dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border'
                }`}
              >
                {tBilingual(g.mr, g.en)}
              </button>
            ))}
          </div>

          <div className="text-muted-text dark:text-dark-muted text-[11px]">
            {tBilingual('एकूण नोंदणी', 'Total Enrolled')}: <span className="font-bold text-primary-green dark:text-emerald-400">{totalStudents}</span> {tBilingual('विद्यार्थी', 'students')}
          </div>
        </div>
      </Card>

      {/* Paginated Student Table */}
      <Card className="border border-border-green dark:border-dark-border p-0 overflow-hidden bg-white dark:bg-dark-card shadow-card">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs text-muted-text dark:text-dark-muted font-semibold">
              {tBilingual('विद्यार्थी माहिती लोड होत आहे...', 'Loading student records...')}
            </p>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-green dark:border-dark-border bg-[#F4F7F4] dark:bg-dark-bg text-main-text dark:text-dark-text font-bold">
                  <th className="py-3.5 px-4">{tBilingual('रजिस्टर नं.', 'GR No')}</th>
                  <th className="py-3.5 px-4">{tBilingual('विद्यार्थ्याचे नाव', 'Student Name')}</th>
                  <th className="py-3.5 px-4">{tBilingual('इयत्ता', 'Std')}</th>
                  <th className="py-3.5 px-4">{tBilingual('तुकडी', 'Div')}</th>
                  <th className="py-3.5 px-4">{tBilingual('लिंग', 'Gender')}</th>
                  <th className="py-3.5 px-4">{tBilingual('प्रवर्ग', 'Category')}</th>
                  <th className="py-3.5 px-4">{tBilingual('पालक संपर्क', 'Guardian Phone')}</th>
                  <th className="py-3.5 px-4 text-center">{tBilingual('कृती', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-green dark:divide-dark-border">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-[#F4F7F4]/60 dark:hover:bg-dark-bg/60 transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-primary-green dark:text-emerald-400">
                      {s.grNumber}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openStudentProfile(s._id)}
                        className="font-bold text-main-text dark:text-dark-text group-hover:text-primary-green dark:group-hover:text-emerald-400 text-left hover:underline flex items-center gap-1.5"
                      >
                        {s.name}
                      </button>
                      <span className="text-[10px] text-muted-text dark:text-dark-muted font-mono">
                        SARAL: {s.saralId || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-main-text dark:text-dark-text">
                      {s.currentStandard || s.classGrade}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-bg font-bold font-mono text-main-text dark:text-dark-text">
                        {s.division || 'A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-main-text dark:text-dark-text">
                      {s.gender === 'मुलगा'
                        ? tBilingual('मुलगा', 'Boy')
                        : s.gender === 'मुलगी'
                        ? tBilingual('मुलगी', 'Girl')
                        : s.gender}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#E2EFE7] dark:bg-emerald-950/60 text-primary-green dark:text-emerald-400 font-bold text-[10px]">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-text dark:text-dark-muted font-mono">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-primary-green dark:text-emerald-400" />
                        {s.primaryPhone ? `••••••${s.primaryPhone.slice(-4)}` : '••••••••••'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] py-1 h-7 text-primary-green dark:text-emerald-400 hover:bg-[#E2EFE7] dark:hover:bg-dark-border"
                        onClick={() => openStudentProfile(s._id)}
                      >
                        {tBilingual('तपशील पहा', 'View Details')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-muted-text dark:text-dark-muted space-y-2">
            <Users className="w-8 h-8 text-muted-text/40 mx-auto" />
            <p className="font-semibold text-main-text dark:text-dark-text">
              {tBilingual('कोणतेही विद्यार्थी आढळले नाहीत.', 'No students found.')}
            </p>
            <p>{tBilingual('कृपया फिल्टर किंवा शोध शब्द बदलून पुन्हा प्रयत्न करा.', 'Please adjust your filter or search keywords.')}</p>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border-green dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-white dark:bg-dark-card">
          <div className="text-muted-text dark:text-dark-muted">
            {tBilingual('दाखवत आहे: पृष्ठ', 'Showing page')}{' '}
            <span className="font-bold text-main-text dark:text-dark-text">{page}</span> /{' '}
            <span className="font-bold text-main-text dark:text-dark-text">{totalPages || 1}</span> (
            {tBilingual('एकूण', 'Total')} {totalStudents} {tBilingual('विद्यार्थी', 'students')})
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              {tBilingual('मागील', 'Previous')}
            </Button>
            <span className="px-2 font-bold font-mono text-primary-green dark:text-emerald-400">{page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              {tBilingual('पुढील', 'Next')}
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* DETAILED STUDENT PROFILE MODAL (EDIT & VIEW) */}
      {/* ========================================================================= */}
      {modalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-4xl w-full border border-border-green dark:border-dark-border shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-primary-green dark:bg-dark-secondary text-white p-5 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="bg-saffron-orange text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    GR #{selectedStudent.grNumber}
                  </span>
                  <span className="text-xs text-white/80 font-medium">
                    SARAL ID: {selectedStudent.saralId}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                  {selectedStudent.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {canEditStudent && !isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-white border-white/40 hover:bg-white/10"
                    onClick={() => setIsEditing(true)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    माहिती संपादित करा (Edit)
                  </Button>
                )}
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
            {saveErrorMsg && (
              <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            {/* Modal Body / Profile Sections */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs text-main-text flex-1">
              <form id="student-edit-form" onSubmit={handleSaveStudent} className="space-y-6">
                {/* 1. General Profile */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-primary-green flex items-center gap-2 border-b border-border-green pb-1.5">
                    <FileText className="w-4 h-4" /> सामान्य माहिती (General Profile)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold block text-muted-text mb-1">पूर्ण नाव (Full Name) *</label>
                      {isEditing ? (
                        <input
                          type="text"
                          required
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p className="font-bold text-main-text">{selectedStudent.name}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-muted-text">आधार क्रमांक (Aadhaar Number) *</label>
                        <button
                          type="button"
                          onClick={toggleAadhaarUnmask}
                          className="text-[10px] text-primary-green hover:underline flex items-center gap-1 font-semibold"
                        >
                          {unmaskAadhaar ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {unmaskAadhaar ? 'मास्क करा' : 'पहा (Unmask)'}
                        </button>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.aadhaarNumber || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg font-mono"
                        />
                      ) : (
                        <p className="font-mono font-bold text-main-text">
                          {selectedStudent.aadhaarNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">जन्म तारीख (Date of Birth) *</label>
                      {isEditing ? (
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
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p className="font-medium">
                          {new Date(selectedStudent.dateOfBirth).toLocaleDateString('mr-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">लिंग (Gender) *</label>
                      {isEditing ? (
                        <select
                          value={editFormData.gender || 'मुलगा'}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, gender: e.target.value as any })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        >
                          <option value="मुलगा">मुलगा (Male)</option>
                          <option value="मुलगी">मुलगी (Female)</option>
                          <option value="इतर">इतर (Other)</option>
                        </select>
                      ) : (
                        <p className="font-semibold">{selectedStudent.gender}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">मातृभाषा (Mother Tongue)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.motherTongue || 'मराठी'}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, motherTongue: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p>{selectedStudent.motherTongue || 'मराठी'}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">धर्म व जात (Religion & Caste)</label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="धर्म"
                            value={editFormData.religion || 'हिंदू'}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, religion: e.target.value })
                            }
                            className="w-1/2 p-2 border border-border-green rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="जात"
                            value={editFormData.caste || 'मराठा'}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, caste: e.target.value })
                            }
                            className="w-1/2 p-2 border border-border-green rounded-lg"
                          />
                        </div>
                      ) : (
                        <p>
                          {selectedStudent.religion} - {selectedStudent.caste}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">प्रवर्ग (Category) *</label>
                      {isEditing ? (
                        <select
                          value={editFormData.category || 'OBC'}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, category: e.target.value as any })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        >
                          <option value="General">General (खुला)</option>
                          <option value="OBC">OBC</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="NT">NT</option>
                          <option value="SBC">SBC</option>
                        </select>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded bg-[#E2EFE7] text-primary-green font-bold">
                          {selectedStudent.category}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">रक्तगट (Blood Group)</label>
                      {isEditing ? (
                        <select
                          value={editFormData.bloodGroup || 'B+'}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, bloodGroup: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        >
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      ) : (
                        <p className="font-bold text-red-700">{selectedStudent.bloodGroup || 'B+'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Family Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-primary-green flex items-center gap-2 border-b border-border-green pb-1.5">
                    <Home className="w-4 h-4" /> कौटुंबिक तपशील (Family Details)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold block text-muted-text mb-1">वडिलांचे नाव (Father's Name) *</label>
                      {isEditing ? (
                        <input
                          type="text"
                          required
                          value={editFormData.fatherName || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, fatherName: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p className="font-semibold">{selectedStudent.fatherName}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">आईचे नाव (Mother's Name)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.motherName || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, motherName: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p>{selectedStudent.motherName || 'नोंद नाही'}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">पालकांचा व्यवसाय (Occupation)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.parentsOccupation || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, parentsOccupation: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p>{selectedStudent.parentsOccupation || 'शेतकरी'}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">वार्षिक कौटुंबिक उत्पन्न (Income ₹)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData.annualFamilyIncome || 45000}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              annualFamilyIncome: Number(e.target.value),
                            })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p className="font-semibold">
                          ₹{Number(selectedStudent.annualFamilyIncome || 45000).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">दारिद्र्यरेषेखालील (BPL Status)</label>
                      {isEditing ? (
                        <div className="flex items-center gap-3 pt-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isBpl"
                              checked={editFormData.isBpl === true}
                              onChange={() => setEditFormData({ ...editFormData, isBpl: true })}
                            />
                            <span>होय (Yes)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isBpl"
                              checked={editFormData.isBpl === false}
                              onChange={() => setEditFormData({ ...editFormData, isBpl: false })}
                            />
                            <span>नाही (No)</span>
                          </label>
                        </div>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            selectedStudent.isBpl
                              ? 'bg-orange-100 text-saffron-orange'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {selectedStudent.isBpl ? 'होय (BPL धारक)' : 'नाही (Non-BPL)'}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">अल्पसंख्याक स्थिती (Minority)</label>
                      {isEditing ? (
                        <select
                          value={editFormData.minorityStatus || 'None'}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, minorityStatus: e.target.value as any })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        >
                          <option value="None">None (लागू नाही)</option>
                          <option value="Linguistic Minority">Linguistic Minority (भाषिक)</option>
                          <option value="Religious Minority">Religious Minority (धार्मिक)</option>
                        </select>
                      ) : (
                        <p>{selectedStudent.minorityStatus || 'None'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Contact & Address */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-primary-green flex items-center gap-2 border-b border-border-green pb-1.5">
                    <Phone className="w-4 h-4" /> संपर्क व पत्ता (Contact & Address)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold block text-muted-text mb-1">प्राथमिक फोन क्रमांक (Primary Phone) *</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          required
                          value={editFormData.primaryPhone || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, primaryPhone: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg font-mono"
                        />
                      ) : (
                        <p className="font-mono font-bold text-primary-green">
                          {selectedStudent.primaryPhone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">पर्यायी फोन (Secondary Phone)</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editFormData.secondaryPhone || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, secondaryPhone: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg font-mono"
                        />
                      ) : (
                        <p className="font-mono">{selectedStudent.secondaryPhone || 'नोंद नाही'}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">घर क्र. / इमारत</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.houseNumber || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, houseNumber: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p>{selectedStudent.houseNumber || 'घर क्र. १२'}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="font-semibold block text-muted-text mb-1">संपूर्ण रहिवासी पत्ता (Full Address)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.residentialAddress || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, residentialAddress: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p className="text-muted-text">{selectedStudent.residentialAddress}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Academic / SARAL */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-primary-green flex items-center gap-2 border-b border-border-green pb-1.5">
                    <GraduationCap className="w-4 h-4" /> शैक्षणिक व सरल तपशील (Academic / SARAL)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="font-semibold block text-muted-text mb-1">SARAL ID *</label>
                      <p className="font-mono font-bold text-main-text">{selectedStudent.saralId}</p>
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">PEN (Permanent Edu No) *</label>
                      <p className="font-mono font-bold text-main-text">{selectedStudent.penNumber}</p>
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">सध्याची इयत्ता (Current Standard) *</label>
                      {isEditing && isPrincipal ? (
                        <select
                          value={editFormData.currentStandard || 'इयत्ता १ ली'}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              currentStandard: e.target.value,
                              classGrade: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-border-green rounded-lg font-semibold"
                        >
                          <option value="इयत्ता १ ली">इयत्ता १ ली</option>
                          <option value="इयत्ता २ री">इयत्ता २ री</option>
                          <option value="इयत्ता ३ री">इयत्ता ३ री</option>
                          <option value="इयत्ता ४ थी">इयत्ता ४ थी</option>
                          <option value="इयत्ता ५ वी">इयत्ता ५ वी</option>
                          <option value="इयत्ता ६ वी">इयत्ता ६ वी</option>
                          <option value="इयत्ता ७ वी">इयत्ता ७ वी</option>
                        </select>
                      ) : (
                        <p className="font-bold text-primary-green">
                          {selectedStudent.currentStandard}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">तुकडी (Division) *</label>
                      {isEditing ? (
                        <select
                          value={editFormData.division || 'A'}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, division: e.target.value as any })
                          }
                          className="w-full p-2 border border-border-green rounded-lg font-bold"
                        >
                          <option value="A">अ (A)</option>
                          <option value="B">ब (B)</option>
                        </select>
                      ) : (
                        <p className="font-bold">तुकडी {selectedStudent.division || 'A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">प्रवेश दिनांक (Admission Date)</label>
                      <p className="font-mono text-muted-text">
                        {new Date(selectedStudent.admissionDate).toLocaleDateString('mr-IN')}
                      </p>
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">विद्यार्थी प्रकार (Type)</label>
                      <p>{selectedStudent.studentType || 'Fresher'}</p>
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">माध्यम (Medium)</label>
                      <p>{selectedStudent.mediumOfInstruction || 'मराठी'}</p>
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">मागील वर्ष गुण (Marks %)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData.previousYearMarks || 85}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              previousYearMarks: Number(e.target.value),
                            })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p className="font-bold text-emerald-700">
                          {selectedStudent.previousYearMarks || 85}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Bank Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-primary-green flex items-center gap-2 border-b border-border-green pb-1.5">
                    <Landmark className="w-4 h-4" /> बँक खात्याचा तपशील (Bank Details - DBT)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="font-semibold block text-muted-text mb-1">खातेदाराचे नाव (Account Holder)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.bankAccountHolder || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, bankAccountHolder: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p>{selectedStudent.bankAccountHolder || selectedStudent.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">बँकेचे नाव (Bank Name)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.bankName || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, bankName: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p>{selectedStudent.bankName || 'बँक ऑफ महाराष्ट्र'}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-muted-text">खाते क्रमांक (Account No)</label>
                        <button
                          type="button"
                          onClick={toggleBankUnmask}
                          className="text-[10px] text-primary-green hover:underline flex items-center gap-1 font-semibold"
                        >
                          {unmaskBank ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {unmaskBank ? 'मास्क' : 'पहा'}
                        </button>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.bankAccountNumber || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, bankAccountNumber: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg font-mono"
                        />
                      ) : (
                        <p className="font-mono font-bold">{selectedStudent.bankAccountNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">IFSC कोड</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.bankIfsc || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, bankIfsc: e.target.value })
                          }
                          className="w-full p-2 border border-border-green rounded-lg font-mono"
                        />
                      ) : (
                        <p className="font-mono font-bold text-primary-green">
                          {selectedStudent.bankIfsc || 'MAHB0000412'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Health & CWSN */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-primary-green flex items-center gap-2 border-b border-border-green pb-1.5">
                    <HeartPulse className="w-4 h-4" /> आरोग्य व दिव्यांगत्व तपशील (Health & CWSN)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="font-semibold block text-muted-text mb-1">विशेष गरजा असणारे (CWSN)</label>
                      {isEditing ? (
                        <select
                          value={editFormData.isCwsn ? 'true' : 'false'}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              isCwsn: e.target.value === 'true',
                            })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        >
                          <option value="false">नाही (No)</option>
                          <option value="true">होय (Yes)</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            selectedStudent.isCwsn
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {selectedStudent.isCwsn ? 'होय (CWSN)' : 'नाही (General)'}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">दिव्यांगत्व प्रकार (Disability)</label>
                      <p>{selectedStudent.cwsnDisabilityType || 'None'}</p>
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">उंची (Height cm)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData.heightCm || 115}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, heightCm: Number(e.target.value) })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p className="font-bold">{selectedStudent.heightCm || 115} cm</p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block text-muted-text mb-1">वजन (Weight kg)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData.weightKg || 20}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, weightKg: Number(e.target.value) })
                          }
                          className="w-full p-2 border border-border-green rounded-lg"
                        />
                      ) : (
                        <p className="font-bold">{selectedStudent.weightKg || 20} kg</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Form Action Buttons */}
                {isEditing && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-green">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      रद्द करा (Cancel)
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={savingStudent}
                      leftIcon={
                        savingStudent ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )
                      }
                    >
                      {savingStudent ? 'जतन करत आहे...' : 'बदल जतन करा (Save Changes)'}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW ADMISSION MODAL (PRINCIPAL ONLY) */}
      {/* ========================================================================= */}
      {newAdmissionOpen && isPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-border-green shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-primary-green text-white p-5 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <span className="bg-saffron-orange text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  नवीन नोंदणी २०२६-२७
                </span>
                <h3 className="text-lg font-bold">नवीन विद्यार्थी प्रवेश नोंदणी (Admit Student)</h3>
              </div>
              <button
                onClick={() => setNewAdmissionOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNewAdmissionSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-main-text block mb-1">विद्यार्थ्याचे पूर्ण नाव *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. पाटील यश सचिन"
                    value={newStudentData.name || ''}
                    onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                    className="w-full p-2.5 border border-border-green rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-main-text block mb-1">प्रवेश इयत्ता (Standard) *</label>
                  <select
                    value={newStudentData.currentStandard || 'इयत्ता १ ली'}
                    onChange={(e) =>
                      setNewStudentData({ ...newStudentData, currentStandard: e.target.value })
                    }
                    className="w-full p-2.5 border border-border-green rounded-lg font-semibold"
                  >
                    <option value="इयत्ता १ ली">इयत्ता १ ली</option>
                    <option value="इयत्ता २ री">इयत्ता २ री</option>
                    <option value="इयत्ता ३ री">इयत्ता ३ री</option>
                    <option value="इयत्ता ४ थी">इयत्ता ४ थी</option>
                    <option value="इयत्ता ५ वी">इयत्ता ५ वी</option>
                    <option value="इयत्ता ६ वी">इयत्ता ६ वी</option>
                    <option value="इयत्ता ७ वी">इयत्ता ७ वी</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-main-text block mb-1">लिंग (Gender) *</label>
                  <select
                    value={newStudentData.gender || 'मुलगा'}
                    onChange={(e) =>
                      setNewStudentData({ ...newStudentData, gender: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-border-green rounded-lg"
                  >
                    <option value="मुलगा">मुलगा</option>
                    <option value="मुलगी">मुलगी</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-main-text block mb-1">जन्म तारीख (Date of Birth) *</label>
                  <input
                    type="date"
                    required
                    value={newStudentData.dateOfBirth || ''}
                    onChange={(e) =>
                      setNewStudentData({ ...newStudentData, dateOfBirth: e.target.value })
                    }
                    className="w-full p-2.5 border border-border-green rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-main-text block mb-1">वडिलांचे / पालकांचे नाव *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. सचिन तुकाराम पाटील"
                    value={newStudentData.fatherName || ''}
                    onChange={(e) =>
                      setNewStudentData({ ...newStudentData, fatherName: e.target.value })
                    }
                    className="w-full p-2.5 border border-border-green rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-main-text block mb-1">पालक संपर्क मोबाईल *</label>
                  <input
                    type="tel"
                    required
                    placeholder="उदा. 9823456789"
                    value={newStudentData.primaryPhone || ''}
                    onChange={(e) =>
                      setNewStudentData({ ...newStudentData, primaryPhone: e.target.value })
                    }
                    className="w-full p-2.5 border border-border-green rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-main-text block mb-1">प्रवर्ग (Category) *</label>
                  <select
                    value={newStudentData.category || 'OBC'}
                    onChange={(e) =>
                      setNewStudentData({ ...newStudentData, category: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-border-green rounded-lg"
                  >
                    <option value="OBC">OBC</option>
                    <option value="General">General</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="NT">NT</option>
                    <option value="SBC">SBC</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-main-text block mb-1">आधार क्रमांक (Aadhaar)</label>
                  <input
                    type="text"
                    placeholder="१२ अंकी आधार"
                    value={newStudentData.aadhaarNumber || ''}
                    onChange={(e) =>
                      setNewStudentData({ ...newStudentData, aadhaarNumber: e.target.value })
                    }
                    className="w-full p-2.5 border border-border-green rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-green">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewAdmissionOpen(false)}
                >
                  रद्द करा
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={savingStudent}
                  leftIcon={
                    savingStudent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )
                  }
                >
                  {savingStudent ? 'दाखल करत आहे...' : 'विद्यार्थी दाखल करा (Admit)'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
