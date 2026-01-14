import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IDCardField, CategoryType, getDefaultFields } from '@/types/idCard';

export interface BatchRecord {
  id: string;
  fields: IDCardField[];
  profilePhoto: string | null;
  status: 'pending' | 'generated' | 'error';
}

interface BatchCSVImportProps {
  category: CategoryType;
  onRecordsImported: (records: BatchRecord[]) => void;
  existingRecords: BatchRecord[];
}

const BatchCSVImport: React.FC<BatchCSVImportProps> = ({
  category,
  onRecordsImported,
  existingRecords,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const parseCSV = useCallback((csvText: string): BatchRecord[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const defaultFields = getDefaultFields(category);

    const records: BatchRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      
      if (values.length === 0 || (values.length === 1 && !values[0])) continue;

      const fields = defaultFields.map((field) => {
        // Try to match header with field key or label
        const headerIndex = headers.findIndex(
          (h) =>
            h === field.key.toLowerCase() ||
            h === field.label.toLowerCase() ||
            h.replace(/\s+/g, '') === field.key.toLowerCase() ||
            h.replace(/\s+/g, '') === field.label.toLowerCase().replace(/\s+/g, '')
        );

        return {
          ...field,
          value: headerIndex !== -1 ? values[headerIndex] || '' : '',
        };
      });

      // Check for photo URL column
      const photoIndex = headers.findIndex((h) => 
        h.includes('photo') || h.includes('image') || h.includes('picture')
      );

      records.push({
        id: `batch-${Date.now()}-${i}`,
        fields,
        profilePhoto: photoIndex !== -1 ? values[photoIndex] || null : null,
        status: 'pending',
      });
    }

    return records;
  }, [category]);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const records = parseCSV(csvText);
        
        if (records.length === 0) {
          toast.error('No valid records found in CSV');
          return;
        }

        onRecordsImported([...existingRecords, ...records]);
        toast.success(`Imported ${records.length} records`);
      } catch (error) {
        console.error('CSV parsing error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to parse CSV');
      }
    };
    reader.readAsText(file);
  }, [parseCSV, onRecordsImported, existingRecords]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const downloadTemplate = useCallback(() => {
    const fields = getDefaultFields(category);
    const headers = fields.map((f) => f.label).join(',');
    const exampleRow = fields.map((f) => {
      if (f.key === 'name') return 'John Doe';
      if (f.key === 'dob') return '2000-01-15';
      if (f.key === 'phone') return '555-1234';
      if (f.key === 'bloodGroup') return 'O+';
      return '';
    }).join(',');
    
    const csv = `${headers}\n${exampleRow}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `id-card-template-${category}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  }, [category]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Batch Import (CSV)
        </h3>
        <Button variant="ghost" size="sm" onClick={downloadTemplate}>
          <Download className="w-3 h-3 mr-1" />
          Template
        </Button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
          }
        `}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag & drop a CSV file or
        </p>
        <label className="cursor-pointer">
          <Button variant="secondary" size="sm" asChild>
            <span>Browse Files</span>
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {existingRecords.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>{existingRecords.length} records ready for generation</span>
        </div>
      )}
    </div>
  );
};

export default BatchCSVImport;
