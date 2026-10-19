import { Schema, model, Document, Types } from 'mongoose';

export type EligibilityStatus = 'Eligible' | 'Not Eligible' | 'Needs Review';

export interface IScholarshipEligibility extends Document {
  studentId: Types.ObjectId;
  studentGrNumber: string;
  studentName: string;
  standard: string;
  division: string;
  category: string;
  gender: string;
  annualIncome: number;
  schemeId: Types.ObjectId;
  schemeCode: string;
  schemeName: string;
  academicYear: string;
  status: EligibilityStatus;
  reasons: string[];
  missingInfo: string[];
  isApprovedByPrincipal: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  evaluatedAt: Date;
  ruleVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScholarshipEligibilitySchema = new Schema<IScholarshipEligibility>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentGrNumber: {
      type: String,
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      index: true,
    },
    standard: {
      type: String,
      required: true,
      index: true,
    },
    division: {
      type: String,
      default: 'A',
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    gender: {
      type: String,
      required: true,
    },
    annualIncome: {
      type: Number,
      default: 0,
    },
    schemeId: {
      type: Schema.Types.ObjectId,
      ref: 'Scholarship',
      required: true,
      index: true,
    },
    schemeCode: {
      type: String,
      required: true,
      index: true,
    },
    schemeName: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      default: '2026-27',
      index: true,
    },
    status: {
      type: String,
      enum: ['Eligible', 'Not Eligible', 'Needs Review'],
      required: true,
      index: true,
    },
    reasons: {
      type: [String],
      default: [],
    },
    missingInfo: {
      type: [String],
      default: [],
    },
    isApprovedByPrincipal: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: String,
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
    ruleVersion: {
      type: String,
      default: 'v1.0.26',
    },
  },
  {
    timestamps: true,
  }
);

ScholarshipEligibilitySchema.index(
  { studentId: 1, schemeId: 1, academicYear: 1 },
  { unique: true }
);

export const ScholarshipEligibility = model<IScholarshipEligibility>(
  'ScholarshipEligibility',
  ScholarshipEligibilitySchema
);
