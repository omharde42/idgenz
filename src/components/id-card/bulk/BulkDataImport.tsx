import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Download, AlertCircle, CheckCircle, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IDCardField, CategoryType, getDefaultFields } from '@/types/idCard';
import { BulkRecord, PhotoMapping } from './types';
import * as XLSX from 'xlsx';

interface BulkDataImportProps {
  category: CategoryType;
  onRecordsImported: (records: BulkRecord[]) => void;
  onPhotosImported: (photos: PhotoMapping[]) => void;
  existingRecords: BulkRecord[];
  existingPhotos: PhotoMapping[];
}

const BulkDataImport: React.FC<BulkDataImportProps> = ({
  category,
  onRecordsImported,
  onPhotosImported,
  existingRecords,
  existingPhotos,
}) => {
  const [isDraggingData, setIsDraggingData] = useState(false);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const parseExcelOrCSV = useCallback((file: File): Promise<BulkRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let rows: any[][] = [];
          
          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const text = data as string;
            const lines = text.trim().split('\n');
            rows = lines.map(line => {
              // Handle quoted values with commas
              const values: string[] = [];
              let current = '';
              let inQuotes = false;
              
              for (const char of line) {
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  values.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              values.push(current.trim());
              return values;
            });
          } else {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          }
          
          if (rows.length < 2) {
            reject(new Error('File must have a header row and at least one data row'));
            return;
          }
          
          const headers = rows[0].map((h: any) => 
            String(h || '').trim().toLowerCase().replace(/['"]/g, '')
          );
          const defaultFields = getDefaultFields(category);
          
          const records: BulkRecord[] = [];
          
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;
            
            const values = row.map((v: any) => String(v || '').trim());
            
            const fields = defaultFields.map((field) => {
              // Match header with field key or label
              const headerIndex = headers.findIndex(
                (h: string) =>
                  h === field.key.toLowerCase() ||
                  h === field.label.toLowerCase() ||
                  h.replace(/[\s_-]+/g, '') === field.key.toLowerCase() ||
                  h.replace(/[\s_-]+/g, '') === field.label.toLowerCase().replace(/[\s_-]+/g, '')
              );
              
              return {
                ...field,
                value: headerIndex !== -1 ? values[headerIndex] || '' : '',
              };
            });
            
            // Check for Student_ID column to match photos
            const studentIdIndex = headers.findIndex((h: string) => 
              h.includes('student_id') || 
              h.includes('studentid') || 
              h.includes('roll') ||
              h.includes('enrollment') ||
              h.includes('employee_id') ||
              h.includes('employeeid') ||
              h === 'id'
            );
            
            const studentId = studentIdIndex !== -1 ? values[studentIdIndex] : '';
            
            // Check for photo URL column
            const photoIndex = headers.findIndex((h: string) => 
              h.includes('photo') || h.includes('image') || h.includes('picture')
            );
            
            records.push({
              id: `bulk-${Date.now()}-${i}`,
              rowIndex: i,
              fields,
              profilePhoto: photoIndex !== -1 && values[photoIndex] ? values[photoIndex] : null,
              photoMatched: false,
              status: 'pending',
            });
          }
          
          resolve(records);
        } catch (error) {
          reject(error);
        }
      };
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }, [category]);

  const handleDataFile = useCallback(async (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValid) {
      toast.error('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }
    
    setIsProcessing(true);
    try {
      const records = await parseExcelOrCSV(file);
      
      if (records.length === 0) {
        toast.error('No valid records found in file');
        return;
      }
      
      onRecordsImported([...existingRecords, ...records]);
      toast.success(`Imported ${records.length} records from ${file.name}`);
    } catch (error) {
      console.error('File parsing error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  }, [parseExcelOrCSV, onRecordsImported, existingRecords]);

  const handlePhotoFiles = useCallback(async (files: FileList) => {
    const photoMappings: PhotoMapping[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      
      // Extract student ID from filename (e.g., "S001.jpg" -> "S001")
      const fileName = file.name;
      const studentId = fileName.replace(/\.[^.]+$/, '').trim();
      
      // Convert to data URL
      const photoUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      photoMappings.push({
        studentId,
        photoUrl,
        fileName,
      });
    }
    
    if (photoMappings.length > 0) {
      onPhotosImported([...existingPhotos, ...photoMappings]);
      toast.success(`Imported ${photoMappings.length} photos`);
    }
  }, [onPhotosImported, existingPhotos]);

  const handleDataDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingData(false);
    const file = e.dataTransfer.files[0];
    if (file) handleDataFile(file);
  }, [handleDataFile]);

  const handlePhotoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhotos(false);
    if (e.dataTransfer.files.length > 0) {
      handlePhotoFiles(e.dataTransfer.files);
    }
  }, [handlePhotoFiles]);

  const downloadTemplate = useCallback(() => {
    const fields = getDefaultFields(category);
    const headers = ['Student_ID', ...fields.map((f) => f.label), 'Photo_URL'];
    const exampleRow = [
      'STU001',
      ...fields.map((f) => {
        if (f.key === 'name') return 'John Doe';
        if (f.key === 'dob') return '2010-01-15';
        if (f.key === 'phone') return '555-1234';
        if (f.key === 'bloodGroup') return 'O+';
        if (f.key === 'class') return '10-A';
        if (f.key === 'address') return '123 Main Street';
        if (f.key === 'emergencyContact') return '555-5678';
        return '';
      }),
      ''
    ];
    
    const csv = `${headers.join(',')}\n${exampleRow.join(',')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-id-card-template-${category}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  }, [category]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Bulk Data Import
        </h3>
        <Button variant="ghost" size="sm" onClick={downloadTemplate}>
          <Download className="w-3 h-3 mr-1" />
          Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Data File Upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingData(true); }}
          onDragLeave={() => setIsDraggingData(false)}
          onDrop={handleDataDrop}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center transition-colors
            ${isDraggingData 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
            }
          `}
        >
          <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground mb-2">
            Excel/CSV with student data
          </p>
          <label className="cursor-pointer">
            <Button variant="secondary" size="sm" asChild disabled={isProcessing}>
              <span>{isProcessing ? 'Processing...' : 'Upload Data File'}</span>
            </Button>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleDataFile(e.target.files[0])}
              className="hidden"
              disabled={isProcessing}
            />
          </label>
        </div>

        {/* Photo Upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingPhotos(true); }}
          onDragLeave={() => setIsDraggingPhotos(false)}
          onDrop={handlePhotoDrop}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center transition-colors
            ${isDraggingPhotos 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
            }
          `}
        >
          <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground mb-2">
            Photos named by Student_ID
          </p>
          <label className="cursor-pointer">
            <Button variant="secondary" size="sm" asChild>
              <span>Upload Photos</span>
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handlePhotoFiles(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-3 text-sm">
        {existingRecords.length > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-chart-2" />
            <span>{existingRecords.length} records loaded</span>
          </div>
        )}
        {existingPhotos.length > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Image className="w-4 h-4 text-primary" />
            <span>{existingPhotos.length} photos uploaded</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkDataImport;
