import React, { useRef } from 'react';
import { Upload, User, Building, PenTool, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IDCardConfig } from '@/types/idCard';

interface ImageUploadsProps {
  config: IDCardConfig;
  onChange: (updates: Partial<IDCardConfig>) => void;
}

const ImageUploads: React.FC<ImageUploadsProps> = ({ config, onChange }) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const backgroundRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Pick<IDCardConfig, 'profilePhoto' | 'institutionLogo' | 'authorizedSignature' | 'backgroundImage'>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const uploads = [
    {
      key: 'profilePhoto' as const,
      label: 'Profile Photo',
      icon: User,
      ref: photoRef,
      value: config.profilePhoto,
    },
    {
      key: 'institutionLogo' as const,
      label: 'Institution Logo',
      icon: Building,
      ref: logoRef,
      value: config.institutionLogo,
    },
    {
      key: 'authorizedSignature' as const,
      label: 'Signature',
      icon: PenTool,
      ref: signatureRef,
      value: config.authorizedSignature,
    },
    {
      key: 'backgroundImage' as const,
      label: 'Background',
      icon: Image,
      ref: backgroundRef,
      value: config.backgroundImage,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Upload Images</h3>

      {/* Institution Details */}
      <div className="space-y-3">
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

      {/* Image Upload Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {uploads.map(({ key, label, icon: Icon, ref, value }) => (
          <div key={key}>
            <input
              type="file"
              accept="image/*"
              ref={ref}
              onChange={(e) => handleImageUpload(e, key)}
              className="hidden"
            />
            <button
              onClick={() => ref.current?.click()}
              className="w-full p-3 border-2 border-dashed border-border rounded-lg flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              {value ? (
                <img src={value} alt={label} className="w-10 h-10 object-contain rounded" />
              ) : (
                <Icon className="w-6 h-6 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">{label}</span>
            </button>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-1 text-xs text-destructive hover:text-destructive"
                onClick={() => onChange({ [key]: null })}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploads;
