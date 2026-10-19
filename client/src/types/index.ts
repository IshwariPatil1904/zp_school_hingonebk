export type UserRole = 'principal' | 'teacher';

export type Permission =
  | 'students:view'
  | 'students:manage'
  | 'students:admit'
  | 'students:promote'
  | 'teachers:view'
  | 'teachers:manage'
  | 'finance:view'
  | 'finance:edit'
  | 'finance:manage'
  | 'scholarships:view'
  | 'scholarships:manage'
  | 'certificates:request'
  | 'certificates:download'
  | 'certificates:approve'
  | 'certificates:configure'
  | 'reports:view'
  | 'reports:export'
  | 'website:manage'
  | 'profile:view'
  | 'profile:update_basic'
  | 'profile:update_all';

export interface ITeacherProfile {
  employeeId?: string;
  qualification?: string;
  joiningDate?: string;
  assignedClasses?: string[];
  subjectSpecialization?: string[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  phone?: string;
  designation: string;
  avatar?: string;
  teacherProfile?: ITeacherProfile;
  isActive: boolean;
  createdAt?: string;
}

export interface PublicTeacher {
  _id: string;
  name: string;
  role: 'principal' | 'teacher';
  designation: string;
  avatar: string;
  qualification: string;
  assignedClasses: string[];
  subjectSpecialization: string[];
  experienceYears: number;
}

export interface SchoolProfile {
  name: string;
  marathiName: string;
  udiseCode: string;
  cluster: string;
  block: string;
  district: string;
  state: string;
  pincode: string;
  establishedYear: string;
  medium: string;
  grades: string;
  type: string;
  management: string;
  headmaster: {
    name: string;
    designation: string;
    qualification: string;
    message: string;
    photo: string;
  };
  vision: string;
  mission: string;
  quickFacts: { label: string; value: string }[];
  contact: {
    email: string;
    phone: string;
    address: string;
    timings: string;
  };
}

export interface Notice {
  _id: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'ACADEMIC' | 'EVENT' | 'EXAM' | 'HOLIDAY';
  date: string;
  isImportant: boolean;
  publishedBy: string;
}

export interface ScholarshipScheme {
  _id: string;
  schemeName: string;
  marathiName: string;
  code: string;
  category?: string;
  description?: string;
  marathiDescription?: string;
  applicableGrades: string;
  applicableStandards?: string[];
  beneficiaryGroup: string;
  applicableCategories?: string[];
  incomeLimit?: number;
  genderRequirement?: 'ALL' | 'मुलगी' | 'मुलगा';
  minorityRequirement?: string;
  cwsnRequirement?: string;
  bplRequirement?: string;
  occupationKeyword?: string;
  benefitAmount: string;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  applicationSteps: string;
  officialUrl?: string;
  academicYear?: string;
  applicationStartDate?: string;
  applicationEndDate?: string;
  isActive: boolean;
  isPublic?: boolean;
  eligibleCount?: number;
  ineligibleCount?: number;
  reviewCount?: number;
  approvedCount?: number;
}

export interface ScholarshipEvaluationData {
  _id: string;
  studentId: string;
  studentGrNumber: string;
  studentName: string;
  standard: string;
  division: string;
  category: string;
  gender: string;
  annualIncome: number;
  schemeId: string;
  schemeCode: string;
  schemeName: string;
  academicYear: string;
  status: 'Eligible' | 'Not Eligible' | 'Needs Review';
  reasons: string[];
  missingInfo: string[];
  isApprovedByPrincipal: boolean;
  approvedAt?: string;
  approvedBy?: string;
  evaluatedAt: string;
  ruleVersion: string;
}

export interface GalleryAlbumData {
  _id: string;
  title: string;
  marathiTitle: string;
  category: string;
  year: string;
  description: string;
  coverImage: string;
  images: { src: string; caption: string; marathiCaption: string }[];
  isActive: boolean;
}

export interface AdmissionSubmission {
  studentName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  gradeApplying: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  residentialAddress: string;
  previousSchool?: string;
}

export interface AdmissionConfirmation {
  applicationNo: string;
  studentName: string;
  gradeApplying: string;
  parentName: string;
  status: string;
  appliedAt: string;
}

export interface StudentData {
  _id: string;
  grNumber: string;
  name: string;
  aadhaarNumber: string;
  dateOfBirth: string;
  gender: 'मुलगा' | 'मुलगी' | 'इतर';
  motherTongue: string;
  religion: string;
  caste: string;
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'NT' | 'SBC';
  bloodGroup: string;

