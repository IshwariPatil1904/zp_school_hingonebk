import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacher extends Document {
  // Personal Details
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: Date;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-' | 'Unknown';
  contactPhone: string;
  email: string;
  aadhaarNumber: string;
  residentialAddress: string;

  // Professional Details
  employeeId: string; // Sevaarth ID e.g. SEV-2015-0812
  designation: string;
  qualification: string;
  joiningDate: Date;
  assignedClasses: string[];
  subjectSpecialization: string[];
  experienceYears: number;
  linkedUserId?: mongoose.Types.ObjectId;

  // Health & Emergency Details
  medicalFitness: 'Fit' | 'Under Observation' | 'Exempted';
  emergencyContactName: string;
  emergencyContactPhone: string;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    name: { type: String, required: true, trim: true, index: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'], default: 'Female' },
    dateOfBirth: { type: Date, required: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'],
      default: 'B+',
    },
    contactPhone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    aadhaarNumber: { type: String, required: true, trim: true },
    residentialAddress: {
      type: String,
      default: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव - ४२५१०५',
    },

    employeeId: { type: String, required: true, unique: true, trim: true, index: true },
    designation: { type: String, required: true, default: 'Primary Teacher' },
    qualification: { type: String, required: true, default: 'M.A., D.Ed.' },
    joiningDate: { type: Date, required: true },
    assignedClasses: { type: [String], default: [] },
    subjectSpecialization: { type: [String], default: [] },
    experienceYears: { type: Number, required: true, default: 5 },
    linkedUserId: { type: Schema.Types.ObjectId, ref: 'User' },

    medicalFitness: {
      type: String,
      enum: ['Fit', 'Under Observation', 'Exempted'],
      default: 'Fit',
    },
    emergencyContactName: { type: String, default: 'कुटुंब संपर्क' },
    emergencyContactPhone: { type: String, default: '9823456789' },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
