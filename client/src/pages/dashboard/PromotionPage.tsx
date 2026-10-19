import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldAlert,
  Loader2,
  Calendar,
  Layers,
  History,
  RotateCcw,
  CheckSquare,
  Square,
  AlertTriangle,
  UserCheck,
  FileCheck2,
  Info,
} from 'lucide-react';

interface StudentSelection {
  _id: string;
  grNumber: string;
  name: string;
  gender: string;
  category: string;
  currentStandard: string;
  currentDivision: string;
  suggestedDestinationStandard: string;
  attendancePercentage: number;
  alreadyProcessed: boolean;
  isEligible: boolean;
  selected: boolean;
  status: 'Promoted' | 'Repeated';
  reason?: string;
}

const STANDARD_SEQUENCE: Record<string, string> = {
  'इयत्ता १ ली': 'इयत्ता २ री',
  'इयत्ता २ री': 'इयत्ता ३ री',
  'इयत्ता ३ री': 'इयत्ता ४ थी',
  'इयत्ता ४ थी': 'इयत्ता ५ वी',
  'इयत्ता ५ वी': 'इयत्ता ६ वी',
  'इयत्ता ६ वी': 'इयत्ता ७ वी',
  'इयत्ता ७ वी': 'उत्तीर्ण / प्राथमिक शिक्षण पूर्ण',
};

