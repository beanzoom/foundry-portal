import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';

interface OpenTextQuestionProps {
  question: {
    id: string;
    question_text: string;
    required: boolean;
  };
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OpenTextQuestion({ question, value, onChange, disabled }: OpenTextQuestionProps) {
  const [localValue, setLocalValue] = useState(value);
  const maxLength = 500;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.slice(0, maxLength);
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-1">
        <span className="text-lg font-medium">{question.question_text}</span>
        {question.required && <span className="text-red-500">*</span>}
      </div>
      
      <div className="space-y-2">
        <Textarea
          id={question.id}
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Type your answer here..."
          className="min-h-[120px] resize-none"
          maxLength={maxLength}
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{question.required ? 'Required' : 'Optional'}</span>
          <span>{localValue.length} / {maxLength} characters</span>
        </div>
      </div>
    </div>
  );
}