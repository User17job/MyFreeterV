// src/components/ui/Button.jsx
import { cn } from "@/lib/utils";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-orange text-white hover:bg-orange-light focus:ring-orange",
    secondary:
      "bg-dark-secondary text-white hover:bg-dark-tertiary focus:ring-dark-tertiary",
    ghost: "hover:bg-dark-secondary text-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
