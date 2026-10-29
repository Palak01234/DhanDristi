interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  id: string;
}

export function Toggle({ checked, onChange, label, description, id }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1">
        <label htmlFor={id} className="block cursor-pointer text-sm font-semibold text-foreground-950">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-foreground-600">{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? "bg-primary-600" : "bg-background-300"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1 h-5 w-5 rounded-full bg-background-50 transition-transform ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}