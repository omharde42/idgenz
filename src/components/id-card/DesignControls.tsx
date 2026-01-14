import React from 'react';
import { IDCardConfig } from '@/types/idCard';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RectangleHorizontal, RectangleVertical, Square, CircleDot } from 'lucide-react';

interface DesignControlsProps {
  config: IDCardConfig;
  onChange: (updates: Partial<IDCardConfig>) => void;
}

const DesignControls: React.FC<DesignControlsProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-medium text-foreground">Design & Layout</h3>

      {/* Layout Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Card Layout</Label>
        <RadioGroup
          value={config.layout}
          onValueChange={(value) => onChange({ layout: value as 'vertical' | 'horizontal' })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="vertical" id="vertical" />
            <Label htmlFor="vertical" className="flex items-center gap-1 cursor-pointer text-sm">
              <RectangleVertical className="w-4 h-4" /> Vertical
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="horizontal" id="horizontal" />
            <Label htmlFor="horizontal" className="flex items-center gap-1 cursor-pointer text-sm">
              <RectangleHorizontal className="w-4 h-4" /> Horizontal
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Card Shape */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Card Shape</Label>
        <RadioGroup
          value={config.cardShape}
          onValueChange={(value) => onChange({ cardShape: value as 'rounded' | 'rectangular' })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rounded" id="rounded" />
            <Label htmlFor="rounded" className="flex items-center gap-1 cursor-pointer text-sm">
              <CircleDot className="w-4 h-4" /> Rounded
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rectangular" id="rectangular" />
            <Label htmlFor="rectangular" className="flex items-center gap-1 cursor-pointer text-sm">
              <Square className="w-4 h-4" /> Rectangular
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="headerColor" className="text-xs text-muted-foreground">
            Header Color
          </Label>
          <div className="flex gap-2">
            <input
              type="color"
              id="headerColor"
              value={config.headerColor}
              onChange={(e) => onChange({ headerColor: e.target.value })}
              className="w-12 h-10 rounded border border-border cursor-pointer"
            />
            <Input
              value={config.headerColor}
              onChange={(e) => onChange({ headerColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="footerColor" className="text-xs text-muted-foreground">
            Footer Color
          </Label>
          <div className="flex gap-2">
            <input
              type="color"
              id="footerColor"
              value={config.footerColor}
              onChange={(e) => onChange({ footerColor: e.target.value })}
              className="w-12 h-10 rounded border border-border cursor-pointer"
            />
            <Input
              value={config.footerColor}
              onChange={(e) => onChange({ footerColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Photo Size */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Photo Size: {config.photoSize}px
        </Label>
        <Slider
          value={[config.photoSize]}
          onValueChange={(value) => onChange({ photoSize: value[0] })}
          min={60}
          max={120}
          step={5}
          className="w-full"
        />
      </div>

      {/* QR Code Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="qrcode" className="text-sm">Show QR Code</Label>
        <Switch
          id="qrcode"
          checked={config.showQRCode}
          onCheckedChange={(checked) => onChange({ showQRCode: checked })}
        />
      </div>
    </div>
  );
};

export default DesignControls;
