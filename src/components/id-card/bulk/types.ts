import { IDCardField, CategoryType, IDCardConfig } from '@/types/idCard';

export interface BulkRecord {
  id: string;
  rowIndex: number;
  fields: IDCardField[];
  profilePhoto: string | null;
  photoMatched: boolean;
  status: 'pending' | 'validated' | 'generating' | 'generated' | 'error';
  errorMessage?: string;
  generatedImage?: string;
  syncValidated?: boolean;
}

export interface PhotoMapping {
  studentId: string;
  photoUrl: string;
  fileName: string;
}

export interface BulkConfig extends Omit<IDCardConfig, 'fields' | 'profilePhoto'> {
  // Global design settings applied to all cards
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recordsValidated: number;
  photosMatched: number;
  photosMissing: number;
}

export interface ExportProgress {
  current: number;
  total: number;
  phase: 'validating' | 'generating' | 'packaging' | 'complete';
  message: string;
}
