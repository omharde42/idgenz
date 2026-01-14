import React, { useState, useRef } from 'react';
import { Scan, Loader2, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CategoryType, IDCardConfig, IDCardField } from '@/types/idCard';

interface ExtractDataFromPhotoProps {
  category: CategoryType;
  onDataExtracted: (updates: Partial<IDCardConfig>, fields: IDCardField[]) => void;
  currentFields: IDCardField[];
}

const ExtractDataFromPhoto: React.FC<ExtractDataFromPhotoProps> = ({
  category,
  onDataExtracted,
  currentFields,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setExtractedData(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractData = async () => {
    if (!previewImage) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-id-data', {
        body: { imageBase64: previewImage, category },
      });

      if (error) throw error;

      if (data.extractedData && data.success) {
        setExtractedData(data.extractedData);
        toast.success('Data extracted successfully!');
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        toast.warning('Could not extract data from the image. Please try a clearer photo.');
      }
    } catch (error) {
      console.error('Error extracting data:', error);
      toast.error('Failed to extract data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyExtractedData = () => {
    if (!extractedData) return;

    const updatedFields = currentFields.map((field) => {
      const extractedValue = extractedData[field.key];
      if (extractedValue) {
        return { ...field, value: extractedValue };
      }
      return field;
    });

    const updates: Partial<IDCardConfig> = {};
    if (extractedData.institutionName) {
      updates.institutionName = extractedData.institutionName;
    }
    if (extractedData.institutionAddress) {
      updates.institutionAddress = extractedData.institutionAddress;
    }

    onDataExtracted(updates, updatedFields);
    toast.success('Data applied to ID card!');
    setIsOpen(false);
    setPreviewImage(null);
    setExtractedData(null);
  };

  const reset = () => {
    setPreviewImage(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Scan className="w-4 h-4" />
          Scan Existing ID Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-primary" />
            Extract Data from ID Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!previewImage ? (
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-10 h-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Upload ID Card Photo</p>
                  <p className="text-xs text-muted-foreground">Click to select an image</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewImage}
                  alt="ID Card preview"
                  className="w-full rounded-lg border border-border"
                />
                {extractedData && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Data Found
                  </div>
                )}
              </div>

              {extractedData && (
                <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium mb-2">Extracted Data:</p>
                  <div className="space-y-1">
                    {Object.entries(extractedData)
                      .filter(([_, value]) => value)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  Choose Different
                </Button>
                {!extractedData ? (
                  <Button className="flex-1" onClick={extractData} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4 mr-2" />
                        Extract Data
                      </>
                    )}
                  </Button>
                ) : (
                  <Button className="flex-1" onClick={applyExtractedData}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply Data
                  </Button>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Upload a clear photo of an existing ID card to auto-fill the form fields using AI
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtractDataFromPhoto;
