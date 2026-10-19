import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicRecord {
  academicYear: string;
  standard: string;
  division: string;
  status: 'Admitted' | 'Promoted' | 'Repeated' | 'Transferred' | 'Graduated';
  promotedDate: Date;
  promotedBy: string;
  remarks?: string;
}

export interface IStudent extends Document {
  // Academic Progression History
  academicHistory?: IAcademicRecord[];

  // General Profile
  grNumber: string; // Student / Admission ID
  name: string;
  aadhaarNumber: string;
  dateOfBirth: Date;
  gender: 'मुलगा' | 'मुलगी' | 'इतर';
  motherTongue: string;
  religion: string;
  caste: string;
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'NT' | 'SBC';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-' | 'Unknown';

  // Family Details
  fatherName: string;
  motherName: string;
  guardianName: string;
  parentsOccupation: string;
  annualFamilyIncome: number;
  isBpl: boolean;
  bplNumber?: string;
  minorityStatus: 'None' | 'Linguistic Minority' | 'Religious Minority';

  // Contact and Address
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
  penNumber: string; // Permanent Education Number
  admissionDate: Date;
  studentType: 'Fresher' | 'Transfer' | 'Repeater';
  entryStandard: string;
  currentStandard: string;
  classGrade: string; // Backward compatibility
  division: 'A' | 'B';
  mediumOfInstruction: 'मराठी' | 'सेमी-इंग्रजी' | 'मराठी (Marathi)' | 'इंग्रजी';
  previousYearMarks: number;
  attendancePercentage: number;
  scholarshipScheme?: string;

  // Bank Details
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;

  // Health and CWSN
  isCwsn: boolean;
  cwsnDisabilityType?: string;
  heightCm: number;
  weightKg: number;

  isActive: boolean;
  admissionYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    // General Profile
    grNumber: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    aadhaarNumber: { type: String, required: true, default: 'XXXXXXXXXXXX' },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true, enum: ['मुलगा', 'मुलगी', 'इतर'], default: 'मुलगा' },
    motherTongue: { type: String, default: 'मराठी' },
    religion: { type: String, default: 'हिंदू' },
    caste: { type: String, default: 'मराठा' },
    category: {
      type: String,
      required: true,
      enum: ['General', 'OBC', 'SC', 'ST', 'NT', 'SBC'],
      default: 'OBC',
      index: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'],
      default: 'B+',
    },

    // Family Details
    fatherName: { type: String, required: true },
    motherName: { type: String, default: 'आई' },
    guardianName: { type: String, default: '' },
    parentsOccupation: { type: String, default: 'शेतकरी / शेतमजूर' },
    annualFamilyIncome: { type: Number, default: 45000 },
    isBpl: { type: Boolean, default: false },
    bplNumber: { type: String, default: '' },
    minorityStatus: {
      type: String,
      enum: ['None', 'Linguistic Minority', 'Religious Minority'],
      default: 'None',
    },

    // Contact and Address
    houseNumber: { type: String, default: 'घर क्र. १२' },
    village: { type: String, default: 'हिंगोणे बु.' },
    taluka: { type: String, default: 'धरणगाव' },
    district: { type: String, default: 'जळगाव' },
    pincode: { type: String, default: '425105' },
    primaryPhone: { type: String, required: true },
    secondaryPhone: { type: String, default: '' },
    residentialAddress: {
      type: String,
      default: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव - ४२५१०५',
    },

    // Academic / SARAL
    saralId: { type: String, required: true, index: true },
    penNumber: { type: String, required: true, index: true },
    admissionDate: { type: Date, default: () => new Date('2024-06-15') },
    studentType: {
      type: String,
      enum: ['Fresher', 'Transfer', 'Repeater'],
      default: 'Fresher',
    },
    entryStandard: { type: String, default: 'इयत्ता १ ली' },
    currentStandard: { type: String, required: true, index: true },
    classGrade: { type: String, required: true, index: true },
    division: { type: String, enum: ['A', 'B'], default: 'A', index: true },
    mediumOfInstruction: {
      type: String,
      enum: ['मराठी', 'सेमी-इंग्रजी', 'मराठी (Marathi)', 'इंग्रजी'],
      default: 'मराठी',
    },
    previousYearMarks: { type: Number, default: 85.0 },
    attendancePercentage: { type: Number, default: 95 },
    scholarshipScheme: { type: String, default: '' },

    // Bank Details
    bankAccountHolder: { type: String, default: '' },
    bankName: { type: String, default: 'बँक ऑफ महाराष्ट्र (Bank of Maharashtra)' },
    bankAccountNumber: { type: String, default: '' },
    bankIfsc: { type: String, default: 'MAHB0000412' },

    // Health and CWSN
    isCwsn: { type: Boolean, default: false },
    cwsnDisabilityType: { type: String, default: 'None' },
    heightCm: { type: Number, default: 118 },
    weightKg: { type: Number, default: 21 },

    isActive: { type: Boolean, default: true, index: true },
    admissionYear: { type: String, default: '2026-27' },
    academicHistory: [
      {
        academicYear: { type: String, required: true },
        standard: { type: String, required: true },
        division: { type: String, default: 'A' },
        status: {
          type: String,
          enum: ['Admitted', 'Promoted', 'Repeated', 'Transferred', 'Graduated'],
          default: 'Promoted',
        },
        promotedDate: { type: Date, default: Date.now },
        promotedBy: { type: String, default: 'मुख्याध्यापक' },
        remarks: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

// High-performance compound indexes for class roster, promotions, and reports
StudentSchema.index({ currentStandard: 1, division: 1 });
StudentSchema.index({ currentStandard: 1, gender: 1 });
StudentSchema.index({ category: 1, gender: 1 });

// Pre-save hook to ensure classGrade and currentStandard are in sync
StudentSchema.pre('save', function (next) {
  if (this.currentStandard && !this.classGrade) {
    this.classGrade = this.currentStandard;
  } else if (this.classGrade && !this.currentStandard) {
    this.currentStandard = this.classGrade;
  }
  next();
});

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
