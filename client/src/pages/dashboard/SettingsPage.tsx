import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LANGUAGE_OPTIONS } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  HeartPulse,
  MapPin,
  Calendar,
  Save,
  ShieldAlert,
  Globe,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, isPrincipal, isTeacher, changePassword } = useAuth();
  const { language, setLanguage, tBilingual, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Full user profile metadata from API
  const [profileData, setProfileData] = useState<any>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Load My Profile from API
  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await api.get('/portal/my-profile');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setProfileData(d);
        setFullName(d.name || '');
        setPhone(d.phone || '');
        if (d.dateOfBirth) {
          const dt = new Date(d.dateOfBirth);
          if (!isNaN(dt.getTime())) {
            setDateOfBirth(dt.toISOString().split('T')[0]);
          }
        }
        setAddress(d.residentialAddress || '');
        setBloodGroup(d.bloodGroup || 'B+');
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    // Validation
    if (!fullName.trim()) {
      setProfileError(tBilingual('कृपया आपले पूर्ण नाव टाकावे.', 'Please enter your full name.'));
      return;
    }

    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setProfileError(tBilingual('कृपया वैध १० अंकी मोबाईल क्रमांक टाकावा (उदा. 9823456789).', 'Please enter a valid 10-digit mobile number.'));
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.put('/portal/my-profile', {
        name: fullName.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth || undefined,
        residentialAddress: address.trim(),
        bloodGroup,
      });

      if (res.data?.success) {
        setProfileSuccess(tBilingual('आपली प्रोफाइल माहिती यशस्वीरीत्या अद्ययावत केली गेली आहे!', 'Your profile information has been updated successfully!'));
        setProfileData(res.data.data);
        setTimeout(() => setProfileSuccess(null), 5000);
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || tBilingual('प्रोफाइल अद्ययावत करताना त्रुटी आली.', 'Error updating profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    setPwdError(null);

    if (newPassword.length < 8) {
      setPwdError(tBilingual('नवीन पासवर्ड किमान ८ अक्षरांचा असावा.', 'New password must be at least 8 characters long.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError(tBilingual('नवीन पासवर्ड आणि खात्री पासवर्ड जुळत नाहीत.', 'New password and confirm password do not match.'));
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwdMessage(tBilingual('पासवर्ड यशस्वीरीत्या बदलण्यात आला आहे!', 'Password has been changed successfully!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdMessage(null), 4000);
    } catch (err: any) {
      setPwdError(err.message || tBilingual('पासवर्ड बदलताना त्रुटी आली.', 'Failed to change password.'));
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary-green dark:text-emerald-400 uppercase tracking-wider">
            {tBilingual('कर्मचारी खाते', 'Staff Account')}
          </span>
          <span className="text-muted-text dark:text-dark-muted">•</span>
          <span className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual('माझे प्रोफाइल', 'My Profile')}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-main-text dark:text-dark-text mt-1 flex items-center gap-2">
          <User className="w-6 h-6 text-primary-green dark:text-saffron-orange" />
          {tBilingual('माझे प्रोफाइल व खाते सेटिंग्ज', 'My Profile & Account Settings')}
        </h2>
        <p className="text-xs text-muted-text dark:text-dark-muted">
          {tBilingual(
            'आपली वैयक्तिक माहिती, संपर्क तपशील, भाषा, रंगसंगती आणि सुरक्षा पासवर्ड व्यवस्थापित करा.',
            'Manage personal credentials, contact records, system language, theme appearance, and security password.'
          )}
        </p>
      </div>

      {/* Language & Appearance Preferences Card */}
      <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border-green dark:border-dark-border">
          <Globe className="w-4 h-4 text-primary-green dark:text-saffron-orange" />
          <h3 className="text-base font-bold text-main-text dark:text-dark-text">
            {tBilingual('भाषा व रंगसंगती प्राधान्ये', 'Language & Appearance Preferences')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Language Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-main-text dark:text-dark-text">
              {tBilingual('प्रणाली भाषा (Application Language):', 'Application Language:')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguage(opt.id)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-center border ${
                    language === opt.id
                      ? 'bg-primary-green text-white border-primary-green shadow'
                      : 'bg-light-green dark:bg-dark-secondary text-main-text dark:text-dark-text border-border-green dark:border-dark-border hover:bg-light-green-hover dark:hover:bg-[#25382D]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-text dark:text-dark-muted">
              {language === 'mr'
                ? 'संपूर्ण प्रणाली शुद्ध मराठी भाषेत प्रदर्शित होत आहे.'
                : language === 'en'
                ? 'Application is currently displayed in English.'
                : 'मराठी व इंग्रजी दोन्ही भाषांमध्ये एकाच वेळी माहिती दर्शवली जाईल.'}
            </p>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-main-text dark:text-dark-text">
              {tBilingual('रंगसंगती (Theme Mode):', 'Appearance Theme:')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                  theme === 'light'
                    ? 'bg-primary-green text-white border-primary-green shadow'
                    : 'bg-light-green dark:bg-dark-secondary text-main-text dark:text-dark-text border-border-green dark:border-dark-border hover:bg-light-green-hover dark:hover:bg-[#25382D]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{tBilingual('लाइट', 'Light')}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                  theme === 'dark'
                    ? 'bg-primary-green text-white border-primary-green shadow'
                    : 'bg-light-green dark:bg-dark-secondary text-main-text dark:text-dark-text border-border-green dark:border-dark-border hover:bg-light-green-hover dark:hover:bg-[#25382D]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{tBilingual('डार्क', 'Dark')}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                  theme === 'system'
                    ? 'bg-primary-green text-white border-primary-green shadow'
                    : 'bg-light-green dark:bg-dark-secondary text-main-text dark:text-dark-text border-border-green dark:border-dark-border hover:bg-light-green-hover dark:hover:bg-[#25382D]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{tBilingual('सिस्टम', 'System')}</span>
              </button>
            </div>
            <p className="text-[11px] text-muted-text dark:text-dark-muted">
              {tBilingual(
                'पसंतीची रंगसंगती आपोआप सेव्ह होते आणि पुढील वेळीही लागू राहते.',
                'Theme selection is automatically stored in browser storage.'
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Staff Identity Card */}
      <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl text-white font-black text-2xl flex items-center justify-center shadow-md ${
                isPrincipal ? 'bg-saffron-orange' : 'bg-primary-green'
              }`}
            >
              {fullName ? fullName.charAt(0) : user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-main-text dark:text-dark-text">{fullName || user?.name}</h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider text-white ${
                    isPrincipal ? 'bg-saffron-orange' : 'bg-primary-green'
                  }`}
                >
                  {profileData?.role || user?.role}
                </span>
              </div>
              <p className="text-xs text-muted-text dark:text-dark-muted">{profileData?.designation || user?.designation}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-primary-green dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{tBilingual('अधिकृत व सक्रिय कर्मचारी', 'Active Verified Staff Member')}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-muted-text dark:text-dark-muted block">
              {tBilingual('खाते प्रकार:', 'Account Role:')}
            </span>
            <Badge variant={isPrincipal ? 'orange' : 'green'} size="sm">
              {isPrincipal ? tBilingual('प्रशासक', 'Principal / Administrator') : tBilingual('शिक्षक', 'Authorized Educator')}
            </Badge>
          </div>
        </div>

        {/* Read-Only Account Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-4 border-t border-border-green dark:border-dark-border">
          <div>
            <span className="font-semibold text-muted-text dark:text-dark-muted block">
              {tBilingual('ईमेल पत्ता:', 'Official Email:')}
            </span>
            <span className="text-main-text dark:text-dark-text font-medium">{profileData?.email || user?.email}</span>
          </div>

          <div>
            <span className="font-semibold text-muted-text dark:text-dark-muted block">
              {tBilingual('युझरनेम:', 'Username:')}
            </span>
            <span className="text-main-text dark:text-dark-text font-mono font-semibold">@{profileData?.username || user?.username}</span>
          </div>

          <div>
            <span className="font-semibold text-muted-text dark:text-dark-muted block">
              {tBilingual('शाळेचे नाव:', 'School Name:')}
            </span>
            <span className="text-main-text dark:text-dark-text font-medium">
              {tBilingual('जि. प. प्राथमिक शाळा हिंगोणे बु.', 'ZP Primary School Hingone BK')}
            </span>
          </div>

          <div>
            <span className="font-semibold text-muted-text dark:text-dark-muted block">
              {tBilingual('युडायस कोड (UDISE):', 'UDISE Code:')}
            </span>
            <span className="text-main-text dark:text-dark-text font-mono font-medium">27030804501</span>
          </div>

          <div className="sm:col-span-2">
            <span className="font-semibold text-muted-text dark:text-dark-muted block">
              {tBilingual('अधिकार मर्यादा:', 'Permissions Scope:')}
            </span>
            <span className="text-main-text dark:text-dark-text font-medium">
              {isPrincipal
                ? tBilingual('सर्व प्रशासकीय अधिकार, निधी, पदोन्नती, संकेतस्थळ नियंत्रण', 'Full Administrative, Ledger, Promotion, and Portal Access')
                : tBilingual('अध्यापन, अधिकृत वर्ग विद्यार्थी पाहणे व प्रमाणपत्र शिफारस', 'Teacher Scoped Access: Student Roster and Certificate Requests')}
            </span>
          </div>
        </div>

        {/* Service Profile for Teachers */}
        {profileData?.teacherProfile && (
          <div className="pt-4 border-t border-border-green dark:border-dark-border space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary-green dark:text-saffron-orange" />
              <h4 className="text-xs font-bold text-main-text dark:text-dark-text uppercase tracking-wider">
                {tBilingual('सेवा व शैक्षणिक तपशील', 'Service Profile')}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-light-green/60 dark:bg-dark-secondary p-3.5 rounded-xl border border-border-green dark:border-dark-border text-xs">
              <div>
                <span className="text-muted-text dark:text-dark-muted block text-[11px]">
                  {tBilingual('सेवाार्थ आयडी:', 'Employee ID:')}
                </span>
                <span className="font-mono font-bold text-main-text dark:text-dark-text">
                  {profileData.teacherProfile.employeeId || 'SEV-2015-0812'}
                </span>
              </div>
              <div>
                <span className="text-muted-text dark:text-dark-muted block text-[11px]">
                  {tBilingual('शैक्षणिक पात्रता:', 'Qualification:')}
                </span>
                <span className="font-medium text-main-text dark:text-dark-text">
                  {profileData.teacherProfile.qualification || 'M.A., D.Ed.'}
                </span>
              </div>
              <div>
                <span className="text-muted-text dark:text-dark-muted block text-[11px]">
                  {tBilingual('अध्यापन वर्ग:', 'Assigned Classes:')}
                </span>
                <span className="font-semibold text-primary-green dark:text-emerald-400">
                  {profileData.teacherProfile.assignedClasses?.join(', ') || 'इयत्ता १ ली, २ री'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* A. My Profile Edit Form */}
      <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-primary-green dark:text-saffron-orange" />
            <div>
              <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                {tBilingual('वैयक्तिक माहिती संपादन', 'Edit Profile Details')}
              </h3>
              <p className="text-xs text-muted-text dark:text-dark-muted">
                {tBilingual('नाव, मोबाईल, जन्मतारीख, पत्ता आणि रक्तगट अद्ययावत करा.', 'Update contact information, date of birth, address, and blood group.')}
              </p>
            </div>
          </div>
          <Badge variant="green" size="sm">
            {tBilingual('प्रमाणित संपादन', 'Official Profile')}
          </Badge>
        </div>

        {/* Security Warning Notice */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs rounded-xl flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{tBilingual('सुरक्षा नियम व निर्बंध: ', 'Security Policy: ')}</span>
            <span>
              {tBilingual(
                'कोणताही कर्मचारी किंवा मुख्याध्यापक प्रोफाइल फॉर्मद्वारे स्वतःचा रोल किंवा परवानग्या बदलू शकत नाही. केवळ अनुमत वैयक्तिक तपशील अद्ययावत करता येतील.',
                'Staff cannot alter administrative roles or elevated permissions through this profile form. Only authorized personal contact information can be edited.'
              )}
            </span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {profileSuccess && (
          <div className="p-3 bg-[#E2EFE7] dark:bg-emerald-950/40 border border-primary-green/30 dark:border-emerald-700 text-primary-green dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span className="font-medium">{profileError}</span>
          </div>
        )}

        {/* My Profile Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* 1. Full Name */}
            <div>
              <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                {tBilingual('पूर्ण नाव', 'Full Name')} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tBilingual('उदा. श्री. एस. आर. पाटील', 'e.g. Mr. S. R. Patil')}
                className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green text-xs bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text"
              />
            </div>

            {/* 2. Phone Number */}
            <div>
              <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                {tBilingual('मोबाईल क्रमांक', 'Mobile Phone Number')} *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={tBilingual('१० अंकी मोबाईल क्र.', '10-digit mobile number')}
                className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green text-xs bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text"
              />
            </div>

            {/* 3. Date of Birth with Calendar Picker */}
            <div>
              <label className="block font-bold text-main-text dark:text-dark-text mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-green dark:text-saffron-orange" />
                {tBilingual('जन्मतारीख', 'Date of Birth')} *
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green text-xs bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text"
              />
            </div>

            {/* 4. Blood Group Dropdown */}
            <div>
              <label className="block font-bold text-main-text dark:text-dark-text mb-1 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-saffron-orange" />
                {tBilingual('रक्तगट', 'Blood Group')} *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green text-xs bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="Unknown">{tBilingual('माहित नाही', 'Unknown')}</option>
              </select>
            </div>

            {/* 5. Address */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-main-text dark:text-dark-text mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-green dark:text-saffron-orange" />
                {tBilingual('निवासी पत्ता', 'Residential Address')} *
              </label>
              <textarea
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={tBilingual('घर क्र., कॉलनी / गल्ली, गाव, तालुका, जिल्हा व पिनकोड...', 'House no., street, village, taluka, district, and pincode...')}
                className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green text-xs bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text"
              />
            </div>
          </div>

          {/* 6. Save Changes Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingProfile}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              {tBilingual('बदल जतन करा', 'Save Changes')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Password Change */}
      <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border-green dark:border-dark-border">
          <KeyRound className="w-4 h-4 text-saffron-orange" />
          <h3 className="text-base font-bold text-main-text dark:text-dark-text">
            {tBilingual('सुरक्षा व पासवर्ड व्यवस्थापन', 'Security & Password Management')}
          </h3>
        </div>

        {pwdMessage && (
          <div className="p-3 bg-[#E2EFE7] dark:bg-emerald-950/40 border border-primary-green/30 dark:border-emerald-700 text-primary-green dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{pwdMessage}</span>
          </div>
        )}

        {pwdError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span className="font-medium">{pwdError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-main-text dark:text-dark-text mb-1">
              {tBilingual('सध्याचा पासवर्ड', 'Current Password')} *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={tBilingual('सध्याचा पासवर्ड टाका', 'Enter current password')}
              className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-main-text dark:text-dark-text mb-1">
              {tBilingual('नवीन पासवर्ड (किमान ८ अक्षरे)', 'New Password (min 8 characters)')} *
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={tBilingual('किमान ८ अक्षरे (इंग्रजी, अंक व चिन्ह)', 'Min 8 chars (letters, digits, symbol)')}
              className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-main-text dark:text-dark-text mb-1">
              {tBilingual('नवीन पासवर्ड खात्री करा', 'Confirm New Password')} *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={tBilingual('पुन्हा तोच नवीन पासवर्ड टाका', 'Re-enter same new password')}
              className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green bg-white dark:bg-dark-secondary text-main-text dark:text-dark-text"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={pwdLoading}
            leftIcon={<KeyRound className="w-3.5 h-3.5" />}
          >
            {tBilingual('पासवर्ड अपडेट करा', 'Update Password')}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default SettingsPage;
