import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Eye, CheckCircle, AlertTriangle, Edit3, Save, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IDCardConfig, IDCardField } from '@/types/idCard';
import { BulkRecord } from './types';
import IDCardPreview from '../IDCardPreview';
import { toast } from 'sonner';

interface BulkCardPreviewProps {
  config: IDCardConfig | null;
  record: BulkRecord | null;
  totalRecords: number;
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onUpdateRecord?: (recordId: string, fields: IDCardField[], profilePhoto?: string | null) => void;
}

const BulkCardPreview: React.FC<BulkCardPreviewProps> = ({
  config,
  record,
  totalRecords,
  currentIndex,
  onNavigate,
  onUpdateRecord,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<IDCardField[]>([]);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(true);

  const startEditing = useCallback(() => {
    if (record) {
      setEditedFields([...record.fields]);
      setIsEditing(true);
    }
  }, [record]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditedFields([]);
  }, []);

  const saveEdits = useCallback(() => {
    if (record && onUpdateRecord) {
      onUpdateRecord(record.id, editedFields);
      setIsEditing(false);
      toast.success('Record updated');
    }
  }, [record, editedFields, onUpdateRecord]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setEditedFields(prev => 
      prev.map(f => f.key === key ? { ...f, value } : f)
    );
  }, []);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !record || !onUpdateRecord) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const photoUrl = event.target?.result as string;
      onUpdateRecord(record.id, record.fields, photoUrl);
      toast.success('Photo updated');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [record, onUpdateRecord]);

  if (!config || !record) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Eye className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Card Selected</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Click on a record from the list to preview how the ID card will look.
        </p>
      </div>
    );
  }

  const displayFields = isEditing ? editedFields : record.fields;
  const name = displayFields.find(f => f.key === 'name')?.value || 'Unknown';
  const studentId = displayFields.find(f => 
    f.key === 'rollNo' || f.key === 'enrollmentNo' || f.key === 'employeeId' || f.key === 'participantId'
  )?.value || '';

  // Create preview config with current fields (either original or edited)
  const previewConfig: IDCardConfig = {
    ...config,
    fields: displayFields,
  };

  return (
    <div className="flex gap-4 h-full w-full">
      {/* Card Preview */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Record Info */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Badge variant="outline" className="text-xs">
            {currentIndex + 1} of {totalRecords}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {name}
          </Badge>
          {studentId && (
            <Badge variant="secondary" className="text-xs">
              ID: {studentId}
            </Badge>
          )}
          {record.photoMatched ? (
            <Badge className="text-xs bg-chart-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Photo Matched
            </Badge>
          ) : !record.profilePhoto ? (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 mr-1" />
              No Photo
            </Badge>
          ) : null}
        </div>

        {/* Card Preview */}
        <div className="bg-card/50 rounded-xl p-4 shadow-inner">
          <IDCardPreview config={previewConfig} />
        </div>

        {/* Navigation Controls */}
        {totalRecords > 1 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('prev')}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              ← → to navigate
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('next')}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Edit Panel */}
      <div className="w-[240px] border-l border-border bg-card/50 flex flex-col">
        <Collapsible open={isEditPanelOpen} onOpenChange={setIsEditPanelOpen}>
          <div className="p-3 border-b border-border flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto">
                <Edit3 className="w-4 h-4" />
                <span className="text-sm font-medium">Edit Record</span>
              </Button>
            </CollapsibleTrigger>
            
            {!isEditing ? (
              <Button variant="secondary" size="sm" onClick={startEditing}>
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditing}>
                  <X className="w-4 h-4" />
                </Button>
                <Button variant="default" size="sm" onClick={saveEdits}>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>

          <CollapsibleContent>
            <ScrollArea className="h-[400px]">
              <div className="p-3 space-y-3">
                {/* Photo Upload */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Profile Photo</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                      {record.profilePhoto ? (
                        <img src={record.profilePhoto} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <Image className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Image className="w-3 h-3 mr-1" />
                          {record.profilePhoto ? 'Change' : 'Upload'}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Fields */}
                {(isEditing ? editedFields : record.fields).filter(f => f.enabled).map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{field.label}</Label>
                    {isEditing ? (
                      <Input
                        value={editedFields.find(f => f.key === field.key)?.value || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="h-8 text-sm"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    ) : (
                      <div className="px-2 py-1.5 text-sm bg-muted/50 rounded border border-border min-h-[32px]">
                        {field.value || <span className="text-muted-foreground italic">Empty</span>}
                      </div>
                    )}
                  </div>
                ))}

                {/* Disabled fields hint */}
                {record.fields.filter(f => !f.enabled).length > 0 && (
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    {record.fields.filter(f => !f.enabled).length} hidden fields not shown
                  </p>
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {!isEditPanelOpen && (
          <div className="p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Expand to edit record fields
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkCardPreview;
