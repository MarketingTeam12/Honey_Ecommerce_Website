import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';

export const MIN_PAGE_COUNT = 1;
export const MAX_PAGE_COUNT = 500;

interface PageCountStepperProps {
  value: number;
  onChange: (nextValue: number) => void;
  inputId?: string;
}

/**
 * Accessible page-count stepper enforcing [1, 500] bounds with direct numeric typing
 * and inline min/max validation.
 */
export function PageCountStepper({
  value,
  onChange,
  inputId = 'page-count-input',
}: PageCountStepperProps) {
  const safeValue = Math.min(MAX_PAGE_COUNT, Math.max(MIN_PAGE_COUNT, Math.trunc(value || MIN_PAGE_COUNT)));
  const [draftText, setDraftText] = useState(String(safeValue));

  useEffect(() => {
    setDraftText(String(safeValue));
  }, [safeValue]);

  const commitValue = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setDraftText(String(safeValue));
      return;
    }
    const clamped = Math.min(MAX_PAGE_COUNT, Math.max(MIN_PAGE_COUNT, parsed));
    onChange(clamped);
    setDraftText(String(clamped));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setDraftText('');
      return;
    }
    if (!/^\d+$/.test(raw)) {
      return;
    }
    setDraftText(raw);
    const parsed = parseInt(raw, 10);
    if (parsed >= MIN_PAGE_COUNT) {
      onChange(Math.min(MAX_PAGE_COUNT, parsed));
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={inputId} className="font-semibold text-gray-900 whitespace-nowrap">
          Total no. of pages:
        </Label>
        <div className="inline-flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            aria-label="Decrease number of pages"
            onClick={() => onChange(Math.max(MIN_PAGE_COUNT, safeValue - 1))}
            disabled={safeValue <= MIN_PAGE_COUNT}
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
          </Button>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={MIN_PAGE_COUNT}
            max={MAX_PAGE_COUNT}
            value={draftText}
            onChange={handleInputChange}
            onBlur={() => commitValue(draftText)}
            className="w-20 min-h-[44px] text-center px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1f5c]"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            aria-label="Increase number of pages"
            onClick={() => onChange(Math.min(MAX_PAGE_COUNT, safeValue + 1))}
            disabled={safeValue >= MAX_PAGE_COUNT}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </Button>
          <span className="text-sm text-gray-700 font-medium">pages</span>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        Enter between {MIN_PAGE_COUNT} and {MAX_PAGE_COUNT} pages.
      </p>
    </div>
  );
}
