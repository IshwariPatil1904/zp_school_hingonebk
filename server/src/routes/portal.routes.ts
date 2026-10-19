import { Router } from 'express';
import {
  authenticate,
  requireRole,
  requirePermission,
  csrfProtection,
} from '../middleware/auth.middleware';
import {
  getPrincipalDashboardSummary,
  getTeacherDashboardSummary,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  admitStudent,
  getTeachersList,
  getTeacherById,
  createTeacher,
  updateTeacher,
  getTeacherSelfProfile,
  updateTeacherSelfProfile,
  getFinancialRecords,
  getFundsList,
  createFund,
  getExpensesList,
  recordExpense,
  reverseTransaction,
  exportFinancialLedgerCsv,
  getScholarships,
  getScholarshipById,
  getScholarshipEvaluations,
  createScholarship,
  updateScholarship,
  toggleScholarshipStatus,
  reEvaluateScholarship,
  approveScholarship,
  exportScholarshipCsv,
  getCertificates,
  requestCertificate,
  approveCertificate,
  rejectCertificate,
  getCertificateConfig,
  updateCertificateConfig,
  restoreDefaultCertificateConfig,
  downloadCertificate,
  renderCertificatePdfHtml,
  getWebsiteOverview,
  updateWebsiteContent,
} from '../controllers/portal.controller';
import {
  previewPromotion,
  promoteStudents,
  getPromotionHistory,
} from '../controllers/promotion.controller';
import {
  getAdmissionsList,
  getAdmissionDetails,
  getNextGrNumber,
  updateAdmissionStatus,
  enrollStudentFromAdmission,
} from '../controllers/admission.controller';
import {
  getStudentReports,
  getFundReports,
  getTeacherReports,
  exportStudentsCsv,
  exportFundsCsv,
  exportTeachersCsv,
  renderStudentsReportPdf,
  renderFundsReportPdf,
  renderTeachersReportPdf,
} from '../controllers/report.controller';
import {
  getMyProfile,
  updateMyProfile,
} from '../controllers/profile.controller';
import {
  getCmsConfig,
  updateSchoolInfo,
  updatePrincipalMessage,
  updateAcademicsConfig,
  updateAdmissionsConfig,
  createCmsNotice,
  updateCmsNotice,
  deleteCmsNotice,
  createCmsGalleryAlbum,
  updateCmsGalleryAlbum,
  toggleScholarshipVisibility,
  updateTeacherPublicProfile,
  getMediaAssets,
  uploadMediaAsset,
  getCmsAuditLogs,
} from '../controllers/websiteCms.controller';

const router = Router();

// All portal routes require authentication
router.use(authenticate);

/**
 * 0. My Profile (Personal updates for both Principal and Teachers)
 */
router.get('/my-profile', getMyProfile);
router.put('/my-profile', csrfProtection, updateMyProfile);

/**
 * 1. Role-Specific Executive Dashboards
 */
// Principal Summary Dashboard (Aggregate counts across all 148 students, teachers, finances, admissions, certs)
router.get('/dashboard/principal-summary', requireRole('principal'), getPrincipalDashboardSummary);

// Teacher Summary Dashboard (Specific to their authorized classes, gender, category distribution, certs)
router.get('/dashboard/teacher-summary', requireRole('teacher'), getTeacherDashboardSummary);

/**
 * 2. Students & Enrollment
 */
// Searchable, paginated students with filters
router.get('/students', requirePermission('students:view'), getStudents);
router.get('/students/:id', requirePermission('students:view'), getStudentById);
router.post('/students', csrfProtection, requirePermission('students:admit'), createStudent);
router.put('/students/:id', csrfProtection, requirePermission('students:view'), updateStudent);
router.post('/students/admit', csrfProtection, requirePermission('students:admit'), admitStudent);
router.get('/promotion/preview', requirePermission('students:promote'), previewPromotion);
router.post('/students/promote', csrfProtection, requirePermission('students:promote'), promoteStudents);
router.get('/promotion/history', requirePermission('students:promote'), getPromotionHistory);

/**
 * 3. Teachers Management
 */
