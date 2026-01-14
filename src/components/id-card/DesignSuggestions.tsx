import React, { useState } from 'react';
import { Sparkles, Wand2, Palette, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CategoryType, IDCardConfig } from '@/types/idCard';

interface DesignSuggestionsProps {
  category: CategoryType;
  institutionName: string;
  currentColors: { headerColor: string; footerColor: string };
  onApplySuggestions: (updates: Partial<IDCardConfig>) => void;
}

interface ColorTheme {
  name: string;
  headerColor: string;
  footerColor: string;
  description: string;
}

interface Suggestions {
  colorThemes: ColorTheme[];
  recommendedLayout: 'vertical' | 'horizontal';
  layoutReason: string;
  priorityFields: string[];
  designTips: string[];
}

const DesignSuggestions: React.FC<DesignSuggestionsProps> = ({
  category,
  institutionName,
  currentColors,
  onApplySuggestions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('design-suggestions', {
        body: { category, institutionName, currentColors },
      });

      if (error) throw error;
      
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to get AI suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !suggestions) {
      fetchSuggestions();
    }
  };

  const applyTheme = (theme: ColorTheme, index: number) => {
    setSelectedTheme(index);
    onApplySuggestions({
      headerColor: theme.headerColor,
      footerColor: theme.footerColor,
    });
    toast.success(`Applied "${theme.name}" theme!`);
  };

  const applyLayout = () => {
    if (suggestions) {
      onApplySuggestions({ layout: suggestions.recommendedLayout });
      toast.success(`Applied ${suggestions.recommendedLayout} layout!`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Sparkles className="w-4 h-4" />
          AI Design Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            AI Design Suggestions
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your requirements...</p>
          </div>
        ) : suggestions ? (
          <div className="space-y-6">
            {/* Color Themes */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Color Themes</h4>
              <div className="grid gap-2">
                {suggestions.colorThemes.map((theme, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyTheme(theme, idx)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      selectedTheme === idx
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: theme.headerColor }}
                      />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: theme.footerColor }}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{theme.name}</p>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    </div>
                    {selectedTheme === idx && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Recommendation */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recommended Layout</h4>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize">{suggestions.recommendedLayout}</p>
                    <p className="text-xs text-muted-foreground">{suggestions.layoutReason}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={applyLayout}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>

            {/* Priority Fields */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Priority Fields</h4>
              <div className="flex flex-wrap gap-1">
                {suggestions.priorityFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>

            {/* Design Tips */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Design Tips</h4>
              <ul className="space-y-1">
                {suggestions.designTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Wand2 className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSuggestions(null);
                fetchSuggestions();
              }}
            >
              Get New Suggestions
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load suggestions. Please try again.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DesignSuggestions;
