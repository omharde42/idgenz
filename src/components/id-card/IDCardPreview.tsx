import React, { forwardRef } from 'react';
import { User, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { IDCardConfig, cardSizeOptions } from '@/types/idCard';

interface IDCardPreviewProps {
  config: IDCardConfig;
}

const IDCardPreview = forwardRef<HTMLDivElement, IDCardPreviewProps>(
  ({ config }, ref) => {
    const isVertical = config.layout === 'vertical';
    const enabledFields = config.fields.filter((f) => f.enabled);
    
    // Get card dimensions based on selected size
    const selectedSize = cardSizeOptions.find(s => s.id === config.cardSize) || cardSizeOptions[0];
    const cardWidth = isVertical ? selectedSize.height : selectedSize.width;
    const cardHeight = isVertical ? selectedSize.width : selectedSize.height;
    
    // Get all fields including address and emergency contact
    const addressField = config.fields.find(f => f.key === 'address');
    const emergencyContactField = config.fields.find(f => f.key === 'emergencyContact');
    
    // Generate comprehensive QR code data with ALL user details for scanning
    const qrDataObject = {
      cardType: 'ID Card',
      institution: config.institutionName || 'Institution',
      institutionAddress: config.institutionAddress || '',
      category: config.category,
      // Include ALL enabled fields with their labels
      ...enabledFields.reduce((acc, field) => {
        acc[field.label] = field.value || '';
        return acc;
      }, {} as Record<string, string>),
      // Always include address and emergency contact if they have values
      address: addressField?.value || '',
      emergencyContact: emergencyContactField?.value || '',
      issuedBy: config.signatoryTitle,
      validFrom: new Date().toISOString().split('T')[0],
    };
    
    // Create verification URL with encoded data
    const encodedData = btoa(encodeURIComponent(JSON.stringify(qrDataObject)));
    const verifyUrl = `${window.location.origin}/verify?data=${encodedData}`;

    const cardClasses = `
      ${config.cardShape === 'rounded' ? 'rounded-xl' : 'rounded-none'}
      bg-card shadow-xl overflow-hidden relative flex
      ${isVertical ? 'flex-col' : 'flex-row'}
    `;

    const textStyle = { color: config.textColor || '#000000' };

    return (
      <div
        ref={ref}
        className={cardClasses}
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Header */}
        <div
          className={`
            flex items-center justify-center gap-3 p-4
            ${isVertical ? 'w-full' : 'w-2/5 flex-col'}
          `}
          style={{ backgroundColor: config.headerColor }}
        >
          {config.institutionLogo && (
            <img
              src={config.institutionLogo}
              alt="Logo"
              className={`${isVertical ? 'h-8' : 'h-12'} object-contain`}
            />
          )}
          <div className={`text-center ${isVertical ? '' : 'mt-2'}`}>
            <h3 className="font-bold text-sm uppercase text-primary-foreground">
              {config.institutionName || 'Institution Name'}
            </h3>
            <p className="text-xs text-primary-foreground/80">
              {config.institutionAddress || 'Address'}
            </p>
          </div>
          
          {!isVertical && (
            <>
              {/* Photo for horizontal layout */}
              <div
                className="rounded-full overflow-hidden border-4 border-primary-foreground/30 mt-4 relative"
                style={{ width: config.photoSize, height: config.photoSize }}
              >
                {config.profilePhoto ? (
                  <>
                    <img
                      src={config.profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-1/2 h-1/2 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h2 className="text-sm font-bold text-primary-foreground text-center mt-2">
                {config.fields.find((f) => f.key === 'name')?.value || 'Full Name'}
              </h2>
            </>
          )}
        </div>

        {/* Body */}
        <div className={`flex-1 p-2 flex flex-col ${isVertical ? 'items-center' : 'justify-between'} bg-card/95 min-h-0`}>
          {isVertical && (
            <>
              {/* Photo Attached Indicator */}
              {config.profilePhoto && (
                <div className="flex items-center gap-1 text-[8px] text-green-600 mb-0.5 flex-shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  <span>Photo Attached</span>
                </div>
              )}
              
              {/* Photo */}
              <div
                className="rounded-full overflow-hidden border-3 border-primary/30 mb-1 flex-shrink-0 relative"
                style={{ width: Math.min(config.photoSize, 60), height: Math.min(config.photoSize, 60) }}
              >
                {config.profilePhoto ? (
                  <img
                    src={config.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-1/2 h-1/2 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h2 
                className="text-sm font-bold text-center flex-shrink-0 leading-tight"
                style={textStyle}
              >
                {config.fields.find((f) => f.key === 'name')?.value || 'Full Name'}
              </h2>
            </>
          )}

          {/* Fields - Show more fields including address and emergency contact */}
          <div className={`w-full ${isVertical ? 'mt-1' : ''} text-[9px] space-y-0 flex-shrink-0 overflow-auto`}>
            {enabledFields
              .filter((f) => f.key !== 'name')
              .slice(0, isVertical ? 6 : 5)
              .map((field) => (
                <div
                  key={field.key}
                  className="flex justify-between border-b border-border/50 py-0.5"
                >
                  <span className="font-medium" style={{ color: config.textColor ? `${config.textColor}99` : undefined }}>
                    {field.label}:
                  </span>
                  <span style={textStyle} className="truncate max-w-[60%] text-right">
                    {field.value || '--'}
                  </span>
                </div>
              ))}
          </div>

          {/* Footer with QR and Signature */}
          <div className={`mt-auto pt-1 flex ${isVertical ? 'justify-between w-full items-end gap-2' : 'flex-col items-center gap-1'} flex-shrink-0`}>
            {config.showQRCode && (
              <div className="bg-white p-1 rounded shadow-sm flex-shrink-0" title="Scan to view all details">
                <QRCodeSVG 
                  value={verifyUrl} 
                  size={isVertical ? 36 : 40} 
                  level="L"
                  includeMargin={false}
                />
              </div>
            )}
            
            <div className="text-center flex-shrink-0">
              {config.authorizedSignature ? (
                <img
                  src={config.authorizedSignature}
                  alt="Signature"
                  className="h-5 object-contain mx-auto"
                />
              ) : (
                <div className="w-14 border-t-2 border-foreground/60" />
              )}
              <p className="text-[8px] leading-tight font-medium" style={{ color: config.textColor ? `${config.textColor}99` : undefined }}>
                {config.signatoryTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Color Bar */}
        <div
          className={`${isVertical ? 'h-2 w-full' : 'w-2 h-full'}`}
          style={{ backgroundColor: config.footerColor }}
        />
      </div>
    );
  }
);

IDCardPreview.displayName = 'IDCardPreview';

export default IDCardPreview;
