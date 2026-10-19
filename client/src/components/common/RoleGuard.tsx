import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from './Button';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { user, loading, hasPermission } = useAuth();
  const { tBilingual } = useLanguage();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleAllowed = !allowedRoles || allowedRoles.includes(user.role);
  const permissionAllowed = !requiredPermission || hasPermission(requiredPermission);

  if (!roleAllowed || !permissionAllowed) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-1 rounded-full uppercase tracking-wider">
            {tBilingual('त्रुटी ४०३ - प्रवेश मर्यादित', 'Error 403 - Forbidden')}
          </span>
          <h2 className="text-2xl font-black text-main-text dark:text-dark-text tracking-tight pt-2">
            {tBilingual('या विभागासाठी आपणास परवानगी नाही', 'You do not have permission to access this section')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-text dark:text-dark-muted max-w-md mx-auto leading-relaxed">
            {tBilingual(
              'हा विभाग केवळ मुख्याध्यापक यांच्यासाठी राखीव आहे. प्राथमिक शिक्षकांना निधी व्यवस्थापन, प्रमाणपत्र मंजुरी, प्रवेश मंजुरी व पदोन्नतीचे अधिकार मर्यादित आहेत.',
              'This section is strictly reserved for the Principal. Teacher permissions for finances, certificates, admissions and promotions are restricted.'
            )}
          </p>
        </div>

        <div className="p-4 bg-light-green dark:bg-dark-card border border-border-green dark:border-dark-border rounded-xl text-left text-xs space-y-1.5 max-w-md mx-auto">
          <div className="flex justify-between text-muted-text dark:text-dark-muted">
            <span>{tBilingual('आपली वर्तमान भूमिका:', 'Your Current Role:')}</span>
            <span className="font-bold text-primary-green dark:text-emerald-400 uppercase font-mono">{user.role}</span>
          </div>
          <div className="flex justify-between text-muted-text dark:text-dark-muted">
            <span>{tBilingual('कर्मचारी नाव:', 'Staff Name:')}</span>
            <span className="font-semibold text-main-text dark:text-dark-text">{user.name}</span>
          </div>
          <div className="flex justify-between text-muted-text dark:text-dark-muted">
            <span>{tBilingual('आवश्यक भूमिका:', 'Required Role:')}</span>
            <span className="font-bold text-saffron-orange uppercase font-mono">
              {allowedRoles?.join(', ') || 'principal'}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <Link to="/dashboard">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              {tBilingual('माझ्या अधिकृत डॅशबोर्डवर परत जा', 'Back to My Dashboard')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
