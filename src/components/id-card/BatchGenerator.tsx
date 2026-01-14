import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Download, Trash2, Play, Loader2, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { IDCardConfig } from '@/types/idCard';
import { BatchRecord } from './BatchCSVImport';
import IDCardPreview from './IDCardPreview';

interface BatchGeneratorProps {
  records: BatchRecord[];
  baseConfig: IDCardConfig;
  onRecordsUpdate: (records: BatchRecord[]) => void;
  onClearRecords: () => void;
}

const BatchGenerator: React.FC<BatchGeneratorProps> = ({
  records,
  baseConfig,
  onRecordsUpdate,
  onClearRecords,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const generatedImages = useRef<{ name: string; dataUrl: string }[]>([]);

  const generateCard = useCallback(async (record: BatchRecord): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Small delay to allow React to render
      setTimeout(async () => {
        if (!hiddenCardRef.current) {
          reject(new Error('Card ref not available'));
          return;
        }

        try {
          const dataUrl = await toPng(hiddenCardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
          });
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  }, []);

  const handleGenerateAll = useCallback(async () => {
    if (records.length === 0) return;

    setIsGenerating(true);
    setProgress(0);
    generatedImages.current = [];
    const updatedRecords = [...records];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      setPreviewIndex(i);

      // Wait for render
      await new Promise((r) => setTimeout(r, 200));

      try {
        const dataUrl = await generateCard(record);
        const name = record.fields.find((f) => f.key === 'name')?.value || `Card-${i + 1}`;
        generatedImages.current.push({ name, dataUrl });
        updatedRecords[i] = { ...record, status: 'generated' };
      } catch (error) {
        console.error(`Error generating card ${i + 1}:`, error);
        updatedRecords[i] = { ...record, status: 'error' };
      }

      setProgress(((i + 1) / records.length) * 100);
      onRecordsUpdate([...updatedRecords]);
    }

    setPreviewIndex(null);
    setIsGenerating(false);

    const successCount = updatedRecords.filter((r) => r.status === 'generated').length;
    const errorCount = updatedRecords.filter((r) => r.status === 'error').length;

    if (successCount > 0) {
      toast.success(`Generated ${successCount} ID cards${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
    } else {
      toast.error('Failed to generate ID cards');
    }
  }, [records, generateCard, onRecordsUpdate]);

  const handleDownloadAll = useCallback(() => {
    if (generatedImages.current.length === 0) {
      toast.error('No generated cards to download');
      return;
    }

    generatedImages.current.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `${img.name.replace(/\s+/g, '-')}-ID-Card.png`;
        link.href = img.dataUrl;
        link.click();
      }, index * 200); // Stagger downloads
    });

    toast.success(`Downloading ${generatedImages.current.length} ID cards`);
  }, []);

  const removeRecord = useCallback((id: string) => {
    onRecordsUpdate(records.filter((r) => r.id !== id));
  }, [records, onRecordsUpdate]);

  const getStatusIcon = (status: BatchRecord['status']) => {
    switch (status) {
      case 'generated':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const currentRecord = previewIndex !== null ? records[previewIndex] : null;
  const currentConfig: IDCardConfig | null = currentRecord
    ? {
        ...baseConfig,
        fields: currentRecord.fields,
        profilePhoto: currentRecord.profilePhoto || baseConfig.profilePhoto,
      }
    : null;

  const generatedCount = records.filter((r) => r.status === 'generated').length;

  if (records.length === 0) return null;

  return (
    <div className="space-y-3">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto">
              <h3 className="text-sm font-medium text-foreground">
                Batch Records ({records.length})
              </h3>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <div className="flex gap-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearRecords}
              disabled={isGenerating}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <CollapsibleContent className="mt-3 space-y-3">
          {/* Records List */}
          <ScrollArea className="h-[200px] border border-border rounded-lg">
            <div className="p-2 space-y-1">
              {records.map((record, index) => {
                const name = record.fields.find((f) => f.key === 'name')?.value || `Record ${index + 1}`;
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-6">{index + 1}.</span>
                      <span className="font-medium truncate max-w-[150px]">{name}</span>
                      {getStatusIcon(record.status)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeRecord(record.id)}
                      disabled={isGenerating}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Generating...</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate All ({records.length})
                </>
              )}
            </Button>
            {generatedCount > 0 && (
              <Button
                variant="secondary"
                onClick={handleDownloadAll}
                disabled={isGenerating}
              >
                <Download className="w-4 h-4 mr-2" />
                Download ({generatedCount})
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Hidden card for rendering */}
      {currentConfig && (
        <div className="fixed -left-[9999px] -top-[9999px]">
          <IDCardPreview ref={hiddenCardRef} config={currentConfig} />
        </div>
      )}
    </div>
  );
};

export default BatchGenerator;
