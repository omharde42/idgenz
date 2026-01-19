import React from 'react';
import { Download, Printer, RotateCcw, Save, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onDownload: () => void;
  onPrint: () => void;
  onReset: () => void;
  onSave?: () => void;
  onSaveAsNew?: () => void;
  isGenerating: boolean;
  isSaving?: boolean;
  isEditing?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDownload,
  onPrint,
  onReset,
  onSave,
  onSaveAsNew,
  isGenerating,
  isSaving = false,
  isEditing = false,
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
          {isSaving ? 'Saving...' : isEditing ? 'Update Card' : 'Save Card'}
        </Button>
      )}
      {isEditing && onSaveAsNew && (
        <Button
          variant="secondary"
          onClick={onSaveAsNew}
          disabled={isSaving}
          className="flex-1 min-w-[140px]"
        >
          <Copy className="w-4 h-4 mr-2" />
          Save as New
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
