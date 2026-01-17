import React, { useRef, useState, useCallback } from 'react';
import { Upload, User, Building, PenTool, Image, X, AlertCircle, Crop, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IDCardConfig } from '@/types/idCard';
import PhotoEnhancer from './PhotoEnhancer';
import ImageCropper from './ImageCropper';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadsProps {
  config: IDCardConfig;
  onChange: (updates: Partial<IDCardConfig>) => void;
}

type ImageField = keyof Pick<IDCardConfig, 'profilePhoto' | 'institutionLogo' | 'authorizedSignature' | 'backgroundImage'>;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

const ImageUploads: React.FC<ImageUploadsProps> = ({ config, onChange }) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const backgroundRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState<ImageField | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState<string>('');
  const [cropperField, setCropperField] = useState<ImageField>('profilePhoto');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFieldLabel = (field: ImageField) => {
    switch (field) {
      case 'profilePhoto': return 'Photo';
      case 'institutionLogo': return 'Logo';
      case 'authorizedSignature': return 'Signature';
      case 'backgroundImage': return 'Background';
    }
  };

  const processFile = useCallback((file: File, field: ImageField, shouldCrop: boolean = false) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large! Maximum size is 2MB. Your file: ${formatFileSize(file.size)}`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, GIF, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      
      // Only offer cropping for profile photo
      if (field === 'profilePhoto' && shouldCrop) {
        setCropperImage(imageUrl);
        setCropperField(field);
        setCropperOpen(true);
      } else {
        onChange({ [field]: imageUrl });
        toast.success(`${getFieldLabel(field)} uploaded successfully!`);
      }
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: ImageField) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, field, field === 'profilePhoto');
      e.target.value = ''; // Reset input for re-upload
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent, field: ImageField) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(field);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, field: ImageField) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file, field, field === 'profilePhoto');
    }
  }, [processFile]);

  const handleCropComplete = (croppedImageUrl: string) => {
    onChange({ [cropperField]: croppedImageUrl });
    toast.success(`${getFieldLabel(cropperField)} cropped and uploaded successfully!`);
  };

  const openCropper = (field: ImageField, imageUrl: string) => {
    setCropperImage(imageUrl);
    setCropperField(field);
    setCropperOpen(true);
  };

  const uploads = [
    {
      key: 'profilePhoto' as const,
      label: 'Profile Photo',
      description: 'Drag & drop or click to upload',
      icon: User,
      ref: photoRef,
      value: config.profilePhoto,
      aspectRatio: 1,
      canCrop: true,
    },
    {
      key: 'institutionLogo' as const,
      label: 'Institution Logo',
      description: 'Drag & drop or click to upload',
      icon: Building,
      ref: logoRef,
      value: config.institutionLogo,
      aspectRatio: 1,
      canCrop: false,
    },
    {
      key: 'authorizedSignature' as const,
      label: 'Signature',
      description: 'Drag & drop or click to upload',
      icon: PenTool,
      ref: signatureRef,
      value: config.authorizedSignature,
      aspectRatio: 3,
      canCrop: false,
    },
    {
      key: 'backgroundImage' as const,
      label: 'Background',
      description: 'Drag & drop or click to upload',
      icon: Image,
      ref: backgroundRef,
      value: config.backgroundImage,
      aspectRatio: 1.586,
      canCrop: false,
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
            Max file size: <span className="font-medium text-foreground">2MB</span> • Drag & drop supported
          </p>
        </div>

        {/* Upload Grid */}
        <div className="grid grid-cols-2 gap-3">
          {uploads.map(({ key, label, description, icon: Icon, ref, value, canCrop }) => (
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
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {canCrop && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openCropper(key, value)}
                      >
                        <Crop className="w-3 h-3 mr-1" />
                        Crop
                      </Button>
                    )}
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
                      className="h-7 text-xs px-2"
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
                // Upload State with Drag & Drop
                <div
                  onClick={() => ref.current?.click()}
                  onDragOver={(e) => handleDragOver(e, key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, key)}
                  className={cn(
                    "w-full h-28 p-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                    dragOver === key
                      ? "border-primary bg-primary/10 scale-[1.02]"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    dragOver === key
                      ? "bg-primary/20"
                      : "bg-muted group-hover:bg-primary/10"
                  )}>
                    {dragOver === key ? (
                      <GripVertical className="w-5 h-5 text-primary animate-pulse" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {dragOver === key ? 'Drop to upload' : description}
                    </p>
                  </div>
                </div>
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

      {/* Image Cropper Modal */}
      <ImageCropper
        imageUrl={cropperImage}
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title={`Crop ${getFieldLabel(cropperField)}`}
      />
    </div>
  );
};

export default ImageUploads;
