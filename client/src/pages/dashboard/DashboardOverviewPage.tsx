import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import {
  Users,
  UserCheck,
  Landmark,
  Award,
  FileBadge,
  UserPlus,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
  Calendar,
  CheckCircle2,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Coins,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const DashboardOverviewPage: React.FC = () => {
  const { user, isPrincipal } = useAuth();
  const { t, tBilingual, language, formatCurrency } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endpoint = isPrincipal
    ? '/portal/dashboard/principal-summary'
    : '/portal/dashboard/teacher-summary';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .get(endpoint)
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) {
            setData(res.data.data);
          } else {
            setError(res.data?.message || 'Failed to load executive summary');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              'Unable to fetch MongoDB records. Please ensure your session is active.'
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  if (loading) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center gap-3 bg-white dark:bg-dark-card rounded-xl border border-border-green dark:border-dark-border p-8 shadow-sm">
        <Loader2 className="w-9 h-9 text-primary-green animate-spin" />
        <p className="text-sm font-semibold text-main-text dark:text-dark-text">
          {tBilingual('माहिती लोड होत आहे...', 'Connecting to MongoDB & calculating live records...')}
        </p>
        <p className="text-xs text-muted-text dark:text-dark-muted">
          {tBilingual(
            'वर्गवारी, आर्थिक हिशोब व प्रलंबित कामे गोळा केली जात आहेत',
            'Fetching class distribution, financial ledger, and pending approvals'
          )}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-6 text-red-800 dark:text-red-300 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h3 className="font-bold text-sm">
            {tBilingual('डॅशबोर्ड डेटा त्रुटी', 'Dashboard Data Sync Error')}
          </h3>
        </div>
        <p className="text-xs text-red-700 dark:text-red-300">{error || 'Data could not be loaded.'}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          {tBilingual('पुन्हा प्रयत्न करा', 'Retry')}
        </Button>
      </div>
    );
  }

  // Common colors for charts
  const GREEN_COLOR = isDark ? '#267A48' : '#176638';
  const LIGHT_GREEN = '#22C55E';
  const ORANGE_COLOR = '#FFA500';

  const chartAxisColor = isDark ? '#D1D5DB' : '#24352A';
  const chartGridColor = isDark ? '#374151' : '#E1E8E1';
  const chartTooltipStyle = {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderColor: isDark ? '#374151' : '#E1E8E1',
    borderRadius: '8px',
    fontSize: '12px',
    color: isDark ? '#F9FAFB' : '#24352A',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-dark-card p-5 sm:p-6 rounded-xl border border-border-green dark:border-dark-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-green dark:text-emerald-400 uppercase tracking-wider">
              {tBilingual('शैक्षणिक सत्र २०२६-२७', 'Academic Session 2026-27')}
            </span>
            <span className="text-muted-text dark:text-dark-muted">•</span>
            <span className="text-xs text-muted-text dark:text-dark-muted">
              {new Date().toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-main-text dark:text-dark-text tracking-tight flex items-center gap-2">
            {tBilingual('स्वागतम्', 'Welcome')}, {user?.name}! 👋
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isPrincipal
                  ? 'bg-saffron-orange text-white'
                  : 'bg-primary-green text-white'
              }`}
            >
              {isPrincipal
                ? tBilingual('मुख्याध्यापक', 'Principal')
                : tBilingual('वर्गशिक्षक', 'Teacher')}
            </span>
          </h1>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {isPrincipal
              ? tBilingual(
                  'शाळा व्यवस्थापन, आर्थिक हिशोब, विद्यार्थी प्रवेश व प्रशासकीय नियंत्रण कक्ष',
                  'School Management, Financial Ledger, Admissions & Administrative Operations'
                )
              : `${tBilingual('अधिकृत वर्ग', 'Assigned Classes')}: ${(data.assignedClasses || []).join(', ')} • ${tBilingual('विद्यार्थी नोंदवही व अहवाल', 'Student Registry & Reports')}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/dashboard/students">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Users className="w-4 h-4 text-primary-green dark:text-emerald-400" />}
            >
              {tBilingual('विद्यार्थी यादी', 'Students')}
            </Button>
          </Link>
          <Link to="/dashboard/reports">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<TrendingUp className="w-4 h-4" />}
            >
              {tBilingual('अहवाल डाउनलोड', 'Reports')}
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINCIPAL DASHBOARD SUMMARY */}
      {/* ========================================================================= */}
      {isPrincipal && (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <Link to="/dashboard/students" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-primary-green transition-all shadow-sm hover:shadow-md bg-white dark:bg-dark-card">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-muted-text dark:text-dark-muted group-hover:text-primary-green">
                    {tBilingual('एकूण विद्यार्थी', 'Total Students')}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-[#E2EFE7] dark:bg-emerald-950/50 text-primary-green dark:text-emerald-400 flex items-center justify-center group-hover:bg-primary-green group-hover:text-white transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-main-text dark:text-dark-text">{data.totalStudents}</div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-text dark:text-dark-muted pt-2 border-t border-border-green/60 dark:border-dark-border/60">
                  <span className="text-primary-green dark:text-emerald-400 font-medium">
                    {tBilingual('इयत्ता १ ली ते ७ वी', 'Grades 1 to 7')}
                  </span>
                  <span className="flex items-center gap-0.5 text-saffron-orange font-medium group-hover:underline">
                    {tBilingual('तपशील', 'Details')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </Link>

            {/* Total Teachers */}
            <Link to="/dashboard/teachers" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-primary-green transition-all shadow-sm hover:shadow-md bg-white dark:bg-dark-card">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-muted-text dark:text-dark-muted group-hover:text-primary-green">
                    {tBilingual('मंजूर शिक्षक कर्मचारी', 'Authorized Teachers')}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-[#E2EFE7] dark:bg-emerald-950/50 text-primary-green dark:text-emerald-400 flex items-center justify-center group-hover:bg-primary-green group-hover:text-white transition-colors">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-main-text dark:text-dark-text">{data.totalTeachers}</div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-text dark:text-dark-muted pt-2 border-t border-border-green/60 dark:border-dark-border/60">
                  <span className="text-primary-green dark:text-emerald-400 font-medium">
                    {tBilingual('१००% हजर व कार्यरत', '100% Active Staff')}
                  </span>
                  <span className="flex items-center gap-0.5 text-saffron-orange font-medium group-hover:underline">
                    {tBilingual('रोस्टर', 'Roster')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </Link>

            {/* Pending Admissions */}
            <Link to="/dashboard/admissions" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-saffron-orange transition-all shadow-sm hover:shadow-md bg-white dark:bg-dark-card">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-muted-text dark:text-dark-muted group-hover:text-saffron-orange">
                    {tBilingual('प्रलंबित प्रवेश अर्ज', 'Pending Admissions')}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-saffron-orange flex items-center justify-center group-hover:bg-saffron-orange group-hover:text-white transition-colors">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-saffron-orange">
                  {data.pendingAdmissionsCount}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-text dark:text-dark-muted pt-2 border-t border-border-green/60 dark:border-dark-border/60">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    {tBilingual('ऑनलाइन अर्ज छाननी', 'Online Application Review')}
                  </span>
                  <span className="flex items-center gap-0.5 text-saffron-orange font-medium group-hover:underline">
                    {tBilingual('तपासा', 'Review')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </Link>

            {/* Pending Certificates */}
            <Link to="/dashboard/certificates" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-saffron-orange transition-all shadow-sm hover:shadow-md bg-white dark:bg-dark-card">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-muted-text dark:text-dark-muted group-hover:text-saffron-orange">
                    {tBilingual('प्रमाणपत्र विनंत्या', 'Pending Certificates')}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-saffron-orange flex items-center justify-center group-hover:bg-saffron-orange group-hover:text-white transition-colors">
                    <FileBadge className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-saffron-orange">
                  {data.pendingCertificatesCount}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-text dark:text-dark-muted pt-2 border-t border-border-green/60 dark:border-dark-border/60">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    {tBilingual('स्वाक्षरी व मंजुरी', 'Signing & Approval')}
                  </span>
                  <span className="flex items-center gap-0.5 text-saffron-orange font-medium group-hover:underline">
                    {tBilingual('मंजूर करा', 'Approve')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </Link>
          </div>

          {/* Financial Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/dashboard/funds" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-primary-green transition-all bg-white dark:bg-dark-card shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-text dark:text-dark-muted">
                      {tBilingual('एकूण प्राप्त शासकीय निधी', 'Total Government Funds Received')}
                    </p>
                    <p className="text-2xl font-black text-primary-green dark:text-emerald-400">
                      {formatCurrency(Number(data.financials?.totalFundsReceived || 0))}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-primary-green dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-text dark:text-dark-muted mt-2">
                  {tBilingual('शाळा अनुदान, MDM पोषण आहार व समग्र शिक्षा निधी', 'School Grants, MDM Nutrition & Samagra Shiksha')}
                </p>
              </Card>
            </Link>

            <Link to="/dashboard/funds" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-red-400 transition-all bg-white dark:bg-dark-card shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-text dark:text-dark-muted">
                      {tBilingual('एकूण खर्च', 'Total Expenses Incurred')}
                    </p>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400">
                      {formatCurrency(Number(data.financials?.totalExpenses || 0))}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <Landmark className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-text dark:text-dark-muted mt-2">
                  {tBilingual('रंगकाम, पोषण आहार धान्य देयक व शालेय साहित्य', 'Painting, MDM provisions & educational supplies')}
                </p>
              </Card>
            </Link>

            <Link to="/dashboard/funds" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-saffron-orange transition-all bg-white dark:bg-dark-card shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-text dark:text-dark-muted">
                      {tBilingual('शिल्लक उपलब्ध निधी', 'Available Balance')}
                    </p>
                    <p className="text-2xl font-black text-saffron-orange">
                      {formatCurrency(Number(data.financials?.availableBalance || 0))}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-saffron-orange flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-text dark:text-dark-muted mt-2">
                  {tBilingual('बँक खात्यात उपलब्ध चालू शिल्लक', 'Current balance available in school bank account')}
                </p>
              </Card>
            </Link>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class-wise Student Distribution (Bar Chart) */}
            <Card className="lg:col-span-2 border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                    {tBilingual('इयत्तानिहाय विद्यार्थी संख्या', 'Class-wise Student Distribution')}
                  </CardTitle>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual('इयत्ता १ ली ते ७ वी मधील विद्यार्थ्यांचे वर्गीकरण', 'Breakdown of enrolled students across grades 1 to 7')}
                  </p>
                </div>
                <Link to="/dashboard/students">
                  <Button variant="ghost" size="sm" className="text-primary-green dark:text-emerald-400 text-xs">
                    {tBilingual('तपशील पहा', 'View Details')} →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.classDistribution || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis
                        dataKey="_id"
                        tick={{ fill: chartAxisColor, fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar
                        dataKey="total"
                        name={tBilingual('एकूण विद्यार्थी', 'Total Students')}
                        fill={GREEN_COLOR}
                        radius={[4, 4, 0, 0]}
                      >
                        {(data.classDistribution || []).map((_entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 2 ? ORANGE_COLOR : GREEN_COLOR}
                          />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="boys"
                        name={tBilingual('मुले', 'Boys')}
                        fill={LIGHT_GREEN}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="girls"
                        name={tBilingual('मुली', 'Girls')}
                        fill={ORANGE_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 text-xs text-muted-text dark:text-dark-muted mt-3 pt-3 border-t border-border-green dark:border-dark-border">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-primary-green dark:bg-emerald-500 inline-block" /> {tBilingual('एकूण विद्यार्थी', 'Total Students')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#22C55E] inline-block" /> {tBilingual('मुले', 'Boys')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-saffron-orange inline-block" /> {tBilingual('मुली', 'Girls')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Gender Distribution (Pie Chart & Summary) */}
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
              <CardHeader className="border-b border-border-green dark:border-dark-border pb-3">
                <CardTitle className="text-base font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                  {tBilingual('लिंगनिहाय गुणोत्तर', 'Gender Ratio')}
                </CardTitle>
                <p className="text-xs text-muted-text dark:text-dark-muted">
                  {tBilingual('मुले विरुद्ध मुली समतोल प्रमाण', 'Boys vs Girls balance ratio')}
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: tBilingual('मुले', 'Boys'), value: data.genderDistribution?.boys || 75 },
                          { name: tBilingual('मुली', 'Girls'), value: data.genderDistribution?.girls || 73 },
                        ]}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill={GREEN_COLOR} />
                        <Cell fill={ORANGE_COLOR} />
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-[#F4F7F4] dark:bg-dark-bg/60 rounded-lg border border-border-green dark:border-dark-border">
                    <p className="text-xs text-muted-text dark:text-dark-muted font-medium">
                      {tBilingual('मुले', 'Boys')}
                    </p>
                    <p className="text-xl font-bold text-primary-green dark:text-emerald-400">
                      {data.genderDistribution?.boys || 75}
                    </p>
                    <p className="text-[10px] text-muted-text dark:text-dark-muted">
                      {Math.round(
                        ((data.genderDistribution?.boys || 75) / (data.totalStudents || 148)) * 100
                      )}%
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50/60 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900/40">
                    <p className="text-xs text-muted-text dark:text-dark-muted font-medium">
                      {tBilingual('मुली', 'Girls')}
                    </p>
                    <p className="text-xl font-bold text-saffron-orange">
                      {data.genderDistribution?.girls || 73}
                    </p>
                    <p className="text-[10px] text-muted-text dark:text-dark-muted">
                      {Math.round(
                        ((data.genderDistribution?.girls || 73) / (data.totalStudents || 148)) * 100
                      )}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Action Lists Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Online Admissions */}
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-saffron-orange" />
                    {tBilingual('नवीन ऑनलाइन प्रवेश अर्ज', 'Pending Admissions')}
                  </CardTitle>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual('संकेतस्थळावरून पालकांनी दाखल केलेले अर्ज', 'Applications submitted by parents online')}
                  </p>
                </div>
                <Link to="/dashboard/admissions">
                  <Button variant="ghost" size="sm" className="text-primary-green dark:text-emerald-400 text-xs">
                    {tBilingual('सर्व अर्ज', 'All Applications')} ({data.pendingAdmissionsCount}) →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-3">
                {data.pendingAdmissions && data.pendingAdmissions.length > 0 ? (
                  <div className="divide-y divide-border-green dark:divide-dark-border">
                    {data.pendingAdmissions.map((app: any) => (
                      <div key={app._id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-main-text dark:text-dark-text">{app.studentName}</p>
                          <p className="text-[11px] text-muted-text dark:text-dark-muted">
                            {app.gradeApplying} • {tBilingual('अर्ज क्र', 'App No')}: <span className="font-mono text-primary-green dark:text-emerald-400 font-semibold">{app.applicationNo}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="warning">{tBilingual('प्रलंबित', 'Pending')}</Badge>
                          <Link to="/dashboard/admissions">
                            <Button size="sm" variant="outline" className="text-xs py-1 h-7">
                              {tBilingual('छाननी', 'Review')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual('कोणतेही प्रलंबित प्रवेश अर्ज शिल्लक नाहीत.', 'No pending admission applications.')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Certificate Requests */}
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                    <FileBadge className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                    {tBilingual('प्रलंबित प्रमाणपत्र विनंत्या', 'Pending Certificates')}
                  </CardTitle>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual('शिक्षकांनी दाखल केलेले मागणी अर्ज', 'Certificate requests forwarded by teachers')}
                  </p>
                </div>
                <Link to="/dashboard/certificates">
                  <Button variant="ghost" size="sm" className="text-primary-green dark:text-emerald-400 text-xs">
                    {tBilingual('सर्व विनंत्या', 'All Requests')} ({data.pendingCertificatesCount}) →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-3">
                {data.pendingCertificates && data.pendingCertificates.length > 0 ? (
                  <div className="divide-y divide-border-green dark:divide-dark-border">
                    {data.pendingCertificates.map((cert: any) => (
                      <div key={cert._id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-main-text dark:text-dark-text">{cert.studentName}</p>
                          <p className="text-[11px] text-muted-text dark:text-dark-muted">
                            {cert.type} • {cert.classGrade}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="warning">{tBilingual('अपेक्षित', 'Awaiting')}</Badge>
                          <Link to="/dashboard/certificates">
                            <Button size="sm" variant="primary" className="text-xs py-1 h-7">
                              {tBilingual('मंजूर करा', 'Approve')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual('कोणत्याही प्रलंबित प्रमाणपत्र स्वाक्षऱ्या नाहीत.', 'No pending certificates awaiting signing.')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Notices & Activities */}
          <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                  {tBilingual('अलिकडील सूचना व घडामोडी', 'Recent Notices & Activities')}
                </CardTitle>
                <p className="text-xs text-muted-text dark:text-dark-muted">
                  {tBilingual('शाळा व संकेतस्थळ परिपत्रके', 'Official circulars and announcements')}
                </p>
              </div>
              <Link to="/dashboard/website">
                <Button variant="ghost" size="sm" className="text-primary-green dark:text-emerald-400 text-xs">
                  {tBilingual('व्यवस्थापन', 'Manage')} →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data.recentNotices || []).map((notice: any) => (
                  <div
                    key={notice._id}
                    className="p-3 rounded-lg border border-border-green dark:border-dark-border bg-[#F4F7F4]/40 dark:bg-dark-bg/40 hover:bg-[#F4F7F4] dark:hover:bg-dark-bg transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-green text-white">
                        {notice.category}
                      </span>
                      <span className="text-[11px] text-muted-text dark:text-dark-muted">
                        {new Date(notice.date).toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN')}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-main-text dark:text-dark-text line-clamp-1">
                      {notice.title}
                    </h4>
                    <p className="text-[11px] text-muted-text dark:text-dark-muted mt-1 line-clamp-2">
                      {notice.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* TEACHER DASHBOARD SUMMARY */}
      {/* ========================================================================= */}
      {!isPrincipal && (
        <>
          {/* Top KPI Cards for Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Authorized Students */}
            <Link to="/dashboard/students" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-primary-green transition-all shadow-sm hover:shadow-md bg-white dark:bg-dark-card">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-muted-text dark:text-dark-muted group-hover:text-primary-green">
                    {tBilingual('माझ्या वर्गातील विद्यार्थी', 'Authorized Students')}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-[#E2EFE7] dark:bg-emerald-950/50 text-primary-green dark:text-emerald-400 flex items-center justify-center group-hover:bg-primary-green group-hover:text-white transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-main-text dark:text-dark-text">
                  {data.totalAuthorizedStudents}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-text dark:text-dark-muted pt-2 border-t border-border-green/60 dark:border-dark-border/60">
                  <span className="text-primary-green dark:text-emerald-400 font-medium">
                    {(data.assignedClasses || []).join(', ')}
                  </span>
                  <span className="flex items-center gap-0.5 text-saffron-orange font-medium group-hover:underline">
                    {tBilingual('यादी', 'Roster')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </Link>

            {/* Scholarship Eligibility */}
            <Link to="/dashboard/scholarships" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-primary-green transition-all shadow-sm hover:shadow-md bg-white dark:bg-dark-card">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-muted-text dark:text-dark-muted group-hover:text-primary-green">
                    {tBilingual('शिष्यवृत्ती लाभार्थी', 'Scholarships Enrolled')}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-[#E2EFE7] dark:bg-emerald-950/50 text-primary-green dark:text-emerald-400 flex items-center justify-center group-hover:bg-primary-green group-hover:text-white transition-colors">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-primary-green dark:text-emerald-400">
                  {data.scholarshipSummary?.enrolledCount || 0}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-text dark:text-dark-muted pt-2 border-t border-border-green/60 dark:border-dark-border/60">
                  <span className="text-muted-text dark:text-dark-muted">
                    {tBilingual('पात्रता पडताळणी पूर्ण', 'Eligibility Verified')}
                  </span>
                  <span className="flex items-center gap-0.5 text-saffron-orange font-medium group-hover:underline">
                    {tBilingual('योजना', 'Schemes')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </Link>

            {/* Pending Certificates */}
            <Link to="/dashboard/certificates" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-saffron-orange transition-all shadow-sm hover:shadow-md bg-white dark:bg-dark-card">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-muted-text dark:text-dark-muted group-hover:text-saffron-orange">
                    {tBilingual('प्रलंबित दाखले मागणी', 'Pending Certificates')}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-saffron-orange flex items-center justify-center group-hover:bg-saffron-orange group-hover:text-white transition-colors">
                    <FileBadge className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-saffron-orange">
                  {data.certificates?.pending || 0}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-text dark:text-dark-muted pt-2 border-t border-border-green/60 dark:border-dark-border/60">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    {tBilingual('मुख्याध्यापक स्वाक्षरीसाठी', 'Awaiting Principal Sign')}
                  </span>
                  <span className="flex items-center gap-0.5 text-saffron-orange font-medium group-hover:underline">
                    {tBilingual('तपासा', 'Review')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </Link>

            {/* Approved Certificates */}
            <Link to="/dashboard/certificates" className="group">
              <Card className="border border-border-green dark:border-dark-border hover:border-primary-green transition-all shadow-sm hover:shadow-md bg-white dark:bg-dark-card">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-muted-text dark:text-dark-muted group-hover:text-primary-green">
                    {tBilingual('मंजूर व स्वाक्षरी केलेले दाखले', 'Approved Certificates')}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:bg-primary-green group-hover:text-white transition-colors">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  {data.certificates?.approved || 0}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-text dark:text-dark-muted pt-2 border-t border-border-green/60 dark:border-dark-border/60">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    {tBilingual('विद्यार्थ्यांना वाटपास तयार', 'Ready to Distribute')}
                  </span>
                  <span className="flex items-center gap-0.5 text-saffron-orange font-medium group-hover:underline">
                    {tBilingual('डाउनलोड', 'Download')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </Link>
          </div>

          {/* Teacher Class Distribution Chart & Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                    {tBilingual('माझ्या वर्गातील पटसंख्या', 'Assigned Classroom Strength')}
                  </CardTitle>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual('मुले व मुलींची संख्या आणि हजेरी प्रमाण', 'Boys and girls count across authorized standards')}
                  </p>
                </div>
                <Link to="/dashboard/students">
                  <Button variant="ghost" size="sm" className="text-primary-green dark:text-emerald-400 text-xs">
                    {tBilingual('विद्यार्थी यादी', 'Student List')} →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.classDistribution || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis
                        dataKey="_id"
                        tick={{ fill: chartAxisColor, fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar
                        dataKey="total"
                        name={tBilingual('एकूण विद्यार्थी', 'Total Students')}
                        fill={GREEN_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="boys"
                        name={tBilingual('मुले', 'Boys')}
                        fill={LIGHT_GREEN}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="girls"
                        name={tBilingual('मुली', 'Girls')}
                        fill={ORANGE_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 text-xs text-muted-text dark:text-dark-muted mt-3 pt-3 border-t border-border-green dark:border-dark-border">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-primary-green dark:bg-emerald-500 inline-block" /> {tBilingual('एकूण', 'Total')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#22C55E] inline-block" /> {tBilingual('मुले', 'Boys')} ({data.genderDistribution?.boys || 0})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-saffron-orange inline-block" /> {tBilingual('मुली', 'Girls')} ({data.genderDistribution?.girls || 0})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Caste & Social Category Distribution */}
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
              <CardHeader className="border-b border-border-green dark:border-dark-border pb-3">
                <CardTitle className="text-base font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                  {tBilingual('प्रवर्गनिहाय वर्गीकरण', 'Social Category')}
                </CardTitle>
                <p className="text-xs text-muted-text dark:text-dark-muted">
                  {tBilingual('शिष्यवृत्ती व शासन सवलतींसाठी', 'For scholarships and state quotas')}
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  {(data.categoryDistribution || []).map((cat: any) => (
                    <div key={cat._id} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-main-text dark:text-dark-text">{cat._id}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary-green dark:text-emerald-400">
                          {cat.count} {tBilingual('विद्यार्थी', 'students')}
                        </span>
                        <span className="text-[10px] text-muted-text dark:text-dark-muted">
                          ({Math.round((cat.count / (data.totalAuthorizedStudents || 1)) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border-green dark:border-dark-border text-center">
                  <Link to="/dashboard/scholarships">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      {tBilingual('शिष्यवृत्ती प्रस्ताव तयार करा', 'Prepare Scholarship Proposals')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Read-Only School Financial Summary for Teachers (Transparency) */}
          <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-green dark:border-dark-border pb-3">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                  {tBilingual('शालेय निधी व पोषण आहार स्थिती', 'School Finances & Nutrition (Read-Only)')}
                </CardTitle>
                <p className="text-xs text-muted-text dark:text-dark-muted">
                  {tBilingual(
                    'मुख्याध्यापक कार्यालयामार्फत प्रमाणित चालू वित्तीय अहवाल',
                    'Certified financial overview published by Principal office'
                  )}
                </p>
              </div>
              <Link to="/dashboard/funds">
                <Button variant="ghost" size="sm" className="text-primary-green dark:text-emerald-400 text-xs">
                  {tBilingual('सविस्तर हिशोब', 'Detailed Ledger')} →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-[#F4F7F4] dark:bg-dark-bg/60 rounded-lg border border-border-green dark:border-dark-border">
                  <p className="text-xs text-muted-text dark:text-dark-muted">{tBilingual('एकूण प्राप्त निधी', 'Total Funds Received')}</p>
                  <p className="text-xl font-bold text-primary-green dark:text-emerald-400">
                    {formatCurrency(Number(data.financialSummaries?.totalFundsReceived || 0))}
                  </p>
                </div>
                <div className="p-3 bg-[#F4F7F4] dark:bg-dark-bg/60 rounded-lg border border-border-green dark:border-dark-border">
                  <p className="text-xs text-muted-text dark:text-dark-muted">{tBilingual('एकूण खर्च', 'Total Expenses')}</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(Number(data.financialSummaries?.totalExpenses || 0))}
                  </p>
                </div>
                <div className="p-3 bg-orange-50/60 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900/40">
                  <p className="text-xs text-muted-text dark:text-dark-muted">{tBilingual('शिल्लक उपलब्ध निधी', 'Available Balance')}</p>
                  <p className="text-xl font-bold text-saffron-orange">
                    {formatCurrency(Number(data.financialSummaries?.availableBalance || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent School Circulars for Teachers */}
          <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card">
            <CardHeader className="border-b border-border-green dark:border-dark-border pb-3">
              <CardTitle className="text-base font-bold text-main-text dark:text-dark-text flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-green dark:text-emerald-400" />
                {tBilingual('शालेय सूचना फलक व परिपत्रके', 'Internal School Circulars & Notices')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data.recentNotices || []).map((notice: any) => (
                  <div
                    key={notice._id}
                    className="p-3 rounded-lg border border-border-green dark:border-dark-border bg-[#F4F7F4]/40 dark:bg-dark-bg/40"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-green text-white">
                        {notice.category}
                      </span>
                      <span className="text-[11px] text-muted-text dark:text-dark-muted">
                        {new Date(notice.date).toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN')}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-main-text dark:text-dark-text">{notice.title}</h4>
                    <p className="text-[11px] text-muted-text dark:text-dark-muted mt-1">{notice.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
