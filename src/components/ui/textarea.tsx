
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    
    // Function to adjust the height based on content
    const adjustHeight = (element: HTMLTextAreaElement) => {
      if (autoResize) {
        // Reset height to auto to get the correct scrollHeight
        element.style.height = 'auto';
        // Set the height to match the content
        element.style.height = `${element.scrollHeight}px`;
      }
    };

    // Custom onChange handler to adjust height when content changes
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) onChange(event);
      if (autoResize) adjustHeight(event.target);
    };

    // Use effect to adjust height on mount and when dependencies change
    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea && autoResize) {
        adjustHeight(textarea);
      }
    }, [autoResize, props.value]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={(element) => {
          // Handle both the forwarded ref and our internal ref
          if (typeof ref === 'function') ref(element);
          else if (ref) ref.current = element;
          textareaRef.current = element;
        }}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
