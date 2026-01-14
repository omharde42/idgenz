import React, { useState } from 'react';
import { Wand2, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PhotoEnhancerProps {
  photoUrl: string | null;
  onEnhancedPhoto: (enhancedUrl: string) => void;
}

const PhotoEnhancer: React.FC<PhotoEnhancerProps> = ({ photoUrl, onEnhancedPhoto }) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);

  const enhancePhoto = async () => {
    if (!photoUrl) {
      toast.error('Please upload a photo first');
      return;
    }

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-photo', {
        body: { imageBase64: photoUrl },
      });

      if (error) throw error;

      if (data.enhancedImage) {
        setEnhancedPreview(data.enhancedImage);
        toast.success('Photo enhanced! Review and apply the changes.');
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error enhancing photo:', error);
      toast.error('Failed to enhance photo. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyEnhanced = () => {
    if (enhancedPreview) {
      onEnhancedPhoto(enhancedPreview);
      setEnhancedPreview(null);
      toast.success('Enhanced photo applied!');
    }
  };

  const cancelEnhanced = () => {
    setEnhancedPreview(null);
  };

  if (enhancedPreview) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Original</p>
            <img
              src={photoUrl!}
              alt="Original"
              className="w-full h-20 object-cover rounded border border-border"
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Enhanced</p>
            <img
              src={enhancedPreview}
              alt="Enhanced"
              className="w-full h-20 object-cover rounded border border-primary"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={cancelEnhanced}>
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={applyEnhanced}>
            <Check className="w-3 h-3 mr-1" />
            Apply
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full gap-2"
      onClick={enhancePhoto}
      disabled={!photoUrl || isEnhancing}
    >
      {isEnhancing ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          Enhancing...
        </>
      ) : (
        <>
          <Wand2 className="w-3 h-3" />
          AI Enhance Photo
        </>
      )}
    </Button>
  );
};

export default PhotoEnhancer;
