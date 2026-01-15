import React, { forwardRef } from 'react';
import { User } from 'lucide-react';
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
    
    // Generate unique ID for QR code
    const qrData = JSON.stringify({
      name: config.fields.find(f => f.key === 'name')?.value || '',
      id: config.fields.find(f => f.key === 'rollNo' || f.key === 'employeeId' || f.key === 'enrollmentNo' || f.key === 'participantId' || f.key === 'idNumber')?.value || '',
      institution: config.institutionName,
    });

    const cardClasses = `
      ${config.cardShape === 'rounded' ? 'rounded-xl' : 'rounded-none'}
      bg-card shadow-xl overflow-hidden relative flex
      ${isVertical ? 'flex-col' : 'flex-row'}
    `;

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
                className="rounded-full overflow-hidden border-4 border-primary-foreground/30 mt-4"
                style={{ width: config.photoSize, height: config.photoSize }}
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
              <h2 className="text-sm font-bold text-primary-foreground text-center mt-2">
                {config.fields.find((f) => f.key === 'name')?.value || 'Full Name'}
              </h2>
            </>
          )}
        </div>

        {/* Body */}
        <div className={`flex-1 p-3 flex flex-col ${isVertical ? 'items-center' : 'justify-between'} bg-card/95 overflow-hidden`}>
          {isVertical && (
            <>
              {/* Photo */}
              <div
                className="rounded-full overflow-hidden border-4 border-primary/30 mb-2 flex-shrink-0"
                style={{ width: config.photoSize, height: config.photoSize }}
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
              <h2 className="text-base font-bold text-primary text-center flex-shrink-0">
                {config.fields.find((f) => f.key === 'name')?.value || 'Full Name'}
              </h2>
            </>
          )}

          {/* Fields */}
          <div className={`w-full ${isVertical ? 'mt-2' : ''} text-[10px] space-y-0.5 flex-shrink-0`}>
            {enabledFields
              .filter((f) => f.key !== 'name')
              .slice(0, isVertical ? 5 : 4)
              .map((field) => (
                <div
                  key={field.key}
                  className="flex justify-between border-b border-border pb-0.5"
                >
                  <span className="font-semibold text-muted-foreground">{field.label}:</span>
                  <span className="text-foreground">{field.value || '--'}</span>
                </div>
              ))}
          </div>

          {/* Footer with QR and Signature */}
          <div className={`mt-auto pt-2 flex ${isVertical ? 'justify-between w-full items-end' : 'flex-col items-center gap-1'} flex-shrink-0`}>
            {config.showQRCode && (
              <div className="bg-white p-1 rounded shadow-sm">
                <QRCodeSVG value={qrData} size={isVertical ? 40 : 35} />
              </div>
            )}
            
            <div className="text-center">
              {config.authorizedSignature ? (
                <img
                  src={config.authorizedSignature}
                  alt="Signature"
                  className="h-6 object-contain mx-auto"
                />
              ) : (
                <div className="w-16 border-t-2 border-foreground/60" />
              )}
              <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">{config.signatoryTitle}</p>
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
