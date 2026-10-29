import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
  dark?: boolean;
  hero?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  showBack = false,
  right,
  dark = false,
  hero = false,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };
  const base = dark ? "text-background-50" : "text-foreground-950";
  const sub = dark ? "text-background-200" : "text-foreground-600";

  return (
    <header className="relative z-10 px-5 pt-7 md:px-8">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            aria-label="Go back"
            className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors ${
              dark ? "glass-pill text-background-50" : "border border-background-200 bg-background-50 text-foreground-800 hover:bg-background-100"
            }`}
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1
            className={`font-heading font-bold tracking-tight ${base} ${
              hero ? "text-2xl md:text-4xl" : "text-2xl md:text-3xl"
            }`}
          >
            {title}
          </h1>
          {subtitle && <p className={`mt-1 text-sm ${sub}`}>{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}