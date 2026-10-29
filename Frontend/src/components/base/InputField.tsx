import type { ReactNode } from "react";

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  required?: boolean;
  error?: string;
}

export function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  rightSlot,
  required,
  error,
}: InputFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground-900">
        {label}
        {required && <span aria-hidden="true" className="text-accent-700"> *</span>}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <span aria-hidden="true" className="pointer-events-none absolute left-3.5 text-foreground-400">
            {icon}
          </span>
        )}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={error ? "true" : undefined}
          className={`h-12 w-full rounded-xl border bg-background-50 px-4 text-base text-foreground-950 transition-colors placeholder:text-foreground-400 focus:outline-3 focus:outline-primary-400 ${
            icon ? "pl-11" : ""
          } ${rightSlot ? "pr-12" : ""} ${
            error ? "border-accent-500" : "border-background-300 focus:border-primary-400"
          }`}
        />
        {rightSlot && (
          <span className="absolute right-1.5 flex items-center">{rightSlot}</span>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-accent-800">
          {error}
        </p>
      )}
    </div>
  );
}