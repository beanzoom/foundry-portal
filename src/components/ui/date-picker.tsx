
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  className?: string;
  date?: Date | null;
  setDate?: (date: Date | null) => void;
  disabled?: boolean;
  selected?: DateRange;
  onSelect?: (dateRange: DateRange | undefined) => void;
  mode?: "single" | "range" | "multiple";
}

export function DatePicker({ 
  value, 
  onChange, 
  className, 
  // Support for both naming conventions
  date = value, 
  setDate = onChange,
  disabled = false,
  selected,
  onSelect,
  mode = "single" 
}: DatePickerProps) {
  const handleSelect = (date: Date | null) => {
    if (setDate) {
      setDate(date);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {mode === "single" && (
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            className="pointer-events-auto"
          />
        )}
        {mode === "range" && (
          <Calendar
            mode="range"
            selected={selected}
            onSelect={onSelect}
            initialFocus
            className="pointer-events-auto"
          />
        )}
        {mode === "multiple" && (
          <Calendar
            mode="multiple"
            selected={[]}
            onSelect={() => {}}
            initialFocus
            className="pointer-events-auto"
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
