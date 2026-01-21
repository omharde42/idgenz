import React, { useState, useMemo, useEffect } from 'react';
import { Search, Trash2, CheckCircle, XCircle, AlertTriangle, Image, User, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BulkRecord } from './types';
import { cn } from '@/lib/utils';

interface BulkRecordsListProps {
  records: BulkRecord[];
  selectedRecordId: string | null;
  onSelectRecord: (id: string) => void;
  onRemoveRecord: (id: string) => void;
  onClearAll: () => void;
  isProcessing: boolean;
}

const BulkRecordsList: React.FC<BulkRecordsListProps> = ({
  records,
  selectedRecordId,
  onSelectRecord,
  onRemoveRecord,
  onClearAll,
  isProcessing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const term = searchTerm.toLowerCase();
    return records.filter(record => 
      record.fields.some(f => f.value.toLowerCase().includes(term))
    );
  }, [records, searchTerm]);

  const stats = useMemo(() => ({
    total: records.length,
    pending: records.filter(r => r.status === 'pending').length,
    validated: records.filter(r => r.status === 'validated').length,
    generated: records.filter(r => r.status === 'generated').length,
    errors: records.filter(r => r.status === 'error').length,
    photosMatched: records.filter(r => r.photoMatched).length,
  }), [records]);

  const getStatusIcon = (record: BulkRecord) => {
    switch (record.status) {
      case 'generated':
        return <CheckCircle className="w-4 h-4 text-chart-2" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'validated':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'generating':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border border-muted-foreground" />;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (records.length === 0 || !selectedRecordId) return;
      
      const currentIdx = records.findIndex(r => r.id === selectedRecordId);
      if (currentIdx === -1) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const newIdx = (currentIdx - 1 + records.length) % records.length;
        onSelectRecord(records[newIdx].id);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const newIdx = (currentIdx + 1) % records.length;
        onSelectRecord(records[newIdx].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [records, selectedRecordId, onSelectRecord]);

  if (records.length === 0) return null;

  return (
    <div className="space-y-3">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto">
              <h3 className="text-sm font-medium text-foreground">
                Records ({records.length})
              </h3>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearAll}
            disabled={isProcessing}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        </div>

        <CollapsibleContent className="mt-3 space-y-3">
          {/* Stats Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              Total: {stats.total}
            </Badge>
            {stats.photosMatched > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Image className="w-3 h-3 mr-1" />
                Photos: {stats.photosMatched}/{stats.total}
              </Badge>
            )}
            {stats.generated > 0 && (
              <Badge className="text-xs bg-chart-2">
                Generated: {stats.generated}
              </Badge>
            )}
            {stats.errors > 0 && (
              <Badge variant="destructive" className="text-xs">
                Errors: {stats.errors}
              </Badge>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Records List */}
          <ScrollArea className="h-[400px] border border-border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredRecords.map((record) => {
                const name = record.fields.find((f) => f.key === 'name')?.value || `Record ${record.rowIndex}`;
                const studentId = record.fields.find((f) => 
                  f.key === 'rollNo' || f.key === 'enrollmentNo' || f.key === 'employeeId' || f.key === 'participantId'
                )?.value || '';
                const isSelected = record.id === selectedRecordId;
                return (
                  <div
                    key={record.id}
                    onClick={() => onSelectRecord(record.id)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md text-sm cursor-pointer transition-colors",
                      isSelected 
                        ? "bg-primary/10 border border-primary/30" 
                        : "bg-muted/50 hover:bg-muted/70 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-muted-foreground w-6 flex-shrink-0">{record.rowIndex}.</span>
                      
                      {/* Photo indicator */}
                      <div className={cn(
                        "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center",
                        record.photoMatched ? 'bg-chart-2/20' : 'bg-muted'
                      )}>
                        {record.profilePhoto ? (
                          <img src={record.profilePhoto} className="w-full h-full rounded-full object-cover" alt="" />
                        ) : (
                          <User className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{name}</p>
                        {studentId && (
                          <p className="text-xs text-muted-foreground truncate">ID: {studentId}</p>
                        )}
                      </div>
                      
                      {getStatusIcon(record)}
                      
                      {record.errorMessage && (
                        <span className="text-xs text-destructive truncate max-w-[100px]" title={record.errorMessage}>
                          {record.errorMessage}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRecord(record.id);
                      }}
                      disabled={isProcessing}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default BulkRecordsList;
