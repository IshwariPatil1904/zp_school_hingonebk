import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  Lock,
  User,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  UserCheck,
  GraduationCap,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { t, tBilingual } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email/username or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoId: string, demoPass: string) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] bg-light-green/50 dark:bg-[#111827] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-green dark:text-saffron-orange hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {tBilingual('मुख्य संकेतस्थळावर परत जा', 'Back to Home')}
        </Link>

        {/* Card Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-saffron-orange flex flex-col items-center justify-center text-white font-black shadow-lg mx-auto">
            <span className="text-[10px] leading-none text-white/90">जि. प.</span>
            <span className="text-base leading-none mt-0.5">ZP</span>
          </div>
          <h2 className="text-2xl font-extrabold text-main-text dark:text-dark-text tracking-tight">
            {tBilingual('शालेय कर्मचारी व शिक्षक लॉगिन', 'Authorized Staff Login')}
          </h2>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual('जि. प. प्राथमिक शाळा हिंगोणे बु. • प्रशासकीय पोर्टल', 'Zilla Parishad Primary School Hingone BK • RBAC Portal')}
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="bg-white dark:bg-[#1F2937] border border-border-green dark:border-[#374151] p-6 sm:p-8 shadow-card space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                {tBilingual('ईमेल किंवा युझरनेम', 'Email or Username')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-text dark:text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="principal@zphingone.edu.in / teacher.pawar"
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-border-green dark:border-[#374151] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green text-main-text dark:text-dark-text bg-white dark:bg-[#111827]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-main-text dark:text-dark-text">
                  {tBilingual('पासवर्ड', 'Password')}
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-muted-text dark:text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-border-green dark:border-[#374151] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green text-main-text dark:text-dark-text bg-white dark:bg-[#111827]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-bold shadow-md"
              isLoading={loading}
              rightIcon={<Lock className="w-4 h-4" />}
            >
              {tBilingual('लॉगिन करा', 'Sign In')}
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-border-green dark:border-[#374151] space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-text dark:text-dark-muted uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-primary-green dark:text-saffron-orange" />
              <span>{tBilingual('भूमिका चाचणीसाठी त्वरित लॉगिन', 'Demo Credentials for Assessment')}:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('principal@zphingone.edu.in', 'Principal@123')}
                className="p-2.5 text-left rounded-lg border border-saffron-orange/40 bg-saffron-light dark:bg-[#18251F] hover:bg-[#FFE8CC] dark:hover:bg-[#1F2937] transition-colors group"
              >
                <div className="font-bold text-main-text dark:text-dark-text text-xs flex items-center justify-between">
                  <span>{tBilingual('मुख्याध्यापक', 'Principal')}</span>
                  <span className="text-[10px] bg-saffron-orange text-white px-1.5 py-0.2 rounded font-mono">
                    principal
                  </span>
                </div>
                <div className="text-[10px] text-muted-text dark:text-dark-muted truncate mt-0.5">principal@zphingone.edu.in</div>
                <div className="text-[10px] text-primary-green dark:text-emerald-400 font-semibold mt-1">
                  {tBilingual('पूर्ण प्रशासकीय अधिकार', 'Full Administrative')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('teacher.pawar@zphingone.edu.in', 'Teacher@123')}
                className="p-2.5 text-left rounded-lg border border-primary-green/30 dark:border-emerald-500/30 bg-[#E2EFE7]/50 dark:bg-[#14251C] hover:bg-[#E2EFE7] dark:hover:bg-[#1F2937] transition-colors group"
              >
                <div className="font-bold text-main-text dark:text-dark-text text-xs flex items-center justify-between">
                  <span>{tBilingual('प्राथमिक शिक्षक', 'Teacher')}</span>
                  <span className="text-[10px] bg-primary-green text-white px-1.5 py-0.2 rounded font-mono">
                    teacher
                  </span>
                </div>
                <div className="text-[10px] text-muted-text dark:text-dark-muted truncate mt-0.5">teacher.pawar</div>
                <div className="text-[10px] text-muted-text dark:text-dark-muted font-semibold mt-1">
                  {tBilingual('अध्यापन व वर्ग हजेरी', 'Teaching & Attendance')}
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-text dark:text-dark-muted">
          <ShieldCheck className="w-4 h-4 text-primary-green dark:text-emerald-400" />
          <span>{tBilingual('सुरक्षित HTTP-Only कुकीज, CSRF टोकन व रेट-लिमिटिंग द्वारे संरक्षित', 'Protected by Secure HTTP-Only Cookies, CSRF tokens & Rate Limiting')}</span>
        </div>
      </div>
    </div>
  );
};
