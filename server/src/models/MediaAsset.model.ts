import { Schema, model, Document } from 'mongoose';

export interface IMediaAsset extends Document {
  title: string;
  originalName: string;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  category: 'gallery' | 'principal' | 'school' | 'notice' | 'activity' | 'other';
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    title: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true, default: 'image/jpeg' },
    sizeBytes: { type: Number, required: true, default: 0 },
    category: {
      type: String,
      enum: ['gallery', 'principal', 'school', 'notice', 'activity', 'other'],
      default: 'school',
      index: true,
    },
    uploadedBy: { type: String, required: true, default: 'मुख्याध्यापक' },
  },
  { timestamps: true }
);

export const MediaAsset = model<IMediaAsset>('MediaAsset', MediaAssetSchema);
