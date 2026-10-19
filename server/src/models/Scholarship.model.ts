import { Schema, model, Document } from 'mongoose';

export interface IScholarship extends Document {
  schemeName: string;
  marathiName: string;
  code: string;
  category: string;
  description: string;
  marathiDescription: string;
  applicableGrades: string;
  applicableStandards: string[];
  beneficiaryGroup: string;
  applicableCategories: string[];
  incomeLimit: number; // 0 or null if no ceiling
  genderRequirement: 'ALL' | 'मुलगी' | 'मुलगा';
  minorityRequirement: 'ALL' | 'None' | 'Linguistic Minority' | 'Religious Minority' | 'ANY_MINORITY';
  cwsnRequirement: 'ALL' | 'CWSN_ONLY' | 'NON_CWSN';
  bplRequirement: 'ALL' | 'BPL_ONLY';
  occupationKeyword?: string;
  minAttendancePercentage?: number;
  minPreviousMarks?: number;
  benefitAmount: string;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  applicationSteps: string;
  officialUrl: string;
  academicYear: string;
  applicationStartDate: Date;
  applicationEndDate: Date;
  isActive: boolean;
  isPublic: boolean;
  eligibleCount: number;
  ineligibleCount: number;
  reviewCount: number;
  approvedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScholarshipSchema = new Schema<IScholarship>(
  {
    schemeName: {
      type: String,
      required: [true, 'Scholarship scheme name is required'],
      trim: true,
    },
    marathiName: {
      type: String,
      required: [true, 'Marathi scheme name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Pre-Matric',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    marathiDescription: {
      type: String,
      default: '',
    },
    applicableGrades: {
      type: String,
      required: true,
    },
    applicableStandards: {
      type: [String],
      default: [],
    },
    beneficiaryGroup: {
      type: String,
      required: true,
    },
    applicableCategories: {
      type: [String],
      default: ['ALL'],
    },
    incomeLimit: {
      type: Number,
      default: 0,
    },
    genderRequirement: {
      type: String,
      enum: ['ALL', 'मुलगी', 'मुलगा'],
      default: 'ALL',
    },
    minorityRequirement: {
      type: String,
      default: 'ALL',
    },
    cwsnRequirement: {
      type: String,
      default: 'ALL',
    },
    bplRequirement: {
      type: String,
      default: 'ALL',
    },
    occupationKeyword: {
      type: String,
      default: '',
    },
    minAttendancePercentage: {
      type: Number,
      default: 0,
    },
    minPreviousMarks: {
      type: Number,
      default: 0,
    },
    benefitAmount: {
      type: String,
      required: true,
    },
    eligibilityCriteria: {
      type: [String],
      default: [],
    },
    requiredDocuments: {
      type: [String],
      default: [],
    },
    applicationSteps: {
      type: String,
      required: true,
    },
    officialUrl: {
      type: String,
      default: 'https://mahadbt.maharashtra.gov.in/',
    },
    academicYear: {
      type: String,
      default: '2026-27',
    },
    applicationStartDate: {
      type: Date,
      default: () => new Date('2026-06-15'),
    },
    applicationEndDate: {
      type: Date,
      default: () => new Date('2026-11-30'),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    eligibleCount: {
      type: Number,
      default: 0,
    },
    ineligibleCount: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    approvedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Scholarship = model<IScholarship>('Scholarship', ScholarshipSchema);
