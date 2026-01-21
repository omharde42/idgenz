import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Upload, Settings, Users, X, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { IDCardConfig, CategoryType, getDefaultFields, signatoryTitles, defaultCardSizes, IDCardField } from '@/types/idCard';
import { BulkRecord, PhotoMapping } from './types';
import BulkDataImport from './BulkDataImport';
import BulkDesignControls from './BulkDesignControls';
import BulkRecordsList from './BulkRecordsList';
import BulkExporter from './BulkExporter';
import BulkCardPreview from './BulkCardPreview';
import ImageUploads from '../ImageUploads';

interface BulkGeneratorPanelProps {
  category: CategoryType;
  onClose: () => void;
}

const getInitialBulkConfig = (category: CategoryType): IDCardConfig => ({
  category,
  institutionName: '',
  institutionAddress: '',
  layout: 'vertical',
  cardShape: 'rounded',
  cardSize: defaultCardSizes[category],
  headerColor: '#2563eb',
  footerColor: '#1e40af',
  textColor: '#000000',
  photoSize: 90,
  fields: getDefaultFields(category),
  profilePhoto: null,
  institutionLogo: null,
  authorizedSignature: null,
  backgroundImage: null,
  showQRCode: true,
  signatoryTitle: signatoryTitles[category],
});

