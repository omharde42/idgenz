import React, { useState, useEffect } from 'react';
import { Trash2, Download, Loader2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface SavedCard {
  id: string;
  name: string;
  category: string;
  institution_name: string | null;
  image_url: string;
  created_at: string;
}

interface SavedCardsProps {
  userId: string;
  refreshTrigger: number;
}

const SavedCards: React.FC<SavedCardsProps> = ({ userId, refreshTrigger }) => {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_id_cards')
        .select('id, name, category, institution_name, image_url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching saved cards:', error);
    } finally {
      setLoading(false);
    }
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
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => handleDownload(card)}
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
  );
};

export default SavedCards;