import React from 'react';
import { IDCardField } from '@/types/idCard';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FieldsManagerProps {
  fields: IDCardField[];
  onChange: (fields: IDCardField[]) => void;
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const FieldsManager: React.FC<FieldsManagerProps> = ({ fields, onChange }) => {
  const updateField = (key: string, updates: Partial<IDCardField>) => {
    const newFields = fields.map((f) =>
      f.key === key ? { ...f, ...updates } : f
    );
    onChange(newFields);
  };

  const toggleField = (key: string) => {
    updateField(key, { enabled: !fields.find((f) => f.key === key)?.enabled });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Details & Fields</h3>
      
      {/* Field Toggles */}
      <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">Show/Hide Fields:</p>
        <div className="grid grid-cols-2 gap-2">
          {fields.map((field) => (
            <div key={field.key} className="flex items-center space-x-2">
              <Checkbox
                id={`toggle-${field.key}`}
                checked={field.enabled}
                onCheckedChange={() => toggleField(field.key)}
              />
              <Label
                htmlFor={`toggle-${field.key}`}
                className="text-xs cursor-pointer"
              >
                {field.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Field Values */}
      <div className="space-y-3">
        {fields
          .filter((f) => f.enabled)
          .map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key} className="text-xs text-muted-foreground">
                {field.label}
              </Label>
              {field.key === 'bloodGroup' ? (
                <Select
                  value={field.value}
                  onValueChange={(value) => updateField(field.key, { value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.key === 'dob' ? (
                <Input
                  id={field.key}
                  type="date"
                  value={field.value}
                  onChange={(e) => updateField(field.key, { value: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <Input
                  id={field.key}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={field.value}
                  onChange={(e) => updateField(field.key, { value: e.target.value })}
                  className="mt-1"
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default FieldsManager;
