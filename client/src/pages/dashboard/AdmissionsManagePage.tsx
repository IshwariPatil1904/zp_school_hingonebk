import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Phone,
  Home,
  FileText,
  Loader2,
  ShieldAlert,
  Calendar,
  Eye,
  CheckSquare,
  AlertTriangle,
  UserCheck,
  Send,
  Building2,
  GraduationCap,
  Sparkles,
  X,
  FileCheck,
} from 'lucide-react';

interface AdmissionApplication {
  _id: string;
  applicationNo: string;
  studentName: string;
  gender: string;
  dateOfBirth: string;
  gradeApplying: string;
  parentName: string;
  motherName?: string;
  guardianName?: string;
  parentPhone: string;
  parentEmail?: string;
  residentialAddress: string;
  village?: string;
  taluka?: string;
  district?: string;
  pincode?: string;
  category?: string;
  caste?: string;
  religion?: string;
  motherTongue?: string;
  bloodGroup?: string;
  previousSchool?: string;
  previousStandard?: string;
  previousMarks?: number;
  documents?: Array<{ name: string; type: string; url?: string; isVerified: boolean }>;
  status: 'Pending' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Waitlisted' | 'Admitted';
  rejectionReason?: string;
  waitlistReason?: string;
  decisionHistory?: Array<{ status: string; changedBy: string; changedAt: string; notes?: string; reason?: string }>;
  admittedStudentId?: any;
  assignedGrNumber?: string;
  assignedStandard?: string;
  assignedDivision?: string;
  admissionDate?: string;
  appliedAt: string;
}

