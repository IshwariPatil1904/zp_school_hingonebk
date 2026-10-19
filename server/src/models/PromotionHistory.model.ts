import { Schema, model, Document, Types } from 'mongoose';

export interface IPromotedStudentRecord {
  studentId: Types.ObjectId;
  grNumber: string;
  studentName: string;
  fromStandard: string;
  fromDivision: string;
  toStandard: string;
  toDivision: string;
  status: 'Promoted' | 'Repeated' | 'Skipped';
  reason?: string;
}

export interface IPromotionHistory extends Document {
  academicYear: string; // e.g., '2026-27'
  targetAcademicYear: string; // e.g., '2027-28'
  fromStandard: string;
  fromDivision: string;
  toStandard: string;
  toDivision: string;
  promotedBy: string; // Principal Name
  promotedById: Types.ObjectId;
  promotionDate: Date;
  totalStudents: number;
  promotedCount: number;
  repeatedCount: number;
  skippedCount: number;
  studentRecords: IPromotedStudentRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const PromotedStudentRecordSchema = new Schema<IPromotedStudentRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    grNumber: { type: String, required: true },
    studentName: { type: String, required: true },
    fromStandard: { type: String, required: true },
    fromDivision: { type: String, default: 'A' },
    toStandard: { type: String, required: true },
    toDivision: { type: String, default: 'A' },
    status: {
      type: String,
      enum: ['Promoted', 'Repeated', 'Skipped'],
      default: 'Promoted',
    },
    reason: { type: String, default: 'वार्षिक प्रगती समाधानकारक (Regular Annual Promotion)' },
  },
  { _id: false }
);

const PromotionHistorySchema = new Schema<IPromotionHistory>(
  {
    academicYear: { type: String, required: true, index: true },
    targetAcademicYear: { type: String, required: true, index: true },
    fromStandard: { type: String, required: true },
    fromDivision: { type: String, default: 'ALL' },
    toStandard: { type: String, required: true },
    toDivision: { type: String, default: 'A' },
    promotedBy: { type: String, required: true },
    promotedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    promotionDate: { type: Date, default: Date.now },
    totalStudents: { type: Number, required: true, default: 0 },
    promotedCount: { type: Number, required: true, default: 0 },
    repeatedCount: { type: Number, required: true, default: 0 },
    skippedCount: { type: Number, required: true, default: 0 },
    studentRecords: [PromotedStudentRecordSchema],
  },
  { timestamps: true }
);

export const PromotionHistory = model<IPromotionHistory>(
  'PromotionHistory',
  PromotionHistorySchema
);
