import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../lib/api';
import { FundData, ExpenseData, FinanceSummaryData } from '../../types';
import {
  Landmark,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  FileText,
  X,
  RotateCcw,
  Receipt,
  Building,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  PieChart,
  HelpCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
} from 'lucide-react';

export const FinancesPage: React.FC = () => {
  const { isPrincipal, isTeacher } = useAuth();
  const { t, tBilingual, language, formatCurrency, formatDate } = useLanguage();

  // Summary and Ledger Data
  const [summaryData, setSummaryData] = useState<FinanceSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'summary' | 'funds' | 'expenses'>('summary');

  // Funds Tab State
  const [funds, setFunds] = useState<FundData[]>([]);
  const [fundsLoading, setFundsLoading] = useState(false);
  const [fundSearch, setFundSearch] = useState('');
  const [fundStatusFilter, setFundStatusFilter] = useState('ALL');
  const [selectedFundHistory, setSelectedFundHistory] = useState<FundData | null>(null);

  // Expenses Tab State
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('ALL');

  // Modals (Principal Only)
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [reversalTarget, setReversalTarget] = useState<ExpenseData | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Add Fund Form
  const [newFund, setNewFund] = useState({
    schemeType: 'समग्र शिक्षा - समग्र शाळा अनुदान (Composite School Grant)',
    fundId: '',
    amount: '',
    issuedBy: 'जिल्हा परिषद जळगाव - शिक्षण विभाग',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '2027-03-31',
    notes: '',
  });

  // Add Expense Form
  const [newExpense, setNewExpense] = useState({
    purpose: '',
    amount: '',
    billNumber: '',
    vendorName: '',
    category: 'Maintenance & Repairs',
    billDate: new Date().toISOString().split('T')[0],
    associatedFundId: '',
    notes: '',
    billAttachment: '',
  });

  // Load summary and all data
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portal/finance');
      if (res.data?.success) {
        setSummaryData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load finances:', err);
      setActionError('आर्थिक तपशील लोड करताना त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFunds = async () => {
    setFundsLoading(true);
    try {
      const params: any = { limit: 50 };
      if (fundSearch.trim()) params.search = fundSearch.trim();
      if (fundStatusFilter !== 'ALL') params.status = fundStatusFilter;

      const res = await api.get('/portal/finance/funds', { params });
      if (res.data?.success) {
        setFunds(res.data.data);
        if (res.data.data.length > 0 && !newExpense.associatedFundId) {
          setNewExpense((prev) => ({ ...prev, associatedFundId: res.data.data[0].fundId }));
        }
      }
    } catch (err) {
      console.error('Failed to load funds:', err);
    } finally {
      setFundsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    setExpensesLoading(true);
    try {
      const params: any = { limit: 100 };
      if (expenseSearch.trim()) params.search = expenseSearch.trim();
      if (expenseCategoryFilter !== 'ALL') params.category = expenseCategoryFilter;
      if (expenseStatusFilter !== 'ALL') params.status = expenseStatusFilter;

      const res = await api.get('/portal/finance/expenses', { params });
      if (res.data?.success) {
        setExpenses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchFunds();
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (activeTab === 'funds') fetchFunds();
    if (activeTab === 'expenses') fetchExpenses();
  }, [activeTab, fundStatusFilter, expenseCategoryFilter, expenseStatusFilter]);

  // Selected Fund for expense calculation
  const selectedFundForExpense = useMemo(() => {
    return funds.find((f) => f.fundId === newExpense.associatedFundId);
  }, [funds, newExpense.associatedFundId]);

  const selectedFundAvailable = selectedFundForExpense?.remainingAmount ?? (selectedFundForExpense ? selectedFundForExpense.amount - (selectedFundForExpense.utilizedAmount || 0) : 0);
  const expenseAmountNumber = Number(newExpense.amount) || 0;
  const isOverspending = expenseAmountNumber > selectedFundAvailable;

  // Handle Add Fund Submit
  const handleAddFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    setActionError(null);
    setSubmitLoading(true);

    try {
      const res = await api.post('/portal/finance/funds', newFund);
      if (res.data?.success) {
        setActionMessage(res.data.message);
        setIsAddFundOpen(false);
        setNewFund({
          schemeType: 'समग्र शिक्षा - समग्र शाळा अनुदान (Composite School Grant)',
          fundId: '',
          amount: '',
          issuedBy: 'जिल्हा परिषद जळगाव - शिक्षण विभाग',
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: '2027-03-31',
          notes: '',
        });
        fetchSummary();
        fetchFunds();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'अनुदान नोंदणी अयशस्वी झाली.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Add Expense Submit
  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    setActionError(null);

    if (isOverspending) {
      setActionError(`खर्च मर्यादा उल्लंघन: निवडलेल्या अनुदानात केवळ ₹${selectedFundAvailable.toLocaleString('en-IN')} शिल्लक आहेत.`);
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await api.post('/portal/finance/expense', newExpense);
      if (res.data?.success) {
        setActionMessage(res.data.message);
        setIsAddExpenseOpen(false);
        setNewExpense({
          purpose: '',
          amount: '',
          billNumber: '',
          vendorName: '',
          category: 'Maintenance & Repairs',
          billDate: new Date().toISOString().split('T')[0],
          associatedFundId: funds[0]?.fundId || '',
          notes: '',
          billAttachment: '',
        });
        fetchSummary();
        fetchFunds();
        fetchExpenses();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'खर्च नोंदणी अयशस्वी झाली.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Controlled Reversal
  const handleReversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTarget || !reversalReason.trim()) return;

    setSubmitLoading(true);
    try {
      const res = await api.post(`/portal/finance/reverse/${reversalTarget._id}`, {
        reason: reversalReason.trim(),
      });
      if (res.data?.success) {
        setActionMessage(res.data.message);
        setReversalTarget(null);
        setReversalReason('');
        fetchSummary();
        fetchFunds();
        fetchExpenses();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'व्यवहार रद्द करताना त्रुटी आली.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    window.open(`${api.defaults.baseURL}/portal/finance/export/csv`, '_blank');
  };

  // Print Summary
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isPrincipal ? (
              <Badge variant="orange" size="sm">
                {tBilingual('मुख्याध्यापक विशेष अधिकार', 'Principal Financial Authority')}
              </Badge>
            ) : (
              <Badge variant="green" size="sm">
                {tBilingual('केवळ वाचन अधिकार', 'Teacher Read-Only View')}
              </Badge>
            )}
            <span className="text-xs text-muted-text dark:text-dark-muted font-medium">
              {tBilingual('जि. प. प्राथमिक शाळा हिंगोणे बु.', 'ZP Primary School Hingone BK')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-main-text dark:text-dark-text mt-1">
            {tBilingual('शालेय निधी व जमा-खर्च व्यवस्थापन', 'School Financial & Ledger Management')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-dark-muted">
            {tBilingual(
              'शासकीय अनुदान प्राप्ती, अधिकृत देयके, निधी शिल्लक पडताळणी व पारदर्शक हिशोब नोंदवही',
              'Government grant allocations, audited vouchers, expenditure ledger, and balance reconciliations'
            )}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            {tBilingual('CSV एक्सपोर्ट', 'Export CSV')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            {tBilingual('अहवाल प्रिंट / PDF', 'Print / PDF Report')}
          </Button>

          {isPrincipal && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddFundOpen(true)}
                leftIcon={<Landmark className="w-3.5 h-3.5 text-primary-green dark:text-saffron-orange" />}
                className="border-primary-green text-primary-green hover:bg-light-green dark:hover:bg-[#25382D]"
              >
                {tBilingual('+ नवीन निधी नोंदवा', '+ Record Grant')}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddExpenseOpen(true)}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                {tBilingual('+ नवीन खर्च नोंदवा', '+ Record Expense')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {actionMessage && (
        <div className="p-3 bg-[#E2EFE7] dark:bg-emerald-950/40 border border-primary-green/30 dark:border-emerald-700 text-primary-green dark:text-emerald-400 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 1. Core Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Funds Received */}
        <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text dark:text-dark-muted uppercase tracking-wider">
              {tBilingual('प्राप्त शासकीय निधी', 'Total Funds Received')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-primary-green dark:text-emerald-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-primary-green dark:text-emerald-400 mt-2 font-mono">
            {formatCurrency(Number(summaryData?.totalFundsReceived || 0))}
          </div>
          <div className="text-[11px] text-muted-text dark:text-dark-muted mt-2 flex justify-between items-center border-t border-border-green/50 dark:border-dark-border pt-2">
            <span>{tBilingual('एकूण मंजूर शासकीय योजना:', 'Approved schemes:')}</span>
            <span className="font-semibold text-primary-green dark:text-emerald-400">
              {summaryData?.schemesSummary?.length || funds.length} {tBilingual('योजना', 'Schemes')}
            </span>
          </div>
        </Card>

        {/* Total Expenses Incurred */}
        <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text dark:text-dark-muted uppercase tracking-wider">
              {tBilingual('एकूण प्रमाणित खर्च', 'Total Expenses Incurred')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 mt-2 font-mono">
            {formatCurrency(Number(summaryData?.totalExpenses || 0))}
          </div>
          <div className="text-[11px] text-muted-text dark:text-dark-muted mt-2 flex justify-between items-center border-t border-border-green/50 dark:border-dark-border pt-2">
            <span>{tBilingual('प्रमाणित देयके व व्हाउचर्स:', 'Audited vouchers:')}</span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              {expenses.filter((e) => e.status !== 'Reversed').length} {tBilingual('देयके', 'Vouchers')}
            </span>
          </div>
        </Card>

        {/* Available Balance */}
        <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text dark:text-dark-muted uppercase tracking-wider">
              {tBilingual('शिल्लक उपलब्ध निधी', 'Available Balance')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FFF8E7] dark:bg-amber-950/50 text-saffron-orange flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-saffron-orange mt-2 font-mono">
            {formatCurrency(Number(summaryData?.availableBalance || 0))}
          </div>
          <div className="text-[11px] text-primary-green dark:text-emerald-400 font-semibold mt-2 flex justify-between items-center border-t border-border-green/50 dark:border-dark-border pt-2">
            <span>{tBilingual('उपलब्ध खर्च मर्यादा:', 'Status:')}</span>
            <span>{tBilingual('अधिशेष', 'Surplus Available')}</span>
          </div>
        </Card>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-border-green dark:border-dark-border bg-white dark:bg-dark-card rounded-t-xl px-4 pt-3 gap-3 shadow-sm">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'summary'
              ? 'border-saffron-orange text-primary-green dark:text-saffron-orange'
              : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>{tBilingual('१. एकूण आढावा व योजनानिहाय स्थिती', '1. Summary & Schemes')}</span>
        </button>

        <button
          onClick={() => setActiveTab('funds')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'funds'
              ? 'border-saffron-orange text-primary-green dark:text-saffron-orange'
              : 'border-transparent text-muted-text dark:text-dark-muted hover:text-main-text dark:hover:text-dark-text'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>{tBilingual('२. प्राप्त अनुदान यादी', `2. Grants Ledger (${funds.length})`)}</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'expenses'
              ? 'border-saffron-orange text-primary-green'
              : 'border-transparent text-muted-text hover:text-main-text'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>३. खर्च नोंदवही व देयके (Expenses Ledger - {expenses.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SUMMARY & SCHEMES UTILIZATION                     */}
      {/* ========================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Scheme Allocation Progress Bars */}
          <Card className="border border-border-green bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-green">
              <div>
                <h3 className="text-sm font-bold text-main-text">
                  शासकीय योजनानिहाय निधी विनियोग (Government Scheme Utilization)
                </h3>
                <p className="text-xs text-muted-text">
                  प्रत्येक अनुदानाचे मंजूर बजेट, प्रत्यक्षात झालेला खर्च आणि उर्वरित शिल्लक
                </p>
              </div>
              <Badge variant="green" size="sm">
                वास्तविक डेटा (Live DB)
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(summaryData?.schemesSummary || []).map((scheme, i) => {
                const percent =
                  scheme.allocated > 0
                    ? Math.min(100, Math.round((scheme.utilized / scheme.allocated) * 100))
                    : 0;

                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border-green bg-[#F4F7F4]/40 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-primary-green bg-white px-2 py-0.5 rounded border border-border-green">
                          {scheme.fundId}
                        </span>
                        <h4 className="text-xs font-bold text-main-text mt-1">{scheme.schemeType}</h4>
                      </div>
                      <Badge
                        variant={scheme.status === 'Fully Utilized' ? 'orange' : 'green'}
                        size="sm"
                      >
                        {scheme.status || 'Active'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-muted-text block text-[10px]">मंजूर निधी:</span>
                        <span className="font-bold text-main-text font-mono">
                          ₹{scheme.allocated.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-text block text-[10px]">झालेला खर्च:</span>
                        <span className="font-bold text-red-600 font-mono">
                          ₹{scheme.utilized.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-text block text-[10px]">उर्वरित शिल्लक:</span>
                        <span className="font-bold text-primary-green font-mono">
                          ₹{scheme.remaining.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-muted-text font-medium">
                        <span>वापर: {percent}%</span>
                        <span>शिल्लक: {100 - percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            percent > 85 ? 'bg-red-500' : percent > 50 ? 'bg-saffron-orange' : 'bg-primary-green'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Unified Recent Ledger Table */}
          <Card className="border border-border-green bg-white shadow-card">
            <CardHeader className="border-b border-border-green pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-main-text">
                  दैनंदिन जमा-खर्च नोंदवही (Recent Financial Ledger Transactions)
                </CardTitle>
                <p className="text-xs text-muted-text mt-0.5">शासकीय नियमांनुसार अद्ययावत व्यवहार</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                डाउनलोड
              </Button>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-green bg-[#F4F7F4] text-main-text font-bold">
                      <th className="py-2.5 px-3">व्हाउचर क्र.</th>
                      <th className="py-2.5 px-3">प्रकार</th>
                      <th className="py-2.5 px-3">तपशील (Title / Purpose)</th>
                      <th className="py-2.5 px-3">योजना / प्रवर्ग</th>
                      <th className="py-2.5 px-3">रक्कम</th>
                      <th className="py-2.5 px-3">दिनांक</th>
                      <th className="py-2.5 px-3">स्थिती</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-green">
                    {(summaryData?.transactions || []).slice(0, 15).map((t: any, idx: number) => {
                      const isExpense = t.type === 'expense';
                      const isRev = t.status === 'Reversed';

                      return (
                        <tr
                          key={t._id || idx}
                          className={`hover:bg-light-green/30 transition-colors ${
                            isRev ? 'bg-red-50/50 opacity-60 line-through' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-primary-green">
                            {t.voucherNo}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isExpense ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isExpense ? 'खर्च (DR)' : 'निधी जमा (CR)'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-main-text">
                            {t.purpose || t.title}
                          </td>
                          <td className="py-2.5 px-3 text-muted-text">
                            {t.category || t.schemeType || '-'}
                          </td>
                          <td
                            className={`py-2.5 px-3 font-bold font-mono ${
                              isExpense ? 'text-red-600' : 'text-primary-green'
                            }`}
                          >
                            {isExpense ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-muted-text font-mono">
                            {t.date ? new Date(t.date).toLocaleDateString('mr-IN') : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={isRev ? 'orange' : t.status === 'Approved' ? 'green' : 'neutral'}
                              size="sm"
                            >
                              {isRev ? 'रद्द (Reversed)' : t.status || 'सक्रिय'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: VIEW FUNDS (GRANTS RECEIVED)                       */}
      {/* ========================================================= */}
      {activeTab === 'funds' && (
        <div className="space-y-4">
          {/* Funds Search & Filters */}
          <Card className="border border-border-green p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-muted-text absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="अनुदान ओळख क्रमांक (Fund ID), योजना किंवा प्राधिकरणाचे नाव शोधा..."
                  value={fundSearch}
                  onChange={(e) => setFundSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-light-green/60 px-2.5 py-1.5 rounded-lg border border-border-green">
                  <Filter className="w-3.5 h-3.5 text-primary-green" />
                  <select
                    value={fundStatusFilter}
                    onChange={(e) => setFundStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-medium text-main-text focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">सर्व स्थिती (All Status)</option>
                    <option value="Active">सक्रिय (Active)</option>
                    <option value="Fully Utilized">पूर्ण वापरलेले (Fully Utilized)</option>
                    <option value="Expired">मुदत संपलेले (Expired)</option>
                  </select>
                </div>

                <Button variant="outline" size="sm" onClick={fetchFunds}>
                  शोधा
                </Button>
              </div>
            </div>
          </Card>

          {/* Funds List Table */}
          <Card className="border border-border-green bg-white shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-green bg-[#F4F7F4] text-main-text font-bold">
                    <th className="py-3 px-3">अनुदान ID</th>
                    <th className="py-3 px-3">शासकीय योजना / प्रकार</th>
                    <th className="py-3 px-3">मंजूर रक्कम</th>
                    <th className="py-3 px-3">वितरक प्राधिकरण (Issued By)</th>
                    <th className="py-3 px-3">मंजूर दिनांक</th>
                    <th className="py-3 px-3">वापर मुदत (Deadline)</th>
                    <th className="py-3 px-3">झालेला खर्च</th>
                    <th className="py-3 px-3">उर्वरित शिल्लक</th>
                    <th className="py-3 px-3">स्थिती</th>
                    <th className="py-3 px-3 text-right">तपशील</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-green">
                  {fundsLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-text">
                        अनुदान माहिती लोड होत आहे...
                      </td>
                    </tr>
                  ) : funds.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-text">
                        कोणतेही अनुदान आढळले नाही.
                      </td>
                    </tr>
                  ) : (
                    funds.map((f) => {
                      const remaining = f.remainingAmount ?? (f.amount - (f.utilizedAmount || 0));
                      return (
                        <tr key={f._id} className="hover:bg-light-green/30 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-primary-green">
                            {f.fundId || f.voucherNo}
                          </td>
                          <td className="py-3 px-3 font-semibold text-main-text">
                            {f.schemeType || f.title}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-primary-green">
                            ₹{f.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-muted-text">{f.issuedBy || 'ZP Jalgaon'}</td>
                          <td className="py-3 px-3 text-muted-text font-mono">
                            {f.issueDate ? new Date(f.issueDate).toLocaleDateString('mr-IN') : '-'}
                          </td>
                          <td className="py-3 px-3 text-muted-text font-mono">
                            {f.expiryDate ? new Date(f.expiryDate).toLocaleDateString('mr-IN') : '-'}
                          </td>
                          <td className="py-3 px-3 font-mono text-red-600 font-semibold">
                            ₹{(f.utilizedAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-saffron-orange">
                            ₹{remaining.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={f.status === 'Fully Utilized' ? 'orange' : 'green'}
                              size="sm"
                            >
                              {f.status || 'Active'}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFundHistory(f)}
                              className="text-[11px] py-1 px-2"
                            >
                              इतिहास ({f.transactionHistory?.length || 0})
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: EXPENSES LEDGER                                    */}
      {/* ========================================================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Expenses Search & Filter Bar */}
          <Card className="border border-border-green p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-muted-text absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="खर्च तपशील, देयक क्रमांक (Bill No), किंवा विक्रेत्याचे नाव शोधा..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-light-green/60 px-2.5 py-1.5 rounded-lg border border-border-green">
                  <Filter className="w-3.5 h-3.5 text-primary-green" />
                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className="bg-transparent text-xs font-medium text-main-text focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">सर्व प्रवर्ग (All Categories)</option>
                    <option value="Maintenance & Repairs">दुरुस्ती व देखभाल</option>
                    <option value="Educational Materials & Books">शैक्षणिक साहित्य व पुस्तके</option>
                    <option value="Sports Equipment">क्रीडा साहित्य</option>
                    <option value="Digital Infrastructure">डिजिटल क्लासरूम</option>
                    <option value="Mid-Day Meal Utilities">पोषण आहार साहित्य</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-light-green/60 px-2.5 py-1.5 rounded-lg border border-border-green">
                  <select
                    value={expenseStatusFilter}
                    onChange={(e) => setExpenseStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-medium text-main-text focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">सर्व स्थिती</option>
                    <option value="Approved">प्रमाणित (Approved)</option>
                    <option value="Reversed">रद्द (Reversed)</option>
                  </select>
                </div>

                <Button variant="outline" size="sm" onClick={fetchExpenses}>
                  शोधा
                </Button>
              </div>
            </div>
          </Card>

          {/* Expenses List Table */}
          <Card className="border border-border-green bg-white shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-green bg-[#F4F7F4] text-main-text font-bold">
                    <th className="py-3 px-3">व्हाउचर क्र.</th>
                    <th className="py-3 px-3">दिनांक</th>
                    <th className="py-3 px-3">खर्च उद्देश (Purpose)</th>
                    <th className="py-3 px-3">प्रवर्ग</th>
                    <th className="py-3 px-3">विक्रेता (Vendor)</th>
                    <th className="py-3 px-3">बिल क्रमांक</th>
                    <th className="py-3 px-3">संबंधित निधी (Fund)</th>
                    <th className="py-3 px-3">खर्च रक्कम</th>
                    <th className="py-3 px-3">स्थिती</th>
                    {isPrincipal && <th className="py-3 px-3 text-right">कृती</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-green">
                  {expensesLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-text">
                        खर्च नोंदवही लोड होत आहे...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-text">
                        कोणताही खर्च आढळला नाही.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((e) => {
                      const isRev = e.status === 'Reversed';
                      return (
                        <tr
                          key={e._id}
                          className={`hover:bg-light-green/30 transition-colors ${
                            isRev ? 'bg-red-50/50 opacity-60 line-through' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-red-600">
                            {e.voucherNo}
                          </td>
                          <td className="py-3 px-3 text-muted-text font-mono">
                            {e.billDate
                              ? new Date(e.billDate).toLocaleDateString('mr-IN')
                              : new Date(e.date).toLocaleDateString('mr-IN')}
                          </td>
                          <td className="py-3 px-3 font-semibold text-main-text">
                            {e.purpose || e.title}
                            {isRev && e.reversalReason && (
                              <span className="block text-[10px] text-red-600 italic no-underline">
                                कारण: {e.reversalReason}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-muted-text">{e.category}</td>
                          <td className="py-3 px-3 font-medium text-main-text">{e.vendorName || '-'}</td>
                          <td className="py-3 px-3 font-mono">{e.billNumber || '-'}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] bg-light-green text-primary-green px-1.5 py-0.5 rounded border border-border-green">
                              {e.associatedFundId || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-red-600">
                            ₹{e.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={isRev ? 'orange' : 'green'} size="sm">
                              {isRev ? 'रद्द' : 'प्रमाणित'}
                            </Badge>
                          </td>
                          {isPrincipal && (
                            <td className="py-3 px-3 text-right">
                              {!isRev && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReversalTarget(e);
                                    setReversalReason('');
                                  }}
                                  className="text-[11px] text-red-600 hover:text-red-800 hover:underline font-semibold flex items-center gap-1 ml-auto"
                                  title="चूक दुरुस्त करा किंवा देयक रद्द करा"
                                >
                                  <RotateCcw className="w-3 h-3" /> रद्द करा
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD FUND MODAL (PRINCIPAL ONLY)                  */}
      {/* ========================================================= */}
      {isAddFundOpen && isPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-border-green shadow-2xl my-8 overflow-hidden">
            <div className="bg-dark-green text-white p-5 flex items-center justify-between border-b border-border-green">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-saffron-orange" />
                <div>
                  <h3 className="text-lg font-bold">नवीन शासकीय निधी नोंदवा (Add Government Fund)</h3>
                  <p className="text-xs text-white/80">प्राप्त अनुदान तपशील, ओळख क्रमांक व मुदत</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddFundOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFundSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main-text mb-1">
                  अनुदान योजना प्रकार (Fund Scheme / Type) *
                </label>
                <select
                  required
                  value={newFund.schemeType}
                  onChange={(e) => setNewFund({ ...newFund, schemeType: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                >
                  <option value="समग्र शिक्षा - समग्र शाळा अनुदान (Composite School Grant)">
                    समग्र शिक्षा - समग्र शाळा अनुदान (Composite School Grant)
                  </option>
                  <option value="पीएम-पोषण (मध्यान्ह भोजन) अनुदान (PM-POSHAN MDM Grant)">
                    पीएम-पोषण (मध्यान्ह भोजन) अनुदान (PM-POSHAN MDM Grant)
                  </option>
                  <option value="क्रीडा व शारीरिक शिक्षण साहित्य निधी (Sports & PE Grant)">
                    क्रीडा व शारीरिक शिक्षण साहित्य निधी (Sports & PE Grant)
                  </option>
                  <option value="डिजिटल क्लासरूम व आयसीटी अनुदान (ICT & Digital Grant)">
                    डिजिटल क्लासरूम व आयसीटी अनुदान (ICT & Digital Grant)
                  </option>
                  <option value="शालेय स्वच्छता व दुरुस्ती अनुदान (Sanitation & Maintenance)">
                    शालेय स्वच्छता व दुरुस्ती अनुदान (Sanitation & Maintenance)
                  </option>
                  <option value="वाचनालय व अध्ययन साहित्य निधी (Library & TLM Grant)">
                    वाचनालय व अध्ययन साहित्य निधी (Library & TLM Grant)
                  </option>
                  <option value="जिल्हा परिषद स्थानिक विकास निधी (ZP Local Development)">
                    जिल्हा परिषद स्थानिक विकास निधी (ZP Local Development)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    अनुदान ओळख क्र. (Unique Fund ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. FND-2026-005 किंवा SS-CSG-26"
                    value={newFund.fundId}
                    onChange={(e) => setNewFund({ ...newFund, fundId: e.target.value.toUpperCase() })}
                    className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    प्राप्त रक्कम (Amount Received in ₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="उदा. 75000"
                    value={newFund.amount}
                    onChange={(e) => setNewFund({ ...newFund, amount: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main-text mb-1">
                  वितरक प्राधिकरण (Issued By) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. जिल्हा परिषद जळगाव - शिक्षण विभाग"
                  value={newFund.issuedBy}
                  onChange={(e) => setNewFund({ ...newFund, issuedBy: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    मंजूर दिनांक (Issue Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newFund.issueDate}
                    onChange={(e) => setNewFund({ ...newFund, issueDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    वापर मुदत अंतिम दिनांक (Submission Deadline) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newFund.expiryDate}
                    onChange={(e) => setNewFund({ ...newFund, expiryDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main-text mb-1">
                  नोंद / मार्गदर्शक सूचना (Optional Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="शासकीय अध्यादेश क्रमांक किंवा विशेष अटी..."
                  value={newFund.notes}
                  onChange={(e) => setNewFund({ ...newFund, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                />
              </div>

              <div className="bg-[#F4F7F4] -mx-6 -mb-6 p-4 border-t border-border-green flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddFundOpen(false)}
                >
                  रद्द करा
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitLoading}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  निधी जमा नोंद करा (Record Fund)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD EXPENSE MODAL (PRINCIPAL ONLY)               */}
      {/* ========================================================= */}
      {isAddExpenseOpen && isPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-border-green shadow-2xl my-8 overflow-hidden">
            <div className="bg-dark-green text-white p-5 flex items-center justify-between border-b border-border-green">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-saffron-orange" />
                <div>
                  <h3 className="text-lg font-bold">नवीन खर्च नोंदवा (Record School Expense)</h3>
                  <p className="text-xs text-white/80">देयक पडताळणी व संबंधित अनुदानातून वजावट</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main-text mb-1">
                  संबंधित अनुदान (Associated Fund Scheme) *
                </label>
                <select
                  required
                  value={newExpense.associatedFundId}
                  onChange={(e) => setNewExpense({ ...newExpense, associatedFundId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white font-medium"
                >
                  {funds
                    .filter((f) => f.status !== 'Reversed')
                    .map((f) => {
                      const rem = f.remainingAmount ?? (f.amount - (f.utilizedAmount || 0));
                      return (
                        <option key={f.fundId} value={f.fundId}>
                          [{f.fundId}] {f.schemeType || f.title} — शिल्लक: ₹{rem.toLocaleString('en-IN')}
                        </option>
                      );
                    })}
                </select>
                {selectedFundForExpense && (
                  <p className="text-[11px] text-muted-text mt-1 flex justify-between">
                    <span>
                      एकूण मंजूर: ₹{selectedFundForExpense.amount.toLocaleString('en-IN')} | वापर: ₹
                      {(selectedFundForExpense.utilizedAmount || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="font-bold text-primary-green">
                      शिल्लक: ₹{selectedFundAvailable.toLocaleString('en-IN')}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-main-text mb-1">
                  खर्च उद्देश / तपशील (Purpose of Expense) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. पिण्याच्या पाण्याचे वॉटर फिल्टर मेन्टेनन्स व नवे मेम्ब्रेन"
                  value={newExpense.purpose}
                  onChange={(e) => setNewExpense({ ...newExpense, purpose: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    खर्च रक्कम (Amount in ₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="उदा. 4500"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 font-mono ${
                      isOverspending
                        ? 'border-red-500 text-red-600 focus:ring-red-500'
                        : 'border-border-green focus:ring-primary-green'
                    }`}
                  />
                  {isOverspending && (
                    <span className="text-[10px] text-red-600 font-bold block mt-1">
                      ⚠️ चेतावणी: अनुदानातील शिल्लक रक्कम (₹{selectedFundAvailable.toLocaleString('en-IN')}) पेक्षा जास्त खर्च करता येत नाही.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    खर्च प्रवर्ग (Expense Category) *
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white"
                  >
                    <option value="Maintenance & Repairs">दुरुस्ती व देखभाल (Maintenance)</option>
                    <option value="Educational Materials & Books">शैक्षणिक साहित्य व पुस्तके</option>
                    <option value="Sports Equipment">क्रीडा साहित्य (Sports)</option>
                    <option value="Digital Infrastructure">डिजिटल क्लासरूम व संगणक</option>
                    <option value="Health & Sanitation">आरोग्य, पाणी व स्वच्छता</option>
                    <option value="Mid-Day Meal Utilities">पोषण आहार स्वयंपाक भांडी</option>
                    <option value="Stationery & Administrative">लेखन सामग्री व कार्यालयीन खर्च</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    देयक / बिल क्रमांक (Bill / Invoice No) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. INV-2026-401 किंवा BILL-891"
                    value={newExpense.billNumber}
                    onChange={(e) => setNewExpense({ ...newExpense, billNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    विक्रेता / फर्मचे नाव (Vendor / Shop Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. पाटील हार्डवेअर व पेंट्स, धरणगाव"
                    value={newExpense.vendorName}
                    onChange={(e) => setNewExpense({ ...newExpense, vendorName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    बिल दिनांक (Bill Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpense.billDate}
                    onChange={(e) => setNewExpense({ ...newExpense, billDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main-text mb-1">
                    बिल संलग्नक संदर्भ (Bill Attachment Note)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. बिल फाईल क्रमांक ४, पान क्र. १२"
                    value={newExpense.billAttachment}
                    onChange={(e) => setNewExpense({ ...newExpense, billAttachment: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main-text mb-1">
                  शेरा / विशेष नोंद (Optional Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="शाळा व्यवस्थापन समिती मंजुरी ठराव क्रमांक..."
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                />
              </div>

              <div className="bg-[#F4F7F4] -mx-6 -mb-6 p-4 border-t border-border-green flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddExpenseOpen(false)}
                >
                  रद्द करा
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isOverspending}
                  isLoading={submitLoading}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  खर्च मंजूर व नोंद करा (Approve Expense)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CONTROLLED REVERSAL MODAL (PRINCIPAL ONLY)       */}
      {/* ========================================================= */}
      {reversalTarget && isPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold text-main-text">व्यवहार रद्द / दुरुस्त करा (Controlled Reversal)</h3>
            </div>

            <p className="text-xs text-muted-text">
              व्हाउचर <strong className="font-mono text-red-600">{reversalTarget.voucherNo}</strong> (रक्कम ₹{reversalTarget.amount.toLocaleString('en-IN')}) रद्द केल्यास संबंधित अनुदानातील शिल्लक आपोआप पूर्ववत केली जाईल. ऑडिट ट्रेलसाठी रद्द करण्याचे कारण नोंदवणे अनिवार्य आहे.
            </p>

            <form onSubmit={handleReversalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main-text mb-1">
                  रद्द करण्याचे अधिकृत कारण (Official Reason) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="उदा. विक्रेत्याने दिलेले देयक रद्द केले / नजरचुकीने नोंद झाली..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-border-green rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReversalTarget(null)}
                >
                  मागे जा
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  निश्चितपणे रद्द करा (Confirm Reversal)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: FUND TRANSACTION HISTORY MODAL                   */}
      {/* ========================================================= */}
      {selectedFundHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-border-green shadow-2xl overflow-hidden">
            <div className="bg-dark-green text-white p-5 flex items-center justify-between border-b border-border-green">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-saffron-orange px-2 py-0.5 rounded text-white">
                    {selectedFundHistory.fundId}
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedFundHistory.schemeType}</h3>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  एकूण मंजूर: ₹{selectedFundHistory.amount.toLocaleString('en-IN')} | वापर: ₹
                  {(selectedFundHistory.utilizedAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedFundHistory(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              <h4 className="text-xs font-bold text-primary-green uppercase tracking-wider">
                या अनुदानातून झालेले सर्व खर्च (Debited Expenses History)
              </h4>

              {(!selectedFundHistory.transactionHistory || selectedFundHistory.transactionHistory.length === 0) ? (
                <p className="text-xs text-muted-text text-center py-6">
                  या अनुदानातून अद्याप कोणताही खर्च झालेला नाही.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedFundHistory.transactionHistory.map((exp: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 bg-light-green/40 border border-border-green rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-red-600">{exp.voucherNo}</span>
                          <span className="font-semibold text-main-text">{exp.purpose || exp.title}</span>
                        </div>
                        <p className="text-[11px] text-muted-text mt-0.5">
                          बिल क्र: {exp.billNumber || '-'} | विक्रेता: {exp.vendorName || '-'} | दिनांक:{' '}
                          {exp.date ? new Date(exp.date).toLocaleDateString('mr-IN') : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-red-600 text-sm">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#F4F7F4] p-4 border-t border-border-green flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedFundHistory(null)}>
                बंद करा
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancesPage;