const BulkGeneratorPanel: React.FC<BulkGeneratorPanelProps> = ({ category, onClose }) => {
  const [config, setConfig] = useState<IDCardConfig>(getInitialBulkConfig(category));
  const [records, setRecords] = useState<BulkRecord[]>([]);
  const [photos, setPhotos] = useState<PhotoMapping[]>([]);
  const [activeTab, setActiveTab] = useState('data');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Match photos to records based on Student_ID
  useEffect(() => {
    if (photos.length === 0 || records.length === 0) return;

    const updatedRecords = records.map(record => {
      // Get student ID from fields
      const studentIdField = record.fields.find(f => 
        f.key === 'rollNo' || 
        f.key === 'enrollmentNo' || 
        f.key === 'employeeId' ||
        f.key === 'participantId'
      );
      
      if (!studentIdField?.value) return record;

      // Find matching photo
      const matchingPhoto = photos.find(p => 
        p.studentId.toLowerCase() === studentIdField.value.toLowerCase() ||
        p.studentId.toLowerCase().includes(studentIdField.value.toLowerCase()) ||
        studentIdField.value.toLowerCase().includes(p.studentId.toLowerCase())
      );

      if (matchingPhoto && !record.profilePhoto) {
        return {
          ...record,
          profilePhoto: matchingPhoto.photoUrl,
          photoMatched: true,
        };
      }

      return record;
    });

    // Only update if something changed
    const hasChanges = updatedRecords.some((r, i) => 
      r.profilePhoto !== records[i].profilePhoto || r.photoMatched !== records[i].photoMatched
    );

    if (hasChanges) {
      setRecords(updatedRecords);
      const matchedCount = updatedRecords.filter(r => r.photoMatched).length;
      if (matchedCount > 0) {
        toast.success(`Matched ${matchedCount} photos to records`);
      }
    }
  }, [photos, records]);

  // Auto-select first record when records are imported
  useEffect(() => {
    if (records.length > 0 && !selectedRecordId) {
      setSelectedRecordId(records[0].id);
    }
  }, [records, selectedRecordId]);

  const handleConfigUpdate = useCallback((updates: Partial<IDCardConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const handleRecordsImported = useCallback((newRecords: BulkRecord[]) => {
    setRecords(newRecords);
  }, []);

  const handlePhotosImported = useCallback((newPhotos: PhotoMapping[]) => {
    setPhotos(newPhotos);
  }, []);

  const handleRemoveRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecordId === id) {
      setSelectedRecordId(null);
    }
  }, [selectedRecordId]);

  const handleClearAll = useCallback(() => {
    setRecords([]);
    setPhotos([]);
    setSelectedRecordId(null);
    toast.info('All records cleared');
  }, []);

  const handleSelectRecord = useCallback((id: string) => {
    setSelectedRecordId(id);
  }, []);

  const handleUpdateRecord = useCallback((recordId: string, fields: typeof records[0]['fields'], profilePhoto?: string | null) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      return {
        ...r,
        fields,
        profilePhoto: profilePhoto !== undefined ? profilePhoto : r.profilePhoto,
        // Reset status since data changed
        status: 'pending' as const,
      };
    }));
  }, []);

  const isProcessing = useMemo(() => 
    records.some(r => r.status === 'generating'),
  [records]);

  const selectedRecord = useMemo(() => 
    records.find(r => r.id === selectedRecordId) || null,
  [records, selectedRecordId]);

  // Create preview config for selected record
  const previewConfig: IDCardConfig | null = useMemo(() => {
    if (!selectedRecord) return null;
    return {
      ...config,
      fields: selectedRecord.fields,
      profilePhoto: selectedRecord.profilePhoto || config.profilePhoto,
    };
  }, [selectedRecord, config]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Bulk ID Card Generator</h2>
              <p className="text-sm text-muted-foreground">Generate up to 1,000+ ID cards at once</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isProcessing}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="w-[380px] border-r border-border flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="data" className="text-xs">
                      <Upload className="w-3 h-3 mr-1" />
                      Data
                    </TabsTrigger>
                    <TabsTrigger value="design" className="text-xs">
                      <Settings className="w-3 h-3 mr-1" />
                      Design
                    </TabsTrigger>
                    <TabsTrigger value="images" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Assets
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="data" className="mt-4 space-y-4">
                    <BulkDataImport
                      category={category}
                      onRecordsImported={handleRecordsImported}
                      onPhotosImported={handlePhotosImported}
                      existingRecords={records}
                      existingPhotos={photos}
                    />
                  </TabsContent>

                  <TabsContent value="design" className="mt-4">
                    <BulkDesignControls
                      config={config}
                      onChange={handleConfigUpdate}
                    />
                  </TabsContent>

                  <TabsContent value="images" className="mt-4">
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Upload logo, signature, and background that apply to all cards.
                      </p>
                      <ImageUploads
                        config={config}
                        onChange={handleConfigUpdate}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>

            {/* Export Section */}
            <div className="p-4 border-t border-border bg-muted/30">
              <BulkExporter
                records={records}
                baseConfig={config}
                onRecordsUpdate={setRecords}
              />
            </div>
          </div>

          {/* Middle Panel - Records List */}
          <div className="w-[320px] border-r border-border flex flex-col">
            <div className="p-4 flex-1 overflow-hidden">
              {records.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Data Loaded</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Upload an Excel or CSV file with student data.
                  </p>
                  <div className="mt-4 text-xs text-muted-foreground space-y-1">
                    <p>✓ Supports .xlsx, .xls, .csv</p>
                    <p>✓ Auto-matches photos by ID</p>
                    <p>✓ Validates before export</p>
                  </div>
                </div>
              ) : (
                <BulkRecordsList
                  records={records}
                  selectedRecordId={selectedRecordId}
                  onSelectRecord={handleSelectRecord}
                  onRemoveRecord={handleRemoveRecord}
                  onClearAll={handleClearAll}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </div>

          {/* Right Panel - Card Preview */}
          <div className="flex-1 flex flex-col bg-muted/30">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Card Preview</span>
              {selectedRecord && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Record #{selectedRecord.rowIndex}
                </span>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <BulkCardPreview
                config={previewConfig}
                record={selectedRecord}
                totalRecords={records.length}
                currentIndex={selectedRecord ? records.findIndex(r => r.id === selectedRecord.id) : -1}
                onNavigate={(direction) => {
                  if (records.length === 0) return;
                  const currentIdx = records.findIndex(r => r.id === selectedRecordId);
                  let newIdx = direction === 'prev' 
                    ? (currentIdx - 1 + records.length) % records.length
                    : (currentIdx + 1) % records.length;
                  setSelectedRecordId(records[newIdx].id);
                }}
                onUpdateRecord={handleUpdateRecord}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkGeneratorPanel;
