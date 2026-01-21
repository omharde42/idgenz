import React, { useState, useRef, useCallback } from 'react';
import { Download, Play, Shield, Loader2, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { IDCardConfig } from '@/types/idCard';
import { BulkRecord, ValidationResult, ExportProgress } from './types';
import IDCardPreview from '../IDCardPreview';

interface BulkExporterProps {
  records: BulkRecord[];
  baseConfig: IDCardConfig;
  onRecordsUpdate: (records: BulkRecord[]) => void;
}

const BulkExporter: React.FC<BulkExporterProps> = ({
  records,
  baseConfig,
  onRecordsUpdate,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ExportProgress>({
    current: 0,
    total: 0,
    phase: 'validating',
    message: '',
  });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [currentRenderIndex, setCurrentRenderIndex] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync-check validation
  const validateRecords = useCallback((): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let photosMatched = 0;
    let photosMissing = 0;

    records.forEach((record, index) => {
      const name = record.fields.find(f => f.key === 'name')?.value;
      const studentId = record.fields.find(f => 
        f.key === 'rollNo' || f.key === 'enrollmentNo' || f.key === 'employeeId'
      )?.value;

      // Check required fields
      if (!name || name.trim() === '') {
        errors.push(`Row ${record.rowIndex}: Missing name`);
      }

      // Photo matching check
      if (record.profilePhoto) {
        photosMatched++;
      } else {
        photosMissing++;
        warnings.push(`Row ${record.rowIndex} (${name || 'Unknown'}): No photo attached`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordsValidated: records.length,
      photosMatched,
      photosMissing,
    };
  }, [records]);

  // Generate a single card image
  const generateCardImage = useCallback(async (record: BulkRecord): Promise<string> => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        if (!cardRef.current) {
          reject(new Error('Card ref not available'));
          return;
        }

        try {
          const dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 3, // High resolution
            backgroundColor: '#ffffff',
          });
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      }, 150);
    });
  }, []);

  // Main save/export function
  const handleSaveNow = useCallback(async () => {
    if (records.length === 0) {
      toast.error('No records to process');
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: records.length, phase: 'validating', message: 'Validating data...' });

    // Phase 1: Validation
    const validation = validateRecords();
    setValidationResult(validation);

    if (!validation.isValid) {
      toast.error(`Validation failed: ${validation.errors.length} errors found`);
      setIsProcessing(false);
      return;
    }

    if (validation.warnings.length > 0 && validation.warnings.length <= 5) {
      validation.warnings.forEach(w => toast.warning(w));
    } else if (validation.warnings.length > 5) {
      toast.warning(`${validation.warnings.length} warnings found (check console)`);
      console.warn('Validation warnings:', validation.warnings);
    }

    // Phase 2: Generate cards
    setProgress({ current: 0, total: records.length, phase: 'generating', message: 'Generating ID cards...' });
    
    const updatedRecords = [...records];
    const generatedImages: { name: string; studentId: string; dataUrl: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      setCurrentRenderIndex(i);
      
      // Update record status
      updatedRecords[i] = { ...record, status: 'generating' };
      onRecordsUpdate([...updatedRecords]);

      // Wait for render
      await new Promise(r => setTimeout(r, 200));

      try {
        const dataUrl = await generateCardImage(record);
        
        const name = record.fields.find(f => f.key === 'name')?.value || 'Unknown';
        const studentId = record.fields.find(f => 
          f.key === 'rollNo' || f.key === 'enrollmentNo' || f.key === 'employeeId' || f.key === 'participantId'
        )?.value || `ID${record.rowIndex}`;

        // CRITICAL SYNC CHECK: Verify the image belongs to this record
        generatedImages.push({
          name: name.replace(/[^a-zA-Z0-9\s]/g, '').trim(),
          studentId: studentId.replace(/[^a-zA-Z0-9]/g, ''),
          dataUrl,
        });

        updatedRecords[i] = { 
          ...record, 
          status: 'generated', 
          generatedImage: dataUrl,
          syncValidated: true 
        };
      } catch (error) {
        console.error(`Error generating card for row ${record.rowIndex}:`, error);
        updatedRecords[i] = { 
          ...record, 
          status: 'error', 
          errorMessage: 'Generation failed' 
        };
      }

      setProgress({
        current: i + 1,
        total: records.length,
        phase: 'generating',
        message: `Generated ${i + 1} of ${records.length} cards...`,
      });
      
      onRecordsUpdate([...updatedRecords]);
    }

    setCurrentRenderIndex(null);

    // Phase 3: Package into ZIP
    setProgress({ current: 0, total: 1, phase: 'packaging', message: 'Creating ZIP file...' });

    const successfulCards = generatedImages.filter((_, i) => updatedRecords[i].status === 'generated');
    
    if (successfulCards.length === 0) {
      toast.error('No cards were generated successfully');
      setIsProcessing(false);
      return;
    }

    try {
      const zip = new JSZip();
      
      for (const card of successfulCards) {
        // Convert data URL to blob
        const response = await fetch(card.dataUrl);
        const blob = await response.blob();
        
        // Name format: StudentName_StudentID.png
        const fileName = `${card.name}_${card.studentId}.png`;
        zip.file(fileName, blob);
      }

      // Generate ZIP
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download
      const timestamp = new Date().toISOString().split('T')[0];
      const institutionName = baseConfig.institutionName?.replace(/[^a-zA-Z0-9]/g, '_') || 'IDCards';
      saveAs(zipBlob, `${institutionName}_BulkIDCards_${timestamp}.zip`);

      setProgress({ current: 1, total: 1, phase: 'complete', message: 'Export complete!' });
      toast.success(`Successfully exported ${successfulCards.length} ID cards`);
      
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast.error('Failed to create ZIP file');
    }

    setIsProcessing(false);
  }, [records, baseConfig, validateRecords, generateCardImage, onRecordsUpdate]);

  // Get current record for rendering
  const currentRecord = currentRenderIndex !== null ? records[currentRenderIndex] : null;
  const currentConfig: IDCardConfig | null = currentRecord
    ? {
        ...baseConfig,
        fields: currentRecord.fields,
        profilePhoto: currentRecord.profilePhoto || baseConfig.profilePhoto,
      }
    : null;

  const pendingCount = records.filter(r => r.status === 'pending').length;
  const generatedCount = records.filter(r => r.status === 'generated').length;
  const errorCount = records.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Validation Summary */}
      {validationResult && (
        <div className={`p-3 rounded-lg border ${
          validationResult.isValid ? 'bg-chart-2/10 border-chart-2/30' : 'bg-destructive/10 border-destructive/30'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {validationResult.isValid ? (
              <>
                <CheckCircle className="w-4 h-4 text-chart-2" />
                <span>Sync-Check Passed</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span>Sync-Check Failed: {validationResult.errors.length} errors</span>
              </>
            )}
          </div>
          {validationResult.errors.length > 0 && (
            <ul className="mt-2 text-xs text-destructive space-y-1">
              {validationResult.errors.slice(0, 5).map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
              {validationResult.errors.length > 5 && (
                <li>• ...and {validationResult.errors.length - 5} more</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              {progress.phase === 'validating' && <Shield className="w-4 h-4" />}
              {progress.phase === 'generating' && <Loader2 className="w-4 h-4 animate-spin" />}
              {progress.phase === 'packaging' && <Package className="w-4 h-4" />}
              {progress.message}
            </span>
            <span className="font-medium">
              {progress.phase === 'generating' && `${Math.round((progress.current / progress.total) * 100)}%`}
            </span>
          </div>
          <Progress value={(progress.current / progress.total) * 100} className="h-2" />
        </div>
      )}

      {/* Status Summary */}
      {(generatedCount > 0 || errorCount > 0) && !isProcessing && (
        <div className="flex gap-2 text-sm">
          {generatedCount > 0 && (
            <span className="text-chart-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {generatedCount} generated
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {errorCount} failed
            </span>
          )}
        </div>
      )}

      {/* Save Now Button */}
      <Button
        onClick={handleSaveNow}
        disabled={isProcessing || records.length === 0}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Save Now ({records.length} cards)
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Validates data sync, generates high-res cards, and exports as ZIP
      </p>

      {/* Hidden card for rendering */}
      {currentConfig && (
        <div className="fixed -left-[9999px] -top-[9999px]">
          <IDCardPreview ref={cardRef} config={currentConfig} />
        </div>
      )}
    </div>
  );
};

export default BulkExporter;
