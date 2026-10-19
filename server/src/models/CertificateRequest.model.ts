import mongoose, { Document, Schema } from 'mongoose';

export type CertificateType =
  | 'Bonafide Certificate'
  | 'Leaving Certificate'
  | 'Scholarship Certificate'
  | 'बोनाफाईड प्रमाणपत्र (Bonafide)'
  | 'शाळा सोडल्याचा दाखला (Leaving TC)'
  | 'निर्गम उतारा (Nirgam Utara)'
  | 'हजेरी प्रमाणपत्र (Attendance)';

export interface ICertificateRequest extends Document {
  certificateNo: string;
  studentId?: mongoose.Types.ObjectId;
  studentName: string;
  grNumber: string;
  classGrade: string;
  division: string;
  type: string;
  reason: string;
  purpose?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string; // Teacher's name / role
  approvedBy?: string; // Principal's name
  requestedDate: Date;
  approvedDate?: Date;
  rejectedBy?: string;
  rejectedDate?: Date;
  rejectionReason?: string;

  // Leaving Certificate specifics
  leavingDate?: Date;
  reasonForLeaving?: string;
  conduct?: string;
  progress?: string;
  dateOfBirthInWords?: string;
  nationality?: string;

  // Scholarship Certificate specifics
  scholarshipSchemeName?: string;
  sanctionAmount?: number;
  academicYear?: string;
  verificationNote?: string;

  // Download & Audit integrity
  downloadCount: number;
  lastDownloadedAt?: Date;
  templateVersion?: number;
  templateConfigSnapshot?: any;

  createdAt: Date;
  updatedAt: Date;
}

const CertificateRequestSchema = new Schema<ICertificateRequest>(
  {
    certificateNo: { type: String, required: true, unique: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    studentName: { type: String, required: true },
    grNumber: { type: String, required: true },
    classGrade: { type: String, required: true },
    division: { type: String, default: 'A' },
    type: {
      type: String,
      required: true,
    },
    reason: { type: String, default: 'शिष्यवृत्ती व अधिकृत कामासाठी' },
    purpose: { type: String, default: '' },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    requestedBy: { type: String, required: true },
    approvedBy: { type: String, default: '' },
    requestedDate: { type: Date, default: Date.now },
    approvedDate: { type: Date },
    rejectedBy: { type: String, default: '' },
    rejectedDate: { type: Date },
    rejectionReason: { type: String, default: '' },

    // Leaving Certificate fields
    leavingDate: { type: Date },
    reasonForLeaving: { type: String, default: '' },
    conduct: { type: String, default: 'उत्कृष्ट (Excellent)' },
    progress: { type: String, default: 'समाधानकारक (Satisfactory)' },
    dateOfBirthInWords: { type: String, default: '' },
    nationality: { type: String, default: 'भारतीय (Indian)' },

    // Scholarship Certificate fields
    scholarshipSchemeName: { type: String, default: '' },
    sanctionAmount: { type: Number, default: 0 },
    academicYear: { type: String, default: '2026-27' },
    verificationNote: { type: String, default: '' },

    // Integrity tracking
    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date },
    templateVersion: { type: Number, default: 1 },
    templateConfigSnapshot: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const CertificateRequest = mongoose.model<ICertificateRequest>(
  'CertificateRequest',
  CertificateRequestSchema
);