// Teachers list with subject & experience filters
router.get('/teachers', requirePermission('teachers:view'), getTeachersList);
// Self-profile view & update for teacher (only permitted personal & health fields)
router.get('/teachers/my-profile', getTeacherSelfProfile);
router.put('/teachers/my-profile', csrfProtection, updateTeacherSelfProfile);
router.get('/teachers/:id', requirePermission('teachers:view'), getTeacherById);
// Only principal can create new teacher records (and link user accounts)
router.post('/teachers', csrfProtection, requireRole('principal'), createTeacher);
// Principal full edit / Teacher own profile edit
router.put('/teachers/:id', csrfProtection, updateTeacher);

/**
 * 4. School Funds & Expenses
 */
// Financial summary and general ledger (Teachers read-only, Principal manage)
router.get('/finance', requirePermission('finance:view'), getFinancialRecords);
// Funds Received: list with search/filter/pagination
router.get('/finance/funds', requirePermission('finance:view'), getFundsList);
// Add Fund: Principal only
router.post('/finance/funds', csrfProtection, requireRole('principal'), createFund);
// Expenses: list with search/filter/pagination
router.get('/finance/expenses', requirePermission('finance:view'), getExpensesList);
// Add Expense: Principal only
router.post('/finance/expense', csrfProtection, requireRole('principal'), recordExpense);
// Controlled Transaction Reversal: Principal only
router.post('/finance/reverse/:id', csrfProtection, requireRole('principal'), reverseTransaction);
// Export Financial Ledger CSV: Available to authorized staff
router.get('/finance/export/csv', requirePermission('finance:view'), exportFinancialLedgerCsv);

/**
 * 5. Scholarships & Eligibility Engine
 */
// Both principal and teacher can view scholarships list
router.get('/scholarships', requirePermission('scholarships:view'), getScholarships);
// Single scheme details
router.get('/scholarships/:id', requirePermission('scholarships:view'), getScholarshipById);
// Student eligibility evaluations (Teachers restricted to assigned classes)
router.get('/scholarships/:id/evaluations', requirePermission('scholarships:view'), getScholarshipEvaluations);
// Export student eligibility ledger to CSV
router.get('/scholarships/:id/export/csv', requirePermission('scholarships:view'), exportScholarshipCsv);

// Mutations - Principal only (Teachers get 403 Forbidden)
router.post('/scholarships', csrfProtection, requirePermission('scholarships:manage'), createScholarship);
router.put('/scholarships/:id', csrfProtection, requirePermission('scholarships:manage'), updateScholarship);
router.patch('/scholarships/:id/status', csrfProtection, requirePermission('scholarships:manage'), toggleScholarshipStatus);
router.post('/scholarships/:id/re-evaluate', csrfProtection, requirePermission('scholarships:manage'), reEvaluateScholarship);
router.post('/scholarships/approve', csrfProtection, requirePermission('scholarships:manage'), approveScholarship);

/**
 * 6. Student Certificates (Bonafide, Leaving, Scholarship)
 */
// Both can view certificates list
router.get('/certificates', requirePermission('certificates:download'), getCertificates);
router.get('/certificates/approved', requirePermission('certificates:download'), getCertificates);

// Configuration endpoints (Must be declared before :id routes)
router.get('/certificates/config', requirePermission('certificates:download'), getCertificateConfig);
router.put('/certificates/config', csrfProtection, requirePermission('certificates:configure'), updateCertificateConfig);
router.post('/certificates/configure', csrfProtection, requirePermission('certificates:configure'), updateCertificateConfig);
router.post('/certificates/config/restore-default', csrfProtection, requirePermission('certificates:configure'), restoreDefaultCertificateConfig);

// Teachers and principal can submit a certificate request
router.post('/certificates/request', csrfProtection, requirePermission('certificates:request'), requestCertificate);

// Only principal can approve or reject certificates (Teachers get 403)
router.post('/certificates/approve', csrfProtection, requirePermission('certificates:approve'), approveCertificate);
router.post('/certificates/:id/approve', csrfProtection, requirePermission('certificates:approve'), approveCertificate);
router.post('/certificates/reject', csrfProtection, requirePermission('certificates:approve'), rejectCertificate);
router.post('/certificates/:id/reject', csrfProtection, requirePermission('certificates:approve'), rejectCertificate);

