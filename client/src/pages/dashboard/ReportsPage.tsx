import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  Users,
  IndianRupee,
  GraduationCap,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  TrendingUp,
  Award,
  BookOpen,
} from 'lucide-react';

const COLORS = {
  green: '#176638',
  lightGreen: '#2E8540',
  orange: '#FFA500',
  darkOrange: '#D97706',
  blue: '#2563EB',
  purple: '#7C3AED',
  red: '#DC2626',
  gray: '#6B7280',
};

const PIE_PALETTE = ['#176638', '#FFA500', '#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706'];

export const ReportsPage: React.FC = () => {
  const { isPrincipal, isTeacher, user } = useAuth();
  const { t, tBilingual, formatCurrency, formatNumber, language } = useLanguage();
  const { isDark } = useTheme();

  // Active Report Module Tab
  const [activeTab, setActiveTab] = useState<'students' | 'funds' | 'teachers'>('students');

  // Filters State
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [standardFilter, setStandardFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data States
  const [studentData, setStudentData] = useState<any>(null);
  const [fundData, setFundData] = useState<any>(null);
  const [teacherData, setTeacherData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Student Reports
  const fetchStudentReports = async () => {
    try {
      let query = `?academicYear=${academicYear}&standard=${standardFilter}&division=${divisionFilter}`;
      const res = await api.get(`/portal/reports/students${query}`);
      if (res.data?.success) {
        setStudentData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch student reports:', err);
      setErrorMsg(err.response?.data?.message || 'विद्यार्थी अहवाल लोड करता आला नाही.');
    }
  };

  // Fetch Fund Reports
  const fetchFundReports = async () => {
    try {
      let query = `?academicYear=${academicYear}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;
      const res = await api.get(`/portal/reports/funds${query}`);
      if (res.data?.success) {
        setFundData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch fund reports:', err);
      setErrorMsg(err.response?.data?.message || 'आर्थिक अहवाल लोड करता आला नाही.');
    }
  };

  // Fetch Teacher Reports
  const fetchTeacherReports = async () => {
    try {
      const res = await api.get('/portal/reports/teachers');
      if (res.data?.success) {
        setTeacherData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch teacher reports:', err);
      setErrorMsg(err.response?.data?.message || 'शिक्षक अहवाल लोड करता आला नाही.');
    }
  };

  const loadCurrentTab = async () => {
    setLoading(true);
    setErrorMsg(null);
    if (activeTab === 'students') await fetchStudentReports();
    else if (activeTab === 'funds') await fetchFundReports();
    else if (activeTab === 'teachers') await fetchTeacherReports();
    setLoading(false);
  };

  useEffect(() => {
    loadCurrentTab();
  }, [activeTab, academicYear, standardFilter, divisionFilter, startDate, endDate]);

  // Export handlers
  const handleExportCsv = (module: 'students' | 'funds' | 'teachers') => {
    let url = `/api/portal/reports/${module}/csv?`;
    if (module === 'students') {
      url += `academicYear=${academicYear}&standard=${standardFilter}&division=${divisionFilter}`;
    } else if (module === 'funds') {
      url += `academicYear=${academicYear}&startDate=${startDate}&endDate=${endDate}`;
    }
    window.open(url, '_blank');
  };

  const handleExportPdf = (module: 'students' | 'funds' | 'teachers') => {
    let url = `/api/portal/reports/${module}/pdf?`;
    if (module === 'students') {
      url += `academicYear=${academicYear}&standard=${standardFilter}&division=${divisionFilter}`;
    } else if (module === 'funds') {
      url += `academicYear=${academicYear}&startDate=${startDate}&endDate=${endDate}`;
    }
    window.open(url, '_blank');
  };

  // Printable trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-green dark:border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="green" size="sm">
              {tBilingual('अहवाल व डेटा विश्लेषण (Analytics & Reports)')}
            </Badge>
            <span className="text-[11px] text-muted-text dark:text-dark-muted">UDISE: 27030504401</span>
          </div>
          <h1 className="text-2xl font-bold text-main-text dark:text-dark-text mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-green" />
            {tBilingual('शालेय सांख्यिकी व अहवाल प्रणाली (Reports Module)')}
          </h1>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual(
              'विद्यार्थी सांख्यिकी, आर्थिक ताळेबंद व निधी उपयोगिता, आणि शिक्षक कार्यभार अहवाल',
              'Student statistics, financial balance sheet & fund utilization, and teacher workload reports'
            )}
          </p>
        </div>

        {/* Global Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCurrentTab}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="border-border-green dark:border-dark-border text-main-text dark:text-dark-text hover:bg-light-green/40 dark:hover:bg-primary-green/20"
          >
            {tBilingual('रिफ्रेश', 'Refresh')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />}
            className="border-border-green dark:border-dark-border text-main-text dark:text-dark-text hover:bg-light-green/40 dark:hover:bg-primary-green/20"
          >
            {tBilingual('प्रिंट (Print)')}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800 text-red-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Primary Module Tabs */}
      <div className="flex items-center gap-2 border-b border-border-green dark:border-dark-border overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'students'
              ? 'border-primary-green text-primary-green bg-light-green dark:bg-primary-green/20 font-bold'
              : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text hover:bg-light-green/30 dark:hover:bg-primary-green/10'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>{tBilingual('विद्यार्थी सांख्यिकी (Student Reports)')}</span>
        </button>

        <button
          onClick={() => setActiveTab('funds')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'funds'
              ? 'border-saffron-orange text-saffron-orange bg-orange-50/70 dark:bg-amber-950/30 font-bold'
              : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text hover:bg-light-green/30 dark:hover:bg-primary-green/10'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>{tBilingual('निधी व खर्च ताळेबंद (Fund Reports)')}</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'teachers'
              ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text hover:bg-light-green/30 dark:hover:bg-primary-green/10'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{tBilingual('शिक्षक वृंद व विषय वाटप (Teacher Reports)')}</span>
        </button>
      </div>

      {/* 3. Filters Toolbar */}
      <Card className="border border-border-green dark:border-dark-border shadow-xs bg-light-green/20 dark:bg-dark-card">
        <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-main-text dark:text-dark-text flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary-green" />
              {tBilingual('फिल्टर्स (Filters):')}
            </span>

            {/* Academic Year */}
            <div className="flex items-center gap-1.5">
              <label className="text-muted-text dark:text-dark-muted font-medium">{tBilingual('शैक्षणिक वर्ष', 'Academic Year')}:</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="px-2.5 py-1 border border-border-green dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-main-text dark:text-dark-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-green"
              >
                <option value="2026-27">2026-27 ({tBilingual('चालू सत्र', 'Current')})</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="ALL">{tBilingual('सर्व वर्षे (ALL)', 'All Years (ALL)')}</option>
              </select>
            </div>

            {/* Student Specific Filters */}
            {activeTab === 'students' && (
              <>
                <div className="flex items-center gap-1.5">
                  <label className="text-muted-text dark:text-dark-muted font-medium">{tBilingual('इयत्ता', 'Standard')}:</label>
                  <select
                    value={standardFilter}
                    onChange={(e) => setStandardFilter(e.target.value)}
                    className="px-2.5 py-1 border border-border-green dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-main-text dark:text-dark-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-green"
                  >
                    <option value="ALL">{tBilingual('सर्व इयत्ता (Classes 1-7)', 'All Classes (1-7)')}</option>
                    <option value="इयत्ता १ ली">{tBilingual('इयत्ता १ ली (Class 1)')}</option>
                    <option value="इयत्ता २ री">{tBilingual('इयत्ता २ री (Class 2)')}</option>
                    <option value="इयत्ता ३ री">{tBilingual('इयत्ता ३ री (Class 3)')}</option>
                    <option value="इयत्ता ४ थी">{tBilingual('इयत्ता ४ थी (Class 4)')}</option>
                    <option value="इयत्ता ५ वी">{tBilingual('इयत्ता ५ वी (Class 5)')}</option>
                    <option value="इयत्ता ६ वी">{tBilingual('इयत्ता ६ वी (Class 6)')}</option>
                    <option value="इयत्ता ७ वी">{tBilingual('इयत्ता ७ वी (Class 7)')}</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-muted-text dark:text-dark-muted font-medium">{tBilingual('तुकडी', 'Division')}:</label>
                  <select
                    value={divisionFilter}
                    onChange={(e) => setDivisionFilter(e.target.value)}
                    className="px-2.5 py-1 border border-border-green dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-main-text dark:text-dark-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-green"
                  >
                    <option value="ALL">{tBilingual('सर्व तुकड्या (All Div)', 'All Divisions')}</option>
                    <option value="A">{tBilingual('तुकडी A', 'Division A')}</option>
                    <option value="B">{tBilingual('तुकडी B', 'Division B')}</option>
                  </select>
                </div>
              </>
            )}

            {/* Fund Specific Date Filters */}
            {activeTab === 'funds' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-muted-text dark:text-dark-muted">{tBilingual('पासून', 'From')}:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 border border-border-green dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-main-text dark:text-dark-text text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-text dark:text-dark-muted">{tBilingual('पर्यंत', 'To')}:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 border border-border-green dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-main-text dark:text-dark-text text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Buttons for Active Tab */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCsv(activeTab)}
              className="text-primary-green border-primary-green/40 hover:bg-light-green dark:hover:bg-primary-green/20 text-xs"
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-primary-green" />}
            >
              {tBilingual('CSV / Excel अहवाल', 'CSV / Excel Report')}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleExportPdf(activeTab)}
              className="text-xs bg-primary-green hover:bg-dark-green text-white"
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              {tBilingual('अधिकृत PDF अहवाल', 'Official PDF Report')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. TAB 1: STUDENT REPORTS */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Summary Metric Strip */}
          {studentData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-light-green dark:bg-primary-green/20 flex items-center justify-center text-primary-green">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-text dark:text-dark-muted font-medium block">
                      {tBilingual('एकूण विद्यार्थी (Total Students)')}
                    </span>
                    <span className="text-2xl font-extrabold text-main-text dark:text-dark-text">
                      {formatNumber(studentData.summary.totalStudents)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-primary-green/40 dark:border-primary-green/60 shadow-xs bg-[#F4F7F4] dark:bg-dark-bg/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E2EFE7] dark:bg-primary-green/20 flex items-center justify-center text-primary-green">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-primary-green font-semibold block">
                      {tBilingual('मुले (Boys Count)')}
                    </span>
                    <span className="text-2xl font-extrabold text-primary-green">
                      {formatNumber(studentData.summary.totalBoys)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-saffron-orange/40 dark:border-saffron-orange/60 shadow-xs bg-orange-50/40 dark:bg-amber-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-amber-900/40 flex items-center justify-center text-saffron-orange">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold block">
                      {tBilingual('मुली (Girls Count)')}
                    </span>
                    <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-300">
                      {formatNumber(studentData.summary.totalGirls)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-blue-200 dark:border-blue-800 shadow-xs bg-blue-50/30 dark:bg-blue-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold block">
                      {tBilingual('एकूण वर्ग (Classes)')}
                    </span>
                    <span className="text-2xl font-extrabold text-blue-800 dark:text-blue-300">
                      {formatNumber(studentData.summary.totalClasses)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State Check */}
          {studentData && studentData.summary.totalStudents === 0 ? (
            <Card className="border border-dashed border-border-green dark:border-dark-border p-12 text-center space-y-3 bg-white dark:bg-dark-card">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
              <h3 className="font-bold text-sm text-main-text dark:text-dark-text">
                {tBilingual('निवडलेल्या निकषांसाठी कोणताही डेटा उपलब्ध नाही', 'No data available for the selected criteria')}
              </h3>
              <p className="text-xs text-muted-text dark:text-dark-muted">
                {tBilingual('कृपया वरील फिल्टर्स (इयत्ता, तुकडी किंवा वर्ष) बदलून पुन्हा प्रयत्न करा.', 'Please change the filters (standard, division, or year) and try again.')}
              </p>
            </Card>
          ) : (
            studentData && (
              <>
                {/* Visual Charts Grid: 1. Gender Pie Chart, 2. Category Bar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Chart 1: Gender Distribution Pie Chart */}
                  <Card className="lg:col-span-5 border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
                    <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border">
                      <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4 text-primary-green" />
                        <span>{tBilingual('१. लिंगनिहाय विद्यार्थी प्रमाण (Gender Distribution)')}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={studentData.genderDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                              label={({ name, percentage }) => `${name.split(' ')[0]}: ${percentage}%`}
                            >
                              {studentData.genderDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill || PIE_PALETTE[index]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                                borderColor: isDark ? '#374151' : '#E5E7EB',
                                color: isDark ? '#F9FAFB' : '#111827',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              formatter={(value: any, name: any, item: any) => [
                                `${formatNumber(value)} ${tBilingual('विद्यार्थी', 'Students')} (${item.payload.percentage}%)`,
                                name,
                              ]}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chart 2: Category Distribution Bar Chart */}
                  <Card className="lg:col-span-7 border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
                    <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border">
                      <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-saffron-orange" />
                        <span>{tBilingual('२. सामाजिक प्रवर्गनिहाय वितरण (Category Distribution)')}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={studentData.categoryDistribution}
                            margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                            <XAxis dataKey="category" tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                                borderColor: isDark ? '#374151' : '#E5E7EB',
                                color: isDark ? '#F9FAFB' : '#111827',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              formatter={(val: any, name: any, item: any) => [
                                `${formatNumber(val)} ${tBilingual('विद्यार्थी', 'Students')} (${item.payload.percentage}%)`,
                                tBilingual('संख्या', 'Count'),
                              ]}
                            />
                            <Legend />
                            <Bar dataKey="count" name={tBilingual('विद्यार्थी संख्या', 'Student Count')} fill="#176638" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart 3: Class-Wise Student Count Bar Chart */}
                <Card className="border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
                  <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border">
                    <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary-green" />
                      <span>{tBilingual('३. इयत्तानिहाय विद्यार्थी संख्या व लिंग विभाजन (Class-Wise Distribution)')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={studentData.classDistribution}
                          margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                          <XAxis dataKey="standard" tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }} angle={-10} textAnchor="end" />
                          <YAxis allowDecimals={false} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                              borderColor: isDark ? '#374151' : '#E5E7EB',
                              color: isDark ? '#F9FAFB' : '#111827',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Legend />
                          <Bar dataKey="boys" name={tBilingual('मुले (Boys)')} fill="#176638" stackId="a" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="girls" name={tBilingual('मुली (Girls)')} fill="#FFA500" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabular Data View with Privacy Protection */}
                <Card className="border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
                  <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text">
                        {tBilingual('विद्यार्थी माहिती तक्ता (Sanitized Student Roster)')}
                      </CardTitle>
                      <p className="text-[11px] text-muted-text dark:text-dark-muted">
                        {tBilingual('गोपनीयता संरक्षणासह (No Bank/Aadhaar/Health Details Expose)')}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary-green">
                      {tBilingual('एकूण:', 'Total:')} {formatNumber(studentData.students.length)} {tBilingual('नोंदी', 'records')}
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-light-green dark:bg-dark-bg/80 text-main-text dark:text-dark-text font-bold">
                          <tr className="border-b border-border-green dark:border-dark-border">
                            <th className="py-2.5 px-3">{tBilingual('अ. क्र.', 'Sr. No.')}</th>
                            <th className="py-2.5 px-3">{tBilingual('G.R. क्र.', 'G.R. No.')}</th>
                            <th className="py-2.5 px-3">{tBilingual('विद्यार्थ्याचे पूर्ण नाव (Full Name)')}</th>
                            <th className="py-2.5 px-3">{tBilingual('इयत्ता', 'Standard')}</th>
                            <th className="py-2.5 px-3">{tBilingual('तुकडी', 'Division')}</th>
                            <th className="py-2.5 px-3">{tBilingual('लिंग', 'Gender')}</th>
                            <th className="py-2.5 px-3">{tBilingual('प्रवर्ग', 'Category')}</th>
                            <th className="py-2.5 px-3">{tBilingual('जात', 'Caste')}</th>
                            <th className="py-2.5 px-3">{tBilingual('हजेरी %', 'Attendance %')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-green dark:divide-dark-border">
                          {studentData.students.slice(0, 50).map((stu: any) => (
                            <tr key={stu.srNo} className="hover:bg-light-green/20 dark:hover:bg-primary-green/10">
                              <td className="py-2 px-3">{stu.srNo}</td>
                              <td className="py-2 px-3 font-mono font-bold text-primary-green">
                                {stu.grNumber}
                              </td>
                              <td className="py-2 px-3 font-semibold text-main-text dark:text-dark-text">{stu.name}</td>
                              <td className="py-2 px-3 text-main-text dark:text-dark-text">{stu.standard}</td>
                              <td className="py-2 px-3 text-main-text dark:text-dark-text">{stu.division}</td>
                              <td className="py-2 px-3 text-main-text dark:text-dark-text">{stu.gender}</td>
                              <td className="py-2 px-3">
                                <Badge variant="outline" size="sm">
                                  {stu.category}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-muted-text dark:text-dark-muted">{stu.caste || '-'}</td>
                              <td className="py-2 px-3 font-medium text-primary-green">
                                {stu.attendancePercentage}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )
          )}
        </div>
      )}

      {/* 5. TAB 2: FUND REPORTS */}
      {activeTab === 'funds' && fundData && (
        <div className="space-y-6">
          {/* Summary Balance Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-primary-green/40 dark:border-primary-green/60 shadow-xs bg-[#F4F7F4] dark:bg-dark-bg/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E2EFE7] dark:bg-primary-green/20 flex items-center justify-center text-primary-green">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-primary-green font-semibold block">
                    {tBilingual('१. एकूण प्राप्त निधी (Total Funds Received)')}
                  </span>
                  <span className="text-2xl font-extrabold text-primary-green">
                    {formatCurrency(fundData.summary.totalFundsReceived)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-saffron-orange/40 dark:border-saffron-orange/60 shadow-xs bg-orange-50/40 dark:bg-amber-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-amber-900/40 flex items-center justify-center text-saffron-orange">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold block">
                    {tBilingual('२. एकूण झालेला खर्च (Total Expenses)')}
                  </span>
                  <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-300">
                    {formatCurrency(fundData.summary.totalExpenses)}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block">
                    {tBilingual('उपयोगिता', 'Utilization')}: {fundData.summary.utilizationRate}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-blue-200 dark:border-blue-800 shadow-xs bg-blue-50/40 dark:bg-blue-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold block">
                    {tBilingual('३. अखेर शिल्लक रक्कम (Available Balance)')}
                  </span>
                  <span className="text-2xl font-extrabold text-blue-800 dark:text-blue-300">
                    {formatCurrency(fundData.summary.availableBalance)}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 block">
                    {tBilingual('निधी - खर्च = शिल्लक ताळेबंद', 'Funds - Expenses = Balance')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts: 1. Received vs Expenses, 2. Expense Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Received vs Expenses Bar Chart */}
            <Card className="lg:col-span-6 border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
              <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border">
                <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary-green" />
                  <span>{tBilingual('प्राप्त निधी विरूद्ध खर्च ताळेबंद (Received vs Expenses)')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fundData.comparisonData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis dataKey="name" tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                      <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                          borderColor: isDark ? '#374151' : '#E5E7EB',
                          color: isDark ? '#F9FAFB' : '#111827',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [formatCurrency(val), tBilingual('रक्कम', 'Amount')]}
                      />
                      <Bar dataKey="amount" name={tBilingual('रक्कम (INR)', 'Amount (INR)')} radius={[4, 4, 0, 0]}>
                        {fundData.comparisonData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Category Distribution Pie Chart */}
            <Card className="lg:col-span-6 border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
              <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border">
                <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-saffron-orange" />
                  <span>{tBilingual('खर्च वर्गवारीनिहाय प्रमाण (Expense Category Distribution)')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fundData.expenseCategoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="amount"
                        label={({ percentage }) => `${percentage}%`}
                      >
                        {fundData.expenseCategoryDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || PIE_PALETTE[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                          borderColor: isDark ? '#374151' : '#E5E7EB',
                          color: isDark ? '#F9FAFB' : '#111827',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(val: any, name: any, item: any) => [
                          `${formatCurrency(val)} (${item.payload.percentage}%)`,
                          item.payload.category,
                        ]}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fund-Wise Utilization Table */}
          <Card className="border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
            <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text">
                {tBilingual('शासकीय योजनानिहाय निधी उपयोगिता विवरण (Scheme-Wise Utilization)')}
              </CardTitle>
              <span className="text-xs text-muted-text dark:text-dark-muted">
                {tBilingual('प्रत्येक योजनेचा स्वतंत्र ताळेबंद', 'Individual balance sheet per scheme')}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-light-green dark:bg-dark-bg/80 text-main-text dark:text-dark-text font-bold">
                    <tr className="border-b border-border-green dark:border-dark-border">
                      <th className="py-2.5 px-3">{tBilingual('योजना संकेतांक / निधी क्र.', 'Scheme Code / Fund ID')}</th>
                      <th className="py-2.5 px-3">{tBilingual('योजनेचे नाव', 'Scheme Name')}</th>
                      <th className="py-2.5 px-3">{tBilingual('मंजूर निधी (Allocated)')}</th>
                      <th className="py-2.5 px-3">{tBilingual('झालेला खर्च (Utilized)')}</th>
                      <th className="py-2.5 px-3">{tBilingual('शिल्लक रक्कम (Remaining)')}</th>
                      <th className="py-2.5 px-3">{tBilingual('उपयोगिता %', 'Utilization %')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-green dark:divide-dark-border">
                    {fundData.fundUtilization.map((f: any, idx: number) => (
                      <tr key={idx} className="hover:bg-light-green/20 dark:hover:bg-primary-green/10">
                        <td className="py-2.5 px-3 font-mono font-bold text-primary-green">{f.fundId}</td>
                        <td className="py-2.5 px-3 font-semibold text-main-text dark:text-dark-text">{f.schemeType}</td>
                        <td className="py-2.5 px-3 text-main-text dark:text-dark-text">{formatCurrency(f.allocated)}</td>
                        <td className="py-2.5 px-3 text-amber-800 dark:text-amber-400 font-medium">
                          {formatCurrency(f.utilized)}
                        </td>
                        <td className="py-2.5 px-3 text-blue-700 dark:text-blue-300 font-bold">
                          {formatCurrency(f.remaining)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-dark-border rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary-green h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, f.percentUtilized)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-main-text dark:text-dark-text">
                              {f.percentUtilized}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. TAB 3: TEACHER REPORTS */}
      {activeTab === 'teachers' && teacherData && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-light-green dark:bg-primary-green/20 flex items-center justify-center text-primary-green">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-text dark:text-dark-muted font-medium block">
                    {tBilingual('एकूण शिक्षक (Total Teachers)')}
                  </span>
                  <span className="text-2xl font-extrabold text-main-text dark:text-dark-text">
                    {formatNumber(teacherData.summary.totalTeachers)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-blue-200 dark:border-blue-800 shadow-xs bg-blue-50/40 dark:bg-blue-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold block">
                    {tBilingual('सरासरी अनुभव (Avg Experience)')}
                  </span>
                  <span className="text-2xl font-extrabold text-blue-800 dark:text-blue-300">
                    {formatNumber(teacherData.summary.avgExperience)} {tBilingual('वर्षे', 'Years')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary-green/40 dark:border-primary-green/60 shadow-xs bg-[#F4F7F4] dark:bg-dark-bg/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E2EFE7] dark:bg-primary-green/20 flex items-center justify-center text-primary-green">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-primary-green font-semibold block">
                    {tBilingual('महिला शिक्षिका (Female)')}
                  </span>
                  <span className="text-2xl font-extrabold text-primary-green">
                    {formatNumber(teacherData.summary.femaleTeachers)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-saffron-orange/40 dark:border-saffron-orange/60 shadow-xs bg-orange-50/40 dark:bg-amber-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-amber-900/40 flex items-center justify-center text-saffron-orange">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold block">
                    {tBilingual('पुरुष शिक्षक (Male)')}
                  </span>
                  <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-300">
                    {formatNumber(teacherData.summary.maleTeachers)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visual Charts: 1. Subject Specialization Pie, 2. Experience Histogram */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Subject Distribution */}
            <Card className="lg:col-span-6 border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
              <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border">
                <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-primary-green" />
                  <span>{tBilingual('१. विषय विशेषीकरण वितरण (Subject Specialization Distribution)')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={teacherData.subjectDistribution.filter((s: any) => s.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="count"
                        label={({ name }) => name.split(' ')[0]}
                      >
                        {teacherData.subjectDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || PIE_PALETTE[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                          borderColor: isDark ? '#374151' : '#E5E7EB',
                          color: isDark ? '#F9FAFB' : '#111827',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(val: any, name: any) => [`${formatNumber(val)} ${tBilingual('शिक्षक', 'Teachers')}`, name]}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Experience Histogram */}
            <Card className="lg:col-span-6 border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
              <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border">
                <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>{tBilingual('२. अध्यापन अनुभव वारंवारिता (Teacher Experience Histogram)')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={teacherData.experienceHistogram}
                      margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis dataKey="range" tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                          borderColor: isDark ? '#374151' : '#E5E7EB',
                          color: isDark ? '#F9FAFB' : '#111827',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${formatNumber(val)} ${tBilingual('शिक्षक', 'Teachers')}`, tBilingual('संख्या', 'Count')]}
                      />
                      <Legend />
                      <Bar dataKey="count" name={tBilingual('शिक्षकांची संख्या', 'Teacher Count')} fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Roster Table */}
          <Card className="border border-border-green dark:border-dark-border shadow-xs bg-white dark:bg-dark-card">
            <CardHeader className="py-3 px-4 bg-light-green/40 dark:bg-dark-bg/60 border-b border-border-green dark:border-dark-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-main-text dark:text-dark-text">
                {tBilingual('शिक्षक वृंद व पदवाटप तक्ता (Teacher Qualifications Roster)')}
              </CardTitle>
              <span className="text-xs text-muted-text dark:text-dark-muted">
                {tBilingual('सर्व कार्यरत शिक्षक', 'All active teachers')}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-light-green dark:bg-dark-bg/80 text-main-text dark:text-dark-text font-bold">
                    <tr className="border-b border-border-green dark:border-dark-border">
                      <th className="py-2.5 px-3">{tBilingual('अ. क्र.', 'Sr. No.')}</th>
                      <th className="py-2.5 px-3">{tBilingual('सेवाार्थ क्र.', 'Sevaarth ID')}</th>
                      <th className="py-2.5 px-3">{tBilingual('शिक्षकाचे नाव', 'Teacher Name')}</th>
                      <th className="py-2.5 px-3">{tBilingual('पदनाम', 'Designation')}</th>
                      <th className="py-2.5 px-3">{tBilingual('शैक्षणिक पात्रता', 'Qualification')}</th>
                      <th className="py-2.5 px-3">{tBilingual('विषय विशेषीकरण', 'Subject Specialization')}</th>
                      <th className="py-2.5 px-3">{tBilingual('अनुभव वर्षे', 'Experience (Yrs)')}</th>
                      <th className="py-2.5 px-3">{tBilingual('नेमून दिलेले वर्ग', 'Assigned Classes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-green dark:divide-dark-border">
                    {teacherData.teachers.map((t: any) => (
                      <tr key={t.srNo} className="hover:bg-light-green/20 dark:hover:bg-primary-green/10">
                        <td className="py-2.5 px-3">{t.srNo}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-primary-green">
                          {t.employeeId}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-main-text dark:text-dark-text">{t.name}</td>
                        <td className="py-2.5 px-3 text-main-text dark:text-dark-text">{t.designation}</td>
                        <td className="py-2.5 px-3 text-muted-text dark:text-dark-muted">{t.qualification}</td>
                        <td className="py-2.5 px-3 text-primary-green font-medium">
                          {t.subjectSpecialization}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-main-text dark:text-dark-text">{formatNumber(t.experienceYears)} {tBilingual('वर्षे', 'Years')}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" size="sm">
                            {t.assignedClasses || tBilingual('सर्व वर्ग', 'All Classes')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
