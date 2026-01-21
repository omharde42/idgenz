import React from 'react';
import { ChevronLeft, ChevronRight, Eye, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IDCardConfig } from '@/types/idCard';
import { BulkRecord } from './types';
import IDCardPreview from '../IDCardPreview';

interface BulkCardPreviewProps {
  config: IDCardConfig | null;
  record: BulkRecord | null;
  totalRecords: number;
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const BulkCardPreview: React.FC<BulkCardPreviewProps> = ({
  config,
  record,
  totalRecords,
  currentIndex,
  onNavigate,
}) => {
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

  const name = record.fields.find(f => f.key === 'name')?.value || 'Unknown';
  const studentId = record.fields.find(f => 
    f.key === 'rollNo' || f.key === 'enrollmentNo' || f.key === 'employeeId' || f.key === 'participantId'
  )?.value || '';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Record Info */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
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
      <div className="bg-card/50 rounded-xl p-6 shadow-inner">
        <IDCardPreview config={config} />
      </div>

      {/* Navigation Controls */}
      {totalRecords > 1 && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('prev')}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Use arrow keys to navigate
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

      {/* Keyboard hint */}
      <p className="text-xs text-muted-foreground">
        Preview updates in real-time as you change design settings
      </p>
    </div>
  );
};

export default BulkCardPreview;
