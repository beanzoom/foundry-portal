
import { cn } from "@/lib/utils";
import React from "react";

interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string;
  children?: React.ReactNode;
}

const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn("list-none space-y-1", className)}
        {...props}
      >
        {children}
      </ul>
    );
  }
);
List.displayName = "List";

interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  className?: string;
  children?: React.ReactNode;
}

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        {children}
      </li>
    );
  }
);
ListItem.displayName = "ListItem";

export { List, ListItem };
