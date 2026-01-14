import React from 'react';
import { School, GraduationCap, Building2, CalendarDays, Settings2 } from 'lucide-react';
import { CategoryType, categoryLabels } from '@/types/idCard';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  selected: CategoryType;
  onChange: (category: CategoryType) => void;
}

const categoryIcons: Record<CategoryType, React.ReactNode> = {
  school: <School className="w-5 h-5" />,
  college: <GraduationCap className="w-5 h-5" />,
  corporate: <Building2 className="w-5 h-5" />,
  event: <CalendarDays className="w-5 h-5" />,
  custom: <Settings2 className="w-5 h-5" />,
};

const CategorySelector: React.FC<CategorySelectorProps> = ({ selected, onChange }) => {
  const categories = Object.keys(categoryLabels) as CategoryType[];

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
        Select Category
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200',
              selected === cat
                ? 'border-primary bg-primary text-primary-foreground shadow-[0_4px_0_0_hsl(var(--primary)/0.6)] translate-y-0'
                : 'border-border bg-card text-muted-foreground shadow-[0_4px_0_0_hsl(var(--border))] hover:border-primary/50 hover:shadow-[0_2px_0_0_hsl(var(--border))] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]'
            )}
          >
            {categoryIcons[cat]}
            <span className="text-xs font-medium">{categoryLabels[cat]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
