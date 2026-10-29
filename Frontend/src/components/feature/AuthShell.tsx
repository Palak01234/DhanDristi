import type { ReactNode } from "react";
import { ScanLine, Volume2, ShieldCheck, Coins } from "lucide-react";
import { BrandMark } from "@/components/base/BrandMark";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const HIGHLIGHTS = [
  { icon: ScanLine, text: "Point your camera and recognise any banknote instantly." },
  { icon: Volume2, text: "Hear clear spoken results in your chosen voice." },
  { icon: Coins, text: "Six currencies supported, online or offline." },
  { icon: ShieldCheck, text: "Built accessibility-first, for low-vision users." },
];

export function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="app-bg min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Desktop brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-12 text-background-50 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <BrandMark size="sm" dark />
          <span className="font-heading text-lg font-bold">DhanDrishti</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-heading text-4xl font-bold leading-tight">
            See money.
            <br />
            Hear money.
          </h2>
          <p className="mt-4 text-base text-primary-100/80">
            An assistive companion that helps visually impaired users identify paper currency
            independently, with confident spoken feedback.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <li key={h.text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background-50/10 ring-1 ring-background-50/15">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-relaxed text-primary-50/90">{h.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-primary-100/60">
          Accessible currency recognition, available on any phone.
        </p>
      </aside>

      {/* Form column */}
      <div className="flex min-h-screen flex-col px-5 py-9 sm:px-8 lg:justify-center lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark size="sm" />
            <span className="font-heading text-lg font-bold text-foreground-950">DhanDrishti</span>
          </div>

          <div className="animate-fade-up mt-8 lg:mt-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground-950">
              {title}
            </h1>
            <p className="mt-2 text-sm text-foreground-600">{subtitle}</p>
          </div>

          <div className="animate-fade-up surface mt-7 rounded-2xl p-6">{children}</div>

          {footer && <div className="mt-6 text-center">{footer}</div>}
        </div>
      </div>
    </div>
  );
}