export const PromotionPage: React.FC = () => {
  const { isPrincipal } = useAuth();
  const { t, tBilingual, formatNumber, language } = useLanguage();

  // Workflow State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1); // 1: Configure & Select, 2: Preview, 3: Confirmed Summary
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [targetAcademicYear, setTargetAcademicYear] = useState('2027-28');
  const [fromClass, setFromClass] = useState('इयत्ता १ ली');
  const [fromDivision, setFromDivision] = useState('ALL');
  const [toClass, setToClass] = useState('इयत्ता २ री');
  const [toDivision, setToDivision] = useState('A');

  // Student Selections
  const [students, setStudents] = useState<StudentSelection[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Summary Result
  const [promotionResult, setPromotionResult] = useState<{
    promotedCount: number;
    repeatedCount: number;
    skippedCount: number;
    skippedRecords: Array<{ grNumber: string; name: string; reason: string }>;
    message: string;
  } | null>(null);

  // Promotion Audit Log
  const [showHistory, setShowHistory] = useState(false);
  const [historyBatches, setHistoryBatches] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auto-suggest destination class when fromClass changes
  useEffect(() => {
    if (STANDARD_SEQUENCE[fromClass]) {
      setToClass(STANDARD_SEQUENCE[fromClass]);
    }
  }, [fromClass]);

  // Fetch student preview from server
  const fetchPromotionPreview = async () => {
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await api.get(
        `/portal/promotion/preview?currentStandard=${encodeURIComponent(
          fromClass
        )}&division=${fromDivision}&destinationStandard=${encodeURIComponent(
          toClass
        )}&destinationDivision=${toDivision}&academicYear=${academicYear}&targetAcademicYear=${targetAcademicYear}`
      );

      if (res.data?.success) {
        const rawList = res.data.data.students || [];
        const initialized: StudentSelection[] = rawList.map((s: any) => ({
          ...s,
          selected: s.isEligible,
          status: 'Promoted' as const,
          reason: '',
        }));
        setStudents(initialized);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'विद्यार्थी यादी लोड करताना त्रुटी आली.');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPromotionPreview();
  }, [fromClass, fromDivision, toClass, academicYear, targetAcademicYear]);

  // Fetch History Batches
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/portal/promotion/history');
      if (res.data?.success) {
        setHistoryBatches(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load promotion history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Toggle selection
  const handleToggleSelectAll = (checkAll: boolean) => {
    setStudents((prev) =>
      prev.map((s) => (s.isEligible ? { ...s, selected: checkAll } : s))
    );
  };

  const handleToggleStudent = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s._id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleStatusChange = (id: string, newStatus: 'Promoted' | 'Repeated') => {
    setStudents((prev) =>
      prev.map((s) =>
        s._id === id
          ? {
              ...s,
              status: newStatus,
              reason:
                newStatus === 'Repeated'
                  ? 'वर्ग पुनरावृत्ती (पालकांच्या विनंतीनुसार)'
                  : 'वार्षिक प्रगती समाधानकारक',
            }
          : s
      )
    );
  };

  const handleReasonChange = (id: string, reason: string) => {
    setStudents((prev) =>
      prev.map((s) => (s._id === id ? { ...s, reason } : s))
    );
  };

  // Confirm and Execute Promotion
  const handleExecutePromotion = async () => {
    const selectedStudents = students.filter((s) => s.selected);
    if (selectedStudents.length === 0) {
      setError('कृपया पदोन्नतीसाठी किमान एका विद्यार्थ्याची निवड करा.');
      return;
    }

    setPromoting(true);
    setError(null);

    const payload = {
      fromClass,
      toClass,
      fromDivision,
      toDivision,
      academicYear,
      targetAcademicYear,
      studentSelections: selectedStudents.map((s) => ({
        studentId: s._id,
        status: s.status,
        reason: s.reason,
      })),
    };

    try {
      const res = await api.post('/portal/students/promote', payload);
      if (res.data?.success) {
        setPromotionResult({
          promotedCount: res.data.promotedCount,
          repeatedCount: res.data.repeatedCount,
          skippedCount: res.data.skippedCount,
          skippedRecords: res.data.skippedRecords || [],
          message: res.data.message,
        });
        setCurrentStep(3);
      } else {
        setError(res.data?.message || 'पदोन्नती प्रक्रिया पूर्ण होऊ शकली नाही.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'पदोन्नती प्रक्रिया अयशस्वी. कृपया मुख्याध्यापक अधिकार व नेटवर्क तपासा.'
      );
    } finally {
      setPromoting(false);
    }
  };

  const selectedCount = students.filter((s) => s.selected).length;
  const eligibleCount = students.filter((s) => s.isEligible).length;

  if (!isPrincipal) {
    return (
      <Card className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-rose-950/40 p-6 text-red-800 dark:text-rose-300 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-rose-400" />
          <h3 className="font-bold text-sm">{tBilingual('प्रवेश व पदोन्नती प्रतिबंध (Principal Access Only)')}</h3>
        </div>
        <p className="text-xs">
          {tBilingual('विद्यार्थी वर्ग पदोन्नती अधिकार केवळ अधिकृत मुख्याध्यापकांना राखीव आहेत.', 'Student promotion privileges are restricted to the authorized Principal.')}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-green dark:border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-green uppercase tracking-wider">
              {tBilingual('प्रशासकीय नियंत्रण कक्ष', 'Administrative Control Cell')}
            </span>
            <span className="text-muted-text dark:text-dark-muted">•</span>
            <span className="text-xs text-muted-text dark:text-dark-muted">
              {tBilingual('शैक्षणिक वर्ष', 'Academic Year')} {academicYear} → {targetAcademicYear}
            </span>
          </div>
          <h2 className="text-xl font-bold text-main-text dark:text-dark-text mt-1 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary-green" />
            {tBilingual('विद्यार्थी वर्ग पदोन्नती व्यवस्थापन (Student Promotion Module)')}
          </h2>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual('शैक्षणिक वर्षाअखेर वर्गातील विद्यार्थ्यांची पडताळणी करून पुढील वर्गात पदोन्नती द्या.', 'Verify students at the end of the academic year and promote them to the next standard.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) loadHistory();
            }}
            leftIcon={<History className="w-4 h-4 text-primary-green" />}
            className="border-border-green dark:border-dark-border text-main-text dark:text-dark-text hover:bg-light-green/40 dark:hover:bg-primary-green/20"
          >
            {showHistory ? tBilingual('पदोन्नती फॉर्म', 'Promotion Form') : tBilingual('पदोन्नती इतिहास (History)')}
          </Button>
          <Badge variant="orange">{tBilingual('मुख्याध्यापक विशेष अधिकार', 'Principal Exclusive Privilege')}</Badge>
        </div>
      </div>

      {/* Progress Wizard Steps */}
      {!showHistory && (
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-light-green/60 dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border">
          <button
            onClick={() => setCurrentStep(1)}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              currentStep === 1
                ? 'bg-primary-green text-white shadow-sm'
                : 'text-main-text dark:text-dark-text hover:bg-white/80 dark:hover:bg-dark-bg'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">1</span>
            {tBilingual('वर्ग व विद्यार्थी निवड', 'Class & Student Selection')}
          </button>

          <button
            onClick={() => {
              if (selectedCount > 0) setCurrentStep(2);
            }}
            disabled={selectedCount === 0}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              currentStep === 2
                ? 'bg-primary-green text-white shadow-sm'
                : selectedCount > 0
                ? 'text-main-text dark:text-dark-text hover:bg-white/80 dark:hover:bg-dark-bg'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">2</span>
            {tBilingual('पडताळणी व पूर्वावलोकन', 'Verification & Preview')}
          </button>

          <button
            disabled={!promotionResult}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              currentStep === 3
                ? 'bg-primary-green text-white shadow-sm'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">3</span>
            {tBilingual('पदोन्नती सारांश (Summary)')}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800 text-red-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* History View */}
      {showHistory ? (
        <Card className="border border-border-green dark:border-dark-border p-0 overflow-hidden bg-white dark:bg-dark-card shadow-card">
          <div className="p-4 border-b border-border-green dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary-green" />
              <h3 className="text-sm font-bold text-main-text dark:text-dark-text">
                {tBilingual('मागील वर्ग पदोन्नती इतिहास व लेखाजोखा', 'Past Promotion History & Audit Trail')}
              </h3>
            </div>
            <span className="text-xs text-muted-text dark:text-dark-muted">
              {tBilingual('अंतिम ५० पदोन्नती नोंदी', 'Last 50 promotion records')}
            </span>
          </div>

          {loadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-primary-green animate-spin" />
              <p className="text-xs text-muted-text dark:text-dark-muted">{tBilingual('इतिहास लोड होत आहे...', 'Loading history...')}</p>
            </div>
          ) : historyBatches.length > 0 ? (
            <div className="divide-y divide-border-green dark:divide-dark-border">
              {historyBatches.map((batch) => (
                <div key={batch._id} className="p-4 sm:p-5 hover:bg-light-green/20 dark:hover:bg-primary-green/10 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-primary-green bg-[#E2EFE7] dark:bg-primary-green/20 px-2.5 py-0.5 rounded">
                        {batch.fromStandard} → {batch.toStandard}
                      </span>
                      <span className="text-xs font-semibold text-main-text dark:text-dark-text">
                        ({tBilingual('सत्र', 'Session')} {batch.academicYear} → {batch.targetAcademicYear})
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-text dark:text-dark-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(batch.promotionDate).toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="bg-white dark:bg-dark-bg p-2 rounded border border-border-green dark:border-dark-border">
                      <span className="text-muted-text dark:text-dark-muted block text-[10px]">{tBilingual('एकूण विद्यार्थी', 'Total Students')}</span>
                      <span className="font-bold text-main-text dark:text-dark-text">{formatNumber(batch.totalStudents)}</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800">
                      <span className="text-emerald-800 dark:text-emerald-300 block text-[10px]">{tBilingual('पदोन्नती दिली', 'Promoted')}</span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">{formatNumber(batch.promotedCount)}</span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800">
                      <span className="text-amber-800 dark:text-amber-300 block text-[10px]">{tBilingual('वर्ग पुनरावृत्ती', 'Repeated')}</span>
                      <span className="font-bold text-amber-800 dark:text-amber-300">{formatNumber(batch.repeatedCount)}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-dark-bg p-2 rounded border border-slate-200 dark:border-dark-border">
                      <span className="text-slate-700 dark:text-dark-muted block text-[10px]">{tBilingual('मुख्याध्यापक', 'Principal')}</span>
                      <span className="font-bold text-slate-800 dark:text-dark-text truncate">{batch.promotedBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-text dark:text-dark-muted">
              {tBilingual('अद्याप कोणतीही पदोन्नती नोंद उपलब्ध नाही.', 'No promotion records available yet.')}
            </div>
          )}
        </Card>
      ) : currentStep === 1 ? (
        /* STEP 1: Configure Classes & Select Students */
        <div className="space-y-6">
          <Card className="border border-border-green dark:border-dark-border p-5 bg-white dark:bg-dark-card shadow-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-green flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              {tBilingual('१. वर्ग व शैक्षणिक सत्र निवड (Step 1: Classes & Academic Years)')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Academic Year Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-main-text dark:text-dark-text">{tBilingual('चालू सत्र (Current Session)')}</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs p-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-medium"
                >
                  <option value="2026-27">२०२६-२७ (2026-27)</option>
                  <option value="2025-26">२०२५-२६ (2025-26)</option>
                </select>
              </div>

              {/* Target Academic Year */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-main-text dark:text-dark-text">{tBilingual('पुढील पदोन्नती सत्र (Target Session)')}</label>
                <select
                  value={targetAcademicYear}
                  onChange={(e) => setTargetAcademicYear(e.target.value)}
                  className="w-full text-xs p-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-medium"
                >
                  <option value="2027-28">२०२७-२८ (2027-28)</option>
                  <option value="2028-29">२०२८-२९ (2028-29)</option>
                </select>
              </div>

              {/* Source Standard */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-main-text dark:text-dark-text">{tBilingual('सद्यस्थिती वर्ग (Source Class)')}</label>
                <select
                  value={fromClass}
                  onChange={(e) => setFromClass(e.target.value)}
                  className="w-full text-xs p-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-medium"
                >
                  <option value="इयत्ता १ ली">{tBilingual('इयत्ता १ ली (Class 1)')}</option>
                  <option value="इयत्ता २ री">{tBilingual('इयत्ता २ री (Class 2)')}</option>
                  <option value="इयत्ता ३ री">{tBilingual('इयत्ता ३ री (Class 3)')}</option>
                  <option value="इयत्ता ४ थी">{tBilingual('इयत्ता ४ थी (Class 4)')}</option>
                  <option value="इयत्ता ५ वी">{tBilingual('इयत्ता ५ वी (Class 5)')}</option>
                  <option value="इयत्ता ६ वी">{tBilingual('इयत्ता ६ वी (Class 6)')}</option>
                  <option value="इयत्ता ७ वी">{tBilingual('इयत्ता ७ वी (Class 7)')}</option>
                </select>
              </div>

              {/* Source Division */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-main-text dark:text-dark-text">{tBilingual('तुकडी (Source Division)')}</label>
                <select
                  value={fromDivision}
                  onChange={(e) => setFromDivision(e.target.value)}
                  className="w-full text-xs p-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-medium"
                >
                  <option value="ALL">{tBilingual('सर्व तुकड्या (All Divisions)')}</option>
                  <option value="A">{tBilingual('तुकडी A', 'Division A')}</option>
                  <option value="B">{tBilingual('तुकडी B', 'Division B')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border-green dark:border-dark-border">
              {/* Destination Standard */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-main-text dark:text-dark-text flex items-center justify-between">
                  <span>{tBilingual('पदोन्नतीचा पुढील वर्ग (Destination Class)')}</span>
                  <span className="text-[10px] text-primary-green">{tBilingual('नैसर्गिक प्रगतीनुसार', 'Natural Progression')}</span>
                </label>
                <select
                  value={toClass}
                  onChange={(e) => setToClass(e.target.value)}
                  className="w-full text-xs p-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-bold"
                >
                  <option value="इयत्ता २ री">{tBilingual('इयत्ता २ री (Class 2)')}</option>
                  <option value="इयत्ता ३ री">{tBilingual('इयत्ता ३ री (Class 3)')}</option>
                  <option value="इयत्ता ४ थी">{tBilingual('इयत्ता ४ थी (Class 4)')}</option>
                  <option value="इयत्ता ५ वी">{tBilingual('इयत्ता ५ वी (Class 5)')}</option>
                  <option value="इयत्ता ६ वी">{tBilingual('इयत्ता ६ वी (Class 6)')}</option>
                  <option value="इयत्ता ७ वी">{tBilingual('इयत्ता ७ वी (Class 7)')}</option>
                  <option value="उत्तीर्ण / प्राथमिक शिक्षण पूर्ण">
                    {tBilingual('उत्तीर्ण / प्राथमिक शिक्षण पूर्ण (Completed Standard 7)')}
                  </option>
                </select>
              </div>

              {/* Destination Division */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-main-text dark:text-dark-text">{tBilingual('पुढील तुकडी (Destination Division)')}</label>
                <select
                  value={toDivision}
                  onChange={(e) => setToDivision(e.target.value)}
                  className="w-full text-xs p-2.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-medium"
                >
                  <option value="A">{tBilingual('तुकडी A', 'Division A')}</option>
                  <option value="B">{tBilingual('तुकडी B', 'Division B')}</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Student Table & Selection Controls */}
          <Card className="border border-border-green dark:border-dark-border p-0 overflow-hidden bg-white dark:bg-dark-card shadow-card">
            <div className="p-4 border-b border-border-green dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F7F4]/50 dark:bg-dark-bg/60">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-green" />
                <h3 className="text-sm font-bold text-main-text dark:text-dark-text">
                  {fromClass} {tBilingual('मधील विद्यार्थी सूची', 'Student List')} ({formatNumber(students.length)} {tBilingual('पटसंख्या', 'Enrollment')})
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-text dark:text-dark-muted">
                  {tBilingual('निवडले:', 'Selected:')} <strong className="text-primary-green">{formatNumber(selectedCount)}</strong> / {formatNumber(eligibleCount)} {tBilingual('पात्र विद्यार्थी', 'eligible students')}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs py-1 px-2.5 h-8 border-border-green dark:border-dark-border text-main-text dark:text-dark-text"
                    onClick={() => handleToggleSelectAll(true)}
                  >
                    {tBilingual('सर्व निवडा', 'Select All')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs py-1 px-2.5 h-8 border-border-green dark:border-dark-border text-main-text dark:text-dark-text"
                    onClick={() => handleToggleSelectAll(false)}
                  >
                    {tBilingual('सर्व काढा', 'Deselect All')}
                  </Button>
                </div>
              </div>
            </div>

            {loadingPreview ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-primary-green animate-spin" />
                <p className="text-xs text-muted-text dark:text-dark-muted">
                  {tBilingual('विद्यार्थी यादी पडताळत आहे...', 'Verifying student list...')}
                </p>
              </div>
            ) : students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-green dark:border-dark-border bg-[#F4F7F4] dark:bg-dark-bg/60 text-main-text dark:text-dark-text font-bold">
                      <th className="py-3 px-4 w-12 text-center">{tBilingual('निवड', 'Select')}</th>
                      <th className="py-3 px-4">{tBilingual('GR क्र.', 'GR No.')}</th>
                      <th className="py-3 px-4">{tBilingual('विद्यार्थ्याचे नाव', 'Student Name')}</th>
                      <th className="py-3 px-4">{tBilingual('तुकडी', 'Division')}</th>
                      <th className="py-3 px-4">{tBilingual('हजेरी', 'Attendance')}</th>
                      <th className="py-3 px-4">{tBilingual('पदोन्नती स्थिती', 'Promotion Status')}</th>
                      <th className="py-3 px-4">{tBilingual('नोंद / कारण', 'Remarks / Reason')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-green dark:divide-dark-border">
                    {students.map((stu) => (
                      <tr
                        key={stu._id}
                        className={`hover:bg-light-green/30 dark:hover:bg-emerald-950/20 transition-colors ${
                          stu.alreadyProcessed
                            ? 'bg-gray-50 dark:bg-gray-800/40 opacity-60'
                            : stu.selected
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/30'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={stu.selected}
                            disabled={stu.alreadyProcessed}
                            onChange={() => handleToggleStudent(stu._id)}
                            className="w-4 h-4 text-primary-green rounded border-border-green dark:border-dark-border focus:ring-primary-green cursor-pointer bg-white dark:bg-dark-bg"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-primary-green">{stu.grNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-main-text dark:text-dark-text">{stu.name}</div>
                          <div className="text-[10px] text-muted-text dark:text-dark-muted">
                            {stu.gender} • {stu.category}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-main-text dark:text-dark-text">{stu.currentDivision}</td>
                        <td className="py-3 px-4 font-semibold text-primary-green">{formatNumber(stu.attendancePercentage)}%</td>
                        <td className="py-3 px-4">
                          {stu.alreadyProcessed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {tBilingual('यापूर्वीच पदोन्नती झाली', 'Already Promoted')}
                            </span>
                          ) : (
                            <select
                              value={stu.status}
                              onChange={(e) => handleStatusChange(stu._id, e.target.value as any)}
                              className={`text-xs p-1.5 rounded border font-semibold dark:bg-dark-bg ${
                                stu.status === 'Repeated'
                                  ? 'border-amber-400 bg-amber-50 text-amber-900 dark:text-amber-200 dark:border-amber-700'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:text-emerald-200 dark:border-emerald-700'
                              }`}
                            >
                              <option value="Promoted">{tBilingual('पदोन्नती', 'Promote')}</option>
                              <option value="Repeated">{tBilingual('वर्ग पुनरावृत्ती', 'Repeat Standard')}</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder={tBilingual('नोंद किंवा अपवादाचे कारण...', 'Remarks or exception reason...')}
                            value={stu.reason || ''}
                            onChange={(e) => handleReasonChange(stu._id, e.target.value)}
                            disabled={stu.alreadyProcessed}
                            className="w-full text-xs px-2 py-1 border border-border-green dark:border-dark-border rounded bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-text dark:text-dark-muted">
                {tBilingual('या वर्गात पदोन्नतीसाठी कोणतेही विद्यार्थी उपलब्ध नाहीत.', 'No students available for promotion in this standard.')}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-border-green dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F4F7F4]/50 dark:bg-dark-bg/60">
              <span className="text-xs text-muted-text dark:text-dark-muted">
                {tBilingual('पुढील पायरी: निवडलेल्या', 'Next Step: Final inspection and preview of')}{' '}
                <strong className="text-primary-green">{formatNumber(selectedCount)}</strong>{' '}
                {tBilingual('विद्यार्थ्यांची अंतिम तपासणी व पूर्वावलोकन', 'selected students')}
              </span>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep(2)}
                disabled={selectedCount === 0}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {tBilingual('पूर्वावलोकन करा (पायरी २)', 'Proceed to Step 2 (Preview)')}
              </Button>
            </div>
          </Card>
        </div>
      ) : currentStep === 2 ? (
        /* STEP 2: Preview & Validation */
        <div className="space-y-6">
          <Card className="border border-border-green dark:border-dark-border p-6 bg-white dark:bg-dark-card shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-primary-green" />
                  {tBilingual('२. वर्ग पदोन्नती अंतिम पूर्वावलोकन', '2. Class Promotion Final Preview')}
                </h3>
                <p className="text-xs text-muted-text dark:text-dark-muted mt-0.5">
                  {tBilingual('खालील प्रस्तावित बदलांची खातरजमा करा व मुख्याध्यापक मान्यतेने प्रमाणित करा.', 'Verify the proposed changes below and certify with Principal approval.')}
                </p>
              </div>

              <Badge variant="green">
                {tBilingual('प्रक्रिया:', 'Processing:')} {formatNumber(selectedCount)} {tBilingual('विद्यार्थी', 'students')}
              </Badge>
            </div>

            {/* Transfer Visual Badge */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 rounded-xl bg-light-green/60 dark:bg-emerald-950/30 border border-border-green dark:border-dark-border">
              <div className="text-center">
                <span className="text-[10px] text-muted-text dark:text-dark-muted font-bold block uppercase">
                  {tBilingual('सद्यस्थिती वर्ग', 'Current Standard')}
                </span>
                <span className="text-base font-bold text-main-text dark:text-dark-text">{fromClass}</span>
                <span className="text-xs text-muted-text dark:text-dark-muted block">
                  ({tBilingual('सत्र', 'Session')} {academicYear})
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary-green text-white flex items-center justify-center shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-primary-green mt-1">
                  {tBilingual('पदोन्नती', 'Promotion')}
                </span>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-muted-text dark:text-dark-muted font-bold block uppercase">
                  {tBilingual('प्रस्तावित वर्ग', 'Proposed Standard')}
                </span>
                <span className="text-base font-bold text-primary-green">
                  {toClass} - {tBilingual('तुकडी', 'Div')} {toDivision}
                </span>
                <span className="text-xs text-muted-text dark:text-dark-muted block">
                  ({tBilingual('सत्र', 'Session')} {targetAcademicYear})
                </span>
              </div>
            </div>

            {/* Proposed Students List */}
            <div className="overflow-x-auto rounded-lg border border-border-green dark:border-dark-border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-green dark:border-dark-border bg-[#F4F7F4] dark:bg-dark-bg/60 text-main-text dark:text-dark-text font-bold">
                    <th className="py-2.5 px-3">{tBilingual('GR क्र.', 'GR No.')}</th>
                    <th className="py-2.5 px-3">{tBilingual('विद्यार्थ्याचे नाव', 'Student Name')}</th>
                    <th className="py-2.5 px-3">{tBilingual('सद्य वर्ग', 'Current Std')}</th>
                    <th className="py-2.5 px-3">{tBilingual('प्रस्तावित वर्ग', 'Proposed Std')}</th>
                    <th className="py-2.5 px-3">{tBilingual('पदोन्नती कृती', 'Action')}</th>
                    <th className="py-2.5 px-3">{tBilingual('कारण / अभिप्राय', 'Reason / Remarks')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-green dark:divide-dark-border">
                  {students
                    .filter((s) => s.selected)
                    .map((s) => (
                      <tr key={s._id} className="hover:bg-light-green/20 dark:hover:bg-emerald-950/20">
                        <td className="py-2.5 px-3 font-mono font-bold text-primary-green">{s.grNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-main-text dark:text-dark-text">{s.name}</td>
                        <td className="py-2.5 px-3 text-muted-text dark:text-dark-muted">
                          {s.currentStandard} ({s.currentDivision})
                        </td>
                        <td className="py-2.5 px-3 font-bold text-primary-green">
                          {s.status === 'Repeated'
                            ? `${s.currentStandard} (${tBilingual('पुनरावृत्ती', 'Repeated')})`
                            : `${toClass} (${toDivision})`}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'Repeated'
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                                : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
                            }`}
                          >
                            {s.status === 'Repeated'
                              ? tBilingual('वर्ग पुनरावृत्ती', 'Repeat Standard')
                              : tBilingual('पुढील वर्गात पदोन्नती', 'Promoted to Next Standard')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-text dark:text-dark-muted">
                          {s.reason || tBilingual('वार्षिक प्रगती समाधानकारक', 'Satisfactory annual progress')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Warnings and Policy Notice */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>{tBilingual('मुख्याध्यापक प्रमाणीकरण सूचना:', 'Principal Certification Notice:')}</strong>{' '}
                {tBilingual(
                  'पदोन्नती निश्चित केल्यानंतर विद्यार्थ्यांची वर्ग नोंदवही अद्ययावत केली जाईल आणि मागील शैक्षणिक इतिहास सुरक्षित ठेवला जाईल. शिष्यवृत्ती व हजेरी पात्रता आपोआप पुनर्गणित केली जाईल.',
                  'Once promotion is finalized, student class registers will be updated and academic history will be preserved. Scholarship and attendance eligibility will be recalculated automatically.'
                )}
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border-green dark:border-dark-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                disabled={promoting}
              >
                {tBilingual('मागे जा', 'Back to Selection')}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleExecutePromotion}
                disabled={promoting}
                leftIcon={promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
              >
                {promoting
                  ? tBilingual('प्रक्रिया सुरू आहे...', 'Processing...')
                  : `${tBilingual('पदोन्नती प्रमाणित करा', 'Certify Promotion')} (${formatNumber(selectedCount)} ${tBilingual('विद्यार्थी', 'Students')})`}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        /* STEP 3: Summary of Updated and Skipped Records */
        <Card className="border border-border-green dark:border-dark-border p-6 bg-white dark:bg-dark-card shadow-card space-y-6">
          <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                {tBilingual('वर्ग पदोन्नती यशस्वीरीत्या पूर्ण झाली!', 'Class Promotion Completed Successfully!')}
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">{promotionResult?.message}</p>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                {tBilingual('यशस्वी पदोन्नती', 'Promoted')}
              </span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {formatNumber(promotionResult?.promotedCount || 0)}
              </span>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block mt-0.5">
                {tBilingual('पुढील वर्गात दाखल झाले', 'Enrolled in next standard')}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                {tBilingual('वर्ग पुनरावृत्ती', 'Repeated')}
              </span>
              <span className="text-2xl font-black text-amber-700 dark:text-amber-400">
                {formatNumber(promotionResult?.repeatedCount || 0)}
              </span>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 block mt-0.5">
                {tBilingual('त्याच वर्गात नोंदवले', 'Retained in same standard')}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/40">
              <span className="text-xs font-bold text-slate-800 dark:text-dark-text block">
                {tBilingual('वगळलेले रेकॉर्ड्स', 'Skipped Records')}
              </span>
              <span className="text-2xl font-black text-slate-700 dark:text-slate-300">
                {formatNumber(promotionResult?.skippedCount || 0)}
              </span>
              <span className="text-[10px] text-slate-600 dark:text-dark-muted block mt-0.5">
                {tBilingual('यापूर्वीच प्रक्रिया झाली', 'Already processed earlier')}
              </span>
            </div>
          </div>

          {/* Skipped Details Table if any */}
          {promotionResult?.skippedRecords && promotionResult.skippedRecords.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-dark-muted uppercase tracking-wider">
                {tBilingual('वगळलेल्या विद्यार्थ्यांची माहिती', 'Duplicate / Skipped Records Details')}
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-dark-border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-dark-text font-bold border-b border-slate-200 dark:border-dark-border">
                      <th className="py-2 px-3">{tBilingual('GR क्र.', 'GR No.')}</th>
                      <th className="py-2 px-3">{tBilingual('विद्यार्थ्याचे नाव', 'Student Name')}</th>
                      <th className="py-2 px-3">{tBilingual('कारण', 'Reason')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                    {promotionResult.skippedRecords.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-dark-text">{r.grNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-dark-text">{r.name}</td>
                        <td className="py-2 px-3 text-red-600 dark:text-red-400 font-medium">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-green dark:border-dark-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowHistory(true);
                loadHistory();
              }}
              leftIcon={<History className="w-4 h-4" />}
            >
              {tBilingual('सर्व पदोन्नती नोंदी पहा', 'View All Batches / History')}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCurrentStep(1);
                setPromotionResult(null);
                fetchPromotionPreview();
              }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              {tBilingual('दुसऱ्या वर्गाची पदोन्नती करा', 'Promote Another Class')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
