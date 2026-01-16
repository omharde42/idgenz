import React, { useRef } from 'react';
import { Upload, User, Building, PenTool, Image, X, AlertCircle, HardDrive, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IDCardConfig } from '@/types/idCard';
import PhotoEnhancer from './PhotoEnhancer';
import { toast } from 'sonner';

interface ImageUploadsProps {
  config: IDCardConfig;
  onChange: (updates: Partial<IDCardConfig>) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

const ImageUploads: React.FC<ImageUploadsProps> = ({ config, onChange }) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const backgroundRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Pick<IDCardConfig, 'profilePhoto' | 'institutionLogo' | 'authorizedSignature' | 'backgroundImage'>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large! Maximum size is 2MB. Your file: ${formatFileSize(file.size)}`);
        e.target.value = ''; // Reset input
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ [field]: reader.result as string });
        toast.success(`${field === 'profilePhoto' ? 'Photo' : field === 'institutionLogo' ? 'Logo' : field === 'authorizedSignature' ? 'Signature' : 'Background'} uploaded successfully!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploads = [
    {
      key: 'profilePhoto' as const,
      label: 'Profile Photo',
      description: 'Upload passport-size photo',
      icon: User,
      ref: photoRef,
      value: config.profilePhoto,
    },
    {
      key: 'institutionLogo' as const,
      label: 'Institution Logo',
      description: 'Company or school logo',
      icon: Building,
      ref: logoRef,
      value: config.institutionLogo,
    },
    {
      key: 'authorizedSignature' as const,
      label: 'Signature',
      description: 'Authorized signature image',
      icon: PenTool,
      ref: signatureRef,
      value: config.authorizedSignature,
    },
    {
      key: 'backgroundImage' as const,
      label: 'Background',
      description: 'Card background image',
      icon: Image,
      ref: backgroundRef,
      value: config.backgroundImage,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Institution Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Building className="w-4 h-4" />
          Institution Details
        </h3>
        <div className="space-y-3 pl-1">
          <div>
            <Label htmlFor="institutionName" className="text-xs text-muted-foreground">
              Institution Name
            </Label>
            <Input
              id="institutionName"
              placeholder="Enter institution name"
              value={config.institutionName}
              onChange={(e) => onChange({ institutionName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="institutionAddress" className="text-xs text-muted-foreground">
              Address
            </Label>
            <Input
              id="institutionAddress"
              placeholder="Enter address"
              value={config.institutionAddress}
              onChange={(e) => onChange({ institutionAddress: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="signatoryTitle" className="text-xs text-muted-foreground">
              Signatory Title
            </Label>
            <Input
              id="signatoryTitle"
              placeholder="e.g., Principal, HR Manager"
              value={config.signatoryTitle}
              onChange={(e) => onChange({ signatoryTitle: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Images
        </h3>
        
        {/* File Size Notice */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border/50">
          <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Max file size: <span className="font-medium text-foreground">2MB</span> • Supported: JPG, PNG, GIF, WebP
          </p>
        </div>

        {/* Upload Grid */}
        <div className="grid grid-cols-2 gap-3">
          {uploads.map(({ key, label, description, icon: Icon, ref, value }) => (
            <div key={key} className="group">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                ref={ref}
                onChange={(e) => handleImageUpload(e, key)}
                className="hidden"
              />
              
              {value ? (
                // Image Preview State
                <div className="relative border-2 border-primary/30 rounded-lg overflow-hidden bg-muted/30">
                  <img 
                    src={value} 
                    alt={label} 
                    className="w-full h-24 object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => ref.current?.click()}
                    >
                      Change
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onChange({ [key]: null })}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/90 px-2 py-1">
                    <p className="text-xs font-medium text-foreground truncate">{label}</p>
                  </div>
                </div>
              ) : (
                // Upload State
                <button
                  onClick={() => ref.current?.click()}
                  className="w-full h-28 p-3 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Laptop className="w-3 h-3" />
                    <span>Local</span>
                    <span className="mx-1">•</span>
                    <HardDrive className="w-3 h-3" />
                    <span>Drive</span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Photo Enhancer */}
      {config.profilePhoto && (
        <div className="pt-2 border-t border-border/50">
          <PhotoEnhancer
            photoUrl={config.profilePhoto}
            onEnhancedPhoto={(enhancedUrl) => onChange({ profilePhoto: enhancedUrl })}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploads;
