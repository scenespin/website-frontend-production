/**
 * Asset Bank Types (Frontend)
 * 
 * TypeScript types for Asset Bank feature - mirroring backend types.
 * Part of Feature 0099: Asset Bank - Digital Prop Department
 */

export type AssetCategory = 'prop' | 'vehicle' | 'furniture' | 'other';

export interface AssetImage {
  url: string;
  angle?: string;
  uploadedAt: string;
  s3Key?: string; // S3 key for regenerating presigned URLs when expired
  metadata?: {
    s3Key?: string;
    source?: string;
    createdIn?: 'creation' | 'production-hub';
    uploadMethod?: string;
    angle?: string;
    [key: string]: any; // Allow additional metadata fields
  };
}

export interface Asset {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  category: AssetCategory;
  description?: string;
  tags: string[];
  images: AssetImage[];
  has3DModel: boolean;
  model3DJobId?: string;
  createdAt: string;
  updatedAt: string;
  deleted_at?: number;
}

export interface CreateAssetRequest {
  projectId: string;
  name: string;
  category: AssetCategory;
  description?: string;
  tags?: string[];
}

export interface AssetCategoryMetadata {
  id: AssetCategory;
  label: string;
  icon: string;
  credits: number;
  priceUSD: string;
  examples: string;
  description: string;
}

export const ASSET_CATEGORY_METADATA: Record<AssetCategory, AssetCategoryMetadata> = {
  prop: {
    id: 'prop',
    label: 'Props & Small Items',
    icon: 'Package',
    credits: 300,
    priceUSD: '$3',
    examples: 'Weapons, phones, jewelry, books, tools, food items',
    description: 'Small objects and handheld props for scenes',
  },
  vehicle: {
    id: 'vehicle',
    label: 'Vehicles',
    icon: 'Car',
    credits: 700,
    priceUSD: '$7',
    examples: 'Cars, motorcycles, trucks, bicycles',
    description: 'Vehicles and transportation objects',
  },
  furniture: {
    id: 'furniture',
    label: 'Furniture & Equipment',
    icon: 'Armchair',
    credits: 700,
    priceUSD: '$7',
    examples: 'Chairs, tables, sofas, equipment, instruments',
    description: 'Furniture, equipment, and medium-sized objects',
  },
  other: {
    id: 'other',
    label: 'Other Objects',
    icon: 'Box',
    credits: 700,
    priceUSD: '$7',
    examples: 'Any other objects or items',
    description: 'Objects that don\'t fit other categories',
  },
};

