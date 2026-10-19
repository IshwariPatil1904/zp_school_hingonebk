import { Schema, model, Document, Types } from 'mongoose';

export interface IDecisionLog {
  status: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  notes?: string;
}

export interface IApplicationDocument {
  name: string;
  type: string;
  url?: string;
  isVerified: boolean;
}

export interface IAdmissionApplication extends Document {
  applicationNo: string;
  studentName: string;
  gender: 'Male' | 'Female' | 'Other' | 'मुलगा' | 'मुलगी' | 'इतर';
  dateOfBirth: Date;
  gradeApplying: string;
  parentName: string; // Father / Guardian
  motherName?: string;
  guardianName?: string;
  parentPhone: string;
  parentEmail?: string;
  residentialAddress: string;
  village?: string;
  taluka?: string;
  district?: string;
  pincode?: string;
  category?: 'General' | 'OBC' | 'SC' | 'ST' | 'NT' | 'SBC';
  caste?: string;
  religion?: string;
  motherTongue?: string;
  bloodGroup?: string;
  previousSchool?: string;
  previousStandard?: string;
  previousMarks?: number;
  transferCertificateNo?: string;
  documents?: IApplicationDocument[];
  status: 'Pending' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Waitlisted' | 'Admitted';
  rejectionReason?: string;
  waitlistReason?: string;
  notes?: string;
  decisionHistory: IDecisionLog[];
  admittedStudentId?: Types.ObjectId;
  assignedGrNumber?: string;
  assignedStandard?: string;
  assignedDivision?: string;
  admissionDate?: Date;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DecisionLogSchema = new Schema<IDecisionLog>(
  {
    status: { type: String, required: true },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const ApplicationDocumentSchema = new Schema<IApplicationDocument>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    url: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const AdmissionApplicationSchema = new Schema<IAdmissionApplication>(
  {
    applicationNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      default: 'Male',
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gradeApplying: {
      type: String,
      required: [true, 'Grade/Standard applying for is required'],
      trim: true,
    },
    parentName: {
      type: String,
      required: [true, 'Parent / Guardian name is required'],
      trim: true,
    },
    motherName: {
      type: String,
      default: '',
      trim: true,
    },
    guardianName: {
      type: String,
      default: '',
      trim: true,
    },
    parentPhone: {
      type: String,
      required: [true, 'Parent phone number is required'],
      trim: true,
    },
    parentEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    residentialAddress: {
      type: String,
      required: [true, 'Residential address is required'],
      trim: true,
    },
    village: { type: String, default: 'हिंगोणे बु.' },
    taluka: { type: String, default: 'धरणगाव' },
    district: { type: String, default: 'जळगाव' },
    pincode: { type: String, default: '425105' },
    category: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'NT', 'SBC'],
      default: 'OBC',
    },
    caste: { type: String, default: 'मराठा' },
    religion: { type: String, default: 'हिंदू' },
    motherTongue: { type: String, default: 'मराठी' },
    bloodGroup: { type: String, default: 'B+' },
    previousSchool: {
      type: String,
      trim: true,
      default: 'N/A (First Admission)',
    },
    previousStandard: { type: String, default: '' },
    previousMarks: { type: Number, default: 0 },
    transferCertificateNo: { type: String, default: '' },
    documents: {
      type: [ApplicationDocumentSchema],
      default: () => [
        { name: 'जन्म दाखला (Birth Certificate)', type: 'birth_cert', isVerified: true },
        { name: 'आधार कार्ड (Aadhaar Card)', type: 'aadhaar_card', isVerified: true },
        { name: 'शाळा सोडल्याचा दाखला (TC/Leaving)', type: 'leaving_cert', isVerified: false },
        { name: 'जात प्रमाणपत्र (Caste Certificate)', type: 'caste_cert', isVerified: false },
        { name: 'रहिवासी दाखला / शिधापत्रिका (Ration Card)', type: 'ration_card', isVerified: true },
      ],
    },
    status: {
      type: String,
      enum: ['Pending', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Waitlisted', 'Admitted'],
      default: 'Pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    waitlistReason: { type: String, default: '' },
    notes: { type: String, default: '' },
    decisionHistory: {
      type: [DecisionLogSchema],
      default: () => [
        {
          status: 'Submitted',
          changedBy: 'ऑनलाइन प्रणाली (Portal)',
          changedAt: new Date(),
          notes: 'पालकांकडून ऑनलाइन प्रवेश अर्ज दाखल झाला.',
        },
      ],
    },
    admittedStudentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    assignedGrNumber: { type: String, default: '' },
    assignedStandard: { type: String, default: '' },
    assignedDivision: { type: String, default: '' },
    admissionDate: { type: Date },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// High performance compound indexes for deduplication and rapid application review
AdmissionApplicationSchema.index({ studentName: 1, parentPhone: 1, gradeApplying: 1 });
AdmissionApplicationSchema.index({ status: 1, appliedAt: -1 });

export const AdmissionApplication = model<IAdmissionApplication>(
  'AdmissionApplication',
  AdmissionApplicationSchema
);
