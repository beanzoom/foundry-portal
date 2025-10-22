
import React from "react";
import { cn } from "@/lib/utils";

export const AppDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-row items-center justify-end shrink-0 space-x-2 border-t p-6 pt-4",
      className
    )}
    {...props}
  />
);
