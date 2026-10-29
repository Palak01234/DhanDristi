import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
  subtitle?: string;
}

export function TopBar({ title, onBack, showBack = true, right, subtitle }: TopBarProps) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-background-200 bg-background-50/90 px-4 py-3 backdrop-blur-md">
      {showBack ? (
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-background-200 bg-background-50 text-foreground-800 transition-colors hover:bg-background-100"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold text-foreground-950">{title}</h1>
        {subtitle && <p className="truncate text-xs text-foreground-600">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}