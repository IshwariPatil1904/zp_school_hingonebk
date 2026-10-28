import React, { useEffect, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api, getCookie } from '../../lib/api';
import {
  Globe,
  School,
  UserCheck,
  BookOpen,
  Users,
  Bell,
  Image as ImageIcon,
  Award,
  FileCheck2,
  FolderOpen,
  History,
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Calendar,
  Lock,
  Layers,
} from 'lucide-react';

type CmsTab =
  | 'school-info'
  | 'principal-message'
  | 'academics'
  | 'teachers'
  | 'notices'
  | 'gallery'
  | 'scholarships'
  | 'admissions'
  | 'media'
  | 'audit';

export const WebsiteManagePage: React.FC = () => {
  const { isPrincipal } = useAuth();
  const { language, tBilingual, formatNumber, formatDate } = useLanguage();
  const [activeTab, setActiveTab] = useState<CmsTab>('school-info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Full CMS Data
  const [cmsConfig, setCmsConfig] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // 1. School Info State
  const [schoolInfo, setSchoolInfo] = useState<any>({
    name: '',
    marathiName: '',
    udiseCode: '',
    logoUrl: '/imgs/school1.jpg',
    establishedYear: '1962',
    management: '',
    address: '',
    phone: '',
    email: '',
    timings: '',
    introduction: '',
    vision: '',
    mission: '',
    facilities: [] as string[],
    quickFacts: [] as { label: string; value: string }[],
  });
  const [newFacility, setNewFacility] = useState('');
  const [newFactLabel, setNewFactLabel] = useState('');
  const [newFactValue, setNewFactValue] = useState('');

  // 2. Principal Message State
  const [principalMsg, setPrincipalMsg] = useState({
    displayName: '',
    designation: '',
    qualification: '',
    photo: '/imgs/principal.jpeg',
    message: '',
  });

  // 3. Academics State
  const [academics, setAcademics] = useState<any>({
    availableClasses: [] as string[],
    mediumOfInstruction: '',
    academicDetails: '',
    textbookLinks: [] as { standard: string; subject: string; balbharatiUrl: string }[],
  });
  const [newTbStandard, setNewTbStandard] = useState('');
  const [newTbSubject, setNewTbSubject] = useState('');
  const [newTbUrl, setNewTbUrl] = useState('');

  // 4. Admissions State
  const [admissionsConfig, setAdmissionsConfig] = useState<any>({
    isFormOpen: true,
    academicYear: '2026-2027',
    processDescription: '',
    requiredDocuments: [] as string[],
    startDate: '',
    endDate: '',
  });
  const [newDocRequirement, setNewDocRequirement] = useState('');

  // 5. Notices CMS State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('GENERAL');
  const [noticeIsImportant, setNoticeIsImportant] = useState(false);
  const [noticeIsActive, setNoticeIsActive] = useState(true);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);

  // 6. Gallery CMS State
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumMarathiTitle, setAlbumMarathiTitle] = useState('');
  const [albumCategory, setAlbumCategory] = useState('उपक्रम');
  const [albumYear, setAlbumYear] = useState('2026-27');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumCoverImage, setAlbumCoverImage] = useState('/imgs/playground.jpg');
  const [albumImagesText, setAlbumImagesText] = useState('');
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);

  // 7. Media Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('gallery');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBase64, setUploadBase64] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Load Complete CMS Data
  const loadCmsData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portal/website/config');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setCmsConfig(d.config);
        setNotices(d.notices || []);
        setAlbums(d.albums || []);
        setScholarships(d.scholarships || []);
        setTeachers(d.teachers || []);
        setStats(d.stats || {});

        if (d.config?.schoolInfo) {
          setSchoolInfo(d.config.schoolInfo);
        }
        if (d.config?.principalMessage) {
          setPrincipalMsg(d.config.principalMessage);
        }
        if (d.config?.academics) {
          setAcademics(d.config.academics);
        }
        if (d.config?.admissionsConfig) {
          const adm = d.config.admissionsConfig;
          setAdmissionsConfig({
            ...adm,
            startDate: adm.startDate ? new Date(adm.startDate).toISOString().split('T')[0] : '',
            endDate: adm.endDate ? new Date(adm.endDate).toISOString().split('T')[0] : '',
          });
        }
      }

      // Load Media & Audit Logs in parallel
      const [mediaRes, auditRes] = await Promise.all([
        api.get('/portal/website/media'),
        api.get('/portal/website/audit-logs'),
      ]);

      if (mediaRes.data?.success) setMediaAssets(mediaRes.data.data || []);
      if (auditRes.data?.success) setAuditLogs(auditRes.data.data || []);
    } catch (err: any) {
      console.error('Error fetching CMS config:', err);
      showFeedback('error', err.response?.data?.message || 'CMS डेटा लोड करताना त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPrincipal) {
      loadCmsData();
    }
  }, [isPrincipal]);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 1. Save School Info
  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/portal/website/school-info', schoolInfo);
      if (res.data?.success) {
        showFeedback('success', 'शाळेची माहिती व सोयी-सुविधा सार्वजनिक संकेतस्थळावर यशस्वीरीत्या अद्ययावत झाल्या!');
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'माहिती अद्ययावत करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  // 2. Save Principal Message
  const handleSavePrincipalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/portal/website/principal-message', principalMsg);
      if (res.data?.success) {
        showFeedback('success', 'मुख्याध्यापक संदेश व छायाचित्र सार्वजनिक संकेतस्थळावर अद्ययावत झाले!');
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'संदेश अद्ययावत करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Save Academics
  const handleSaveAcademics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/portal/website/academics', academics);
      if (res.data?.success) {
        showFeedback('success', 'शैक्षणिक अभ्यासक्रम व पाठ्यपुस्तके लिंक सार्वजनिक संकेतस्थळावर अद्ययावत झाली!');
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'अभ्यासक्रम अद्ययावत करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  // 4. Save Admissions Config
  const handleSaveAdmissions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/portal/website/admissions', admissionsConfig);
      if (res.data?.success) {
        showFeedback('success', 'प्रवेश प्रक्रिया, आवश्यक कागदपत्रे व वेळापत्रक अद्ययावत झाले!');
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'प्रवेश माहिती अद्ययावत करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  // 5. Notices Management
  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      showFeedback('error', 'कृपया शीर्षक व मजकूर टाकावा.');
      return;
    }

    setSaving(true);
    try {
      if (editingNoticeId) {
        await api.put(`/portal/website/notices/${editingNoticeId}`, {
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          category: noticeCategory,
          isImportant: noticeIsImportant,
          isActive: noticeIsActive,
        });
        showFeedback('success', 'परिपत्रक यशस्वीरीत्या अद्ययावत केले!');
      } else {
        await api.post('/portal/website/notices', {
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          category: noticeCategory,
          isImportant: noticeIsImportant,
          isActive: noticeIsActive,
        });
        showFeedback('success', 'नवीन परिपत्रक यशस्वीरीत्या तयार केले!');
      }
      setNoticeTitle('');
      setNoticeContent('');
      setEditingNoticeId(null);
      loadCmsData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'परिपत्रक जतन करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNoticeStatus = async (notice: any) => {
    try {
      await api.put(`/portal/website/notices/${notice._id}`, {
        isActive: !notice.isActive,
      });
      showFeedback('success', `परिपत्रक '${notice.title}' स्थिती बदलली.`);
      loadCmsData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'स्थिती बदलताना त्रुटी.');
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('आपण हे परिपत्रक निश्चितपणे हटवू/संग्रहित करू इच्छिता?')) return;
    try {
      await api.delete(`/portal/website/notices/${id}`);
      showFeedback('success', 'परिपत्रक यशस्वीरीत्या काढून टाकले.');
      loadCmsData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'हटवताना त्रुटी.');
    }
  };

  // 6. Gallery Management
  const handleAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim() || !albumCoverImage.trim()) {
      showFeedback('error', 'कृपया अल्बम शीर्षक व कव्हर फोटो टाकावा.');
      return;
    }

    const imagesArray = albumImagesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (editingAlbumId) {
        await api.put(`/portal/website/gallery/${editingAlbumId}`, {
          title: albumTitle.trim(),
          marathiTitle: albumMarathiTitle.trim() || albumTitle.trim(),
          category: albumCategory,
          year: albumYear,
          description: albumDescription.trim(),
          coverImage: albumCoverImage.trim(),
          images: imagesArray,
        });
        showFeedback('success', 'छायाचित्र अल्बम यशस्वीरीत्या अद्ययावत केला!');
      } else {
        await api.post('/portal/website/gallery', {
          title: albumTitle.trim(),
          marathiTitle: albumMarathiTitle.trim() || albumTitle.trim(),
          category: albumCategory,
          year: albumYear,
          description: albumDescription.trim(),
          coverImage: albumCoverImage.trim(),
          images: imagesArray,
          isActive: true,
        });
        showFeedback('success', 'नवीन छायाचित्र अल्बम तयार केला!');
      }
      setAlbumTitle('');
      setAlbumMarathiTitle('');
      setAlbumDescription('');
      setAlbumImagesText('');
      setEditingAlbumId(null);
      loadCmsData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'अल्बम जतन करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAlbumStatus = async (album: any) => {
    try {
      await api.put(`/portal/website/gallery/${album._id}`, {
        isActive: !album.isActive,
      });
      showFeedback('success', `अल्बम स्थिती बदलली (${album.isActive ? 'अप्रकाशित' : 'प्रकाशित'}).`);
      loadCmsData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'स्थिती बदलताना त्रुटी.');
    }
  };

  // 7. Scholarships Visibility Toggle
  const handleToggleScholarship = async (scheme: any) => {
    try {
      await api.post(`/portal/website/scholarships/${scheme._id}/visibility`, {
        isPublic: !scheme.isPublic,
        isActive: scheme.isActive,
      });
      showFeedback('success', `शिष्यवृत्ती '${scheme.schemeName}' सार्वजनिक दृश्यता बदलली.`);
      loadCmsData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'दृश्यता बदलताना त्रुटी.');
    }
  };

  // 8. Teacher Public Profile Update
  const handleUpdateTeacherProfile = async (teacher: any, newPhoto: string, newExp: number) => {
    try {
      await api.put(`/portal/website/teachers/${teacher._id}`, {
        avatar: newPhoto,
        experienceYears: newExp,
      });
      showFeedback('success', `${teacher.name} यांचे सार्वजनिक प्रोफाइल अद्ययावत झाले.`);
      loadCmsData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'अद्ययावत करताना त्रुटी.');
    }
  };

  // 9. Media Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showFeedback('error', 'केवळ JPG, PNG किंवा WEBP छायाचित्र निवडावे.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('error', 'छायाचित्राचा आकार ५ MB पेक्षा कमी असावा.');
      return;
    }

    setUploadFile(file);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadBase64 || !uploadFile) {
      showFeedback('error', 'कृपया शीर्षक व वैध छायाचित्र फाईल निवडा.');
      return;
    }

    setUploading(true);
    try {
      let res;
      if (import.meta.env.DEV) {
        res = await api.post('/portal/website/media/upload', {
          title: uploadTitle.trim(),
          fileName: uploadFile.name,
          category: uploadCategory,
          mimeType: uploadFile.type,
          base64Data: uploadBase64,
        });
      } else {
        const safeFileName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const pathname = `school-photos/${Date.now()}_${safeFileName}`;
        const blob = await upload(pathname, uploadFile, {
          access: 'public',
          handleUploadUrl: '/api/portal/website/media/upload/token',
          clientPayload: JSON.stringify({
            title: uploadTitle.trim(),
            originalName: uploadFile.name,
            category: uploadCategory,
          }),
          headers: {
            'X-CSRF-Token': getCookie('csrfToken') || '',
          },
        });

        res = await api.post('/portal/website/media/upload/register', {
          pathname: blob.pathname,
          title: uploadTitle.trim(),
          originalName: uploadFile.name,
          category: uploadCategory,
        });
      }

      if (res.data?.success) {
        showFeedback('success', 'छायाचित्र यशस्वीरीत्या अपलोड व संचयित झाले!');
        setUploadTitle('');
        setUploadFile(null);
        setUploadBase64('');
        loadCmsData();
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'अपलोड अयशस्वी.');
    } finally {
      setUploading(false);
    }
  };

  // Strict RBAC Guard
  if (!isPrincipal) {
    return (
      <Card className="border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-6 text-red-800 dark:text-red-200 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h3 className="font-bold text-base">
            {tBilingual('सुरक्षा निर्बंध: केवळ मुख्याध्यापकांसाठी', 'Security Restriction: Principal Access Only')}
          </h3>
        </div>
        <p className="text-xs">
          {tBilingual(
            'सार्वजनिक संकेतस्थळ व्यवस्थापन (CMS), शाळा माहिती, मुख्याध्यापक संदेश व परिपत्रके प्रकाशित करण्याचे अधिकार केवळ शाळेच्या अधिकृत मुख्याध्यापकांना आहेत.',
            'Website CMS management, school profile, principal message and notice publication permissions are restricted to the school Principal.'
          )}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-green dark:border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-green uppercase tracking-wider">
              {tBilingual('सीएमएस स्टुडिओ', 'Website CMS')}
            </span>
            <span className="text-muted-text dark:text-dark-muted">•</span>
            <span className="text-xs text-muted-text dark:text-dark-muted">
              {tBilingual('सार्वजनिक संकेतस्थळ नियंत्रण केंद्र', 'Public Portal Control Center')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-main-text dark:text-dark-text mt-1 flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-primary-green" />
            {tBilingual('सार्वजनिक संकेतस्थळ व्यवस्थापन', 'Public Website Management')}
          </h2>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual(
              'शाळा माहिती, मुख्याध्यापक संदेश, अभ्यासक्रम, परिपत्रके, छायाचित्र दालन व प्रवेश प्रक्रिया व्यवस्थापित करा.',
              'Manage school info, principal message, academics, notices, photo gallery and admissions process.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-4 h-4 text-saffron-orange" />}>
              {tBilingual('थेट संकेतस्थळ उघडा', 'Live Site')}
            </Button>
          </a>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium shadow-sm ${
            feedback.type === 'success'
              ? 'bg-[#E2EFE7] dark:bg-emerald-950/40 border-primary-green/30 dark:border-emerald-800/40 text-primary-green dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* CMS Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-card p-3.5 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
          <span className="text-[11px] font-semibold text-muted-text dark:text-dark-muted block">
            {tBilingual('प्रकाशित परिपत्रके', 'Published Notices')}
          </span>
          <span className="text-xl font-black text-primary-green">
            {formatNumber(stats?.publishedNotices ?? notices.filter((n) => n.isActive).length)} / {formatNumber(notices.length)}
          </span>
        </div>
        <div className="bg-white dark:bg-dark-card p-3.5 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
          <span className="text-[11px] font-semibold text-muted-text dark:text-dark-muted block">
            {tBilingual('छायाचित्र अल्बम्स', 'Photo Albums')}
          </span>
          <span className="text-xl font-black text-saffron-orange">
            {formatNumber(stats?.publishedAlbums ?? albums.filter((a) => a.isActive).length)}
          </span>
        </div>
        <div className="bg-white dark:bg-dark-card p-3.5 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
          <span className="text-[11px] font-semibold text-muted-text dark:text-dark-muted block">
            {tBilingual('सार्वजनिक शिक्षक प्रोफाइल', 'Public Teacher Profiles')}
          </span>
          <span className="text-xl font-black text-primary-green">{formatNumber(teachers.length)}</span>
        </div>
        <div className="bg-white dark:bg-dark-card p-3.5 rounded-xl border border-border-green dark:border-dark-border shadow-sm">
          <span className="text-[11px] font-semibold text-muted-text dark:text-dark-muted block">
            {tBilingual('छायाचित्र भांडार', 'Media Assets')}
          </span>
          <span className="text-xl font-black text-main-text dark:text-dark-text">{formatNumber(mediaAssets.length)}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-border-green dark:border-dark-border text-xs scrollbar-none">
        <button
          onClick={() => setActiveTab('school-info')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'school-info'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <School className="w-3.5 h-3.5" />
          {tBilingual('शाळा माहिती', 'School Info')}
        </button>

        <button
          onClick={() => setActiveTab('principal-message')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'principal-message'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          {tBilingual('मुख्याध्यापक संदेश', 'Principal Message')}
        </button>

        <button
          onClick={() => setActiveTab('academics')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'academics'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          {tBilingual('अभ्यासक्रम व पाठ्यपुस्तके', 'Academics & Books')}
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'teachers'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          {tBilingual('शिक्षक प्रोफाइल', 'Teacher Profiles')}
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'notices'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          {tBilingual('सूचना व परिपत्रके', 'Notices & Circulars')}
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'gallery'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          {tBilingual('छायाचित्र दालन', 'Photo Gallery')}
        </button>

        <button
          onClick={() => setActiveTab('scholarships')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'scholarships'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          {tBilingual('शिष्यवृत्ती योजना', 'Scholarship Schemes')}
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'admissions'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          {tBilingual('प्रवेश प्रक्रिया', 'Admissions Setup')}
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'media'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          {tBilingual('छायाचित्र भांडार', 'Media Storage')}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold shrink-0 transition-colors ${
            activeTab === 'audit'
              ? 'bg-primary-green text-white shadow-sm'
              : 'text-muted-text dark:text-dark-muted hover:bg-light-green dark:hover:bg-dark-bg/60'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          {tBilingual('ऑडिट इतिहास', 'Audit Trail')}
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-muted-text dark:text-dark-muted flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary-green" />
          <span>{tBilingual('सीएमएस माहिती लोड होत आहे...', 'Loading CMS content...')}</span>
        </div>
      ) : (
        <>
          {/* TAB 1: SCHOOL INFO & FACILITIES */}
          {activeTab === 'school-info' && (
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                <div>
                  <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                    {tBilingual('शाळा सामान्य माहिती व सोयी-सुविधा', 'School Information & Facilities')}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual(
                      'सार्वजनिक संकेतस्थळावर दिसणारे नाव, लोगो, संपर्क, परिचय, सोयी-सुविधा आणि महत्त्वाचे तथ्य',
                      'Name, logo, contact, introduction, facilities, and quick facts displayed on the public website.'
                    )}
                  </p>
                </div>
                <Badge variant="green" size="sm">{tBilingual('शाळा प्रोफाइल', 'School Profile')}</Badge>
              </div>

              <form onSubmit={handleSaveSchoolInfo} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शाळेचे नाव (English) *', 'School Name (English) *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolInfo.name}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शाळेचे नाव (मराठी) *', 'School Name (Marathi) *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolInfo.marathiName}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, marathiName: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('युडायस कोड (UDISE Code) *', 'UDISE Code *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolInfo.udiseCode}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, udiseCode: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-mono focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शाळा लोगो URL', 'School Logo URL')}
                    </label>
                    <input
                      type="text"
                      value={schoolInfo.logoUrl}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, logoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-mono focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('स्थापना वर्ष', 'Established Year')}
                    </label>
                    <input
                      type="text"
                      value={schoolInfo.establishedYear}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, establishedYear: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शासकीय व्यवस्थापन', 'Governance / Management')}
                    </label>
                    <input
                      type="text"
                      value={schoolInfo.management}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, management: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('अधिकृत संपर्क फोन', 'Official Phone')}
                    </label>
                    <input
                      type="text"
                      value={schoolInfo.phone}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('अधिकृत ईमेल पत्ता', 'Official Email Address')}
                    </label>
                    <input
                      type="email"
                      value={schoolInfo.email}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शालेय वेळ', 'School Timings')}
                    </label>
                    <input
                      type="text"
                      value={schoolInfo.timings}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, timings: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शाळेचा पूर्ण पत्ता', 'Official Address')}
                    </label>
                    <input
                      type="text"
                      value={schoolInfo.address}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, address: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शाळा परिचय व पार्श्वभूमी', 'Introduction & Background')}
                    </label>
                    <textarea
                      rows={3}
                      value={schoolInfo.introduction}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, introduction: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('ध्येय व दृष्टी (Vision)', 'Vision')}
                      </label>
                      <textarea
                        rows={2}
                        value={schoolInfo.vision}
                        onChange={(e) => setSchoolInfo({ ...schoolInfo, vision: e.target.value })}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('उद्दिष्टे (Mission)', 'Mission')}
                      </label>
                      <textarea
                        rows={2}
                        value={schoolInfo.mission}
                        onChange={(e) => setSchoolInfo({ ...schoolInfo, mission: e.target.value })}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                      />
                    </div>
                  </div>
                </div>

                {/* Facilities Tag Manager */}
                <div className="pt-4 border-t border-border-green dark:border-dark-border space-y-3">
                  <h4 className="text-xs font-bold text-main-text dark:text-dark-text uppercase tracking-wider">
                    {tBilingual('शालेय भौतिक सोयी-सुविधा', 'Physical Facilities')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {schoolInfo.facilities?.map((f: string, i: number) => (
                      <span
                        key={i}
                        className="bg-light-green dark:bg-dark-bg border border-border-green dark:border-dark-border px-2.5 py-1 rounded-lg text-xs font-semibold text-primary-green flex items-center gap-1.5"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = schoolInfo.facilities.filter((_: any, idx: number) => idx !== i);
                            setSchoolInfo({ ...schoolInfo, facilities: updated });
                          }}
                          className="hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      type="text"
                      placeholder={tBilingual('उदा. अत्याधुनिक डिजिटल स्मार्ट क्लासरूम', 'E.g., Digital Smart Classroom')}
                      value={newFacility}
                      onChange={(e) => setNewFacility(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text grow focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newFacility.trim()) {
                          setSchoolInfo({
                            ...schoolInfo,
                            facilities: [...(schoolInfo.facilities || []), newFacility.trim()],
                          });
                          setNewFacility('');
                        }
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {tBilingual('सुविधा जोडा', 'Add Facility')}
                    </Button>
                  </div>
                </div>

                {/* Quick Facts Manager */}
                <div className="pt-4 border-t border-border-green dark:border-dark-border space-y-3">
                  <h4 className="text-xs font-bold text-main-text dark:text-dark-text uppercase tracking-wider">
                    {tBilingual('महत्त्वाचे तथ्य', 'Quick Facts')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {schoolInfo.quickFacts?.map((q: any, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 bg-white dark:bg-dark-bg border border-border-green dark:border-dark-border rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-muted-text dark:text-dark-muted block text-[11px]">{q.label}</span>
                          <span className="font-bold text-main-text dark:text-dark-text">{q.value}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = schoolInfo.quickFacts.filter((_: any, idx: number) => idx !== i);
                            setSchoolInfo({ ...schoolInfo, quickFacts: updated });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 max-w-lg">
                    <input
                      type="text"
                      placeholder={tBilingual('शीर्षक (उदा. वर्गखोल्या)', 'Label (e.g. Classrooms)')}
                      value={newFactLabel}
                      onChange={(e) => setNewFactLabel(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text grow focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                    <input
                      type="text"
                      placeholder={tBilingual('मूल्य (उदा. ०७ हवेशीर खोल्या)', 'Value (e.g. 7 Ventilated Rooms)')}
                      value={newFactValue}
                      onChange={(e) => setNewFactValue(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text grow focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newFactLabel.trim() && newFactValue.trim()) {
                          setSchoolInfo({
                            ...schoolInfo,
                            quickFacts: [
                              ...(schoolInfo.quickFacts || []),
                              { label: newFactLabel.trim(), value: newFactValue.trim() },
                            ],
                          });
                          setNewFactLabel('');
                          setNewFactValue('');
                        }
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {tBilingual('तथ्य जोडा', 'Add Fact')}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border-green dark:border-dark-border">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    {tBilingual('शाळा माहिती जतन करा', 'Save School Info')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 2: PRINCIPAL'S MESSAGE */}
          {activeTab === 'principal-message' && (
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                <div>
                  <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                    {tBilingual("मुख्याध्यापकांचा अधिकृत संदेश", "Principal's Message")}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual(
                      'सार्वजनिक मुख्यपृष्ठावर दिसणारा मुख्याध्यापक संदेश, छायाचित्र व शैक्षणिक पदनाम',
                      'Principal message, photo, and academic designation displayed on the homepage.'
                    )}
                  </p>
                </div>
                <Badge variant="orange" size="sm">{tBilingual('मुख्याध्यापक कक्ष', 'Principal Desk')}</Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <form onSubmit={handleSavePrincipalMessage} className="space-y-4">
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('मुख्याध्यापकांचे नाव (Display Name) *', 'Display Name *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={principalMsg.displayName}
                        onChange={(e) => setPrincipalMsg({ ...principalMsg, displayName: e.target.value })}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('पदनाम (Designation) *', 'Designation *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={principalMsg.designation}
                        onChange={(e) => setPrincipalMsg({ ...principalMsg, designation: e.target.value })}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('शैक्षणिक पात्रता व अनुभव (Qualification)', 'Qualification & Experience')}
                      </label>
                      <input
                        type="text"
                        value={principalMsg.qualification}
                        onChange={(e) => setPrincipalMsg({ ...principalMsg, qualification: e.target.value })}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('मान्यताप्राप्त छायाचित्र URL (Approved Photo)', 'Approved Photo URL')}
                      </label>
                      <input
                        type="text"
                        value={principalMsg.photo}
                        onChange={(e) => setPrincipalMsg({ ...principalMsg, photo: e.target.value })}
                        placeholder="/imgs/principal.jpeg"
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-mono focus:outline-none focus:ring-1 focus:ring-primary-green"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('अधिकृत संदेश (Principal\'s Message) *', 'Official Message *')}
                      </label>
                      <textarea
                        rows={6}
                        required
                        value={principalMsg.message}
                        onChange={(e) => setPrincipalMsg({ ...principalMsg, message: e.target.value })}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary-green"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    {tBilingual('संदेश जतन करा', 'Save Message')}
                  </Button>
                </form>

                {/* Live Preview Card */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary-green">
                    <Sparkles className="w-4 h-4" />
                    <span>{tBilingual('थेट संकेतस्थळ पूर्वावलोकन', 'Live Website Preview')}</span>
                  </div>

                  <div className="bg-light-green/70 dark:bg-dark-bg/60 border border-border-green dark:border-dark-border rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={principalMsg.photo || '/imgs/principal.jpeg'}
                        alt={principalMsg.displayName}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-green shadow-md"
                        onError={(e: any) => {
                          e.target.src = '/imgs/principal.jpeg';
                        }}
                      />
                      <div>
                        <h4 className="font-extrabold text-main-text dark:text-dark-text text-sm">
                          {principalMsg.displayName || tBilingual('मुख्याध्यापक', 'Headmaster')}
                        </h4>
                        <p className="text-xs font-semibold text-primary-green">{principalMsg.designation || 'Headmaster'}</p>
                        <p className="text-[11px] text-muted-text dark:text-dark-muted">{principalMsg.qualification || 'M.A., D.Ed.'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-main-text dark:text-dark-text leading-relaxed italic bg-white/80 dark:bg-dark-card/90 p-4 rounded-xl border border-border-green/50 dark:border-dark-border/50">
                      "{principalMsg.message || tBilingual('मुख्याध्यापकांचा अधिकृत संदेश येथे दिसेल...', 'Principal official message will appear here...')}"
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: ACADEMICS & TEXTBOOKS */}
          {activeTab === 'academics' && (
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                <div>
                  <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                    {tBilingual('शैक्षणिक अभ्यासक्रम व अधिकृत पाठ्यपुस्तके', 'Academics & Official Textbooks')}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual(
                      'उपलब्ध वर्ग, शिक्षण माध्यम, अभ्यासक्रम तपशील आणि बालभारती अधिकृत पाठ्यपुस्तक लिंक्स',
                      'Available standards, medium of instruction, curriculum details and Balbharati textbook links.'
                    )}
                  </p>
                </div>
                <Badge variant="green" size="sm">{tBilingual('अभ्यासक्रम', 'Academics')}</Badge>
              </div>

              <form onSubmit={handleSaveAcademics} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शिक्षण माध्यम (Medium of Instruction) *', 'Medium of Instruction *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={academics.mediumOfInstruction}
                      onChange={(e) => setAcademics({ ...academics, mediumOfInstruction: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('उपलब्ध वर्ग (स्वल्पविरामाने वेगळे करा)', 'Available Classes (Comma separated)')}
                    </label>
                    <input
                      type="text"
                      value={academics.availableClasses?.join(', ')}
                      onChange={(e) =>
                        setAcademics({
                          ...academics,
                          availableClasses: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शैक्षणिक तपशील (Academic Details Overview)', 'Academic Details Overview')}
                    </label>
                    <textarea
                      rows={3}
                      value={academics.academicDetails}
                      onChange={(e) => setAcademics({ ...academics, academicDetails: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>
                </div>

                {/* Textbook Links Table */}
                <div className="pt-4 border-t border-border-green dark:border-dark-border space-y-3">
                  <h4 className="text-xs font-bold text-main-text dark:text-dark-text uppercase tracking-wider">
                    {tBilingual('बालभारती अधिकृत पाठ्यपुस्तक लिंक्स', 'Official Textbook Links (Balbharati)')}
                  </h4>

                  <div className="border border-border-green dark:border-dark-border rounded-xl overflow-hidden text-xs">
                    <table className="w-full divide-y divide-border-green dark:divide-dark-border">
                      <thead className="bg-light-green/60 dark:bg-dark-bg/60 text-left font-bold text-main-text dark:text-dark-text">
                        <tr>
                          <th className="p-2.5">{tBilingual('इयत्ता (Class)', 'Class')}</th>
                          <th className="p-2.5">{tBilingual('विषय (Subjects)', 'Subjects')}</th>
                          <th className="p-2.5">{tBilingual('बालभारती अधिकृत URL', 'Balbharati Official URL')}</th>
                          <th className="p-2.5 text-center">{tBilingual('क्रिया', 'Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-green dark:divide-dark-border bg-white dark:bg-dark-card">
                        {academics.textbookLinks?.map((tb: any, i: number) => (
                          <tr key={i} className="hover:bg-light-green/30 dark:hover:bg-emerald-950/20">
                            <td className="p-2.5 font-bold text-main-text dark:text-dark-text">{tb.standard}</td>
                            <td className="p-2.5 text-muted-text dark:text-dark-muted">{tb.subject}</td>
                            <td className="p-2.5 font-mono text-[11px] text-primary-green truncate max-w-xs">
                              <a href={tb.balbharatiUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                {tb.balbharatiUrl}
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = academics.textbookLinks.filter((_: any, idx: number) => idx !== i);
                                  setAcademics({ ...academics, textbookLinks: updated });
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 max-w-2xl">
                    <input
                      type="text"
                      placeholder={tBilingual('इयत्ता (उदा. इयत्ता १ ली)', 'Class (e.g. Class 1)')}
                      value={newTbStandard}
                      onChange={(e) => setNewTbStandard(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                    <input
                      type="text"
                      placeholder={tBilingual('विषय (उदा. बालभारती मराठी, गणित)', 'Subjects (e.g. Marathi, Math)')}
                      value={newTbSubject}
                      onChange={(e) => setNewTbSubject(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text grow focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                    <input
                      type="url"
                      placeholder="https://cart.ebalbharati.in/..."
                      value={newTbUrl}
                      onChange={(e) => setNewTbUrl(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text font-mono grow focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newTbStandard.trim() && newTbSubject.trim() && newTbUrl.trim()) {
                          setAcademics({
                            ...academics,
                            textbookLinks: [
                              ...(academics.textbookLinks || []),
                              { standard: newTbStandard.trim(), subject: newTbSubject.trim(), balbharatiUrl: newTbUrl.trim() },
                            ],
                          });
                          setNewTbStandard('');
                          setNewTbSubject('');
                          setNewTbUrl('');
                        }
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {tBilingual('पाठ्यपुस्तक जोडा', 'Add Textbook')}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border-green dark:border-dark-border">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    {tBilingual('अभ्यासक्रम माहिती जतन करा', 'Save Academics')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 4: TEACHERS PUBLIC PROFILES */}
          {activeTab === 'teachers' && (
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                <div>
                  <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                    {tBilingual('शिक्षक सार्वजनिक प्रोफाइल व्यवस्थापन', 'Teacher Public Profile Management')}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual(
                      'सार्वजनिक संकेतस्थळावर शिक्षकांची छायाचित्रे, शैक्षणिक पात्रता, अध्यापन विषय व अनुभव नियंत्रित करा',
                      'Manage teachers public photos, qualifications, teaching subjects and experience on public portal'
                    )}
                  </p>
                </div>
                <Badge variant="green" size="sm">
                  {tBilingual('गोपनीयता संरक्षित', 'Privacy Protected')}
                </Badge>
              </div>

              {/* Data Protection Guarantee */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{tBilingual('डेटा संरक्षण हमी:', 'Data Protection Guarantee:')}</strong>{' '}
                  {tBilingual(
                    'शिक्षकांचे खाजगी मोबाईल क्रमांक, निवासी पत्ते, रक्तगट अथवा आरोग्य तपशील सार्वजनिक संकेतस्थळावर कधीही प्रकाशित केले जात नाहीत.',
                    'Teachers personal phone numbers, addresses, blood group and health records are never published on the public portal.'
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teachers.map((teacher) => (
                  <div
                    key={teacher._id}
                    className="p-4 border border-border-green dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg/60 shadow-sm flex items-start gap-3.5 text-xs"
                  >
                    <img
                      src={teacher.avatar || '/imgs/principal.jpeg'}
                      alt={teacher.name}
                      className="w-14 h-14 rounded-xl object-cover border border-border-green dark:border-dark-border shrink-0 shadow-sm"
                      onError={(e: any) => {
                        e.target.src = '/imgs/principal.jpeg';
                      }}
                    />

                    <div className="grow space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-main-text dark:text-dark-text text-sm">{teacher.name}</h4>
                        <span className="text-[10px] bg-primary-green/10 dark:bg-primary-green/20 text-primary-green dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                          {teacher.designation}
                        </span>
                      </div>

                      <p className="text-muted-text dark:text-dark-muted text-[11px]">
                        <strong>{tBilingual('पात्रता:', 'Qualification:')}</strong>{' '}
                        {teacher.teacherProfile?.qualification || tBilingual('पदवीधर शिक्षक', 'Graduate Teacher')}
                      </p>

                      <p className="text-muted-text dark:text-dark-muted text-[11px]">
                        <strong>{tBilingual('वर्ग:', 'Classes:')}</strong>{' '}
                        {teacher.teacherProfile?.assignedClasses?.join(', ') || tBilingual('इयत्ता १ ली, २ री', 'Class 1st, 2nd')}
                      </p>

                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={teacher.avatar || ''}
                          placeholder={tBilingual('फोटो URL (उदा. /imgs/principal.jpeg)', 'Photo URL (e.g. /imgs/principal.jpeg)')}
                          id={`avatar-${teacher._id}`}
                          className="text-[11px] px-2 py-1 border border-border-green dark:border-dark-border rounded bg-white dark:bg-dark-bg dark:text-dark-text grow font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById(`avatar-${teacher._id}`) as HTMLInputElement;
                            if (input) {
                              handleUpdateTeacherProfile(teacher, input.value.trim(), 8);
                            }
                          }}
                        >
                          {tBilingual('जतन', 'Save')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 5: NOTICES & CIRCULARS */}
          {activeTab === 'notices' && (
            <div className="space-y-6">
              {/* Notice Creation Form */}
              <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                  <div>
                    <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                      {editingNoticeId
                        ? tBilingual('परिपत्रक संपादन', 'Edit Notice')
                        : tBilingual('नवीन परिपत्रक / सूचना तयार करा', 'Create New Notice / Circular')}
                    </h3>
                    <p className="text-xs text-muted-text dark:text-dark-muted">
                      {tBilingual(
                        'मसुदा (Draft) किंवा थेट प्रकाशित (Published) स्थितीत परिपत्रके जतन करा.',
                        'Save circulars as drafts or publish them immediately.'
                      )}
                    </p>
                  </div>
                  {editingNoticeId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingNoticeId(null);
                        setNoticeTitle('');
                        setNoticeContent('');
                      }}
                    >
                      {tBilingual('संपादन रद्द', 'Cancel Edit')}
                    </Button>
                  )}
                </div>

                <form onSubmit={handleNoticeSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('परिपत्रक शीर्षक', 'Notice Title')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={noticeTitle}
                        onChange={(e) => setNoticeTitle(e.target.value)}
                        placeholder={tBilingual('उदा. शैक्षणिक वर्ष २०२६-२७ नवीन प्रवेश प्रारंभ...', 'e.g. Academic Year 2026-27 Admissions Open...')}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('वर्गवारी', 'Category')}
                      </label>
                      <select
                        value={noticeCategory}
                        onChange={(e) => setNoticeCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      >
                        <option value="GENERAL">{tBilingual('सामान्य सूचना', 'General Notice')}</option>
                        <option value="ACADEMIC">{tBilingual('शैक्षणिक', 'Academic')}</option>
                        <option value="EVENT">{tBilingual('समारंभ / स्पर्धा', 'Event / Function')}</option>
                        <option value="EXAM">{tBilingual('परीक्षा', 'Examination')}</option>
                        <option value="HOLIDAY">{tBilingual('सुट्टी', 'Holiday')}</option>
                        <option value="ADMINISTRATIVE">{tBilingual('प्रशासकीय', 'Administrative')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('परिपत्रक सविस्तर मजकूर', 'Notice Content')} *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                      placeholder={tBilingual('परिपत्रकाचा सविस्तर तपशील, दिनांक, पालकांसाठी सूचना...', 'Detailed circular message, date, instructions for parents...')}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noticeIsImportant}
                          onChange={(e) => setNoticeIsImportant(e.target.checked)}
                          className="accent-primary-green w-4 h-4"
                        />
                        <span className="font-semibold text-main-text dark:text-dark-text">
                          {tBilingual('अति महत्त्वाचे', 'Important Pin')}
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noticeIsActive}
                          onChange={(e) => setNoticeIsActive(e.target.checked)}
                          className="accent-primary-green w-4 h-4"
                        />
                        <span className="font-semibold text-main-text dark:text-dark-text">
                          {tBilingual('थेट प्रकाशित करा', 'Publish Immediately')}
                        </span>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={saving}
                      leftIcon={<Bell className="w-3.5 h-3.5" />}
                    >
                      {editingNoticeId
                        ? tBilingual('बदल जतन करा', 'Save Changes')
                        : tBilingual('परिपत्रक जतन करा', 'Save Notice')}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Notices List */}
              <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                  <h4 className="text-sm font-bold text-main-text dark:text-dark-text">
                    {tBilingual('सर्व परिपत्रके व सूचना', 'All Notices & Circulars')} ({formatNumber(notices.length)})
                  </h4>
                  <Badge variant="green" size="sm">
                    {formatNumber(notices.filter((n) => n.isActive).length)} {tBilingual('प्रकाशित', 'Published')}
                  </Badge>
                </div>

                <div className="divide-y divide-border-green dark:divide-dark-border">
                  {notices.map((n) => (
                    <div key={n._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 grow">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-light-green dark:bg-emerald-950/40 text-primary-green dark:text-emerald-400">
                            {n.category}
                          </span>
                          {n.isImportant && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-saffron-orange text-white">
                              {tBilingual('महत्त्वाचे', 'Important')}
                            </span>
                          )}
                          <span className="text-muted-text dark:text-dark-muted text-[11px]">
                            {formatDate(n.date)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              n.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {n.isActive
                              ? tBilingual('प्रकाशित', 'Published')
                              : tBilingual('मसुदा', 'Draft')}
                          </span>
                        </div>
                        <h4 className="font-bold text-main-text dark:text-dark-text">{n.title}</h4>
                        <p className="text-muted-text dark:text-dark-muted line-clamp-1">{n.content}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleNoticeStatus(n)}
                          leftIcon={n.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        >
                          {n.isActive
                            ? tBilingual('अप्रकाशित करा', 'Unpublish')
                            : tBilingual('प्रकाशित करा', 'Publish')}
                        </Button>

                        <button
                          onClick={() => {
                            setEditingNoticeId(n._id);
                            setNoticeTitle(n.title);
                            setNoticeContent(n.content);
                            setNoticeCategory(n.category);
                            setNoticeIsImportant(n.isImportant);
                            setNoticeIsActive(n.isActive);
                          }}
                          className="p-1.5 hover:bg-light-green dark:hover:bg-dark-bg rounded text-primary-green dark:text-emerald-400"
                          title={tBilingual('संपादित करा', 'Edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteNotice(n._id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded text-red-600 dark:text-red-400"
                          title={tBilingual('हटवा', 'Delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 6: GALLERY & ALBUMS */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {/* Create/Edit Album */}
              <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                  <div>
                    <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                      {editingAlbumId
                        ? tBilingual('छायाचित्र अल्बम संपादन', 'Edit Gallery Album')
                        : tBilingual('नवीन छायाचित्र दालन अल्बम तयार करा', 'Create New Gallery Album')}
                    </h3>
                    <p className="text-xs text-muted-text dark:text-dark-muted">
                      {tBilingual(
                        'क्रीडा, स्नेहसंमेलन, सहल, वृक्षारोपण किंवा सांस्कृतिक स्पर्धांचे अल्बम्स',
                        'Albums for sports, annual gathering, excursion, plantation or cultural events'
                      )}
                    </p>
                  </div>
                  {editingAlbumId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAlbumId(null);
                        setAlbumTitle('');
                        setAlbumMarathiTitle('');
                        setAlbumDescription('');
                        setAlbumImagesText('');
                      }}
                    >
                      {tBilingual('संपादन रद्द', 'Cancel Edit')}
                    </Button>
                  )}
                </div>

                <form onSubmit={handleAlbumSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('अल्बम नाव (इंग्रजी)', 'Album Name (English)')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={albumTitle}
                        onChange={(e) => setAlbumTitle(e.target.value)}
                        placeholder="Sports Meet 2026"
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('अल्बम नाव (मराठी)', 'Album Name (Marathi)')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={albumMarathiTitle}
                        onChange={(e) => setAlbumMarathiTitle(e.target.value)}
                        placeholder="वार्षिक क्रीडा महोत्सव २०२६"
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('श्रेणी', 'Category')}
                      </label>
                      <input
                        type="text"
                        value={albumCategory}
                        onChange={(e) => setAlbumCategory(e.target.value)}
                        placeholder={tBilingual('क्रीडा, स्नेहसंमेलन, सहल', 'Sports, Gathering, Picnic')}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('वर्ष', 'Year')}
                      </label>
                      <input
                        type="text"
                        value={albumYear}
                        onChange={(e) => setAlbumYear(e.target.value)}
                        placeholder="2026-27"
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-4">
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('मुखपृष्ठ छायाचित्र URL', 'Cover Photo URL')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={albumCoverImage}
                        onChange={(e) => setAlbumCoverImage(e.target.value)}
                        placeholder="/imgs/playground.jpg"
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-4">
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('अल्बम वर्णन', 'Album Description')}
                      </label>
                      <textarea
                        rows={2}
                        value={albumDescription}
                        onChange={(e) => setAlbumDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-4">
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('छायाचित्रे URLs (प्रत्येक ओळीवर एक फोटो URL)', 'Photos URLs (One photo URL per line)')}
                      </label>
                      <textarea
                        rows={3}
                        value={albumImagesText}
                        onChange={(e) => setAlbumImagesText(e.target.value)}
                        placeholder="/imgs/playground.jpg&#10;/imgs/activity.jpg"
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={saving}
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      {editingAlbumId
                        ? tBilingual('अल्बम बदल जतन करा', 'Save Album Changes')
                        : tBilingual('अल्बम तयार करा', 'Create Album')}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Existing Albums Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {albums.map((album) => (
                  <Card key={album._id} className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-sm overflow-hidden flex flex-col text-xs">
                    <div className="relative h-40 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={album.coverImage || '/imgs/playground.jpg'}
                        alt={album.marathiTitle}
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.src = '/imgs/playground.jpg';
                        }}
                      />
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                          album.isActive ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-white'
                        }`}
                      >
                        {album.isActive
                          ? tBilingual('प्रकाशित', 'Published')
                          : tBilingual('संग्रहित', 'Archived')}
                      </span>
                    </div>

                    <div className="p-4 space-y-2 grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-muted-text dark:text-dark-muted">
                          <span>{album.category}</span>
                          <span>{album.year}</span>
                        </div>
                        <h4 className="font-bold text-main-text dark:text-dark-text text-sm mt-0.5">
                          {language === 'en' ? album.title : album.marathiTitle || album.title}
                        </h4>
                        <p className="text-[11px] text-muted-text dark:text-dark-muted line-clamp-2 mt-1">{album.description}</p>
                        <p className="text-[11px] text-primary-green dark:text-emerald-400 font-semibold mt-1">
                          {tBilingual('एकूण फोटो', 'Total Photos')}: {formatNumber(album.images?.length || 0)}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border-green dark:border-dark-border flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAlbumStatus(album)}
                          leftIcon={album.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        >
                          {album.isActive
                            ? tBilingual('अप्रकाशित करा', 'Unpublish')
                            : tBilingual('प्रकाशित करा', 'Publish')}
                        </Button>

                        <button
                          onClick={() => {
                            setEditingAlbumId(album._id);
                            setAlbumTitle(album.title);
                            setAlbumMarathiTitle(album.marathiTitle);
                            setAlbumCategory(album.category);
                            setAlbumYear(album.year);
                            setAlbumDescription(album.description || '');
                            setAlbumCoverImage(album.coverImage);
                            setAlbumImagesText(
                              (album.images || [])
                                .map((img: any) => (typeof img === 'string' ? img : img.src))
                                .join('\n')
                            );
                          }}
                          className="p-1.5 hover:bg-light-green dark:hover:bg-dark-bg rounded text-primary-green dark:text-emerald-400"
                          title={tBilingual('संपादित करा', 'Edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SCHOLARSHIPS PUBLIC VISIBILITY */}
          {activeTab === 'scholarships' && (
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                <div>
                  <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                    {tBilingual('शासकीय शिष्यवृत्ती योजना सार्वजनिक दृश्यता', 'Govt Scholarship Schemes Public Visibility')}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual(
                      'कोणत्या शासकीय योजना सार्वजनिक संकेतस्थळावर पालकांसाठी दृश्यमान असाव्यात ते नियंत्रित करा.',
                      'Control which government scholarship schemes are visible to parents on the public website.'
                    )}
                  </p>
                </div>
                <Badge variant="green" size="sm">
                  {tBilingual('पारदर्शक योजना', 'Transparent Scheme')}
                </Badge>
              </div>

              <div className="divide-y divide-border-green dark:divide-dark-border text-xs">
                {scholarships.map((s) => (
                  <div key={s._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary-green dark:text-emerald-400 bg-light-green dark:bg-emerald-950/40 px-2 py-0.5 rounded text-[11px]">
                          {s.code}
                        </span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded">
                          {s.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.isPublic
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {s.isPublic
                            ? tBilingual('सार्वजनिक', 'Public')
                            : tBilingual('खाजगी', 'Hidden')}
                        </span>
                      </div>
                      <h4 className="font-bold text-main-text dark:text-dark-text text-sm">{s.schemeName}</h4>
                      <p className="text-muted-text dark:text-dark-muted text-[11px]">
                        {tBilingual('लाभार्थी गट:', 'Beneficiary Group:')} {s.beneficiaryGroup || tBilingual('सर्व पात्र विद्यार्थी', 'All Eligible Students')}
                      </p>
                    </div>

                    <Button
                      variant={s.isPublic ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleScholarship(s)}
                      leftIcon={s.isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    >
                      {s.isPublic
                        ? tBilingual('संकेतस्थळावरून लपवा', 'Hide from Portal')
                        : tBilingual('संकेतस्थळावर दाखवा', 'Show on Portal')}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 8: ADMISSIONS CONFIGURATION */}
          {activeTab === 'admissions' && (
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                <div>
                  <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                    {tBilingual('प्रवेश प्रक्रिया व अर्जाची उपलब्धता', 'Admissions Process & Form Availability')}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual(
                      'ऑनलाइन प्रवेश अर्ज सुरू/बंद करणे, शैक्षणिक वर्ष, प्रक्रिया वर्णन व आवश्यक कागदपत्रे',
                      'Open/close online admission forms, academic year, process description and required documents'
                    )}
                  </p>
                </div>
                <Badge variant={admissionsConfig.isFormOpen ? 'green' : 'orange'} size="sm">
                  {admissionsConfig.isFormOpen
                    ? tBilingual('प्रवेश अर्ज सुरू', 'Admissions Open')
                    : tBilingual('प्रवेश अर्ज बंद', 'Admissions Closed')}
                </Badge>
              </div>

              <form onSubmit={handleSaveAdmissions} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('शैक्षणिक वर्ष', 'Academic Year')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={admissionsConfig.academicYear}
                      onChange={(e) => setAdmissionsConfig({ ...admissionsConfig, academicYear: e.target.value })}
                      placeholder="2026-2027"
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('अर्ज प्रारंभ तारीख', 'Start Date')}
                    </label>
                    <input
                      type="date"
                      value={admissionsConfig.startDate || ''}
                      onChange={(e) => setAdmissionsConfig({ ...admissionsConfig, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('अर्ज अंतिम तारीख', 'End Date')}
                    </label>
                    <input
                      type="date"
                      value={admissionsConfig.endDate || ''}
                      onChange={(e) => setAdmissionsConfig({ ...admissionsConfig, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="flex items-center gap-3 p-3 bg-light-green/60 dark:bg-emerald-950/30 rounded-xl border border-border-green dark:border-dark-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={admissionsConfig.isFormOpen}
                        onChange={(e) => setAdmissionsConfig({ ...admissionsConfig, isFormOpen: e.target.checked })}
                        className="w-4 h-4 accent-primary-green"
                      />
                      <div>
                        <span className="font-bold text-main-text dark:text-dark-text block">
                          {tBilingual(
                            'सार्वजनिक संकेतस्थळावर नवीन प्रवेश अर्ज स्वीकारणे सुरू ठेवा',
                            'Accept online admission applications on public website'
                          )}
                        </span>
                        <span className="text-[11px] text-muted-text dark:text-dark-muted">
                          {tBilingual(
                            'चेक केल्यास पालकांना ऑनलाइन अर्ज भरता येईल, अनचेक केल्यास प्रवेश बंद दर्शवेल.',
                            'When checked, parents can apply online; when unchecked, admissions will show closed.'
                          )}
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('प्रवेश प्रक्रिया तपशील व सूचना', 'Admission Process Details & Instructions')}
                    </label>
                    <textarea
                      rows={3}
                      value={admissionsConfig.processDescription}
                      onChange={(e) => setAdmissionsConfig({ ...admissionsConfig, processDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>
                </div>

                {/* Required Documents Manager */}
                <div className="pt-4 border-t border-border-green dark:border-dark-border space-y-3">
                  <h4 className="text-xs font-bold text-main-text dark:text-dark-text uppercase tracking-wider">
                    {tBilingual('प्रवेशासाठी आवश्यक कागदपत्रे', 'Required Documents for Admission')}
                  </h4>

                  <ul className="space-y-1.5">
                    {admissionsConfig.requiredDocuments?.map((doc: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-center justify-between p-2 bg-white dark:bg-dark-bg border border-border-green dark:border-dark-border rounded-lg text-xs"
                      >
                        <span className="text-main-text dark:text-dark-text font-medium">{doc}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = admissionsConfig.requiredDocuments.filter((_: any, idx: number) => idx !== i);
                            setAdmissionsConfig({ ...admissionsConfig, requiredDocuments: updated });
                          }}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 max-w-lg">
                    <input
                      type="text"
                      placeholder={tBilingual('उदा. विद्यार्थ्याचे जन्म प्रमाणपत्र किंवा आधार कार्ड', 'e.g. Student birth certificate or Aadhaar card')}
                      value={newDocRequirement}
                      onChange={(e) => setNewDocRequirement(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text grow"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newDocRequirement.trim()) {
                          setAdmissionsConfig({
                            ...admissionsConfig,
                            requiredDocuments: [...(admissionsConfig.requiredDocuments || []), newDocRequirement.trim()],
                          });
                          setNewDocRequirement('');
                        }
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {tBilingual('कागदपत्र जोडा', 'Add Document')}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border-green dark:border-dark-border">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    {tBilingual('प्रवेश प्रक्रिया जतन करा', 'Save Admissions Config')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 9: MEDIA ASSETS & UPLOAD */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Image Upload Card */}
              <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                  <div>
                    <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                      {tBilingual('नवीन छायाचित्र अपलोड करा', 'Upload New Image')}
                    </h3>
                    <p className="text-xs text-muted-text dark:text-dark-muted">
                      {tBilingual(
                        'JPEG, PNG किंवा WEBP छायाचित्रे अपलोड करा (कमाल आकार: ५ MB). फाईल मेटाडेटा सुरक्षितरीत्या संचयित होतो.',
                        'Upload JPEG, PNG or WEBP images (Max size: 5 MB). File metadata is safely stored.'
                      )}
                    </p>
                  </div>
                  <Badge variant="orange" size="sm">
                    {tBilingual('५ MB मर्यादा', '5 MB Limit')}
                  </Badge>
                </div>

                <form onSubmit={handleUploadMedia} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('छायाचित्र शीर्षक', 'Image Title')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder={tBilingual('उदा. ध्वजारोहण कार्यक्रम', 'e.g. Flag Hoisting Ceremony')}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('श्रेणी', 'Category')}
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg dark:text-dark-text"
                      >
                        <option value="gallery">{tBilingual('दालन', 'Gallery')}</option>
                        <option value="school">{tBilingual('शाळा परिसर', 'School Campus')}</option>
                        <option value="principal">{tBilingual('मुख्याध्यापक', 'Principal')}</option>
                        <option value="activity">{tBilingual('उपक्रम', 'Activity')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('छायाचित्र फाईल निवडा', 'Select Image File')} *
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        onChange={handleFileChange}
                        className="w-full text-xs dark:text-dark-text"
                      />
                    </div>
                  </div>

                  {uploadBase64 && (
                    <div className="flex items-center gap-4 p-3 bg-light-green/60 dark:bg-emerald-950/30 rounded-xl border border-border-green dark:border-dark-border">
                      <img src={uploadBase64} alt="Preview" className="w-16 h-16 object-cover rounded-lg border dark:border-dark-border shadow-sm" />
                      <div>
                        <span className="font-bold text-main-text dark:text-dark-text block">{uploadFile?.name}</span>
                        <span className="text-[11px] text-muted-text dark:text-dark-muted">
                          {tBilingual('आकार:', 'Size:')} {uploadFile ? formatNumber(Math.round(uploadFile.size / 1024)) : 0} KB | {tBilingual('प्रकार:', 'Type:')} {uploadFile?.type}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={uploading}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      {tBilingual('छायाचित्र अपलोड करा', 'Upload Image')}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Media Assets Library */}
              <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                  <div>
                    <h4 className="text-sm font-bold text-main-text dark:text-dark-text">
                      {tBilingual('छायाचित्र भांडार व उपलब्ध स्रोत', 'Media Asset Library')} ({formatNumber(mediaAssets.length)} {tBilingual('स्रोत', 'Assets')})
                    </h4>
                    <p className="text-[11px] text-muted-text dark:text-dark-muted">
                      {tBilingual(
                        "विद्यमान 'imgs' डिरेक्टरीतील सर्व अधिकृत छायाचित्रे येथे उपलब्ध आहेत. URL कॉपी करून वापरू शकता.",
                        "All official photos in existing 'imgs' folder are available here. You can copy URLs to use them."
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {mediaAssets.map((asset) => (
                    <div
                      key={asset._id}
                      className="group border border-border-green dark:border-dark-border rounded-xl overflow-hidden bg-white dark:bg-dark-bg shadow-sm flex flex-col justify-between text-[11px]"
                    >
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                        <img
                          src={asset.url}
                          alt={asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e: any) => {
                            e.target.src = '/imgs/playground.jpg';
                          }}
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                          {asset.category}
                        </span>
                      </div>

                      <div className="p-2 space-y-1">
                        <span className="font-bold text-main-text dark:text-dark-text truncate block" title={asset.title}>
                          {asset.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(asset.url);
                            showFeedback('success', `${tBilingual('URL कॉपी केली:', 'Copied URL:')} ${asset.url}`);
                          }}
                          className="w-full text-center py-1 text-[10px] font-semibold bg-light-green dark:bg-emerald-950/40 text-primary-green dark:text-emerald-400 rounded hover:bg-primary-green hover:text-white dark:hover:bg-primary-green transition-colors"
                        >
                          {tBilingual('URL कॉपी करा', 'Copy URL')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 10: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <Card className="border border-border-green dark:border-dark-border bg-white dark:bg-dark-card shadow-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-green dark:border-dark-border">
                <div>
                  <h3 className="text-base font-bold text-main-text dark:text-dark-text">
                    {tBilingual('सीएमएस संपादन इतिहास', 'CMS Audit Trail')}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual(
                      'संकेतस्थळ माहिती, परिपत्रके आणि छायाचित्रांमधील सर्व महत्त्वाच्या बदलांचे सुरक्षा ऑडिट लॉग',
                      'Security audit log of all changes made to website info, circulars and gallery'
                    )}
                  </p>
                </div>
                <Badge variant="green" size="sm">
                  {tBilingual('ऑडिट लॉग', 'Audit Log')}
                </Badge>
              </div>

              <div className="divide-y divide-border-green dark:divide-dark-border text-xs">
                {auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-muted-text dark:text-dark-muted">
                    {tBilingual('अद्याप कोणतेही ऑडिट लॉग उपलब्ध नाहीत.', 'No audit logs available yet.')}
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary-green dark:text-emerald-400 bg-light-green dark:bg-emerald-950/40 px-2 py-0.5 rounded text-[11px]">
                            {log.action}
                          </span>
                          <span className="text-muted-text dark:text-dark-muted text-[11px]">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-main-text dark:text-dark-text font-medium">{log.details}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-main-text dark:text-dark-text block text-[11px]">{log.performedBy}</span>
                        <span className="text-[10px] uppercase font-mono text-muted-text dark:text-dark-muted">{log.performedByRole}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default WebsiteManagePage;
