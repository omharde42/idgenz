import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { IDCardConfig, CategoryType, getDefaultFields, signatoryTitles, IDCardField } from '@/types/idCard';
import CategorySelector from '@/components/id-card/CategorySelector';
import FieldsManager from '@/components/id-card/FieldsManager';
import DesignControls from '@/components/id-card/DesignControls';
import ImageUploads from '@/components/id-card/ImageUploads';
import IDCardPreview from '@/components/id-card/IDCardPreview';
import ActionButtons from '@/components/id-card/ActionButtons';
import DesignSuggestions from '@/components/id-card/DesignSuggestions';
import ExtractDataFromPhoto from '@/components/id-card/ExtractDataFromPhoto';
import BatchCSVImport, { BatchRecord } from '@/components/id-card/BatchCSVImport';
import BatchGenerator from '@/components/id-card/BatchGenerator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const getInitialConfig = (category: CategoryType): IDCardConfig => ({
  category,
  institutionName: '',
  institutionAddress: '',
  layout: 'vertical',
  cardShape: 'rounded',
  headerColor: '#2563eb',
  footerColor: '#1e40af',
  photoSize: 90,
  fields: getDefaultFields(category),
  profilePhoto: null,
  institutionLogo: null,
  authorizedSignature: null,
  backgroundImage: null,
  showQRCode: true,
  signatoryTitle: signatoryTitles[category],
});

const Index = () => {
  const [config, setConfig] = useState<IDCardConfig>(getInitialConfig('school'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchRecords, setBatchRecords] = useState<BatchRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCategoryChange = useCallback((category: CategoryType) => {
    setConfig((prev) => ({
      ...prev,
      category,
      fields: getDefaultFields(category),
      signatoryTitle: signatoryTitles[category],
    }));
  }, []);

  const handleConfigUpdate = useCallback((updates: Partial<IDCardConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleDataExtracted = useCallback((updates: Partial<IDCardConfig>, fields: IDCardField[]) => {
    setConfig((prev) => ({ ...prev, ...updates, fields }));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      const name = config.fields.find((f) => f.key === 'name')?.value || 'ID-Card';
      link.download = `${name.replace(/\s+/g, '-')}-ID-Card.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('ID Card downloaded successfully!');
    } catch (error) {
      console.error('Error generating ID card:', error);
      toast.error('Failed to generate ID card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [config.fields]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleReset = useCallback(() => {
    setConfig(getInitialConfig(config.category));
    toast.info('Form has been reset');
  }, [config.category]);

  const handleBatchRecordsImported = useCallback((records: BatchRecord[]) => {
    setBatchRecords(records);
  }, []);

  const handleClearBatchRecords = useCallback(() => {
    setBatchRecords([]);
    toast.info('Batch records cleared');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <CreditCard className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ID Card Generator</h1>
              <p className="text-sm text-muted-foreground">
                Create professional ID cards for any institution or event
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Controls */}
          <div className="w-full lg:w-[420px] flex-shrink-0">
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="p-5 space-y-6">
                  {/* Category Selection */}
                  <CategorySelector
                    selected={config.category}
                    onChange={handleCategoryChange}
                  />

                  {/* Mode Tabs */}
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'single' | 'batch')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="single">Single Card</TabsTrigger>
                      <TabsTrigger value="batch">Batch Import</TabsTrigger>
                    </TabsList>

                    <TabsContent value="single" className="space-y-6 mt-4">
                      {/* AI Features */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                          ✨ AI Features
                        </h3>
                        <div className="grid gap-2">
                          <ExtractDataFromPhoto
                            category={config.category}
                            onDataExtracted={handleDataExtracted}
                            currentFields={config.fields}
                          />
                          <DesignSuggestions
                            category={config.category}
                            institutionName={config.institutionName}
                            currentColors={{
                              headerColor: config.headerColor,
                              footerColor: config.footerColor,
                            }}
                            onApplySuggestions={handleConfigUpdate}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Image Uploads */}
                      <ImageUploads config={config} onChange={handleConfigUpdate} />

                      <Separator />

                      {/* Fields Manager */}
                      <FieldsManager
                        fields={config.fields}
                        onChange={(fields) => handleConfigUpdate({ fields })}
                      />
                    </TabsContent>

                    <TabsContent value="batch" className="space-y-4 mt-4">
                      {/* Batch CSV Import */}
                      <BatchCSVImport
                        category={config.category}
                        onRecordsImported={handleBatchRecordsImported}
                        existingRecords={batchRecords}
                      />

                      {/* Batch Generator */}
                      <BatchGenerator
                        records={batchRecords}
                        baseConfig={config}
                        onRecordsUpdate={setBatchRecords}
                        onClearRecords={handleClearBatchRecords}
                      />

                      <Separator />

                      {/* Design Suggestions for batch */}
                      <DesignSuggestions
                        category={config.category}
                        institutionName={config.institutionName}
                        currentColors={{
                          headerColor: config.headerColor,
                          footerColor: config.footerColor,
                        }}
                        onApplySuggestions={handleConfigUpdate}
                      />
                    </TabsContent>
                  </Tabs>

                  <Separator />

                  {/* Design Controls - always visible */}
                  <DesignControls config={config} onChange={handleConfigUpdate} />
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col">
            <div className="bg-muted/50 rounded-xl border border-border p-6 flex-1 flex flex-col items-center justify-center min-h-[600px]">
              <p className="text-sm text-muted-foreground mb-6">Live Preview</p>
              
              {/* ID Card Preview */}
              <div className="print:m-0" id="id-card-preview">
                <IDCardPreview ref={cardRef} config={config} />
              </div>

              {/* Action Buttons */}
              <div className="mt-8 w-full max-w-md">
                <ActionButtons
                  onDownload={handleDownload}
                  onPrint={handlePrint}
                  onReset={handleReset}
                  isGenerating={isGenerating}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #id-card-preview,
          #id-card-preview * {
            visibility: visible;
          }
          #id-card-preview {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
