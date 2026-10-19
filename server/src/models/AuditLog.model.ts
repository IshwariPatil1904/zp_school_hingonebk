import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  entityType: string;
  entityId: string;
  voucherNo?: string;
  amount?: number;
  performedBy: string;
  performedByRole: string;
  reason?: string;
  details: string;
  timestamp: Date;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: { type: String, required: true, default: 'General' },
    entityId: { type: String, required: true, index: true },
    voucherNo: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    performedBy: { type: String, required: true },
    performedByRole: { type: String, required: true },
    reason: { type: String, default: '' },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
