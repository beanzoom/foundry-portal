import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface MultipleChoiceQuestionProps {
  question: {
    id: string;
    question_text: string;
    options: string[];
    required: boolean;
  };
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MultipleChoiceQuestion({ question, value, onChange, disabled }: MultipleChoiceQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-1">
        <span className="text-lg font-medium">{question.question_text}</span>
        {question.required && <span className="text-red-500">*</span>}
      </div>
      
      <RadioGroup
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
        className="space-y-2"
      >
        {question.options.map((option, index) => (
          <div 
            key={index} 
            className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <RadioGroupItem value={option} id={`${question.id}-${index}`} />
            <Label 
              htmlFor={`${question.id}-${index}`} 
              className="flex-1 cursor-pointer text-base"
            >
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}