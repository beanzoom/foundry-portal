import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface YesNoQuestionProps {
  question: {
    id: string;
    question_text: string;
    required: boolean;
  };
  value: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function YesNoQuestion({ question, value, onChange, disabled }: YesNoQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-1">
        <span className="text-lg font-medium">{question.question_text}</span>
        {question.required && <span className="text-red-500">*</span>}
      </div>
      
      <RadioGroup
        value={value === null ? undefined : value.toString()}
        onValueChange={(val) => onChange(val === 'true')}
        disabled={disabled}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="true" id={`${question.id}-yes`} />
          <Label 
            htmlFor={`${question.id}-yes`} 
            className="flex-1 cursor-pointer text-base"
          >
            Yes
          </Label>
        </div>
        <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="false" id={`${question.id}-no`} />
          <Label 
            htmlFor={`${question.id}-no`} 
            className="flex-1 cursor-pointer text-base"
          >
            No
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}