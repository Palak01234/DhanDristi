import type { ReactNode } from "react";

type Tone = "ok" | "warn" | "off" | "info";

const TONES: Record<Tone, string> = {
  ok: "bg-primary-50 text-primary-700 ring-1 ring-primary-200",
  warn: "bg-accent-50 text-accent-800 ring-1 ring-accent-200",
  off: "bg-background-100 text-foreground-600 ring-1 ring-background-200",
  info: "bg-secondary-50 text-secondary-800 ring-1 ring-secondary-200",
};

interface StatusPillProps {
  icon: ReactNode;
  label: string;
  tone?: Tone;
  dark?: boolean;
}

export function StatusPill({ icon, label, tone = "ok", dark = false }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
        dark ? "glass-pill text-background-50" : TONES[tone]
      }`}
    >
      <span aria-hidden="true" className="flex h-3.5 w-3.5 items-center justify-center">
        {icon}
      </span>
      {label}
    </span>
  );
}