  // Family
  fatherName: string;
  motherName: string;
  guardianName: string;
  parentsOccupation: string;
  annualFamilyIncome: number;
  isBpl: boolean;
  bplNumber?: string;
  minorityStatus: string;

  // Contact
  houseNumber: string;
  village: string;
  taluka: string;
  district: string;
  pincode: string;
  primaryPhone: string;
  secondaryPhone?: string;
  residentialAddress: string;

  // Academic / SARAL
  saralId: string;
  penNumber: string;
  admissionDate: string;
  studentType: string;
  entryStandard: string;
  currentStandard: string;
  classGrade?: string;
  division: 'A' | 'B';
  mediumOfInstruction: string;
  previousYearMarks: number;
  attendancePercentage: number;
  scholarshipScheme?: string;

  // Bank
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;

  // Health & CWSN
  isCwsn: boolean;
  cwsnDisabilityType?: string;
  heightCm: number;
  weightKg: number;
  isActive: boolean;
}

export interface TeacherData {
  _id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  bloodGroup: string;
  contactPhone: string;
  email: string;
  aadhaarNumber: string;
  residentialAddress: string;

  employeeId: string;
  designation: string;
  qualification: string;
  joiningDate: string;
  assignedClasses: string[];
  subjectSpecialization: string[];
  experienceYears: number;
  linkedUserId?: {
    _id: string;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
  };

  medicalFitness: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  isActive: boolean;
}

export interface FundData {
  _id: string;
  type: 'fund_received';
  fundId: string;
  schemeType: string;
  title: string;
  category?: string;
  amount: number;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  utilizedAmount: number;
  remainingAmount?: number;
  date: string;
  voucherNo: string;
  approvedBy: string;
  status: 'Active' | 'Fully Utilized' | 'Expired' | 'Reversed';
  notes?: string;
  transactionHistory?: ExpenseData[];
  createdAt?: string;
}

export interface ExpenseData {
  _id: string;
  type: 'expense';
  purpose: string;
  title?: string;
  amount: number;
  billNumber: string;
  vendorName: string;
  category: string;
  billDate: string;
  associatedFundId: string;
  associatedFundScheme?: string;
  billAttachment?: string;
  voucherNo: string;
  date: string;
  approvedBy: string;
  status: 'Approved' | 'Disbursed' | 'Reversed';
  reversalReason?: string;
  reversedBy?: string;
  reversedAt?: string;
  notes?: string;
  createdAt?: string;
}

export interface FinanceSummaryData {
  totalFundsReceived: number;
  totalExpenses: number;
  availableBalance: number;
  schemesSummary: {
    fundId: string;
    schemeType: string;
    allocated: number;
    utilized: number;
    remaining: number;
    status: string;
  }[];
  recentFunds: FundData[];
  recentExpenses: ExpenseData[];
  transactions: (FundData | ExpenseData)[];
  readOnly: boolean;
}

export type CertificateAccentColor = 'green' | 'blue' | 'red' | 'black' | 'purple';

export interface TemplateSettings {
  certificateType: 'Bonafide Certificate' | 'Leaving Certificate' | 'Scholarship Certificate';
  title: string;
  header: string;
  subheader: string;
  body: string;
  footerNote: string;
  place: string;
  teacherSignLabel: string;
  principalSignLabel: string;
  showBorder: boolean;
  showSeal: boolean;
  accentColor: CertificateAccentColor;
}

export interface CertificateConfigData {
  _id?: string;
  activeTemplate: 'Bonafide Certificate' | 'Leaving Certificate' | 'Scholarship Certificate';
  templates: {
    bonafide: TemplateSettings;
    leaving: TemplateSettings;
    scholarship: TemplateSettings;
  };
  version: number;
  lastUpdatedBy: string;
  updatedAt?: string;
}

export interface CertificateRequestData {
  _id: string;
  certificateNo: string;
  studentId?: string;
  studentName: string;
  grNumber: string;
  classGrade: string;
  division: string;
  type: string;
  reason: string;
  purpose?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  leavingDate?: string;
  reasonForLeaving?: string;
  conduct?: string;
  progress?: string;
  dateOfBirthInWords?: string;
  nationality?: string;
  scholarshipSchemeName?: string;
  sanctionAmount?: number;
  academicYear?: string;
  verificationNote?: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  templateVersion?: number;
  templateConfigSnapshot?: any;
  isAuthorized?: boolean;
  createdAt: string;
  updatedAt: string;
}
