
import React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AppDialogBody = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof ScrollArea>) => (
  <ScrollArea
    className={cn(
      "flex-1 overflow-auto",
      className
    )}
    {...props}
  >
    <div className="p-6 pt-4">
      {children}
    </div>
  </ScrollArea>
);

export const AppDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}
  />
));
AppDialogContent.displayName = "AppDialogContent";
