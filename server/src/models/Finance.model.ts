import mongoose, { Document, Schema } from 'mongoose';

export interface IFinance extends Document {
  type: 'fund_received' | 'expense';
  title: string;
  amount: number;
  date: Date;
  voucherNo: string;
  approvedBy: string;
  notes?: string;
  status: 'Active' | 'Fully Utilized' | 'Expired' | 'Approved' | 'Disbursed' | 'Reversed';

  // Fund Specific Fields
  fundId?: string; // e.g. FND-2026-001, SS-CSG-2026-01
  schemeType?: string; // Scheme dropdown e.g. Samagra Shiksha - Composite School Grant
  issuedBy?: string; // Issuing authority e.g. Zilla Parishad Jalgaon
  issueDate?: Date;
  expiryDate?: Date; // Submission/utilization deadline
  utilizedAmount?: number;

  // Expense Specific Fields
  purpose?: string;
  billNumber?: string; // Invoice / Bill reference
  vendorName?: string;
  category: string; // e.g. School Maintenance, Sports, Educational Materials, etc.
  billDate?: Date;
  associatedFundId?: string; // Reference to fundId e.g. FND-2026-001
  associatedFundScheme?: string;
  billAttachment?: string; // File path or reference

  // Controlled Reversal / Correction fields
  reversalReason?: string;
  reversedBy?: string;
  reversedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const FinanceSchema = new Schema<IFinance>(
  {
    type: { type: String, required: true, enum: ['fund_received', 'expense'], index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than zero'] },
    date: { type: Date, default: Date.now, index: true },
    voucherNo: { type: String, required: true, unique: true, index: true },
    approvedBy: { type: String, default: 'Shri. S. R. Patil (Principal)' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Active', 'Fully Utilized', 'Expired', 'Approved', 'Disbursed', 'Reversed'],
      default: 'Active',
      index: true,
    },

    // Fund Fields
    fundId: { type: String, trim: true, sparse: true, index: true },
    schemeType: { type: String, default: '' },
    issuedBy: { type: String, default: '' },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    utilizedAmount: { type: Number, default: 0 },

    // Expense Fields
    purpose: { type: String, default: '' },
    billNumber: { type: String, default: '', index: true },
    vendorName: { type: String, default: '' },
    category: {
      type: String,
      required: true,
      default: 'Maintenance',
      index: true,
    },
    billDate: { type: Date },
    associatedFundId: { type: String, default: '', index: true },
    associatedFundScheme: { type: String, default: '' },
    billAttachment: { type: String, default: '' },

    // Reversal Fields
    reversalReason: { type: String, default: '' },
    reversedBy: { type: String, default: '' },
    reversedAt: { type: Date },
  },
  { timestamps: true }
);

// High-performance compound indexes for ledger, vendor queries, and balance aggregations
FinanceSchema.index({ type: 1, status: 1 });
FinanceSchema.index({ vendorName: 1, billNumber: 1 });
FinanceSchema.index({ type: 1, date: -1 });

export const Finance = mongoose.model<IFinance>('Finance', FinanceSchema);
