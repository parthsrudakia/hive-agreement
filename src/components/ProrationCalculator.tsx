import { useState, useMemo } from 'react';
import { format, getDaysInMonth, getDate } from 'date-fns';
import { Calculator, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';

interface ProrationCalculatorProps {
  monthlyRent: string;
  moveInDate: Date | undefined;
  onApply: (value: string) => void;
}

const ProrationCalculator = ({ monthlyRent, moveInDate, onApply }: ProrationCalculatorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(moveInDate);
  const [rentInput, setRentInput] = useState<string>(monthlyRent);

  const effectiveDate = selectedDate ?? moveInDate;
  const rentNum = parseFloat(rentInput);

  const result = useMemo(() => {
    if (!effectiveDate || !rentNum || isNaN(rentNum) || rentNum <= 0) return null;
    const daysInMonth = getDaysInMonth(effectiveDate);
    const moveDay = getDate(effectiveDate);
    const daysOccupied = daysInMonth - moveDay + 1;
    const dailyRate = rentNum / daysInMonth;
    const prorated = dailyRate * daysOccupied;
    return {
      daysOccupied,
      daysInMonth,
      dailyRate,
      prorated: Math.round(prorated * 100) / 100,
    };
  }, [effectiveDate, rentNum]);

  const handleApply = () => {
    if (result) {
      onApply(result.prorated.toFixed(2));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) {
        setSelectedDate(moveInDate);
        setRentInput(monthlyRent);
      }
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary hover:text-primary/80 font-semibold"
        >
          <Calculator className="h-3 w-3" />
          Calculate
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4" align="end">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Prorated Rent Calculator</h4>
          <p className="text-xs text-muted-foreground">
            Based on monthly rent and move-in date.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="calc-rent" className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Rent ($)</Label>
          <Input
            id="calc-rent"
            type="number"
            placeholder="e.g., 1650"
            value={rentInput}
            onChange={(e) => setRentInput(e.target.value)}
            className="h-10 bg-secondary/50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Move-in Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-10 justify-start text-left font-normal bg-secondary/50',
                  !effectiveDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {effectiveDate ? format(effectiveDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={effectiveDate}
                onSelect={setSelectedDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {result ? (
          <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Days occupied</span>
              <span className="font-medium">{result.daysOccupied} / {result.daysInMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily rate</span>
              <span className="font-medium">${result.dailyRate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
              <span className="font-semibold">Prorated rent</span>
              <span className="font-bold text-primary">${result.prorated.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Enter a monthly rent and pick a move-in date to calculate.
          </p>
        )}

        <Button
          type="button"
          onClick={handleApply}
          disabled={!result}
          className="w-full h-10 text-xs uppercase tracking-wider"
        >
          Apply to Form
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default ProrationCalculator;