export const AdmissionsManagePage: React.FC = () => {
  const { isPrincipal } = useAuth();
  const { tBilingual, formatNumber, formatDate } = useLanguage();
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Application Counts
  const [counts, setCounts] = useState<{
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    admitted: number;
    waitlisted: number;
    rejected: number;
  }>({
    total: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    admitted: 0,
    waitlisted: 0,
    rejected: 0,
  });

  // Detailed Modal State
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Status Action Modal State
  const [actionType, setActionType] = useState<'Under Review' | 'Approved' | 'Rejected' | 'Waitlisted' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [processingStatus, setProcessingStatus] = useState(false);

  // Controlled Enrollment Modal State
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [nextGr, setNextGr] = useState('');
  const [enrollForm, setEnrollForm] = useState({
    grNumber: '',
    standard: 'इयत्ता १ ली',
    division: 'A',
    admissionDate: new Date().toISOString().split('T')[0],
    category: 'OBC',
    bloodGroup: 'B+',
    saralId: '',
    penNumber: '',
  });
  const [enrolling, setEnrolling] = useState(false);

  const fetchAdmissions = async () => {
    setLoading(true);
    let url = `/portal/admissions?status=${statusFilter}&grade=${gradeFilter}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    try {
      const res = await api.get(url);
      if (res.data?.success) {
        setApplications(res.data.data || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'प्रवेश अर्ज लोड करताना त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [statusFilter, gradeFilter]);

  // Open Full Details
  const handleOpenDetails = async (appId: string) => {
    try {
      const res = await api.get(`/portal/admissions/${appId}`);
      if (res.data?.success) {
        setSelectedApp(res.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch application details', err);
    }
  };

  // Status Update Handler (Under Review, Approve, Reject, Waitlist)
  const handleConfirmStatusUpdate = async () => {
    if (!selectedApp || !actionType) return;

    if (actionType === 'Rejected' && !actionReason.trim()) {
      alert(tBilingual('प्रवेश अर्ज नाकारताना कारण नमूद करणे अनिवार्य आहे.', 'Reason for rejection is mandatory.'));
      return;
    }

    setProcessingStatus(true);
    try {
      const res = await api.post(`/portal/admissions/${selectedApp._id}/status`, {
        status: actionType,
        reason: actionReason,
        notes: actionNotes,
      });

      if (res.data?.success) {
        setActionMsg(
          `${tBilingual('अर्ज #', 'Application #')}${selectedApp.applicationNo} ${tBilingual('ची स्थिती यशस्वीरीत्या अद्ययावत करण्यात आली.', 'status was updated successfully.')}`
        );
        setActionType(null);
        setActionReason('');
        setActionNotes('');
        handleOpenDetails(selectedApp._id); // Refresh modal
        fetchAdmissions(); // Refresh list
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'स्थिती अद्ययावत करताना त्रुटी आली.');
    } finally {
      setProcessingStatus(false);
    }
  };

  // Open Enrollment Modal and fetch next available GR Number
  const handleOpenEnrollModal = async (app: AdmissionApplication) => {
    setSelectedApp(app);
    try {
      const nextGrRes = await api.get('/portal/admissions/next-gr');
      const calculatedGr = nextGrRes.data?.data?.nextGrNumber || '1501';
      setNextGr(calculatedGr);

      const cleanStd = app.gradeApplying.includes('(')
        ? app.gradeApplying.split('(')[0].trim()
        : app.gradeApplying;

      setEnrollForm({
        grNumber: calculatedGr,
        standard: cleanStd || 'इयत्ता १ ली',
        division: 'A',
        admissionDate: new Date().toISOString().split('T')[0],
        category: app.category || 'OBC',
        bloodGroup: app.bloodGroup || 'B+',
        saralId: `2703080450126${calculatedGr.padStart(4, '0')}`,
        penNumber: `PEN2026${calculatedGr}`,
      });
      setShowEnrollModal(true);
    } catch (err) {
      console.error('Failed to get next GR number', err);
      setShowEnrollModal(true);
    }
  };

  // Submit Controlled Student Enrollment
  const handleExecuteEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setEnrolling(true);
    try {
      const res = await api.post(`/portal/admissions/${selectedApp._id}/enroll`, enrollForm);
      if (res.data?.success) {
        setActionMsg(
          `${tBilingual('अभिनंदन!', 'Congratulations!')} ${selectedApp.studentName} — ${tBilingual('GR क्र.', 'GR No.')} ${enrollForm.grNumber} ${tBilingual('सह अधिकृत प्रवेश निश्चित झाला आहे!', 'enrollment confirmed successfully!')}`
        );
        setShowEnrollModal(false);
        setShowDetailModal(false);
        fetchAdmissions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'विद्यार्थी नोंदणी करताना त्रुटी आली.');
    } finally {
      setEnrolling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            {tBilingual('मंजूर', 'Approved')}
          </span>
        );
      case 'Admitted':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-700 text-white shadow-sm">
            {tBilingual('प्रवेश निश्चित', 'Admitted')}
          </span>
        );
      case 'Under Review':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
            {tBilingual('छाननी सुरू', 'Under Review')}
          </span>
        );
      case 'Waitlisted':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            {tBilingual('प्रतीक्षा यादी', 'Waitlisted')}
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200">
            {tBilingual('नाकारलेले', 'Rejected')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200">
            {tBilingual('नवीन अर्ज', 'Submitted')}
          </span>
        );
    }
  };

  if (!isPrincipal) {
    return (
      <Card className="border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-6 text-red-800 dark:text-red-200 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h3 className="font-bold text-sm">
            {tBilingual('प्रवेश छाननी नियंत्रण', 'Principal Access Only')}
          </h3>
        </div>
        <p className="text-xs">
          {tBilingual(
            'नवीन विद्यार्थी प्रवेश अर्ज तपासणे व मंजुरी देणे केवळ अधिकृत मुख्याध्यापकांच्या (Principal) अखत्यारीत आहे.',
            'Reviewing and approving new student admissions is restricted to the Principal.'
          )}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-green uppercase tracking-wider">
              {tBilingual('ऑनलाइन प्रवेश व्यवस्थापन', 'Online Admissions Management')}
            </span>
            <span className="text-muted-text dark:text-dark-muted">•</span>
            <span className="text-xs text-muted-text dark:text-dark-muted">
              {tBilingual('शैक्षणिक सत्र २०२६-२७', 'Academic Session 2026-27')}
            </span>
          </div>
          <h2 className="text-xl font-bold text-main-text dark:text-dark-text mt-1 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-saffron-orange" />
            {tBilingual('प्रवेश अर्ज छाननी व पडताळणी कक्ष', 'Admissions Management Desk')}
          </h2>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual(
              'सार्वजनिक संकेतस्थळावरून पालकांनी दाखल केलेल्या अर्जांची कागदपत्र पडताळणी, प्रतीक्षा यादी व अधिकृत विद्यार्थी नोंदणी.',
              'Document verification, waitlisting and official student enrollment for applications submitted via the public portal.'
            )}
          </p>
        </div>

        <Badge variant="orange">{tBilingual('मुख्याध्यापक मंजुरी अधिकार', 'Principal Approval Authority')}</Badge>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'border-primary-green bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm'
              : 'border-border-green dark:border-dark-border bg-white dark:bg-dark-card hover:bg-light-green/30 dark:hover:bg-dark-bg/60'
          }`}
        >
          <span className="text-[10px] font-bold text-muted-text dark:text-dark-muted uppercase block">
            {tBilingual('एकूण अर्ज', 'Total Applications')}
          </span>
          <span className="text-xl font-black text-main-text dark:text-dark-text">{formatNumber(counts.total)}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Pending')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'Pending'
              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 shadow-sm'
              : 'border-border-green dark:border-dark-border bg-white dark:bg-dark-card hover:bg-yellow-50/40'
          }`}
        >
          <span className="text-[10px] font-bold text-yellow-800 dark:text-yellow-400 uppercase block">
            {tBilingual('नवीन अर्ज', 'New / Pending')}
          </span>
          <span className="text-xl font-black text-yellow-800 dark:text-yellow-300">{formatNumber(counts.pending)}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Under Review')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'Under Review'
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 shadow-sm'
              : 'border-border-green dark:border-dark-border bg-white dark:bg-dark-card hover:bg-blue-50/40'
          }`}
        >
          <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase block">
            {tBilingual('छाननी सुरू', 'Under Review')}
          </span>
          <span className="text-xl font-black text-blue-800 dark:text-blue-300">{formatNumber(counts.underReview)}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Approved')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'Approved'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm'
              : 'border-border-green dark:border-dark-border bg-white dark:bg-dark-card hover:bg-emerald-50/40'
          }`}
        >
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block">
            {tBilingual('मंजूर केलेले', 'Approved')}
          </span>
          <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">{formatNumber(counts.approved)}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Admitted')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'Admitted'
              ? 'border-green-700 bg-green-50 dark:bg-green-950/40 shadow-sm'
              : 'border-border-green dark:border-dark-border bg-white dark:bg-dark-card hover:bg-green-50/40'
          }`}
        >
          <span className="text-[10px] font-bold text-green-800 dark:text-green-400 uppercase block">
            {tBilingual('प्रवेशित', 'Enrolled')}
          </span>
          <span className="text-xl font-black text-green-800 dark:text-green-300">{formatNumber(counts.admitted)}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Waitlisted')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'Waitlisted'
              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 shadow-sm'
              : 'border-border-green dark:border-dark-border bg-white dark:bg-dark-card hover:bg-amber-50/40'
          }`}
        >
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase block">
            {tBilingual('प्रतीक्षा यादी', 'Waitlisted')}
          </span>
          <span className="text-xl font-black text-amber-800 dark:text-amber-300">{formatNumber(counts.waitlisted)}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border-green dark:border-dark-border p-4 flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-dark-card shadow-card">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-text dark:text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAdmissions()}
            placeholder={tBilingual('अर्ज क्र., विद्यार्थ्याचे नाव, पालक मोबाईल...', 'App No., Student Name, Mobile...')}
            className="w-full text-xs pl-9 pr-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-light-green/40 dark:bg-dark-bg focus:bg-white dark:focus:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Class Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-medium"
          >
            <option value="ALL">{tBilingual('सर्व वर्ग', 'All Grades')}</option>
            <option value="इयत्ता १ ली">{tBilingual('इयत्ता १ ली', 'Class 1')}</option>
            <option value="इयत्ता २ री">{tBilingual('इयत्ता २ री', 'Class 2')}</option>
            <option value="इयत्ता ३ री">{tBilingual('इयत्ता ३ री', 'Class 3')}</option>
            <option value="इयत्ता ४ थी">{tBilingual('इयत्ता ४ थी', 'Class 4')}</option>
            <option value="इयत्ता ५ वी">{tBilingual('इयत्ता ५ वी', 'Class 5')}</option>
            <option value="इयत्ता ६ वी">{tBilingual('इयत्ता ६ वी', 'Class 6')}</option>
            <option value="इयत्ता ७ वी">{tBilingual('इयत्ता ७ वी', 'Class 7')}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-medium"
          >
            <option value="ALL">{tBilingual('सर्व स्थिती', 'All Statuses')}</option>
            <option value="Pending">{tBilingual('नवीन अर्ज', 'Submitted')}</option>
            <option value="Under Review">{tBilingual('छाननी सुरू', 'Under Review')}</option>
            <option value="Approved">{tBilingual('मंजूर केलेले', 'Approved')}</option>
            <option value="Admitted">{tBilingual('प्रवेश निश्चित', 'Admitted')}</option>
            <option value="Waitlisted">{tBilingual('प्रतीक्षा यादी', 'Waitlisted')}</option>
            <option value="Rejected">{tBilingual('नाकारलेले', 'Rejected')}</option>
          </select>

          <Button size="sm" variant="outline" onClick={fetchAdmissions}>
            {tBilingual('शोधा', 'Search')}
          </Button>
        </div>
      </Card>

      {/* Applications List */}
      <Card className="border border-border-green dark:border-dark-border p-0 overflow-hidden bg-white dark:bg-dark-card shadow-card">
        <div className="p-4 border-b border-border-green dark:border-dark-border flex items-center justify-between bg-[#F4F7F4]/50 dark:bg-dark-bg/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-green" />
            <h3 className="text-sm font-bold text-main-text dark:text-dark-text">
              {tBilingual('दाखल झालेले प्रवेश अर्ज', 'Received Admission Applications')} ({formatNumber(applications.length)})
            </h3>
          </div>
          <span className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual('ऑनलाइन प्रणालीद्वारे प्राप्त', 'Received via online portal')}
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-primary-green animate-spin" />
            <p className="text-xs text-muted-text dark:text-dark-muted">
              {tBilingual('प्रवेश अर्ज लोड होत आहेत...', 'Loading admission applications...')}
            </p>
          </div>
        ) : applications.length > 0 ? (
          <div className="divide-y divide-border-green dark:divide-dark-border">
            {applications.map((app) => (
              <div
                key={app._id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-light-green/20 dark:hover:bg-dark-bg/50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary-green bg-[#E2EFE7] dark:bg-emerald-950/60 px-2.5 py-0.5 rounded">
                      {app.applicationNo}
                    </span>
                    {getStatusBadge(app.status)}
                    <span className="text-xs text-muted-text dark:text-dark-muted font-medium">
                      • {tBilingual('वर्ग मागणी:', 'Grade:')} <strong className="text-main-text dark:text-dark-text">{app.gradeApplying}</strong>
                    </span>
                    <span className="text-xs text-muted-text dark:text-dark-muted">
                      • {tBilingual('अर्ज तारीख:', 'Applied Date:')} {formatDate(app.appliedAt)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                    <span>{app.studentName}</span>
                    {app.assignedGrNumber && (
                      <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                        GR No: {app.assignedGrNumber}
                      </span>
                    )}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-text dark:text-dark-muted pt-1">
                    <div>
                      <span className="font-medium text-main-text dark:text-dark-text">{tBilingual('लिंग:', 'Gender:')}</span> {app.gender}
                    </div>
                    <div>
                      <span className="font-medium text-main-text dark:text-dark-text">{tBilingual('जन्म तारीख:', 'Date of Birth:')}</span>{' '}
                      {formatDate(app.dateOfBirth)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary-green" />
                      <span className="font-mono">{app.parentPhone}</span>
                    </div>
                    <div>
                      <span className="font-medium text-main-text dark:text-dark-text">{tBilingual('पालक:', 'Parent:')}</span> {app.parentName}
                    </div>
                    <div className="col-span-full truncate text-[11px]">
                      <span className="font-medium text-main-text dark:text-dark-text">{tBilingual('पत्ता:', 'Address:')}</span> {app.residentialAddress}
                    </div>
                  </div>
                </div>

                {/* Principal Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border-green dark:border-dark-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDetails(app._id)}
                    leftIcon={<Eye className="w-3.5 h-3.5 text-primary-green" />}
                  >
                    {tBilingual('तपशील व कागदपत्रे', 'Details & Docs')}
                  </Button>

                  {app.status === 'Approved' && !app.admittedStudentId && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenEnrollModal(app)}
                      leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                    >
                      {tBilingual('प्रवेश निश्चित करा', 'Enroll Student')}
                    </Button>
                  )}

                  {(app.status === 'Pending' || app.status === 'Submitted') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      onClick={() => {
                        setSelectedApp(app);
                        setActionType('Under Review');
                        handleConfirmStatusUpdate();
                      }}
                    >
                      {tBilingual('छाननी सुरू करा', 'Start Review')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-muted-text dark:text-dark-muted">
            {tBilingual('कोणतेही प्रवेश अर्ज आढळले नाहीत.', 'No admission applications found.')}
          </div>
        )}
      </Card>

      {/* DETAILED APPLICATION MODAL / DOSSIER */}
      {showDetailModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-card text-main-text dark:text-dark-text rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-border-green dark:border-dark-border space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-green dark:border-dark-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary-green bg-[#E2EFE7] dark:bg-emerald-950/60 px-2.5 py-0.5 rounded">
                    {selectedApp.applicationNo}
                  </span>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <h3 className="text-lg font-bold text-main-text dark:text-dark-text mt-1">{selectedApp.studentName}</h3>
                <p className="text-xs text-muted-text dark:text-dark-muted">
                  {tBilingual('मागणी केलेला वर्ग:', 'Applying For Grade:')}{' '}
                  <strong className="text-main-text dark:text-dark-text">{selectedApp.gradeApplying}</strong> •{' '}
                  {tBilingual('अर्ज दिनांक:', 'Applied Date:')} {formatDate(selectedApp.appliedAt)}
                </p>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-full bg-light-green dark:bg-dark-bg flex items-center justify-center text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Tabs / Sections */}
            <div className="space-y-4">
              {/* 1. Student Demographics */}
              <div className="p-4 rounded-xl bg-light-green/40 dark:bg-dark-bg/60 border border-border-green dark:border-dark-border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-green">
                  {tBilingual('१. विद्यार्थी वैयक्तिक माहिती', '1. Student Personal Information')}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('लिंग', 'Gender')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedApp.gender}</strong>
                  </div>
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('जन्मतारीख', 'Date of Birth')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">
                      {formatDate(selectedApp.dateOfBirth)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('प्रवर्ग', 'Category')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedApp.category || 'OBC'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('रक्तगट', 'Blood Group')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedApp.bloodGroup || 'B+'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('धर्म', 'Religion')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedApp.religion || 'हिंदू'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('जात', 'Caste')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedApp.caste || 'लेवा पाटील'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('मातृभाषा', 'Mother Tongue')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedApp.motherTongue || 'मराठी'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('मागील शाळा', 'Previous School')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text truncate block">{selectedApp.previousSchool || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Parent & Contact Details */}
              <div className="p-4 rounded-xl bg-light-green/40 dark:bg-dark-bg/60 border border-border-green dark:border-dark-border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-green">
                  {tBilingual('२. पालक व संपर्क तपशील', '2. Parent & Contact Details')}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('वडिलांचे / पालकांचे नाव', 'Father / Guardian Name')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedApp.parentName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('आईचे नाव', 'Mother Name')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedApp.motherName || 'आई'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('संपर्क मोबाईल', 'Parent Mobile')}
                    </span>
                    <strong className="text-primary-green font-mono">{selectedApp.parentPhone}</strong>
                  </div>
                  <div className="col-span-full">
                    <span className="text-muted-text dark:text-dark-muted block text-[10px]">
                      {tBilingual('निवासी पत्ता', 'Residential Address')}
                    </span>
                    <strong className="text-main-text dark:text-dark-text">{selectedApp.residentialAddress}</strong>
                  </div>
                </div>
              </div>

              {/* 3. Document Verification Checklist */}
              <div className="p-4 rounded-xl bg-white dark:bg-dark-bg/40 border border-border-green dark:border-dark-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-green flex items-center justify-between">
                  <span>{tBilingual('३. अधिकृत कागदपत्रे पडताळणी सूची', '3. Official Document Checklist')}</span>
                  <span className="text-[10px] text-muted-text dark:text-dark-muted">
                    {tBilingual('मुख्याध्यापक पडताळणी', 'Principal Verification')}
                  </span>
                </h4>

                <div className="space-y-2">
                  {(selectedApp.documents || [
                    { name: tBilingual('जन्म दाखला', 'Birth Certificate'), type: 'birth_cert', isVerified: true },
                    { name: tBilingual('आधार कार्ड', 'Aadhaar Card'), type: 'aadhaar_card', isVerified: true },
                    { name: tBilingual('शाळा सोडल्याचा दाखला', 'School Leaving Certificate / TC'), type: 'leaving_cert', isVerified: false },
                    { name: tBilingual('जात प्रमाणपत्र', 'Caste Certificate'), type: 'caste_cert', isVerified: false },
                    { name: tBilingual('रहिवासी दाखला / शिधापत्रिका', 'Ration Card / Residence Proof'), type: 'ration_card', isVerified: true },
                  ]).map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg border border-border-green dark:border-dark-border bg-light-green/20 dark:bg-dark-card text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-primary-green shrink-0" />
                        <span className="font-semibold text-main-text dark:text-dark-text">{doc.name}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.isVerified
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                        }`}
                      >
                        {doc.isVerified
                          ? tBilingual('पडताळणी पूर्ण', 'Verified')
                          : tBilingual('मूळ प्रत प्रलंबित', 'Pending Verification')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Decision History Audit Timeline */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-dark-muted flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  {tBilingual('४. निर्णय इतिहास व कालरेषा', '4. Decision Audit Trail')}
                </h4>

                <div className="space-y-2 text-xs divide-y divide-slate-200 dark:divide-dark-border">
                  {(selectedApp.decisionHistory || []).map((log, i) => (
                    <div key={i} className="pt-2 first:pt-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-dark-text">{log.status}</span>
                        <span className="text-[10px] text-muted-text dark:text-dark-muted">
                          {formatDate(log.changedAt)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-dark-muted">
                        {tBilingual('अधिकारी:', 'Officer:')} <strong className="text-main-text dark:text-dark-text">{log.changedBy}</strong>
                        {log.notes && ` — ${log.notes}`}
                        {log.reason && ` (${tBilingual('कारण:', 'Reason:')} ${log.reason})`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Principal Decision Actions */}
            <div className="border-t border-border-green dark:border-dark-border pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {selectedApp.status !== 'Approved' && selectedApp.status !== 'Admitted' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setActionType('Approved');
                      setActionNotes(tBilingual('सर्व कागदपत्रे वैध आढळली. प्रवेश मंजूर करण्यात येत आहे.', 'All documents verified. Admission approved.'));
                    }}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    {tBilingual('प्रवेश मंजूर करा', 'Approve')}
                  </Button>
                )}

                {selectedApp.status === 'Approved' && !selectedApp.admittedStudentId && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleOpenEnrollModal(selectedApp)}
                    leftIcon={<UserCheck className="w-4 h-4" />}
                  >
                    {tBilingual('प्रवेश नोंदणी करा', 'Enroll Student')}
                  </Button>
                )}

                {selectedApp.status !== 'Waitlisted' && selectedApp.status !== 'Admitted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    onClick={() => {
                      setActionType('Waitlisted');
                      setActionReason(tBilingual('जागा उपलब्धतेनुसार प्रतीक्षा', 'Waitlisted based on seat availability'));
                    }}
                  >
                    {tBilingual('प्रतीक्षा यादी', 'Waitlist')}
                  </Button>
                )}

                {selectedApp.status !== 'Rejected' && selectedApp.status !== 'Admitted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 dark:text-red-400 border-red-300 dark:border-red-800/60 hover:bg-red-50 dark:hover:bg-red-950/40"
                    onClick={() => {
                      setActionType('Rejected');
                      setActionReason('');
                    }}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    {tBilingual('नाकारा', 'Reject')}
                  </Button>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => setShowDetailModal(false)}>
                {tBilingual('बंद करा', 'Close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE CONFIRMATION / REASON MODAL */}
      {actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card text-main-text dark:text-dark-text rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-green dark:border-dark-border space-y-4">
            <h3 className="text-base font-bold text-main-text dark:text-dark-text">
              {tBilingual('निर्णय पुष्टीकरण:', 'Confirm Decision:')}{' '}
              {actionType === 'Approved'
                ? tBilingual('प्रवेश मंजुरी', 'Approve Admission')
                : actionType === 'Rejected'
                ? tBilingual('प्रवेश नकार', 'Reject Admission')
                : tBilingual('प्रतीक्षा यादी', 'Waitlist Admission')}
            </h3>

            {actionType === 'Rejected' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-main-text dark:text-dark-text">
                  {tBilingual('नकाराचे कारण *', 'Reason for Rejection *')}
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={tBilingual('उदा. वय निकष अपूर्ण / आवश्यक मूळ जन्म दाखला सादर केला नाही...', 'E.g., age criteria unmet / original birth certificate missing...')}
                  className="w-full text-xs p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                />
              </div>
            )}

            {actionType === 'Waitlisted' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-main-text dark:text-dark-text">
                  {tBilingual('प्रतीक्षा यादी शेरा', 'Waitlist Remarks')}
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={tBilingual('उदा. वर्ग १ ची पटसंख्या पूर्ण, पुढील फेरीसाठी प्रतीक्षा...', 'E.g., Class 1 capacity full, waiting for next round...')}
                  className="w-full text-xs p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-main-text dark:text-dark-text">
                {tBilingual('मुख्याध्यापक शेरा / टिप्पणी (ऐच्छिक)', 'Principal Notes / Remarks (Optional)')}
              </label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={tBilingual('कार्यालयीन टिप्पणी...', 'Office remarks...')}
                className="w-full text-xs p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-green dark:border-dark-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionType(null)}
                disabled={processingStatus}
              >
                {tBilingual('रद्द करा', 'Cancel')}
              </Button>
              <Button
                variant={actionType === 'Rejected' ? 'outline' : 'primary'}
                className={actionType === 'Rejected' ? 'text-red-700 dark:text-red-400 border-red-300 dark:border-red-800/60 hover:bg-red-50' : ''}
                size="sm"
                onClick={handleConfirmStatusUpdate}
                disabled={processingStatus}
              >
                {processingStatus ? tBilingual('जतन करत आहे...', 'Saving...') : tBilingual('निर्णय नोंदवा', 'Confirm Decision')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLLED ENROLLMENT MODAL (CREATE OFFICIAL STUDENT RECORD) */}
      {showEnrollModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteEnrollment}
            className="bg-white dark:bg-dark-card text-main-text dark:text-dark-text rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border-green dark:border-dark-border space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary-green" />
                <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                  {tBilingual('अधिकृत विद्यार्थी नोंदणी', 'Official Student Enrollment')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="w-7 h-7 rounded-full bg-light-green dark:bg-dark-bg flex items-center justify-center text-muted-text dark:text-dark-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200 text-xs">
              {tBilingual('विद्यार्थी:', 'Student:')} <strong>{selectedApp.studentName}</strong> ({tBilingual('अर्ज #', 'App #')}{selectedApp.applicationNo})
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* GR Number */}
              <div className="space-y-1">
                <label className="font-bold text-main-text dark:text-dark-text flex items-center justify-between">
                  <span>{tBilingual('जनरल रजिस्टर (GR) क्र. *', 'General Register (GR) No. *')}</span>
                  <span className="text-[10px] text-primary-green font-semibold">
                    {tBilingual('सुचवलेला:', 'Suggested:')} {nextGr}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={enrollForm.grNumber}
                  onChange={(e) => setEnrollForm({ ...enrollForm, grNumber: e.target.value })}
                  className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg font-mono font-bold text-primary-green bg-white dark:bg-dark-bg"
                />
              </div>

              {/* Admission Date */}
              <div className="space-y-1">
                <label className="font-bold text-main-text dark:text-dark-text">
                  {tBilingual('प्रवेश दिनांक *', 'Admission Date *')}
                </label>
                <input
                  type="date"
                  required
                  value={enrollForm.admissionDate}
                  onChange={(e) => setEnrollForm({ ...enrollForm, admissionDate: e.target.value })}
                  className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                />
              </div>

              {/* Standard */}
              <div className="space-y-1">
                <label className="font-bold text-main-text dark:text-dark-text">
                  {tBilingual('दाखल वर्ग *', 'Enrolling Standard *')}
                </label>
                <select
                  value={enrollForm.standard}
                  onChange={(e) => setEnrollForm({ ...enrollForm, standard: e.target.value })}
                  className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg font-semibold bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
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

              {/* Division */}
              <div className="space-y-1">
                <label className="font-bold text-main-text dark:text-dark-text">
                  {tBilingual('तुकडी *', 'Division *')}
                </label>
                <select
                  value={enrollForm.division}
                  onChange={(e) => setEnrollForm({ ...enrollForm, division: e.target.value })}
                  className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg font-semibold bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                >
                  <option value="A">{tBilingual('तुकडी A', 'Division A')}</option>
                  <option value="B">{tBilingual('तुकडी B', 'Division B')}</option>
                </select>
              </div>

              {/* SARAL ID */}
              <div className="space-y-1">
                <label className="font-bold text-main-text dark:text-dark-text">
                  {tBilingual('सरल आयडी', 'SARAL ID')}
                </label>
                <input
                  type="text"
                  value={enrollForm.saralId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, saralId: e.target.value })}
                  className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg font-mono bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                />
              </div>

              {/* PEN Number */}
              <div className="space-y-1">
                <label className="font-bold text-main-text dark:text-dark-text">
                  {tBilingual('पेन क्रमांक', 'PEN Number')}
                </label>
                <input
                  type="text"
                  value={enrollForm.penNumber}
                  onChange={(e) => setEnrollForm({ ...enrollForm, penNumber: e.target.value })}
                  className="w-full p-2 border border-border-green dark:border-dark-border rounded-lg font-mono bg-white dark:bg-dark-bg text-main-text dark:text-dark-text"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-dark-bg/60 rounded-xl border border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-muted text-[11px]">
              {tBilingual(
                'नोंदणी पूर्ण केल्यानंतर विद्यार्थ्यांचे नाव थेट अधिकृत विद्यार्थी नोंदवहीत (General Register) सामील होईल आणि शिष्यवृत्ती पात्रता आपोआप तपासली जाईल.',
                'Once enrolled, student will be added to the General Register and scholarship eligibility will be checked automatically.'
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-green dark:border-dark-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEnrollModal(false)}
                disabled={enrolling}
              >
                {tBilingual('रद्द करा', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={enrolling}
                leftIcon={enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              >
                {enrolling
                  ? tBilingual('नोंदणी करत आहे...', 'Enrolling...')
                  : tBilingual('प्रवेश निश्चित करा', 'Confirm Enrollment')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
