// src/components/ui/Card.jsx
import { cn } from "@/lib/utils";

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-dark-secondary border border-gray-800 rounded-xl p-4",
        "shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
