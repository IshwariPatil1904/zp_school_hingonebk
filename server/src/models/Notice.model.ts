import { Schema, model, Document } from 'mongoose';

export type NoticeCategory = 'GENERAL' | 'ACADEMIC' | 'EVENT' | 'EXAM' | 'HOLIDAY' | 'ADMINISTRATIVE';

export interface INotice extends Document {
  title: string;
  content: string;
  category: NoticeCategory;
  date: Date;
  isImportant: boolean;
  isActive: boolean;
  publishedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
    },
    category: {
      type: String,
      enum: ['GENERAL', 'ACADEMIC', 'EVENT', 'EXAM', 'HOLIDAY', 'ADMINISTRATIVE'],
      default: 'GENERAL',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    publishedBy: {
      type: String,
      default: 'Headmaster Office',
    },
  },
  {
    timestamps: true,
  }
);

export const Notice = model<INotice>('Notice', NoticeSchema);
