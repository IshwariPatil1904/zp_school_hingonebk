import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import { ScholarshipScheme, ScholarshipEvaluationData } from '../../types';
import {
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Edit,
  X,
  FileCheck,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Calendar,
  IndianRupee,
  BookOpen,
} from 'lucide-react';

export const ScholarshipsManagePage: React.FC = () => {
  const { isPrincipal, isTeacher } = useAuth();
  const { t, tBilingual, formatCurrency, formatNumber, language } = useLanguage();

  // State
  const [schemes, setSchemes] = useState<ScholarshipScheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<ScholarshipScheme | null>(null);
  const [evaluations, setEvaluations] = useState<ScholarshipEvaluationData[]>([]);
  const [evalCounts, setEvalCounts] = useState({
    total: 0,
    eligible: 0,
    ineligible: 0,
    needsReview: 0,
    approved: 0,
  });
  const [stats, setStats] = useState({
    totalSchemes: 0,
    totalEligible: 0,
    totalNeedsReview: 0,
    totalApproved: 0,
    totalBeneficiaries: 0,
  });

  const [activeTab, setActiveTab] = useState<'Eligible' | 'Not Eligible' | 'Needs Review'>('Eligible');
  const [loading, setLoading] = useState(true);
  const [evalLoading, setEvalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stdFilter, setStdFilter] = useState('ALL');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<ScholarshipScheme | null>(null);

  // Form State for Scheme Create/Edit
  const [formData, setFormData] = useState({
    schemeName: '',
    marathiName: '',
    code: '',
    category: 'Pre-Matric',
    description: '',
    marathiDescription: '',
    applicableGrades: 'इयत्ता १ ली ते ७ वी',
    applicableStandards: ['इयत्ता १ ली', 'इयत्ता २ री', 'इयत्ता ३ री', 'इयत्ता ४ थी', 'इयत्ता ५ वी', 'इयत्ता ६ वी', 'इयत्ता ७ वी'],
    beneficiaryGroup: 'सर्व मागासवर्गीय व वंचित घटकातील विद्यार्थी',
    applicableCategories: ['ALL'],
    incomeLimit: 100000,
    genderRequirement: 'ALL' as 'ALL' | 'मुलगी' | 'मुलगा',
    minorityRequirement: 'ALL',
    cwsnRequirement: 'ALL',
    bplRequirement: 'ALL',
    occupationKeyword: '',
    benefitAmount: '₹1,000/- प्रति वर्ष',
    eligibilityCriteria: ['नियमित शालेय उपस्थिती आवश्यक', 'विहित मुदतीत अर्ज सादर करणे'],
    requiredDocuments: ['आधार कार्ड झेरॉक्स', 'बँक खाते पासबुक', 'सक्षम अधिकाऱ्याचा दाखला'],
    applicationSteps: 'शाळेमार्फत महाडीबीटी पोर्टलवर ऑनलाइन अर्ज सादर करणे.',
    officialUrl: 'https://mahadbt.maharashtra.gov.in/',
    academicYear: '2026-27',
    applicationStartDate: '2026-06-15',
    applicationEndDate: '2026-11-30',
    isPublic: true,
  });

  // Fetch all schemes
  const fetchSchemes = async (maintainSelectedId?: string) => {
    try {
      setLoading(true);
      const res = await api.get('/portal/scholarships');
      if (res.data?.success) {
        const fetchedSchemes: ScholarshipScheme[] = res.data.data.schemes || [];
        setSchemes(fetchedSchemes);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }

        // Maintain selection or select first
        if (fetchedSchemes.length > 0) {
          const target = maintainSelectedId
            ? fetchedSchemes.find((s) => s._id === maintainSelectedId) || fetchedSchemes[0]
            : selectedScheme
            ? fetchedSchemes.find((s) => s._id === selectedScheme._id) || fetchedSchemes[0]
            : fetchedSchemes[0];
          setSelectedScheme(target);
          fetchEvaluations(target._id, activeTab);
        }
      }
    } catch (err: any) {
      console.error('Failed to load scholarships:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch student evaluations for selected scheme and status tab
  const fetchEvaluations = async (schemeId: string, statusTab: string) => {
    try {
      setEvalLoading(true);
      const res = await api.get(`/portal/scholarships/${schemeId}/evaluations`, {
        params: { status: statusTab, limit: 150 },
      });
      if (res.data?.success) {
        setEvaluations(res.data.data || []);
        if (res.data.counts) {
          setEvalCounts(res.data.counts);
        }
      }
    } catch (err: any) {
      console.error('Failed to load evaluations:', err);
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleSelectScheme = (scheme: ScholarshipScheme) => {
    setSelectedScheme(scheme);
    fetchEvaluations(scheme._id, activeTab);
  };

  const handleTabChange = (tab: 'Eligible' | 'Not Eligible' | 'Needs Review') => {
    setActiveTab(tab);
    if (selectedScheme) {
      fetchEvaluations(selectedScheme._id, tab);
    }
  };

  // Re-evaluate current scheme
  const handleReEvaluate = async () => {
    if (!selectedScheme) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/portal/scholarships/${selectedScheme._id}/re-evaluate`);
      if (res.data?.success) {
        setMsg({
          type: 'success',
          text: `पात्रता पुनर्मूल्यांकन यशस्वी: ${res.data.counts.eligibleCount} पात्र, ${res.data.counts.reviewCount} पडताळणी प्रलंबित.`,
        });
        await fetchSchemes(selectedScheme._id);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'पुनर्मूल्यांकन अयशस्वी' });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Public Visibility
  const handleTogglePublic = async (scheme: ScholarshipScheme) => {
    if (!isPrincipal) return;
    try {
      const res = await api.patch(`/portal/scholarships/${scheme._id}/status`, {
        isPublic: !scheme.isPublic,
      });
      if (res.data?.success) {
        setMsg({
          type: 'success',
          text: `योजना सार्वजनिक स्थिती अद्ययावत केली: ${!scheme.isPublic ? 'प्रकाशित (Public)' : 'अप्रकाशित (Private)'}`,
        });
        fetchSchemes(scheme._id);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'स्थिती अद्ययावत करताना त्रुटी' });
    }
  };

  // Approve Scholarship for Student
  const handleApproveStudent = async (grNumber: string) => {
    if (!isPrincipal || !selectedScheme) return;
    try {
      const res = await api.post('/portal/scholarships/approve', {
        grNumber,
        schemeId: selectedScheme._id,
        schemeName: selectedScheme.schemeName,
      });
      if (res.data?.success) {
        setMsg({
          type: 'success',
          text: `विद्यार्थी (GR #${grNumber}) करिता '${selectedScheme.marathiName}' शिष्यवृत्ती यशस्वीरीत्या मंजूर केली.`,
        });
        fetchEvaluations(selectedScheme._id, activeTab);
        fetchSchemes(selectedScheme._id);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'मंजुरी प्रक्रियेत त्रुटी' });
    }
  };

  // Handle Create Scheme Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post('/portal/scholarships', formData);
      if (res.data?.success) {
        setMsg({ type: 'success', text: `नवीन शिष्यवृत्ती योजना '${formData.marathiName}' यशस्वीरीत्या नोंदवली व विद्यार्थी पात्रता निश्चित केली.` });
        setIsAddModalOpen(false);
        fetchSchemes(res.data.data._id);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'योजना नोंदणी अयशस्वी' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Scheme Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheme) return;
    try {
      setActionLoading(true);
      const res = await api.put(`/portal/scholarships/${editingScheme._id}`, formData);
      if (res.data?.success) {
        setMsg({ type: 'success', text: `शिष्यवृत्ती योजना '${editingScheme.marathiName}' अद्ययावत केली व पात्रता पुनर्गणना पूर्ण झाली.` });
        setIsEditModalOpen(false);
        fetchSchemes(editingScheme._id);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'योजना अद्ययावत करताना त्रुटी' });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (scheme: ScholarshipScheme) => {
    setEditingScheme(scheme);
    setFormData({
      schemeName: scheme.schemeName,
      marathiName: scheme.marathiName,
      code: scheme.code,
      category: scheme.category || 'Pre-Matric',
      description: scheme.description || '',
      marathiDescription: scheme.marathiDescription || '',
      applicableGrades: scheme.applicableGrades,
      applicableStandards: scheme.applicableStandards || ['इयत्ता १ ली', 'इयत्ता २ री', 'इयत्ता ३ री', 'इयत्ता ४ थी', 'इयत्ता ५ वी', 'इयत्ता ६ वी', 'इयत्ता ७ वी'],
      beneficiaryGroup: scheme.beneficiaryGroup,
      applicableCategories: scheme.applicableCategories || ['ALL'],
      incomeLimit: scheme.incomeLimit || 0,
      genderRequirement: scheme.genderRequirement || 'ALL',
      minorityRequirement: scheme.minorityRequirement || 'ALL',
      cwsnRequirement: scheme.cwsnRequirement || 'ALL',
      bplRequirement: scheme.bplRequirement || 'ALL',
      occupationKeyword: scheme.occupationKeyword || '',
      benefitAmount: scheme.benefitAmount,
      eligibilityCriteria: scheme.eligibilityCriteria || [],
      requiredDocuments: scheme.requiredDocuments || [],
      applicationSteps: scheme.applicationSteps,
      officialUrl: scheme.officialUrl || 'https://mahadbt.maharashtra.gov.in/',
      academicYear: scheme.academicYear || '2026-27',
      applicationStartDate: scheme.applicationStartDate ? scheme.applicationStartDate.slice(0, 10) : '2026-06-15',
      applicationEndDate: scheme.applicationEndDate ? scheme.applicationEndDate.slice(0, 10) : '2026-11-30',
      isPublic: scheme.isPublic !== false,
    });
    setIsEditModalOpen(true);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (!selectedScheme) return;
    const url = `/api/portal/scholarships/${selectedScheme._id}/export/csv?status=${activeTab}`;
    window.open(url, '_blank');
  };

  // Print PDF view
  const handlePrint = () => {
    window.print();
  };

  // Filtered evaluations for display
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      const matchesSearch =
        search === '' ||
        item.studentName.toLowerCase().includes(search.toLowerCase()) ||
        item.studentGrNumber.includes(search) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchesStd = stdFilter === 'ALL' || item.standard === stdFilter;

      return matchesSearch && matchesStd;
    });
  }, [evaluations, search, stdFilter]);

  const standardsList = [
    'ALL',
    'इयत्ता १ ली',
    'इयत्ता २ री',
    'इयत्ता ३ री',
    'इयत्ता ४ थी',
    'इयत्ता ५ वी',
    'इयत्ता ६ वी',
    'इयत्ता ७ वी',
  ];

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-green/60 dark:border-dark-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-green uppercase tracking-wider">
              {tBilingual('शासकीय योजना व सवलती कक्ष', 'Govt Schemes & Concessions Cell')}
            </span>
            <span className="text-muted-text dark:text-dark-muted">•</span>
            <span className="text-xs text-muted-text dark:text-dark-muted">MahaDBT & Samaj Kalyan</span>
            {isTeacher && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                {tBilingual('केवळ वाचन अधिकार (Read-Only Mode)')}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-main-text dark:text-dark-text mt-1 flex items-center gap-2">
            <Award className="w-5 h-5 text-saffron-orange" />
            {tBilingual('शिष्यवृत्ती व शैक्षणिक सवलती व्यवस्थापन (Scholarships & Eligibility Engine)')}
          </h2>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual('महाराष्ट्र शासन अधिकृत शिष्यवृत्ती नियम व निकषांनुसार विद्यार्थ्यांची स्वयंचलित पात्रता पडताळणी', 'Automated student eligibility verification as per official Govt. of Maharashtra rules')}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-main-text dark:text-dark-text flex items-center gap-1.5 border-border-green dark:border-dark-border hover:bg-light-green/40 dark:hover:bg-primary-green/20"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5 text-primary-green" />
            {tBilingual('अहवाल मुद्रण (Print / PDF)')}
          </Button>

          {isPrincipal && (
            <Button
              size="sm"
              variant="primary"
              className="text-xs bg-primary-green hover:bg-dark-green text-white flex items-center gap-1.5 shadow-sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              {tBilingual('नवीन योजना जोडा (Add Scheme)')}
            </Button>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {msg && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
            msg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border-green dark:border-dark-border p-4 bg-white dark:bg-dark-card shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-text dark:text-dark-muted">
              {tBilingual('नोंदणीकृत शासकीय योजना', 'Registered Govt Schemes')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-primary-green">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-main-text dark:text-dark-text mt-2 font-mono">
            {formatNumber(stats.totalSchemes)}
          </div>
          <p className="text-[11px] text-muted-text dark:text-dark-muted mt-1">
            {tBilingual('महाडीबीटी व समाज कल्याण विभाग', 'MahaDBT & Social Welfare Dept')}
          </p>
        </Card>

        <Card className="border border-border-green dark:border-dark-border p-4 bg-white dark:bg-dark-card shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
              {tBilingual('एकूण पात्र विद्यार्थी (Eligible)')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
            {formatNumber(stats.totalEligible)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            {tBilingual('सर्व विहित अटी व निकष पूर्ण', 'All criteria fulfilled')}
          </p>
        </Card>

        <Card className="border border-border-green dark:border-dark-border p-4 bg-white dark:bg-dark-card shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
              {tBilingual('कागदपत्रे / माहिती प्रलंबित', 'Missing Info / Review')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-2 font-mono">
            {formatNumber(stats.totalNeedsReview)}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            {tBilingual('आधार, बँक किंवा उत्पन्न दाखला आवश्यक', 'Aadhaar, Bank or Income certificate required')}
          </p>
        </Card>

        <Card className="border border-border-green dark:border-dark-border p-4 bg-white dark:bg-dark-card shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-saffron-orange">
              {tBilingual('मुख्याध्यापक मंजूर लाभार्थी', 'Principal Approved Beneficiaries')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-amber-950/40 flex items-center justify-center text-saffron-orange">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-saffron-orange mt-2 font-mono">
            {formatNumber(stats.totalApproved || stats.totalBeneficiaries)}
          </div>
          <p className="text-[11px] text-muted-text dark:text-dark-muted mt-1">
            {tBilingual('शाळेमार्फत महाडीबीटी पोर्टलवर मंजूर', 'Approved on MahaDBT portal via school')}
          </p>
        </Card>
      </div>

      {/* 3. Registered Schemes Quick Switcher */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-main-text dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary-green" />
            {tBilingual('शासकीय शिष्यवृत्ती योजना यादी (Active Schemes)')}
          </h3>
          <span className="text-[11px] text-muted-text dark:text-dark-muted">
            {tBilingual('योजनेवर क्लिक करून सविस्तर निकष व विद्यार्थी यादी पहा', 'Click scheme to view detailed criteria and student list')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {schemes.map((scheme) => {
            const isSelected = selectedScheme?._id === scheme._id;
            const displayName =
              language === 'en'
                ? scheme.schemeName || scheme.marathiName
                : language === 'mr'
                ? scheme.marathiName
                : scheme.marathiName !== scheme.schemeName && scheme.schemeName
                ? `${scheme.marathiName} (${scheme.schemeName})`
                : scheme.marathiName;

            return (
              <div
                key={scheme._id}
                onClick={() => handleSelectScheme(scheme)}
                className={`cursor-pointer rounded-xl p-3 border transition-all text-left relative bg-white dark:bg-dark-card ${
                  isSelected
                    ? 'border-primary-green ring-2 ring-primary-green/20 shadow-md bg-light-green/20 dark:bg-primary-green/10'
                    : 'border-border-green dark:border-dark-border hover:border-primary-green/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {scheme.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {scheme.isPublic ? (
                      <span title={tBilingual('सार्वजनिक संकेतस्थळावर प्रकाशित (Published)')}>
                        <Eye className="w-3.5 h-3.5 text-primary-green" />
                      </span>
                    ) : (
                      <span title={tBilingual('अप्रकाशित (Internal Only)')}>
                        <EyeOff className="w-3.5 h-3.5 text-muted-text dark:text-dark-muted" />
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-main-text dark:text-dark-text line-clamp-1">{displayName}</h4>
                <p className="text-[10px] text-muted-text dark:text-dark-muted line-clamp-1 mt-0.5">{scheme.applicableGrades}</p>

                <div className="mt-2.5 pt-2 border-t border-border-green/50 dark:border-dark-border/60 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-primary-green">{scheme.benefitAmount}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold" title={tBilingual('पात्र विद्यार्थी (Eligible Students)')}>
                      ✓{formatNumber(scheme.eligibleCount || 0)}
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-bold" title={tBilingual('पडताळणी प्रलंबित (Pending Review)')}>
                      ?{formatNumber(scheme.reviewCount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Selected Scheme Full Details & Workspace */}
      {selectedScheme && (
        <div className="space-y-6">
          {/* Scheme Banner Card */}
          <Card className="border border-border-green dark:border-dark-border p-5 bg-white dark:bg-dark-card shadow-card">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-primary-green text-white">
                    {selectedScheme.code}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {selectedScheme.category || 'Pre-Matric Scheme'}
                  </span>
                  <span className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual('शैक्षणिक वर्ष', 'Academic Year')}: <strong className="text-main-text dark:text-dark-text">{selectedScheme.academicYear || '2026-27'}</strong>
                  </span>
                  {selectedScheme.isPublic ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 dark:bg-emerald-950/60 text-green-800 dark:text-emerald-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {tBilingual('सार्वजनिक प्रकाशित', 'Publicly Published')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-muted flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> {tBilingual('अंतर्गत (अप्रकाशित)', 'Internal (Unpublished)')}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-main-text dark:text-dark-text">
                  {language === 'en'
                    ? selectedScheme.schemeName || selectedScheme.marathiName
                    : language === 'mr'
                    ? selectedScheme.marathiName
                    : `${selectedScheme.marathiName} (${selectedScheme.schemeName})`}
                </h3>

                <p className="text-xs text-main-text dark:text-dark-text leading-relaxed">
                  {language === 'en' && selectedScheme.description
                    ? selectedScheme.description
                    : selectedScheme.marathiDescription || selectedScheme.description}
                </p>

                {/* Key Verified Rule Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 text-xs">
                  <div className="p-2 rounded-lg bg-light-green/40 dark:bg-primary-green/10 border border-border-green dark:border-dark-border">
                    <span className="text-[10px] text-muted-text dark:text-dark-muted block">
                      {tBilingual('पात्र इयत्ता / वर्ग', 'Eligible Grades / Classes')}:
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedScheme.applicableGrades}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-light-green/40 dark:bg-primary-green/10 border border-border-green dark:border-dark-border">
                    <span className="text-[10px] text-muted-text dark:text-dark-muted block">
                      {tBilingual('सामाजिक प्रवर्ग (Caste / Category)')}:
                    </span>
                    <strong className="text-main-text dark:text-dark-text">
                      {selectedScheme.applicableCategories?.join(', ') || 'ALL'}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-light-green/40 dark:bg-primary-green/10 border border-border-green dark:border-dark-border">
                    <span className="text-[10px] text-muted-text dark:text-dark-muted block">
                      {tBilingual('वार्षिक कौटुंबिक उत्पन्न मर्यादा', 'Annual Family Income Limit')}:
                    </span>
                    <strong className="text-main-text dark:text-dark-text">
                      {selectedScheme.incomeLimit && selectedScheme.incomeLimit > 0
                        ? `${formatCurrency(selectedScheme.incomeLimit)}/- ${tBilingual('पेक्षा कमी', 'or less')}`
                        : tBilingual('कोणतीही मर्यादा नाही (No Limit)')}
                    </strong>
                  </div>
                </div>

                {/* Eligibility Criteria & Required Documents List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg border border-border-green dark:border-dark-border bg-[#FAFBF9] dark:bg-dark-bg/40">
                    <span className="font-bold text-main-text dark:text-dark-text flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-green" /> {tBilingual('अधिकृत शासकीय पात्रता निकष', 'Official Govt Eligibility Criteria')}:
                    </span>
                    <ul className="space-y-1 text-muted-text dark:text-dark-muted list-disc list-inside text-[11px]">
                      {selectedScheme.eligibilityCriteria?.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-border-green dark:border-dark-border bg-[#FAFBF9] dark:bg-dark-bg/40">
                    <span className="font-bold text-main-text dark:text-dark-text flex items-center gap-1.5 mb-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-saffron-orange" /> {tBilingual('आवश्यक कागदपत्रे (Required Documents)')}:
                    </span>
                    <ul className="space-y-1 text-muted-text dark:text-dark-muted list-disc list-inside text-[11px]">
                      {selectedScheme.requiredDocuments?.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Controls for Selected Scheme */}
              <div className="flex flex-col gap-2 shrink-0 lg:w-64 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border-green/60 dark:border-dark-border lg:pl-4 print:hidden">
                <div className="p-3 rounded-xl bg-light-green/50 dark:bg-primary-green/10 border border-border-green dark:border-dark-border text-center">
                  <span className="text-[10px] text-muted-text dark:text-dark-muted uppercase font-bold block">
                    {tBilingual('मंजूर लाभ रक्कम', 'Approved Benefit Amount')}
                  </span>
                  <span className="text-base font-bold text-primary-green">{selectedScheme.benefitAmount}</span>
                </div>

                {selectedScheme.officialUrl && (
                  <a
                    href={selectedScheme.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-main-text dark:text-dark-text hover:bg-light-green/40 dark:hover:bg-primary-green/20 flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary-green" />
                    {tBilingual('अधिकृत MahaDBT पोर्टल', 'Official MahaDBT Portal')}
                  </a>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCsv}
                  className="text-xs border-border-green dark:border-dark-border hover:bg-light-green/40 dark:hover:bg-primary-green/20 flex items-center justify-center gap-1.5 text-main-text dark:text-dark-text"
                >
                  <Download className="w-3.5 h-3.5 text-primary-green" />
                  {tBilingual('पात्रता CSV डाउनलोड', 'Download Eligibility CSV')}
                </Button>

                {isPrincipal && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReEvaluate}
                      disabled={actionLoading}
                      className="text-xs border-border-green dark:border-dark-border hover:bg-light-green/40 dark:hover:bg-primary-green/20 flex items-center justify-center gap-1.5 text-main-text dark:text-dark-text"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-primary-green ${actionLoading ? 'animate-spin' : ''}`} />
                      {tBilingual('पुनर्मूल्यांकन करा (Re-evaluate)')}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublic(selectedScheme)}
                      className="text-xs border-border-green dark:border-dark-border hover:bg-light-green/40 dark:hover:bg-primary-green/20 flex items-center justify-center gap-1.5 text-main-text dark:text-dark-text"
                    >
                      {selectedScheme.isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-primary-green" />}
                      {selectedScheme.isPublic
                        ? tBilingual('संकेतस्थळावरून लपवा', 'Hide from Website')
                        : tBilingual('संकेतस्थळावर प्रकाशित करा', 'Publish to Website')}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(selectedScheme)}
                      className="text-xs border-border-green dark:border-dark-border hover:bg-light-green/40 dark:hover:bg-primary-green/20 flex items-center justify-center gap-1.5 text-main-text dark:text-dark-text"
                    >
                      <Edit className="w-3.5 h-3.5 text-saffron-orange" />
                      {tBilingual('निकष संपादित करा (Edit)', 'Edit Criteria')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* 5. Three Sections: Eligible, Not Eligible, Needs Review */}
          <Card className="border border-border-green dark:border-dark-border p-0 overflow-hidden bg-white dark:bg-dark-card shadow-card">
            {/* Section Tabs Header */}
            <div className="border-b border-border-green dark:border-dark-border bg-[#F4F7F4] dark:bg-dark-bg/60 flex flex-wrap items-center justify-between p-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTabChange('Eligible')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    activeTab === 'Eligible'
                      ? 'bg-white dark:bg-dark-card text-emerald-800 dark:text-emerald-400 shadow-sm border border-emerald-300 dark:border-emerald-700'
                      : 'text-main-text dark:text-dark-text hover:bg-white/60 dark:hover:bg-dark-card/60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {tBilingual('पात्र विद्यार्थी (Eligible)')}
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    {formatNumber(evalCounts.eligible)}
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('Not Eligible')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    activeTab === 'Not Eligible'
                      ? 'bg-white dark:bg-dark-card text-rose-800 dark:text-rose-400 shadow-sm border border-rose-300 dark:border-rose-700'
                      : 'text-main-text dark:text-dark-text hover:bg-white/60 dark:hover:bg-dark-card/60'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  {tBilingual('अपात्र विद्यार्थी (Not Eligible)')}
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold">
                    {formatNumber(evalCounts.ineligible)}
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('Needs Review')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    activeTab === 'Needs Review'
                      ? 'bg-white dark:bg-dark-card text-amber-900 dark:text-amber-400 shadow-sm border border-amber-300 dark:border-amber-700'
                      : 'text-main-text dark:text-dark-text hover:bg-white/60 dark:hover:bg-dark-card/60'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {tBilingual('पडताळणी प्रलंबित (Needs Review)')}
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold">
                    {formatNumber(evalCounts.needsReview)}
                  </span>
                </button>
              </div>

              {/* Search & Class Filter */}
              <div className="flex items-center gap-2 p-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-text dark:text-dark-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tBilingual('विद्यार्थ्याचे नाव, GR क्र...', 'Student name, GR no...')}
                    className="text-xs pl-8 pr-3 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green w-48 sm:w-60"
                  />
                </div>

                <select
                  value={stdFilter}
                  onChange={(e) => setStdFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none"
                >
                  <option value="ALL">{tBilingual('सर्व इयत्ता', 'All Standards')}</option>
                  {standardsList.slice(1).map((std) => (
                    <option key={std} value={std}>
                      {std}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Evaluations Table */}
            {evalLoading ? (
              <div className="py-16 text-center text-xs text-muted-text dark:text-dark-muted flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 text-primary-green animate-spin" />
                <span>{tBilingual('विद्यार्थी पात्रता निकाल तपासले जात आहेत...', 'Evaluating student eligibility results...')}</span>
              </div>
            ) : filteredEvaluations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-green dark:border-dark-border bg-[#F9FAF8] dark:bg-dark-bg/60 text-main-text dark:text-dark-text font-bold">
                      <th className="py-3 px-4">{tBilingual('रजिस्टर नं. (GR)')}</th>
                      <th className="py-3 px-4">{tBilingual('विद्यार्थ्याचे नाव (Student Name)')}</th>
                      <th className="py-3 px-4">{tBilingual('इयत्ता / तुकडी', 'Standard / Div')}</th>
                      <th className="py-3 px-4">{tBilingual('प्रवर्ग (Category)')}</th>
                      <th className="py-3 px-4">{tBilingual('कौटुंबिक उत्पन्न', 'Family Income')}</th>
                      <th className="py-3 px-4">{tBilingual('पात्रता स्थिती व कारणे (Engine Explanation)')}</th>
                      {activeTab === 'Needs Review' && (
                        <th className="py-3 px-4">{tBilingual('प्रलंबित माहिती (Missing Info)')}</th>
                      )}
                      {activeTab === 'Eligible' && isPrincipal && (
                        <th className="py-3 px-4 text-right">{tBilingual('मुख्याध्यापक कृती', 'Principal Action')}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-green dark:divide-dark-border">
                    {filteredEvaluations.map((item) => (
                      <tr key={item._id} className="hover:bg-light-green/30 dark:hover:bg-primary-green/10 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary-green">{item.studentGrNumber}</td>
                        <td className="py-3 px-4 font-bold text-main-text dark:text-dark-text">
                          {item.studentName}
                          <span className="text-[10px] text-muted-text dark:text-dark-muted block font-normal">
                            {tBilingual('लिंग', 'Gender')}: {item.gender}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-main-text dark:text-dark-text">
                          {item.standard} - {item.division}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-bg text-main-text dark:text-dark-text font-bold text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-text dark:text-dark-muted">
                          {item.annualIncome > 0
                            ? formatCurrency(item.annualIncome)
                            : tBilingual('नोंद नाही', 'Not Recorded')}
                        </td>

                        {/* Engine Reasons */}
                        <td className="py-3 px-4 max-w-md">
                          <div className="space-y-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                                item.status === 'Eligible'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : item.status === 'Not Eligible'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                              }`}
                            >
                              {item.status === 'Eligible'
                                ? tBilingual('✓ पात्र (Eligible)')
                                : item.status === 'Not Eligible'
                                ? tBilingual('✕ अपात्र (Not Eligible)')
                                : tBilingual('! पडताळणी प्रलंबित (Needs Review)')}
                            </span>

                            {item.reasons.map((r, i) => (
                              <p key={i} className="text-[11px] text-main-text dark:text-dark-text leading-tight">
                                • {r}
                              </p>
                            ))}
                          </div>
                        </td>

                        {/* Missing Info for Needs Review tab */}
                        {activeTab === 'Needs Review' && (
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {item.missingInfo?.map((m, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 block"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </td>
                        )}

                        {/* Action buttons for Eligible tab */}
                        {activeTab === 'Eligible' && isPrincipal && (
                          <td className="py-3 px-4 text-right">
                            {item.isApprovedByPrincipal ? (
                              <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {tBilingual('मंजूर (Approved)')}
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                className="text-xs bg-primary-green hover:bg-dark-green text-white py-1 px-2.5 shadow-sm"
                                onClick={() => handleApproveStudent(item.studentGrNumber)}
                              >
                                {tBilingual('मंजूर करा (Approve)')}
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-muted-text dark:text-dark-muted">
                {tBilingual('निवडलेल्या निकषांनुसार कोणतेही विद्यार्थी आढळले नाहीत.', 'No students found matching the selected criteria.')}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 6. Modal: Add New Scheme (Principal Only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-border-green dark:border-dark-border space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
              <div>
                <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                  {tBilingual('नवीन शासकीय शिष्यवृत्ती योजना नोंदणी', 'New Govt Scholarship Scheme Registration')}
                </h3>
                <p className="text-xs text-muted-text dark:text-dark-muted">
                  {tBilingual('शासकीय निकष व नियमांची अचूक नोंद करा', 'Accurately register government criteria and rules')}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('योजनेचे नाव (मराठीत) *', 'Scheme Name (in Marathi) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.marathiName}
                    onChange={(e) => setFormData({ ...formData, marathiName: e.target.value })}
                    placeholder="उदा. क्रांतीज्योती सावित्रीबाई फुले शिष्यवृत्ती"
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:ring-1 focus:ring-primary-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('योजनेचे नाव (इंग्रजीत) *', 'Scheme Name (in English) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schemeName}
                    onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                    placeholder="e.g. Savitribai Phule Scholarship"
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:ring-1 focus:ring-primary-green focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('योजना कोड (Code) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="उदा. SP-SCH-01"
                    className="w-full p-2 font-mono uppercase border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:ring-1 focus:ring-primary-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('प्रवर्ग / श्रेणी (Category)')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg focus:ring-1 focus:ring-primary-green focus:outline-none bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                  >
                    <option value="Pre-Matric">Pre-Matric</option>
                    <option value="Girl Child Welfare">Girl Child Welfare</option>
                    <option value="Tribal Welfare">Tribal Welfare</option>
                    <option value="CWSN / Disability">CWSN / Disability</option>
                    <option value="Minority Welfare">Minority Welfare</option>
                    <option value="Cleanliness Workers / Sanitation">Cleanliness Workers</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('शैक्षणिक वर्ष', 'Academic Year')}
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none"
                  />
                </div>
              </div>

              {/* Eligibility Criteria Controls */}
              <div className="p-3 bg-light-green/30 dark:bg-primary-green/10 rounded-xl border border-border-green dark:border-dark-border space-y-3">
                <span className="font-bold text-primary-green block">
                  {tBilingual('पात्रता निकष व नियम (Eligibility Criteria)')}:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-muted-text dark:text-dark-muted block mb-1">
                      {tBilingual('लिंग आवश्यकता (Gender)')}
                    </label>
                    <select
                      value={formData.genderRequirement}
                      onChange={(e) => setFormData({ ...formData, genderRequirement: e.target.value as any })}
                      className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                    >
                      <option value="ALL">{tBilingual('सर्व (मुले व मुली)', 'All (Boys & Girls)')}</option>
                      <option value="मुलगी">{tBilingual('केवळ विद्यार्थिनी (मुली)', 'Girls Only')}</option>
                      <option value="मुलगा">{tBilingual('केवळ मुले', 'Boys Only')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-text dark:text-dark-muted block mb-1">
                      {tBilingual('वार्षिक उत्पन्न मर्यादा (₹)', 'Annual Income Limit (₹)')}
                    </label>
                    <input
                      type="number"
                      value={formData.incomeLimit}
                      onChange={(e) => setFormData({ ...formData, incomeLimit: Number(e.target.value) })}
                      placeholder="0 = कोणतीही मर्यादा नाही"
                      className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                    />
                  </div>

                  <div>
                    <label className="text-muted-text dark:text-dark-muted block mb-1">
                      {tBilingual('CWSN दिव्यांगत्व निकष', 'CWSN Disability Requirement')}
                    </label>
                    <select
                      value={formData.cwsnRequirement}
                      onChange={(e) => setFormData({ ...formData, cwsnRequirement: e.target.value })}
                      className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                    >
                      <option value="ALL">{tBilingual('लागू नाही (सर्व)', 'Not Applicable (All)')}</option>
                      <option value="CWSN_ONLY">{tBilingual('४०%+ दिव्यांगत्व अनिवार्य', '40%+ Disability Mandatory')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-muted-text dark:text-dark-muted block mb-1">
                    {tBilingual('पात्र इयत्ता वर्णन', 'Applicable Grades Description')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.applicableGrades}
                    onChange={(e) => setFormData({ ...formData, applicableGrades: e.target.value })}
                    placeholder="उदा. इयत्ता ५ वी ते ७ वी"
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('लाभ रक्कम (Benefit Amount) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.benefitAmount}
                    onChange={(e) => setFormData({ ...formData, benefitAmount: e.target.value })}
                    placeholder="उदा. ₹1,000/- प्रति वर्ष"
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('अधिकृत पोर्टल URL', 'Official Portal URL')}
                  </label>
                  <input
                    type="url"
                    value={formData.officialUrl}
                    onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                  {tBilingual('सविस्तर वर्णन (मराठी)', 'Detailed Description (Marathi)')}
                </label>
                <textarea
                  rows={2}
                  value={formData.marathiDescription}
                  onChange={(e) => setFormData({ ...formData, marathiDescription: e.target.value })}
                  className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-green dark:border-dark-border">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-main-text dark:text-dark-text">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded text-primary-green focus:ring-primary-green"
                  />
                  <span>{tBilingual('शाळेच्या सार्वजनिक संकेतस्थळावर प्रकाशित करा (Public Visibility)')}</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs border-border-green dark:border-dark-border text-main-text dark:text-dark-text"
                  >
                    {tBilingual('रद्द करा (Cancel)')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={actionLoading}
                    className="text-xs bg-primary-green hover:bg-dark-green text-white"
                  >
                    {actionLoading
                      ? tBilingual('जतन होत आहे...', 'Saving...')
                      : tBilingual('योजना जतन करा व पात्रता मोजा', 'Save Scheme & Evaluate')}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Edit Scheme (Principal Only) */}
      {isEditModalOpen && editingScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-border-green dark:border-dark-border space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
              <div>
                <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                  {tBilingual('शिष्यवृत्ती योजना निकष संपादन', 'Edit Scholarship Scheme Criteria')}
                </h3>
                <p className="text-xs text-muted-text dark:text-dark-muted">
                  {tBilingual('बदलांनंतर विद्यार्थी पात्रता स्वयंचलित पुनर्गणना होईल', 'Student eligibility will be automatically re-evaluated after changes')}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('योजनेचे नाव (मराठीत) *', 'Scheme Name (in Marathi) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.marathiName}
                    onChange={(e) => setFormData({ ...formData, marathiName: e.target.value })}
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('लाभ रक्कम (Benefit Amount) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.benefitAmount}
                    onChange={(e) => setFormData({ ...formData, benefitAmount: e.target.value })}
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('लिंग आवश्यकता (Gender)')}
                  </label>
                  <select
                    value={formData.genderRequirement}
                    onChange={(e) => setFormData({ ...formData, genderRequirement: e.target.value as any })}
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                  >
                    <option value="ALL">{tBilingual('सर्व (मुले व मुली)', 'All (Boys & Girls)')}</option>
                    <option value="मुलगी">{tBilingual('केवळ विद्यार्थिनी (मुली)', 'Girls Only')}</option>
                    <option value="मुलगा">{tBilingual('केवळ मुले', 'Boys Only')}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('वार्षिक उत्पन्न मर्यादा (₹)', 'Annual Income Limit (₹)')}
                  </label>
                  <input
                    type="number"
                    value={formData.incomeLimit}
                    onChange={(e) => setFormData({ ...formData, incomeLimit: Number(e.target.value) })}
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                  />
                </div>

                <div>
                  <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                    {tBilingual('पात्र इयत्ता वर्णन', 'Applicable Grades Description')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.applicableGrades}
                    onChange={(e) => setFormData({ ...formData, applicableGrades: e.target.value })}
                    className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-main-text dark:text-dark-text block mb-1">
                  {tBilingual('सविस्तर वर्णन (मराठी)', 'Detailed Description (Marathi)')}
                </label>
                <textarea
                  rows={2}
                  value={formData.marathiDescription}
                  onChange={(e) => setFormData({ ...formData, marathiDescription: e.target.value })}
                  className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-green dark:border-dark-border">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-main-text dark:text-dark-text">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded text-primary-green focus:ring-primary-green"
                  />
                  <span>{tBilingual('शाळेच्या सार्वजनिक संकेतस्थळावर प्रकाशित करा (Public Visibility)')}</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-xs border-border-green dark:border-dark-border text-main-text dark:text-dark-text"
                  >
                    {tBilingual('रद्द करा (Cancel)')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={actionLoading}
                    className="text-xs bg-primary-green hover:bg-dark-green text-white"
                  >
                    {actionLoading
                      ? tBilingual('अद्ययावत होत आहे...', 'Updating...')
                      : tBilingual('बदल जतन करा व पुनर्गणना करा', 'Save Changes & Re-evaluate')}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
