import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-background-50 hover:bg-primary-700 active:bg-primary-800",
  secondary:
    "bg-secondary-500 text-background-50 hover:bg-secondary-600 active:bg-secondary-700",
  accent:
    "bg-accent-500 text-foreground-950 hover:bg-accent-600 active:bg-accent-700",
  outline:
    "border border-background-300 bg-background-50 text-foreground-900 hover:bg-background-100 active:bg-background-200",
  ghost:
    "text-foreground-700 hover:bg-background-100 active:bg-background-200",
  danger:
    "border border-accent-200 bg-accent-50 text-accent-900 hover:bg-accent-100",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-7 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  ariaLabel?: string;
}

export function Button({
  variant = "primary",
  size = "lg",
  children,
  icon,
  iconRight,
  fullWidth,
  ariaLabel,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      aria-label={ariaLabel}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold tracking-tight whitespace-nowrap transition-colors duration-150
        focus-visible:outline-3 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-50
        ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}