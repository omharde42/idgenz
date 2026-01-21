import React from 'react';
import { Palette, Layout, Square } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { IDCardConfig, CardSizeType, cardSizeOptions, textColorOptions } from '@/types/idCard';
import { cn } from '@/lib/utils';

interface BulkDesignControlsProps {
  config: IDCardConfig;
  onChange: (updates: Partial<IDCardConfig>) => void;
}

const BulkDesignControls: React.FC<BulkDesignControlsProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Global Design Settings
      </h3>

      {/* Institution Info */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs">School/Organization Name</Label>
          <Input
            value={config.institutionName}
            onChange={(e) => onChange({ institutionName: e.target.value })}
            placeholder="Enter institution name"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Address</Label>
          <Input
            value={config.institutionAddress}
            onChange={(e) => onChange({ institutionAddress: e.target.value })}
            placeholder="Enter address"
            className="mt-1"
          />
        </div>
      </div>

      {/* Layout & Shape */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-2 block">Card Layout</Label>
          <RadioGroup
            value={config.layout}
            onValueChange={(value) => onChange({ layout: value as 'vertical' | 'horizontal' })}
            className="flex gap-2"
          >
            <label className={cn(
              "flex items-center gap-1 px-2 py-1 rounded border cursor-pointer text-xs",
              config.layout === 'vertical' ? "border-primary bg-primary/10" : "border-border"
            )}>
              <RadioGroupItem value="vertical" className="sr-only" />
              <Layout className="w-3 h-3 rotate-90" />
              Vertical
            </label>
            <label className={cn(
              "flex items-center gap-1 px-2 py-1 rounded border cursor-pointer text-xs",
              config.layout === 'horizontal' ? "border-primary bg-primary/10" : "border-border"
            )}>
              <RadioGroupItem value="horizontal" className="sr-only" />
              <Layout className="w-3 h-3" />
              Horizontal
            </label>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-xs mb-2 block">Photo Frame</Label>
          <RadioGroup
            value={config.cardShape}
            onValueChange={(value) => onChange({ cardShape: value as 'rounded' | 'rectangular' })}
            className="flex gap-2"
          >
            <label className={cn(
              "flex items-center gap-1 px-2 py-1 rounded border cursor-pointer text-xs",
              config.cardShape === 'rounded' ? "border-primary bg-primary/10" : "border-border"
            )}>
              <RadioGroupItem value="rounded" className="sr-only" />
              <div className="w-3 h-3 rounded-full border border-current" />
              Round
            </label>
            <label className={cn(
              "flex items-center gap-1 px-2 py-1 rounded border cursor-pointer text-xs",
              config.cardShape === 'rectangular' ? "border-primary bg-primary/10" : "border-border"
            )}>
              <RadioGroupItem value="rectangular" className="sr-only" />
              <Square className="w-3 h-3" />
              Square
            </label>
          </RadioGroup>
        </div>
      </div>

      {/* Card Size */}
      <div>
        <Label className="text-xs mb-2 block">Card Size</Label>
        <Select
          value={config.cardSize}
          onValueChange={(value) => onChange({ cardSize: value as CardSizeType })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cardSizeOptions.map((size) => (
              <SelectItem key={size.id} value={size.id} className="text-xs">
                {size.label} - {size.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-2 block">Header Color</Label>
          <div className="flex gap-1">
            <input
              type="color"
              value={config.headerColor}
              onChange={(e) => onChange({ headerColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <Input
              value={config.headerColor}
              onChange={(e) => onChange({ headerColor: e.target.value })}
              className="h-8 text-xs flex-1"
              maxLength={7}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs mb-2 block">Footer Color</Label>
          <div className="flex gap-1">
            <input
              type="color"
              value={config.footerColor}
              onChange={(e) => onChange({ footerColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <Input
              value={config.footerColor}
              onChange={(e) => onChange({ footerColor: e.target.value })}
              className="h-8 text-xs flex-1"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* Text Color */}
      <div>
        <Label className="text-xs mb-2 block">Text Color</Label>
        <div className="flex flex-wrap gap-1">
          {textColorOptions.slice(0, 12).map((option) => (
            <button
              key={option.color}
              onClick={() => onChange({ textColor: option.color })}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                config.textColor === option.color ? "border-primary ring-2 ring-primary/30" : "border-transparent"
              )}
              style={{ backgroundColor: option.color }}
              title={option.name}
            />
          ))}
        </div>
      </div>

      {/* QR Code Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Include QR Code</Label>
        <Switch
          checked={config.showQRCode}
          onCheckedChange={(checked) => onChange({ showQRCode: checked })}
        />
      </div>
    </div>
  );
};

export default BulkDesignControls;