// Download and PDF generation endpoints (Approved requests only; Teachers restricted to assigned classes/requests)
router.get('/certificates/:id/download', requirePermission('certificates:download'), downloadCertificate);
router.get('/certificates/:id/pdf', requirePermission('certificates:download'), renderCertificatePdfHtml);
router.get('/certificates/:id/print', requirePermission('certificates:download'), renderCertificatePdfHtml);

/**
 * 7. Admissions Applications (Principal Review & Enrollment)
 */
// Principal views applications submitted via public portal
router.get('/admissions', requirePermission('students:manage'), getAdmissionsList);
// Next available GR Number calculation
router.get('/admissions/next-gr', requirePermission('students:admit'), getNextGrNumber);
// Principal reviews full student dossier & documents
router.get('/admissions/:id', requirePermission('students:manage'), getAdmissionDetails);
// Principal updates status (Under Review, Approve, Reject with reason, Waitlist)
router.post('/admissions/:id/status', csrfProtection, requirePermission('students:admit'), updateAdmissionStatus);
// Controlled student enrollment: creates student record & marks admitted
router.post('/admissions/:id/enroll', csrfProtection, requirePermission('students:admit'), enrollStudentFromAdmission);

/**
 * 8. Website Content Management (Principal Only)
 */
router.get('/website', requirePermission('website:manage'), getCmsConfig);
router.get('/website/config', requirePermission('website:manage'), getCmsConfig);
router.put('/website', csrfProtection, requirePermission('website:manage'), updateWebsiteContent);
router.put('/website/school-info', csrfProtection, requirePermission('website:manage'), updateSchoolInfo);
router.put('/website/principal-message', csrfProtection, requirePermission('website:manage'), updatePrincipalMessage);
router.put('/website/academics', csrfProtection, requirePermission('website:manage'), updateAcademicsConfig);
router.put('/website/admissions', csrfProtection, requirePermission('website:manage'), updateAdmissionsConfig);

// Notices management (CMS)
router.post('/website/notices', csrfProtection, requirePermission('website:manage'), createCmsNotice);
router.put('/website/notices/:id', csrfProtection, requirePermission('website:manage'), updateCmsNotice);
router.delete('/website/notices/:id', csrfProtection, requirePermission('website:manage'), deleteCmsNotice);

// Gallery Albums management (CMS)
router.post('/website/gallery', csrfProtection, requirePermission('website:manage'), createCmsGalleryAlbum);
router.put('/website/gallery/:id', csrfProtection, requirePermission('website:manage'), updateCmsGalleryAlbum);

// Scholarships visibility toggle (CMS)
router.post('/website/scholarships/:id/visibility', csrfProtection, requirePermission('website:manage'), toggleScholarshipVisibility);

// Teacher public profile config (CMS)
router.put('/website/teachers/:id', csrfProtection, requirePermission('website:manage'), updateTeacherPublicProfile);

// Media Library and validated image uploads (CMS)
router.get('/website/media', requirePermission('website:manage'), getMediaAssets);
router.post('/website/media/upload', csrfProtection, requirePermission('website:manage'), uploadMediaAsset);

// CMS Audit Trail
router.get('/website/audit-logs', requirePermission('website:manage'), getCmsAuditLogs);

/**
 * 9. Comprehensive Reports (Students, Funds, Teachers)
 */
// Aggregated Chart Data
router.get('/reports/students', requirePermission('reports:view'), getStudentReports);
router.get('/reports/funds', requirePermission('reports:view'), getFundReports);
router.get('/reports/teachers', requirePermission('reports:view'), getTeacherReports);

// CSV Data Exports
router.get('/reports/students/csv', requirePermission('reports:export'), exportStudentsCsv);
router.get('/reports/funds/csv', requirePermission('reports:export'), exportFundsCsv);
router.get('/reports/teachers/csv', requirePermission('reports:export'), exportTeachersCsv);

// Official Printable PDF Formatted Reports
router.get('/reports/students/pdf', requirePermission('reports:export'), renderStudentsReportPdf);
router.get('/reports/funds/pdf', requirePermission('reports:export'), renderFundsReportPdf);
router.get('/reports/teachers/pdf', requirePermission('reports:export'), renderTeachersReportPdf);

export default router;
