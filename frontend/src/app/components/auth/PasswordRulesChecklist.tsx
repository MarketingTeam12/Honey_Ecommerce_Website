import { Check, Circle } from 'lucide-react';
import { validatePasswordPolicy } from '@/app/utils/passwordValidation';

interface PasswordRulesChecklistProps {
  password: string;
  id?: string;
}

/**
 * Live-updating password policy checklist rendered beneath password fields
 * on Sign-up and Reset Password forms.
 */
export function PasswordRulesChecklist({ password, id }: PasswordRulesChecklistProps) {
  const { hasMinLength, hasLetter, hasNumber } = validatePasswordPolicy(password);
  const rules = [
    { key: 'length', met: hasMinLength, label: 'At least 8 characters' },
    { key: 'letter', met: hasLetter, label: 'At least one letter (A–Z or a–z)' },
    { key: 'number', met: hasNumber, label: 'At least one number (0–9)' },
  ];

  return (
    <ul id={id} className="mt-2 space-y-1 text-xs" aria-live="polite">
      {rules.map((rule) => (
        <li
          key={rule.key}
          className={`flex items-center gap-1.5 ${rule.met ? 'text-green-700 font-medium' : 'text-gray-600'}`}
        >
          {rule.met ? (
            <Check className="w-3.5 h-3.5 text-green-700 shrink-0" aria-hidden="true" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          )}
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}
