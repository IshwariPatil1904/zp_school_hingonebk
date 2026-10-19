import { Schema, model, Document } from 'mongoose';

export interface IGalleryImage {
  src: string;
  caption: string;
  marathiCaption: string;
}

export interface IGalleryAlbum extends Document {
  title: string;
  marathiTitle: string;
  category: string;
  year: string;
  description: string;
  coverImage: string;
  images: IGalleryImage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GalleryImageSchema = new Schema<IGalleryImage>(
  {
    src: { type: String, required: true },
    caption: { type: String, required: true },
    marathiCaption: { type: String, required: true },
  },
  { _id: false }
);

const GalleryAlbumSchema = new Schema<IGalleryAlbum>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    marathiTitle: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      required: true,
    },
    images: {
      type: [GalleryImageSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const GalleryAlbum = model<IGalleryAlbum>('GalleryAlbum', GalleryAlbumSchema);
