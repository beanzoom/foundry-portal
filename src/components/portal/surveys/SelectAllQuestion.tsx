import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SelectAllQuestionProps {
  question: {
    id: string;
    question_text: string;
    options: string[];
    required: boolean;
  };
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function SelectAllQuestion({ question, value, onChange, disabled }: SelectAllQuestionProps) {
  const handleToggle = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...value, option]);
    } else {
      onChange(value.filter(v => v !== option));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-start gap-1">
          <span className="text-lg font-medium">{question.question_text}</span>
          {question.required && <span className="text-red-500">*</span>}
        </div>
        <p className="text-sm text-gray-600">Select all that apply</p>
      </div>
      
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <div 
            key={index} 
            className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <Checkbox
              id={`${question.id}-${index}`}
              checked={value.includes(option)}
              onCheckedChange={(checked) => handleToggle(option, checked as boolean)}
              disabled={disabled}
            />
            <Label 
              htmlFor={`${question.id}-${index}`} 
              className="flex-1 cursor-pointer text-base"
            >
              {option}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}