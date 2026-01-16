import React from 'react';
import { Download, Printer, RotateCcw, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onDownload: () => void;
  onPrint: () => void;
  onReset: () => void;
  onSave?: () => void;
  isGenerating: boolean;
  isSaving?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDownload,
  onPrint,
  onReset,
  onSave,
  isGenerating,
  isSaving = false,
}) => {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={onDownload}
        disabled={isGenerating}
        className="flex-1 min-w-[140px]"
      >
        <Download className="w-4 h-4 mr-2" />
        {isGenerating ? 'Generating...' : 'Download PNG'}
      </Button>
      {onSave && (
        <Button
          variant="default"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 min-w-[140px]"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Card'}
        </Button>
      )}
      <Button
        variant="outline"
        onClick={onPrint}
        className="flex-1 min-w-[140px]"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print ID Card
      </Button>
      <Button
        variant="secondary"
        onClick={onReset}
        className="min-w-[100px]"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
    </div>
  );
};

export default ActionButtons;
