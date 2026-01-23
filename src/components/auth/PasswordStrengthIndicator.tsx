import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const requirements = useMemo((): Requirement[] => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Contains special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length;
    return (metCount / requirements.length) * 100;
  }, [requirements]);

  const strengthLabel = useMemo(() => {
    if (strength === 0) return { text: '', color: 'text-muted-foreground' };
    if (strength <= 40) return { text: 'Weak', color: 'text-destructive' };
    if (strength <= 60) return { text: 'Fair', color: 'text-orange-500' };
    if (strength <= 80) return { text: 'Good', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-500' };
  }, [strength]);

  const progressColor = useMemo(() => {
    if (strength <= 40) return 'bg-destructive';
    if (strength <= 60) return 'bg-orange-500';
    if (strength <= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [strength]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn('font-medium', strengthLabel.color)}>{strengthLabel.text}</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn('h-full transition-all duration-300', progressColor)}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1.5">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            {req.met ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={cn(
              req.met ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain a lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain a number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain a special character' };
  }
  return { isValid: true, message: '' };
};
