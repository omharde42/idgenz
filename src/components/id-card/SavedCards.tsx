import React, { useState, useEffect } from 'react';
import { Trash2, Download, Loader2, FolderOpen, FileSpreadsheet, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IDCardConfig, IDCardField } from '@/types/idCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SavedCard {
  id: string;
  name: string;
  category: string;
  institution_name: string | null;
  image_url: string;
  created_at: string;
  config: IDCardConfig;
}

interface SavedCardsProps {
  userId: string;
  refreshTrigger: number;
  onLoadCard?: (config: IDCardConfig) => void;
}

const SavedCards: React.FC<SavedCardsProps> = ({ userId, refreshTrigger, onLoadCard }) => {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_id_cards')
        .select('id, name, category, institution_name, image_url, created_at, config')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards((data || []).map(card => ({
        ...card,
        config: card.config as unknown as IDCardConfig
      })));
    } catch (error) {
      console.error('Error fetching saved cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (cards.length === 0) {
      toast.error('No cards to export');
      return;
    }

    // Build header row from all possible fields
    const allFieldKeys = new Set<string>();
    cards.forEach(card => {
      card.config?.fields?.forEach((field: IDCardField) => {
        if (field.enabled && field.value) {
          allFieldKeys.add(field.key);
        }
      });
    });

    const fieldKeysArray = Array.from(allFieldKeys);
    const headers = ['Name', 'Category', 'Institution', 'Address', 'Created At', ...fieldKeysArray.map(key => {
      const card = cards.find(c => c.config?.fields?.find((f: IDCardField) => f.key === key));
      const field = card?.config?.fields?.find((f: IDCardField) => f.key === key);
      return field?.label || key;
    })];

    const rows = cards.map(card => {
      const config = card.config;
      const fieldValues = fieldKeysArray.map(key => {
        const field = config?.fields?.find((f: IDCardField) => f.key === key);
        return field?.value || '';
      });
      return [
        card.name,
        card.category,
        card.institution_name || config?.institutionName || '',
        config?.institutionAddress || '',
        new Date(card.created_at).toLocaleDateString(),
        ...fieldValues
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, 'saved-id-cards.csv', 'text/csv');
    toast.success('Exported to CSV successfully!');
  };

  const exportToExcel = () => {
    if (cards.length === 0) {
      toast.error('No cards to export');
      return;
    }

    // Build header row from all possible fields
    const allFieldKeys = new Set<string>();
    cards.forEach(card => {
      card.config?.fields?.forEach((field: IDCardField) => {
        if (field.enabled && field.value) {
          allFieldKeys.add(field.key);
        }
      });
    });

    const fieldKeysArray = Array.from(allFieldKeys);
    const headers = ['Name', 'Category', 'Institution', 'Address', 'Created At', ...fieldKeysArray.map(key => {
      const card = cards.find(c => c.config?.fields?.find((f: IDCardField) => f.key === key));
      const field = card?.config?.fields?.find((f: IDCardField) => f.key === key);
      return field?.label || key;
    })];

    const rows = cards.map(card => {
      const config = card.config;
      const fieldValues = fieldKeysArray.map(key => {
        const field = config?.fields?.find((f: IDCardField) => f.key === key);
        return field?.value || '';
      });
      return [
        card.name,
        card.category,
        card.institution_name || config?.institutionName || '',
        config?.institutionAddress || '',
        new Date(card.created_at).toLocaleDateString(),
        ...fieldValues
      ];
    });

    // Create XML-based Excel file
    let excelContent = '<?xml version="1.0"?>\n';
    excelContent += '<?mso-application progid="Excel.Sheet"?>\n';
    excelContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    excelContent += '<Worksheet ss:Name="ID Cards">\n<Table>\n';
    
    // Header row
    excelContent += '<Row>\n';
    headers.forEach(header => {
      excelContent += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
    });
    excelContent += '</Row>\n';
    
    // Data rows
    rows.forEach(row => {
      excelContent += '<Row>\n';
      row.forEach(cell => {
        excelContent += `<Cell><Data ss:Type="String">${escapeXml(String(cell))}</Data></Cell>\n`;
      });
      excelContent += '</Row>\n';
    });
    
    excelContent += '</Table>\n</Worksheet>\n</Workbook>';

    downloadFile(excelContent, 'saved-id-cards.xls', 'application/vnd.ms-excel');
    toast.success('Exported to Excel successfully!');
  };

  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchCards();
  }, [userId, refreshTrigger]);

  const handleDelete = async (card: SavedCard) => {
    setDeletingId(card.id);
    try {
      // Extract file path from URL
      const urlParts = card.image_url.split('/id-cards/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('id-cards').remove([filePath]);
      }

      const { error } = await supabase
        .from('saved_id_cards')
        .delete()
        .eq('id', card.id);

      if (error) throw error;
      
      setCards(prev => prev.filter(c => c.id !== card.id));
      toast.success('Card deleted successfully');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (card: SavedCard) => {
    try {
      const response = await fetch(card.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${card.name.replace(/\s+/g, '-')}-ID-Card.png`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Card downloaded!');
    } catch (error) {
      console.error('Error downloading card:', error);
      toast.error('Failed to download card');
    }
  };

  const handleLoadCard = (card: SavedCard) => {
    if (onLoadCard && card.config) {
      onLoadCard(card.config);
      toast.success(`Loaded "${card.name}" into editor`);
    } else {
      toast.error('Unable to load card configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No saved cards yet</p>
        <p className="text-xs">Save your first ID card to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Buttons */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export All
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToCSV}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToExcel}>
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
        <Card key={card.id} className="overflow-hidden group">
          <CardContent className="p-2">
            <div className="relative aspect-[3/4] bg-muted rounded overflow-hidden mb-2">
              <img
                src={card.image_url}
                alt={card.name}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {onLoadCard && (
                  <Button
                    size="icon"
                    variant="default"
                    className="h-8 w-8"
                    onClick={() => handleLoadCard(card)}
                    title="Load into editor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => handleDownload(card)}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      disabled={deletingId === card.id}
                      title="Delete"
                    >
                      {deletingId === card.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{card.name}" ID card. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(card)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium truncate">{card.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{card.category}</p>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  );
};

export default SavedCards;