// src/components/ui/Select.jsx
import { cn } from "@/lib/utils";

export function Select({ label, error, options, className, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full px-4 py-2 bg-dark-secondary border border-gray-700 rounded-lg",
          "text-white",
          "focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent",
          "transition-all cursor-pointer",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
