import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import {
  CertificateRequestData,
  CertificateConfigData,
  TemplateSettings,
  CertificateAccentColor,
} from '../../types';
import {
  FileBadge,
  Download,
  CheckCircle,
  Plus,
  AlertCircle,
  FileCheck2,
  Settings,
  XCircle,
  Clock,
  Printer,
  Search,
  RefreshCw,
  Eye,
  Sliders,
  RotateCcw,
  Check,
  Award,
  FileText,
  User,
  ShieldAlert,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

const COLOR_SWATCHES: {
  key: CertificateAccentColor;
  label: string;
  hex: string;
  borderClass: string;
}[] = [
  { key: 'blue', label: 'निळा (Blue)', hex: '#2563EB', borderClass: 'border-blue-600 ring-blue-400' },
  { key: 'green', label: 'हिरवा (Green)', hex: '#176638', borderClass: 'border-[#176638] ring-green-500' },
  { key: 'red', label: 'लाल (Red)', hex: '#DC2626', borderClass: 'border-red-600 ring-red-400' },
  { key: 'black', label: 'काळा (Black)', hex: '#111827', borderClass: 'border-gray-900 ring-gray-600' },
  { key: 'purple', label: 'जांभळा (Purple)', hex: '#7C3AED', borderClass: 'border-purple-600 ring-purple-400' },
];

export const CertificatesPage: React.FC = () => {
  const { isPrincipal, isTeacher, user } = useAuth();
  const { t, tBilingual, language, formatDate, formatNumber } = useLanguage();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'settings'>('pending');

  // Certificate requests list and counts
  const [certificates, setCertificates] = useState<CertificateRequestData[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Notifications
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Registered students for dropdown selection
  const [students, setStudents] = useState<any[]>([]);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedCertForReject, setSelectedCertForReject] = useState<CertificateRequestData | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Certificate PDF/Print Modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [certForPrint, setCertForPrint] = useState<{
    certificate: CertificateRequestData;
    student: any;
    template: TemplateSettings;
    filledBody: string;
    issueDate: string;
    downloadCount: number;
  } | null>(null);
  const [printLoading, setPrintLoading] = useState(false);

  // Request Form State
  const [studentSelectType, setStudentSelectType] = useState<'select' | 'manual'>('select');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [grNumber, setGrNumber] = useState('');
  const [classGrade, setClassGrade] = useState('इयत्ता १ ली');
  const [division, setDivision] = useState('A');
  const [certType, setCertType] = useState<
    'Bonafide Certificate' | 'Leaving Certificate' | 'Scholarship Certificate'
  >('Bonafide Certificate');
  const [purpose, setPurpose] = useState('बँक बचत खाते उघडणे व अधिकृत पडताळणीसाठी');
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split('T')[0]);
  const [reasonForLeaving, setReasonForLeaving] = useState('पालकांची बदली / स्थलांतर');
  const [conduct, setConduct] = useState('उत्कृष्ट (Excellent)');
  const [progress, setProgress] = useState('समाधानकारक (Satisfactory)');
  const [scholarshipSchemeName, setScholarshipSchemeName] = useState('सावित्रीबाई फुले कन्या शिष्यवृत्ती');
  const [sanctionAmount, setSanctionAmount] = useState<number>(1000);
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Certificate Settings State (Principal Only)
  const [configData, setConfigData] = useState<CertificateConfigData | null>(null);
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<'bonafide' | 'leaving' | 'scholarship'>('bonafide');
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  // Printable Component Ref
  const printableRef = useRef<HTMLDivElement>(null);

  // Fetch certificates from API
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portal/certificates');
      if (res.data?.success) {
        setCertificates(res.data.data);
        setPendingCount(res.data.pendingCount);
        setApprovedCount(res.data.approvedCount);
        setRejectedCount(res.data.rejectedCount);
      }
    } catch (err: any) {
      console.error('Failed to fetch certificates:', err);
      setStatusError('प्रमाणपत्र सूची लोड करता आली नाही.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch students list for dropdown
  const fetchStudents = async () => {
    try {
      const res = await api.get('/portal/students?limit=200');
      if (res.data?.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  // Fetch certificate settings config
  const fetchConfig = async () => {
    try {
      const res = await api.get('/portal/certificates/config');
      if (res.data?.success) {
        setConfigData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchStudents();
    fetchConfig();
  }, []);

  // Handle student selection from dropdown
  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const stu = students.find((s) => s._id === id);
    if (stu) {
      setStudentName(stu.name);
      setGrNumber(stu.grNumber);
      setClassGrade(stu.currentStandard || stu.classGrade || 'इयत्ता १ ली');
      setDivision(stu.division || 'A');
    }
  };

  // Submit certificate request
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setStatusError(null);
    setSubmittingRequest(true);

    try {
      const payload = {
        studentId: selectedStudentId || undefined,
        studentName,
        grNumber,
        classGrade,
        division,
        type: certType,
        purpose,
        reason: purpose,
        leavingDate: certType === 'Leaving Certificate' ? leavingDate : undefined,
        reasonForLeaving: certType === 'Leaving Certificate' ? reasonForLeaving : undefined,
        conduct: certType === 'Leaving Certificate' ? conduct : undefined,
        progress: certType === 'Leaving Certificate' ? progress : undefined,
        scholarshipSchemeName: certType === 'Scholarship Certificate' ? scholarshipSchemeName : undefined,
        sanctionAmount: certType === 'Scholarship Certificate' ? sanctionAmount : undefined,
        academicYear,
      };

      const res = await api.post('/portal/certificates/request', payload);
      if (res.data?.success) {
        setStatusMessage(res.data.message || 'प्रमाणपत्र मागणी यशस्वीरीत्या नोंदवली गेली.');
        setIsRequestModalOpen(false);
        // Reset form
        setStudentName('');
        setGrNumber('');
        fetchCertificates();
      }
    } catch (err: any) {
      setStatusError(err.response?.data?.message || err.message || 'प्रमाणपत्र मागणी अयशस्वी.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Principal approves certificate
  const handleApprove = async (certId: string, certNo: string) => {
    setStatusMessage(null);
    setStatusError(null);

    try {
      const res = await api.post('/portal/certificates/approve', { certificateId: certId });
      if (res.data?.success) {
        setStatusMessage(`प्रमाणपत्र #${certNo} मुख्याध्यापकांनी यशस्वीरीत्या मंजूर व स्वाक्षरीत केले.`);
        fetchCertificates();
      }
    } catch (err: any) {
      setStatusError(err.response?.data?.message || err.message || 'मंजुरी नोंदवता आली नाही.');
    }
  };

  // Open rejection modal
  const openRejectModal = (cert: CertificateRequestData) => {
    setSelectedCertForReject(cert);
    setRejectionReasonInput('पालकांचे प्रत्यक्ष विनंती अर्ज व कागदपत्रांची पूर्तता झालेली नाही.');
    setIsRejectModalOpen(true);
  };

  // Submit rejection
  const handleRejectSubmit = async () => {
    if (!selectedCertForReject) return;
    setStatusMessage(null);
    setStatusError(null);

    try {
      const res = await api.post('/portal/certificates/reject', {
        certificateId: selectedCertForReject._id,
        rejectionReason: rejectionReasonInput,
      });
      if (res.data?.success) {
        setStatusMessage(`प्रमाणपत्र #${selectedCertForReject.certificateNo} नाकारण्यात आले आहे.`);
        setIsRejectModalOpen(false);
        setSelectedCertForReject(null);
        fetchCertificates();
      }
    } catch (err: any) {
      setStatusError(err.response?.data?.message || err.message || 'नाकारण्याची प्रक्रिया अयशस्वी.');
    }
  };

  // View / Print Approved Certificate
  const handleViewAndDownload = async (certId: string) => {
    setStatusError(null);
    setPrintLoading(true);

    try {
      const res = await api.get(`/portal/certificates/${certId}/download`);
      if (res.data?.success) {
        setCertForPrint(res.data.data);
        setIsPrintModalOpen(true);
        // Refresh local count
        fetchCertificates();
      }
    } catch (err: any) {
      setStatusError(
        err.response?.data?.message ||
          'प्रमाणपत्र डाऊनलोड करता आले नाही. मंजुरी स्थिती व अधिकार तपासा.'
      );
    } finally {
      setPrintLoading(false);
    }
  };

  // Print trigger
  const handlePrint = () => {
    if (certForPrint) {
      const printUrl = `/api/portal/certificates/${certForPrint.certificate._id}/pdf`;
      window.open(printUrl, '_blank');
    }
  };

  // Save Settings Config (Principal Only)
  const handleSaveConfig = async () => {
    if (!configData) return;
    setConfigSaving(true);
    setConfigSuccess(null);
    setStatusError(null);

    try {
      const res = await api.put('/portal/certificates/config', {
        activeTemplate: configData.activeTemplate,
        templates: configData.templates,
      });
      if (res.data?.success) {
        setConfigData(res.data.data);
        setConfigSuccess('प्रमाणपत्र रचना व रंगसंगती यशस्वीरीत्या सेव्ह केली गेली!');
        setTimeout(() => setConfigSuccess(null), 4000);
      }
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'रचना सेव्ह करता आली नाही.');
    } finally {
      setConfigSaving(false);
    }
  };

  // Restore Default Config (Principal Only)
  const handleRestoreDefaultConfig = async () => {
    if (!window.confirm('आपण सर्व प्रमाणपत्र रचना मूळ (Factory Default) स्थितीत पूर्ववत करू इच्छिता?')) {
      return;
    }

    setConfigSaving(true);
    setStatusError(null);
    try {
      const res = await api.post('/portal/certificates/config/restore-default', {});
      if (res.data?.success) {
        setConfigData(res.data.data);
        setConfigSuccess('प्रमाणपत्र रचना मूळ डीफॉल्ट स्थितीत पूर्ववत करण्यात आली आहे.');
        setTimeout(() => setConfigSuccess(null), 4000);
      }
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'डीफॉल्ट रचना लोड करता आली नाही.');
    } finally {
      setConfigSaving(false);
    }
  };

  // Insert placeholder helper in settings textarea
  const insertPlaceholder = (tag: string) => {
    if (!configData) return;
    const currentTemplate = configData.templates[selectedTemplateTab];
    const newBody = `${currentTemplate.body} ${tag}`;
    setConfigData({
      ...configData,
      templates: {
        ...configData.templates,
        [selectedTemplateTab]: {
          ...currentTemplate,
          body: newBody,
        },
      },
    });
  };

  // Filtered certificates list
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      // Tab status match
      if (activeTab === 'pending' && c.status !== 'Pending') return false;
      if (activeTab === 'approved' && c.status !== 'Approved') return false;
      if (activeTab === 'rejected' && c.status !== 'Rejected') return false;

      // Type filter
      if (typeFilter !== 'ALL' && !c.type.toLowerCase().includes(typeFilter.toLowerCase())) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.studentName?.toLowerCase().includes(q);
        const matchesGr = c.grNumber?.toLowerCase().includes(q);
        const matchesNo = c.certificateNo?.toLowerCase().includes(q);
        const matchesClass = c.classGrade?.toLowerCase().includes(q);
        if (!matchesName && !matchesGr && !matchesNo && !matchesClass) return false;
      }

      return true;
    });
  }, [certificates, activeTab, typeFilter, searchTerm]);

  // Color hex mapping for live preview
  const currentAccentHex = useMemo(() => {
    if (!configData) return '#176638';
    const activeColorKey = configData.templates[selectedTemplateTab].accentColor || 'green';
    const found = COLOR_SWATCHES.find((s) => s.key === activeColorKey);
    return found ? found.hex : '#176638';
  }, [configData, selectedTemplateTab]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-green dark:border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            {isPrincipal ? (
              <Badge variant="orange" size="sm">
                {tBilingual('मुख्याध्यापक - मंजुरी व रचना अधिकार', 'Principal - Approval & Design Authority')}
              </Badge>
            ) : (
              <Badge variant="green" size="sm">
                {tBilingual('वर्गशिक्षक - मागणी व अधिकृत डाऊनलोड', 'Teacher - Request & Official Download')}
              </Badge>
            )}
            <span className="text-[11px] text-muted-text dark:text-dark-muted font-mono">UDISE: 27030504401</span>
          </div>
          <h1 className="text-2xl font-bold text-main-text dark:text-dark-text mt-1 flex items-center gap-2">
            <FileBadge className="w-6 h-6 text-primary-green dark:text-saffron-orange" />
            {tBilingual('शालेय प्रमाणपत्र कार्यप्रवाह', 'School Certificate Workflow')}
          </h1>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual(
              'बोनाफाईड प्रमाणपत्र, शाळा सोडल्याचा दाखला (Leaving TC) व शिष्यवृत्ती प्रमाणपत्र व्यवस्थापन',
              'Manage Bonafide, School Leaving (TC), and Scholarship certificates'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchCertificates();
              fetchConfig();
            }}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            {tBilingual('रिफ्रेश', 'Refresh')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRequestModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {tBilingual('नवीन प्रमाणपत्र मागणी', 'New Request')}
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {statusMessage && (
        <div className="p-3.5 bg-[#E2EFE7] dark:bg-emerald-950/40 border border-primary-green/30 dark:border-emerald-700 text-primary-green dark:text-emerald-400 text-xs rounded-xl flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-primary-green dark:text-emerald-400" />
            <span className="font-medium">{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-primary-green dark:text-emerald-400 hover:opacity-70 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {statusError && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span className="font-medium">{statusError}</span>
          </div>
          <button
            onClick={() => setStatusError(null)}
            className="text-red-700 dark:text-red-400 hover:opacity-70 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-border-green/80 dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-light-green dark:bg-dark-secondary flex items-center justify-center text-primary-green dark:text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-text dark:text-dark-muted block">
                {tBilingual('एकूण मागण्या', 'Total Requests')}
              </span>
              <span className="text-xl font-bold text-main-text dark:text-dark-text">{certificates.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-saffron-orange/40 dark:border-amber-700/40 shadow-xs bg-orange-50/40 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-amber-950/50 flex items-center justify-center text-saffron-orange shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 block">
                {tBilingual('प्रलंबित', 'Pending')}
              </span>
              <span className="text-xl font-bold text-amber-900 dark:text-amber-300">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-primary-green/40 dark:border-emerald-700/40 shadow-xs bg-[#F4F7F4] dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2EFE7] dark:bg-emerald-950/50 flex items-center justify-center text-primary-green dark:text-emerald-400 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-primary-green dark:text-emerald-400 block">
                {tBilingual('मंजूर', 'Approved')}
              </span>
              <span className="text-xl font-bold text-primary-green dark:text-emerald-400">{approvedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-red-200 dark:border-red-900/60 shadow-xs bg-red-50/30 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 block">
                {tBilingual('नाकारलेले', 'Rejected')}
              </span>
              <span className="text-xl font-bold text-red-800 dark:text-red-300">{rejectedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-green dark:border-dark-border">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'pending'
                ? 'border-saffron-orange text-saffron-orange bg-orange-50/60 dark:bg-amber-950/30 font-bold'
                : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text hover:bg-light-green/40 dark:hover:bg-dark-secondary'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{tBilingual('प्रलंबित मागण्या', 'Pending Requests')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'pending' ? 'bg-saffron-orange text-white' : 'bg-gray-200 dark:bg-dark-secondary text-gray-700 dark:text-dark-text'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'approved'
                ? 'border-primary-green text-primary-green dark:text-emerald-400 bg-light-green dark:bg-dark-secondary font-bold'
                : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text hover:bg-light-green/40 dark:hover:bg-dark-secondary'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{tBilingual('मंजूर व स्वाक्षरीत', 'Approved Certificates')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'approved' ? 'bg-primary-green text-white' : 'bg-gray-200 dark:bg-dark-secondary text-gray-700 dark:text-dark-text'
              }`}
            >
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'rejected'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 font-bold'
                : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text hover:bg-light-green/40 dark:hover:bg-dark-secondary'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{tBilingual('नाकारलेले', 'Rejected')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-dark-secondary text-gray-700 dark:text-dark-text'
              }`}
            >
              {rejectedCount}
            </span>
          </button>

          {isPrincipal && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'settings'
                  ? 'border-primary-green text-primary-green dark:text-emerald-400 bg-light-green dark:bg-dark-secondary font-bold'
                  : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text hover:bg-light-green/40 dark:hover:bg-dark-secondary'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-saffron-orange" />
              <span>{tBilingual('प्रमाणपत्र रचना', 'Certificate Settings')}</span>
            </button>
          )}
        </div>

        {/* Search and type filters for table tabs */}
        {activeTab !== 'settings' && (
          <div className="flex items-center gap-2 pb-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text dark:text-dark-muted" />
              <input
                type="text"
                placeholder={tBilingual('विद्यार्थी नाव, G.R. किंवा दाखला क्र...', 'Search student, G.R. or certificate no...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text placeholder-muted-text dark:placeholder-dark-muted focus:outline-none focus:ring-1 focus:ring-primary-green w-48 sm:w-60"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green cursor-pointer"
            >
              <option value="ALL" className="dark:bg-dark-card">{tBilingual('सर्व प्रकार', 'All Types')}</option>
              <option value="Bonafide" className="dark:bg-dark-card">{tBilingual('बोनाफाईड', 'Bonafide')}</option>
              <option value="Leaving" className="dark:bg-dark-card">{tBilingual('शाळा सोडल्याचा दाखला', 'Leaving Certificate')}</option>
              <option value="Scholarship" className="dark:bg-dark-card">{tBilingual('शिष्यवृत्ती', 'Scholarship')}</option>
            </select>
          </div>
        )}
      </div>

      {/* 4. Tab Contents */}

      {/* Tab A, B, C: Pending / Approved / Rejected Requests Table */}
      {activeTab !== 'settings' && (
        <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-xs">
          <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-secondary/60 border-b border-border-green dark:border-dark-border flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
              {activeTab === 'pending' && <Clock className="w-4 h-4 text-saffron-orange" />}
              {activeTab === 'approved' && <CheckCircle className="w-4 h-4 text-primary-green dark:text-emerald-400" />}
              {activeTab === 'rejected' && <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
              <span>
                {activeTab === 'pending' && tBilingual('मुख्याध्यापक मंजुरीच्या प्रतीक्षेतील मागण्या', 'Pending Requests Awaiting Principal Approval')}
                {activeTab === 'approved' && tBilingual('मंजूर व डाऊनलोडसाठी उपलब्ध प्रमाणपत्रे', 'Approved Certificates Available for Download')}
                {activeTab === 'rejected' && tBilingual('नाकारण्यात आलेल्या मागण्या व कारणे', 'Rejected Certificate Requests & Reasons')}
              </span>
            </CardTitle>
            <span className="text-[11px] text-muted-text dark:text-dark-muted">
              {formatNumber(filteredCertificates.length)} {tBilingual('नोंदी आढळल्या', 'records found')}
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-text dark:text-dark-muted text-xs">
                {tBilingual('माहिती लोड होत आहे...', 'Loading certificates...')}
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="py-12 text-center text-muted-text dark:text-dark-muted text-xs space-y-2">
                <FileBadge className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                <p>{tBilingual('कोणत्याही प्रमाणपत्राच्या नोंदी आढळल्या नाहीत.', 'No certificate records found.')}</p>
                {searchTerm && (
                  <p className="text-[11px]">{tBilingual('शोध निकष बदलून पुन्हा प्रयत्न करा.', 'Try adjusting your search criteria.')}</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-green dark:border-dark-border bg-light-green/60 dark:bg-dark-secondary/80 text-main-text dark:text-dark-text font-bold">
                      <th className="py-3 px-3.5">{tBilingual('दाखला क्र.', 'Cert No.')}</th>
                      <th className="py-3 px-3.5">{tBilingual('विद्यार्थ्याचे नाव व G.R.', 'Student Name & G.R.')}</th>
                      <th className="py-3 px-3.5">{tBilingual('इयत्ता / तुकडी', 'Class / Div')}</th>
                      <th className="py-3 px-3.5">{tBilingual('प्रमाणपत्र प्रकार', 'Certificate Type')}</th>
                      <th className="py-3 px-3.5">{tBilingual('मागणी तपशील व दिनांक', 'Details & Date')}</th>
                      {activeTab === 'approved' && <th className="py-3 px-3.5">{tBilingual('मंजुरी व डाऊनलोड', 'Approval & Download')}</th>}
                      {activeTab === 'rejected' && <th className="py-3 px-3.5">{tBilingual('नाकारण्याचे कारण', 'Rejection Reason')}</th>}
                      <th className="py-3 px-3.5 text-right">{tBilingual('कृती', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-green/80 dark:divide-dark-border">
                    {filteredCertificates.map((cert) => {
                      const isBonafide = cert.type.toLowerCase().includes('bonafide');
                      const isLeaving = cert.type.toLowerCase().includes('leaving');
                      const isScholarship = cert.type.toLowerCase().includes('scholarship');

                      return (
                        <tr key={cert._id} className="hover:bg-light-green/20 dark:hover:bg-emerald-950/20 transition-colors">
                          {/* Certificate No */}
                          <td className="py-3 px-3.5 font-mono font-bold text-primary-green dark:text-emerald-400 whitespace-nowrap">
                            {cert.certificateNo}
                          </td>

                          {/* Student Name & GR */}
                          <td className="py-3 px-3.5">
                            <span className="font-bold text-main-text dark:text-dark-text block">{cert.studentName}</span>
                            <span className="text-[11px] text-muted-text dark:text-dark-muted">G.R. क्र. : {cert.grNumber}</span>
                          </td>

                          {/* Class / Standard */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <Badge variant="outline" size="sm">
                              {cert.classGrade} ({cert.division || 'A'})
                            </Badge>
                          </td>

                          {/* Certificate Type */}
                          <td className="py-3 px-3.5">
                            {isBonafide && (
                              <Badge variant="green" size="sm">
                                {tBilingual('बोनाफाईड', 'Bonafide')}
                              </Badge>
                            )}
                            {isLeaving && (
                              <Badge variant="orange" size="sm">
                                {tBilingual('शाळा सोडल्याचा दाखला', 'Leaving Certificate')}
                              </Badge>
                            )}
                            {isScholarship && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                <Award className="w-3 h-3 text-purple-700 dark:text-purple-400" />
                                {tBilingual('शिष्यवृत्ती', 'Scholarship')}
                              </span>
                            )}
                            {!isBonafide && !isLeaving && !isScholarship && (
                              <Badge variant="neutral" size="sm">
                                {cert.type}
                              </Badge>
                            )}
                          </td>

                          {/* Requester & Date */}
                          <td className="py-3 px-3.5 text-[11px]">
                            <span className="text-main-text dark:text-dark-text font-medium block">{cert.requestedBy}</span>
                            <span className="text-muted-text dark:text-dark-muted">
                              {formatDate(cert.requestedDate)}
                            </span>
                            {cert.purpose && (
                              <span className="text-[10px] text-gray-500 dark:text-dark-muted block truncate max-w-[180px]">
                                {tBilingual('कारण:', 'Reason:')} {cert.purpose}
                              </span>
                            )}
                          </td>

                          {/* Approved Tab Info */}
                          {activeTab === 'approved' && (
                            <td className="py-3 px-3.5 text-[11px]">
                              <span className="text-primary-green dark:text-emerald-400 font-semibold block flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {cert.approvedBy || tBilingual('मुख्याध्यापक', 'Principal')}
                              </span>
                              <span className="text-muted-text dark:text-dark-muted">
                                {cert.approvedDate ? formatDate(cert.approvedDate) : '-'}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-dark-muted block">
                                {tBilingual('डाऊनलोड:', 'Downloads:')} {formatNumber(cert.downloadCount || 0)} {tBilingual('वेळा', 'times')}
                              </span>
                            </td>
                          )}

                          {/* Rejected Tab Info */}
                          {activeTab === 'rejected' && (
                            <td className="py-3 px-3.5 text-[11px]">
                              <span className="text-red-700 dark:text-red-300 font-semibold block bg-red-50 dark:bg-red-950/50 p-1.5 rounded-md border border-red-200 dark:border-red-900">
                                {cert.rejectionReason || tBilingual('माहिती अपूर्ण', 'Incomplete Information')}
                              </span>
                              <span className="text-[10px] text-muted-text dark:text-dark-muted mt-0.5 block">
                                {tBilingual('नाकारले:', 'Rejected by:')} {cert.rejectedBy || 'Principal'} (
                                {cert.rejectedDate ? formatDate(cert.rejectedDate) : '-'})
                              </span>
                            </td>
                          )}

                          {/* Action Buttons */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            {/* Actions for Pending Tab */}
                            {activeTab === 'pending' && (
                              <div className="flex items-center justify-end gap-1.5">
                                {isPrincipal ? (
                                  <>
                                    <Button
                                      variant="green"
                                      size="sm"
                                      className="text-[11px] py-1 px-2.5"
                                      onClick={() => handleApprove(cert._id, cert.certificateNo)}
                                      leftIcon={<FileCheck2 className="w-3 h-3" />}
                                    >
                                      {tBilingual('मंजूर करा', 'Approve')}
                                    </Button>

                                    <Button
                                      variant="danger"
                                      size="sm"
                                      className="text-[11px] py-1 px-2"
                                      onClick={() => openRejectModal(cert)}
                                      leftIcon={<XCircle className="w-3 h-3" />}
                                    >
                                      {tBilingual('नाकारा', 'Reject')}
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-saffron-orange" />
                                    {tBilingual('मुख्याध्यापक मंजुरी प्रतीक्षेत', 'Awaiting Principal Approval')}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Actions for Approved Tab */}
                            {activeTab === 'approved' && (
                              <div className="flex items-center justify-end gap-1.5">
                                {cert.isAuthorized !== false ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[11px] py-1 px-2.5 text-primary-green dark:text-emerald-400 hover:bg-light-green dark:hover:bg-dark-secondary border-primary-green/40 dark:border-emerald-700/60"
                                    onClick={() => handleViewAndDownload(cert._id)}
                                    leftIcon={<Download className="w-3 h-3 text-primary-green dark:text-emerald-400" />}
                                    disabled={printLoading}
                                  >
                                    {tBilingual('पहा व PDF डाऊनलोड', 'View & Download PDF')}
                                  </Button>
                                ) : (
                                  <span
                                    title={tBilingual('फक्त संबंधित वर्गशिक्षकांना किंवा अर्जदारांनाच डाऊनलोड अधिकार आहेत.', 'Only assigned class teacher or applicant has download permissions.')}
                                    className="text-[10px] text-gray-500 dark:text-dark-muted bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700"
                                  >
                                    {tBilingual('वर्ग अनधिकृत', 'Unauthorized Class')}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Actions for Rejected Tab */}
                            {activeTab === 'rejected' && (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-2 py-1 rounded-md inline-flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {tBilingual('नाकारले', 'Rejected')}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Tab D: Certificate Settings (Principal Only) */}
      {activeTab === 'settings' && isPrincipal && configData && (
        <div className="space-y-6">
          {/* Sub Navigation between Bonafide, Leaving, Scholarship templates */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-light-green rounded-xl border border-border-green">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary-green" />
              <span className="text-xs font-bold text-main-text">
                संपादन करण्यासाठी प्रमाणपत्र निवडा (Select Template to Configure):
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplateTab('bonafide')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedTemplateTab === 'bonafide'
                    ? 'bg-primary-green text-white shadow-xs'
                    : 'bg-white text-main-text border border-border-green hover:bg-gray-50'
                }`}
              >
                बोनाफाईड (Bonafide)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplateTab('leaving')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedTemplateTab === 'leaving'
                    ? 'bg-primary-green text-white shadow-xs'
                    : 'bg-white text-main-text border border-border-green hover:bg-gray-50'
                }`}
              >
                शाळा सोडल्याचा दाखला (Leaving TC)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplateTab('scholarship')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedTemplateTab === 'scholarship'
                    ? 'bg-primary-green text-white shadow-xs'
                    : 'bg-white text-main-text border border-border-green hover:bg-gray-50'
                }`}
              >
                शिष्यवृत्ती (Scholarship)
              </button>
            </div>
          </div>

          {configSuccess && (
            <div className="p-3 bg-[#E2EFE7] border border-primary-green text-primary-green text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-primary-green" />
              <span className="font-semibold">{configSuccess}</span>
            </div>
          )}

          {/* Grid: Editor on Left, Real-Time Live Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Panel */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="border border-border-green shadow-xs">
                <CardHeader className="py-3 px-4 bg-light-green/40 border-b border-border-green flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-main-text flex items-center gap-2">
                    <Settings className="w-4 h-4 text-saffron-orange" />
                    <span>रचना संपादन — {configData.templates[selectedTemplateTab].title}</span>
                  </CardTitle>
                  <span className="text-[11px] text-muted-text">
                    आवृत्ती v{configData.version} (Version)
                  </span>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Header Title */}
                  <div>
                    <label className="block text-xs font-semibold text-main-text mb-1">
                      शाळेचे नाव / मुख्य शीर्षक (Header) *
                    </label>
                    <input
                      type="text"
                      value={configData.templates[selectedTemplateTab].header}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          templates: {
                            ...configData.templates,
                            [selectedTemplateTab]: {
                              ...configData.templates[selectedTemplateTab],
                              header: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                    />
                  </div>

                  {/* Subheader */}
                  <div>
                    <label className="block text-xs font-semibold text-main-text mb-1">
                      उपशीर्षक / पत्ता व UDISE (Subheader) *
                    </label>
                    <input
                      type="text"
                      value={configData.templates[selectedTemplateTab].subheader}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          templates: {
                            ...configData.templates,
                            [selectedTemplateTab]: {
                              ...configData.templates[selectedTemplateTab],
                              subheader: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                    />
                  </div>

                  {/* Certificate Body Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-main-text">
                        प्रमाणपत्राचा मुख्य मजकूर (Certificate Body) *
                      </label>
                      <span className="text-[10px] text-muted-text">
                        खालील व्हेरिएबल टॅग्स वापरून मजकूर डायनॅमिक बनवा
                      </span>
                    </div>

                    {/* Interactive Placeholder Chips */}
                    <div className="flex flex-wrap gap-1 p-2 bg-light-green/50 border border-border-green/80 rounded-lg mb-2">
                      <span className="text-[10px] font-bold text-primary-green w-full block">
                        टॅगवर क्लिक करून मजकुरात समाविष्ट करा (Insert Dynamic Tag):
                      </span>
                      {[
                        '{studentName}',
                        '{grNumber}',
                        '{standard}',
                        '{division}',
                        '{dob}',
                        '{caste}',
                        '{category}',
                        '{fatherName}',
                        '{motherName}',
                        '{purpose}',
                        '{academicYear}',
                        '{leavingDate}',
                        '{reasonForLeaving}',
                        '{conduct}',
                        '{progress}',
                        '{scholarshipSchemeName}',
                        '{sanctionAmount}',
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertPlaceholder(tag)}
                          className="text-[10px] font-mono bg-white hover:bg-primary-green hover:text-white border border-border-green px-1.5 py-0.5 rounded transition-colors text-main-text cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={5}
                      value={configData.templates[selectedTemplateTab].body}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          templates: {
                            ...configData.templates,
                            [selectedTemplateTab]: {
                              ...configData.templates[selectedTemplateTab],
                              body: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white leading-relaxed font-sans"
                    />
                  </div>

                  {/* Footer Note & Place */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-main-text mb-1">
                        तळटीप (Footer Note) *
                      </label>
                      <input
                        type="text"
                        value={configData.templates[selectedTemplateTab].footerNote}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            templates: {
                              ...configData.templates,
                              [selectedTemplateTab]: {
                                ...configData.templates[selectedTemplateTab],
                                footerNote: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-main-text mb-1">
                        स्थळ / ठिकाण (Place) *
                      </label>
                      <input
                        type="text"
                        value={configData.templates[selectedTemplateTab].place}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            templates: {
                              ...configData.templates,
                              [selectedTemplateTab]: {
                                ...configData.templates[selectedTemplateTab],
                                place: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                      />
                    </div>
                  </div>

                  {/* Signature Labels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-main-text mb-1">
                        शिक्षक स्वाक्षरी लेबल (Teacher Signature Label) *
                      </label>
                      <input
                        type="text"
                        value={configData.templates[selectedTemplateTab].teacherSignLabel}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            templates: {
                              ...configData.templates,
                              [selectedTemplateTab]: {
                                ...configData.templates[selectedTemplateTab],
                                teacherSignLabel: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-main-text mb-1">
                        मुख्याध्यापक स्वाक्षरी लेबल (Principal Signature Label) *
                      </label>
                      <input
                        type="text"
                        value={configData.templates[selectedTemplateTab].principalSignLabel}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            templates: {
                              ...configData.templates,
                              [selectedTemplateTab]: {
                                ...configData.templates[selectedTemplateTab],
                                principalSignLabel: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                      />
                    </div>
                  </div>

                  {/* Toggles: Show Border & Show Seal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-green">
                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-border-green hover:bg-light-green/30">
                      <input
                        type="checkbox"
                        checked={configData.templates[selectedTemplateTab].showBorder}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            templates: {
                              ...configData.templates,
                              [selectedTemplateTab]: {
                                ...configData.templates[selectedTemplateTab],
                                showBorder: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-4 h-4 text-primary-green rounded focus:ring-primary-green"
                      />
                      <span className="text-xs font-semibold text-main-text">
                        अधिकृत शासकीय बॉर्डर दाखवा (Show Border)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-border-green hover:bg-light-green/30">
                      <input
                        type="checkbox"
                        checked={configData.templates[selectedTemplateTab].showSeal}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            templates: {
                              ...configData.templates,
                              [selectedTemplateTab]: {
                                ...configData.templates[selectedTemplateTab],
                                showSeal: e.target.checked,
                              },
                            },
                          })
                        }
                        className="w-4 h-4 text-primary-green rounded focus:ring-primary-green"
                      />
                      <span className="text-xs font-semibold text-main-text">
                        शाळेचा शिक्का जागा दाखवा (Show Seal Placeholder)
                      </span>
                    </label>
                  </div>

                  {/* Circular Swatches for Accent / Border Color */}
                  <div className="pt-2 border-t border-border-green">
                    <label className="block text-xs font-bold text-main-text mb-2">
                      बॉर्डर व ॲक्सेंट रंग निवडा (Border / Accent Color Selector):
                    </label>

                    <div className="flex flex-wrap items-center gap-4">
                      {COLOR_SWATCHES.map((swatch) => {
                        const isSelected =
                          configData.templates[selectedTemplateTab].accentColor === swatch.key;
                        return (
                          <button
                            key={swatch.key}
                            type="button"
                            onClick={() =>
                              setConfigData({
                                ...configData,
                                templates: {
                                  ...configData.templates,
                                  [selectedTemplateTab]: {
                                    ...configData.templates[selectedTemplateTab],
                                    accentColor: swatch.key,
                                  },
                                },
                              })
                            }
                            className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all ${
                              isSelected
                                ? 'border-primary-green bg-light-green ring-2 ring-primary-green/30 font-bold'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                              style={{ backgroundColor: swatch.hex }}
                            >
                              {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                            </span>
                            <span className="text-xs text-main-text">{swatch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save and Restore Buttons */}
                  <div className="pt-4 border-t border-border-green flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreDefaultConfig}
                      disabled={configSaving}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-red-600" />}
                      className="text-red-700 hover:bg-red-50 border-red-200"
                    >
                      मूळ रचना पूर्ववत करा (Restore Defaults)
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSaveConfig}
                      isLoading={configSaving}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      रचना सेव्ह करा (Save Configuration)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview Panel */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-main-text flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-primary-green" />
                  थेट पूर्वावलोकन (Live Certificate Preview):
                </span>
                <span className="text-[11px] text-muted-text">
                  बदल करताच आपोआप अपडेट होते (A4 Format)
                </span>
              </div>

              {/* Certificate Sheet Preview */}
              <div
                className="bg-white p-6 shadow-md rounded-lg relative overflow-hidden transition-all text-xs"
                style={{
                  border: configData.templates[selectedTemplateTab].showBorder
                    ? `5px double ${currentAccentHex}`
                    : '1px solid #E5E7EB',
                }}
              >
                {/* Background Watermark */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-[38px] font-black tracking-widest uppercase rotate-[-25deg] opacity-[0.06]"
                  style={{ color: currentAccentHex }}
                >
                  ZP SCHOOL HINGONE BK
                </div>

                {/* School Header */}
                <div
                  className="text-center pb-3 mb-4 relative z-10"
                  style={{ borderBottom: `2px solid ${currentAccentHex}` }}
                >
                  <span className="text-[11px] font-bold text-amber-700 block">
                    ॥ महाराष्ट्र शासन - जिल्हा परिषद, जळगाव ॥
                  </span>
                  <h3
                    className="text-lg font-extrabold mt-0.5 tracking-tight"
                    style={{ color: currentAccentHex }}
                  >
                    {configData.templates[selectedTemplateTab].header}
                  </h3>
                  <p className="text-[11px] text-gray-600">
                    {configData.templates[selectedTemplateTab].subheader}
                  </p>
                </div>

                {/* Metadata Row */}
                <div className="flex justify-between items-center text-[11px] font-semibold text-gray-700 mb-3 relative z-10">
                  <span>जावक क्र. : PREVIEW-2026-001</span>
                  <span>दिनांक : {new Date().toLocaleDateString('mr-IN')}</span>
                </div>

                {/* Certificate Badge */}
                <div className="text-center my-3 relative z-10">
                  <span
                    className="inline-block px-4 py-1 rounded-full text-white font-bold text-xs shadow-xs"
                    style={{ backgroundColor: currentAccentHex }}
                  >
                    {configData.templates[selectedTemplateTab].title}
                  </span>
                </div>

                {/* Dynamic Body Content */}
                <div className="my-4 text-[12px] leading-relaxed text-gray-800 text-justify relative z-10">
                  {configData.templates[selectedTemplateTab].body
                    .replace(/{studentName}/g, 'पाटील वेदांत सचिन')
                    .replace(/{grNumber}/g, '1351')
                    .replace(/{standard}/g, 'इयत्ता १ ली')
                    .replace(/{division}/g, 'A')
                    .replace(/{dob}/g, '०१/०६/२०१६')
                    .replace(/{caste}/g, 'मराठा')
                    .replace(/{category}/g, 'General')
                    .replace(/{fatherName}/g, 'सचिन पाटील')
                    .replace(/{motherName}/g, 'सुनिता पाटील')
                    .replace(/{purpose}/g, 'बँक बचत खाते उघडणे व आधार पडताळणी')
                    .replace(/{academicYear}/g, '2026-27')
                    .replace(/{leavingDate}/g, new Date().toLocaleDateString('mr-IN'))
                    .replace(/{reasonForLeaving}/g, 'पालकांची बदली')
                    .replace(/{conduct}/g, 'उत्कृष्ट (Excellent)')
                    .replace(/{progress}/g, 'समाधानकारक (Satisfactory)')
                    .replace(/{scholarshipSchemeName}/g, 'सावित्रीबाई फुले कन्या शिष्यवृत्ती')
                    .replace(/{sanctionAmount}/g, '1,000')}
                </div>

                {/* Footer Note */}
                <div className="pt-2 pb-6 border-t border-dashed border-gray-300 text-[10px] text-gray-500 italic relative z-10">
                  टीप: {configData.templates[selectedTemplateTab].footerNote}
                </div>

                {/* Signatures & Seal Section */}
                <div className="flex justify-between items-end pt-4 relative z-10">
                  <div className="text-center w-32">
                    <div className="border-t border-gray-800 pt-1 font-bold text-[11px] text-gray-800">
                      {configData.templates[selectedTemplateTab].teacherSignLabel}
                    </div>
                    <span className="text-[10px] text-gray-500">जि. प. शाळा, हिंगोणे बु.</span>
                  </div>

                  {configData.templates[selectedTemplateTab].showSeal && (
                    <div
                      className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center text-center text-[9px] font-bold leading-tight"
                      style={{ borderColor: currentAccentHex, color: currentAccentHex }}
                    >
                      शालेय मोहर
                      <br />
                      ZP SEAL
                    </div>
                  )}

                  <div className="text-center w-36">
                    <span
                      className="text-[10px] font-bold block mb-1"
                      style={{ color: currentAccentHex }}
                    >
                      श्री. एस. आर. पाटील (Principal)
                    </span>
                    <div className="border-t border-gray-800 pt-1 font-bold text-[11px] text-gray-800">
                      {configData.templates[selectedTemplateTab].principalSignLabel}
                    </div>
                    <span className="text-[10px] text-gray-500">जि. प. शाळा, हिंगोणे बु.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Request Certificate Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-border-green dark:border-dark-border animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-light-green dark:bg-emerald-950/40 flex items-center justify-center text-primary-green dark:text-emerald-400">
                  <FileBadge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                    {tBilingual('नवीन प्रमाणपत्र मागणी नोंदवा', 'Request Certificate')}
                  </h3>
                  <span className="text-[11px] text-muted-text dark:text-dark-muted">
                    {isTeacher
                      ? tBilingual('शिक्षकांमार्फत मागणी - मुख्याध्यापक मंजुरीनंतरच दाखला उपलब्ध होईल', 'Teacher request - certificate issued after Principal approval')
                      : tBilingual('मुख्याध्यापक थेट नोंदणी', 'Principal direct issuance')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
              {/* Student selection mode toggle */}
              <div className="flex items-center justify-between p-2 bg-light-green/40 dark:bg-dark-secondary rounded-lg">
                <span className="font-semibold text-main-text dark:text-dark-text">
                  {tBilingual('विद्यार्थी निवड पद्धत:', 'Selection Mode:')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentSelectType('select')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      studentSelectType === 'select'
                        ? 'bg-primary-green text-white shadow-xs'
                        : 'bg-white dark:bg-dark-bg text-main-text dark:text-dark-text border border-border-green dark:border-dark-border'
                    }`}
                  >
                    {tBilingual('यादीतून निवडा', 'From Roster')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentSelectType('manual')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      studentSelectType === 'manual'
                        ? 'bg-primary-green text-white shadow-xs'
                        : 'bg-white dark:bg-dark-bg text-main-text dark:text-dark-text border border-border-green dark:border-dark-border'
                    }`}
                  >
                    {tBilingual('थेट नाव भरा', 'Manual Entry')}
                  </button>
                </div>
              </div>

              {/* Student Picker from Roster */}
              {studentSelectType === 'select' ? (
                <div>
                  <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                    {tBilingual('नोंदणीकृत विद्यार्थी निवडा *', 'Select Enrolled Student *')}
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    required={studentSelectType === 'select'}
                    className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-bg dark:text-dark-text"
                  >
                    <option value="">{tBilingual('-- विद्यार्थी निवडा --', '-- Select Student --')}</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} (G.R.: {s.grNumber} | {s.currentStandard || s.classGrade})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('विद्यार्थ्याचे पूर्ण नाव *', 'Student Full Name *')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={tBilingual('उदा. पाटील वेदांत सचिन', 'e.g. Patil Vedant Sachin')}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('जनरल रजिस्टर क्र. *', 'General Register No. *')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. 1351"
                      value={grNumber}
                      onChange={(e) => setGrNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>
                </div>
              )}

              {/* Class & Division */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                    {tBilingual('इयत्ता *', 'Standard *')}
                  </label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-bg dark:text-dark-text"
                  >
                    <option value="इयत्ता १ ली">{tBilingual('इयत्ता १ ली', 'Class 1st')}</option>
                    <option value="इयत्ता २ री">{tBilingual('इयत्ता २ री', 'Class 2nd')}</option>
                    <option value="इयत्ता ३ री">{tBilingual('इयत्ता ३ री', 'Class 3rd')}</option>
                    <option value="इयत्ता ४ थी">{tBilingual('इयत्ता ४ थी', 'Class 4th')}</option>
                    <option value="इयत्ता ५ वी">{tBilingual('इयत्ता ५ वी', 'Class 5th')}</option>
                    <option value="इयत्ता ६ वी">{tBilingual('इयत्ता ६ वी', 'Class 6th')}</option>
                    <option value="इयत्ता ७ वी">{tBilingual('इयत्ता ७ वी', 'Class 7th')}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                    {tBilingual('तुकडी', 'Division')}
                  </label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-bg dark:text-dark-text"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>

              {/* Certificate Type Selection */}
              <div>
                <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                  {tBilingual('प्रमाणपत्र प्रकार *', 'Certificate Type *')}
                </label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-bg dark:text-dark-text font-medium text-primary-green dark:text-emerald-400"
                >
                  <option value="Bonafide Certificate">
                    {tBilingual('१. बोनाफाईड प्रमाणपत्र', '1. Bonafide Certificate')}
                  </option>
                  <option value="Leaving Certificate">
                    {tBilingual('२. शाळा सोडल्याचा दाखला', '2. Leaving Certificate / TC')}
                  </option>
                  <option value="Scholarship Certificate">
                    {tBilingual('३. शिष्यवृत्ती प्रमाणपत्र', '3. Scholarship Certificate')}
                  </option>
                </select>
              </div>

              {/* Dynamic Fields for Bonafide */}
              {certType === 'Bonafide Certificate' && (
                <div className="space-y-3 p-3 bg-light-green/30 dark:bg-dark-secondary border border-border-green dark:border-dark-border rounded-xl">
                  <span className="font-bold text-primary-green dark:text-emerald-400 block">
                    {tBilingual('बोनाफाईड प्रमाणपत्र तपशील:', 'Bonafide Certificate Details:')}
                  </span>
                  <div>
                    <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('दाखल्याचे प्रयोजन / कारण *', 'Purpose of Certificate *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder={tBilingual('उदा. राष्ट्रीयीकृत बँकेत बचत खाते उघडणे, आधार दुरुस्ती', 'e.g. Opening bank savings account, Aadhaar correction')}
                      className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शैक्षणिक वर्ष', 'Academic Year')}
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Fields for Leaving Certificate */}
              {certType === 'Leaving Certificate' && (
                <div className="space-y-3 p-3 bg-orange-50/50 dark:bg-amber-950/20 border border-saffron-orange/40 dark:border-amber-700/40 rounded-xl">
                  <span className="font-bold text-amber-900 dark:text-amber-300 block">
                    {tBilingual('शाळा सोडल्याचा दाखला तपशील:', 'Leaving Certificate Details:')}
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('शाळा सोडल्याचा दिनांक *', 'Date of Leaving *')}
                      </label>
                      <input
                        type="date"
                        required
                        value={leavingDate}
                        onChange={(e) => setLeavingDate(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('शाळा सोडल्याचे कारण *', 'Reason for Leaving *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={reasonForLeaving}
                        onChange={(e) => setReasonForLeaving(e.target.value)}
                        placeholder={tBilingual('उदा. पालकांची बदली, इयत्ता ७ वी उत्तीर्ण', 'e.g. Parents transfer, passed 7th grade')}
                        className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('वर्तणूक', 'Conduct')}
                      </label>
                      <select
                        value={conduct}
                        onChange={(e) => setConduct(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      >
                        <option value="उत्कृष्ट (Excellent)">{tBilingual('उत्कृष्ट', 'Excellent')}</option>
                        <option value="चांगली (Good)">{tBilingual('चांगली', 'Good')}</option>
                        <option value="समाधानकारक (Satisfactory)">{tBilingual('समाधानकारक', 'Satisfactory')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('प्रगती', 'Progress')}
                      </label>
                      <select
                        value={progress}
                        onChange={(e) => setProgress(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      >
                        <option value="उत्कृष्ट (Outstanding)">{tBilingual('उत्कृष्ट', 'Outstanding')}</option>
                        <option value="चांगली (Good)">{tBilingual('चांगली', 'Good')}</option>
                        <option value="समाधानकारक (Satisfactory)">{tBilingual('समाधानकारक', 'Satisfactory')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Fields for Scholarship Certificate */}
              {certType === 'Scholarship Certificate' && (
                <div className="space-y-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <span className="font-bold text-purple-900 dark:text-purple-300 block">
                    {tBilingual('शिष्यवृत्ती प्रमाणपत्र तपशील:', 'Scholarship Certificate Details:')}
                  </span>
                  <div>
                    <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शिष्यवृत्ती योजनेचे नाव *', 'Scholarship Scheme Name *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={scholarshipSchemeName}
                      onChange={(e) => setScholarshipSchemeName(e.target.value)}
                      placeholder={tBilingual('उदा. सावित्रीबाई फुले कन्या शिष्यवृत्ती', 'e.g. Savitribai Phule Scholarship')}
                      className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('मंजूर रक्कम (₹) *', 'Sanctioned Amount (₹) *')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={sanctionAmount}
                        onChange={(e) => setSanctionAmount(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('शैक्षणिक वर्ष', 'Academic Year')}
                      </label>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-border-green dark:border-dark-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRequestModalOpen(false)}
                >
                  {tBilingual('रद्द करा', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submittingRequest}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {tBilingual('मागणी सबमिट करा', 'Submit Request')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Principal Reject Reason Modal */}
      {isRejectModalOpen && selectedCertForReject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-red-200 dark:border-red-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 pb-2 border-b border-red-100 dark:border-red-900">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                {tBilingual('प्रमाणपत्र मागणी नाकारा', 'Reject Certificate Request')}
              </h3>
            </div>

            <p className="text-xs text-muted-text dark:text-dark-muted">
              {tBilingual(
                `आपण ${selectedCertForReject.studentName} यांचे दाखला क्र. नाकारत आहात. शिक्षकांना समजण्यासाठी कारण नोंदवा:`,
                `You are rejecting certificate request for ${selectedCertForReject.studentName} (${selectedCertForReject.certificateNo}). Enter reason:`
              )}
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-main-text dark:text-dark-text">
                {tBilingual('नाकारण्याचे अधिकृत कारण *', 'Official Rejection Reason *')}
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder={tBilingual('उदा. पालकांचे संमतीपत्र जोडलेले नाही किंवा माहिती अपूर्ण आहे.', 'e.g. Consent letter not attached or incomplete details.')}
                className="w-full p-2.5 border border-red-200 dark:border-red-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-dark-bg dark:text-dark-text"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRejectModalOpen(false)}
              >
                {tBilingual('रद्द करा', 'Cancel')}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleRejectSubmit}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                {tBilingual('दाखला नाकारा', 'Confirm Reject')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Certificate High-Fidelity PDF/Print Preview Modal */}
      {isPrintModalOpen && certForPrint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-border-green dark:border-dark-border animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
              <div>
                <span className="text-[11px] font-bold text-primary-green dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {tBilingual('अधिकृत मंजूर प्रमाणपत्र', 'Official Signed Certificate')}
                </span>
                <h3 className="text-sm font-bold text-main-text dark:text-dark-text">
                  {tBilingual('दाखला क्र.', 'Cert No.')} : {certForPrint.certificate.certificateNo} —{' '}
                  {certForPrint.certificate.studentName}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePrint}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  {tBilingual('प्रिंट / PDF सेव्ह करा', 'Print / Save PDF')}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold p-1 text-sm ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Certificate Paper Sheet */}
            <div
              ref={printableRef}
              className="bg-white text-gray-900 p-8 relative rounded-lg overflow-hidden shadow-xs border transition-all text-xs"
              style={{
                border: certForPrint.template.showBorder
                  ? `6px double ${
                      COLOR_SWATCHES.find((s) => s.key === certForPrint.template.accentColor)?.hex ||
                      '#176638'
                    }`
                  : '1px solid #D1D5DB',
              }}
            >
              {/* Background Watermark */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-[48px] font-black tracking-widest uppercase rotate-[-25deg] opacity-[0.05]"
                style={{
                  color:
                    COLOR_SWATCHES.find((s) => s.key === certForPrint.template.accentColor)?.hex ||
                    '#176638',
                }}
              >
                ZP SCHOOL HINGONE BK
              </div>

              {/* School Header */}
              <div
                className="text-center pb-4 mb-4 relative z-10"
                style={{
                  borderBottom: `2px solid ${
                    COLOR_SWATCHES.find((s) => s.key === certForPrint.template.accentColor)?.hex ||
                    '#176638'
                  }`,
                }}
              >
                <span className="text-[11px] font-bold text-amber-700 tracking-wider block">
                  ॥ महाराष्ट्र शासन - जिल्हा परिषद, जळगाव ॥
                </span>
                <h2
                  className="text-xl font-extrabold mt-1 tracking-tight"
                  style={{
                    color:
                      COLOR_SWATCHES.find((s) => s.key === certForPrint.template.accentColor)?.hex ||
                      '#176638',
                  }}
                >
                  {certForPrint.template.header}
                </h2>
                <p className="text-[11px] text-gray-600 mt-0.5">{certForPrint.template.subheader}</p>
              </div>

              {/* Meta Row: Inward/Outward No. & Date */}
              <div className="flex justify-between items-center text-[12px] font-semibold text-gray-800 mb-4 relative z-10">
                <div>
                  <strong>जावक क्र. :</strong> {certForPrint.certificate.certificateNo}
                </div>
                <div>
                  <strong>दिनांक :</strong> {certForPrint.issueDate}
                </div>
              </div>

              {/* Certificate Badge */}
              <div className="text-center my-4 relative z-10">
                <span
                  className="inline-block px-5 py-1.5 rounded-full text-white font-bold text-sm shadow-xs"
                  style={{
                    backgroundColor:
                      COLOR_SWATCHES.find((s) => s.key === certForPrint.template.accentColor)?.hex ||
                      '#176638',
                  }}
                >
                  {certForPrint.template.title}
                </span>
              </div>

              {/* Body Text Filled with student particulars */}
              <div className="my-6 text-[13px] leading-loose text-gray-900 text-justify indent-8 relative z-10">
                {certForPrint.filledBody}
              </div>

              {/* Footer Note */}
              <div className="pt-2 pb-6 border-t border-dashed border-gray-300 text-[11px] text-gray-500 italic relative z-10">
                <strong>टीप :</strong> {certForPrint.template.footerNote}
              </div>

              {/* Signatures & Seal Section */}
              <div className="flex justify-between items-end pt-6 relative z-10">
                <div className="text-center w-36">
                  <div className="border-t border-gray-900 pt-1.5 font-bold text-xs text-gray-900">
                    {certForPrint.template.teacherSignLabel}
                  </div>
                  <span className="text-[10px] text-gray-500">जि. प. प्राथ. शाळा, हिंगोणे बु.</span>
                </div>

                {certForPrint.template.showSeal && (
                  <div
                    className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center text-center text-[10px] font-bold leading-tight"
                    style={{
                      borderColor:
                        COLOR_SWATCHES.find((s) => s.key === certForPrint.template.accentColor)?.hex ||
                        '#176638',
                      color:
                        COLOR_SWATCHES.find((s) => s.key === certForPrint.template.accentColor)?.hex ||
                        '#176638',
                    }}
                  >
                    शालेय मोहर
                    <br />
                    ZP SEAL
                  </div>
                )}

                <div className="text-center w-44">
                  <span
                    className="text-[11px] font-bold block mb-1"
                    style={{
                      color:
                        COLOR_SWATCHES.find((s) => s.key === certForPrint.template.accentColor)?.hex ||
                        '#176638',
                    }}
                  >
                    {certForPrint.certificate.approvedBy || 'श्री. एस. आर. पाटील (Principal)'}
                  </span>
                  <div className="border-t border-gray-900 pt-1.5 font-bold text-xs text-gray-900">
                    {certForPrint.template.principalSignLabel}
                  </div>
                  <span className="text-[10px] text-gray-500">जि. प. प्राथ. शाळा, हिंगोणे बु.</span>
                </div>
              </div>
            </div>

            {/* Bottom info banner */}
            <div className="flex items-center justify-between text-[11px] text-muted-text dark:text-dark-muted pt-2 border-t border-border-green dark:border-dark-border">
              <span>
                {tBilingual(
                  `ही प्रत अधिकृत डेटाबेस अभिलेखावरून थेट तयार करण्यात आली आहे. (अधिकृत डाऊनलोड: #${certForPrint.certificate.downloadCount} वेळा)`,
                  `This certificate is digitally generated from official school records. (Downloads: #${certForPrint.certificate.downloadCount})`
                )}
              </span>
              <Button variant="outline" size="sm" onClick={() => setIsPrintModalOpen(false)}>
                {tBilingual('बंद करा', 'Close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
