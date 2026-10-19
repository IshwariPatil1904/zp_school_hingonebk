import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../config/permissions';

export interface ITeacherProfile {
  employeeId?: string;
  qualification?: string;
  joiningDate?: Date;
  assignedClasses?: string[];
  subjectSpecialization?: string[];
}

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password?: string;
  role: UserRole;
  teacherProfile?: ITeacherProfile;
  phone?: string;
  dateOfBirth?: Date;
  residentialAddress?: string;
  bloodGroup?: string;
  designation: string;
  avatar?: string;
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherProfileSchema = new Schema<ITeacherProfile>(
  {
    employeeId: { type: String, trim: true, default: '' },
    qualification: { type: String, trim: true, default: '' },
    joiningDate: { type: Date },
    assignedClasses: { type: [String], default: [] },
    subjectSpecialization: { type: [String], default: [] },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Staff member full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['principal', 'teacher'],
      default: 'teacher',
      required: [true, 'Staff role is required'],
      index: true,
    },
    teacherProfile: {
      type: TeacherProfileSchema,
      default: undefined,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: () => new Date('1985-05-15'),
    },
    residentialAddress: {
      type: String,
      trim: true,
      default: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव - ४२५१०५',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'],
      default: 'B+',
    },
    designation: {
      type: String,
      default: 'Primary Teacher',
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', UserSchema);
