import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  ScanLine,
  Repeat,
  History as HistoryIcon,
  Settings,
  UserRound,
  LifeBuoy,
  Mic2,
  Sparkles,
  MonitorSpeaker,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/base/BrandMark";
import { useVoice } from "@/context/VoiceProvider";

interface SidebarItem {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}

const PRIMARY: SidebarItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/scan", label: "Scan Currency", icon: ScanLine, exact: true },
  { to: "/scan/counterfeit", label: "Counterfeit Check", icon: ShieldCheck },
  { to: "/convert", label: "Converter", icon: Repeat },
  { to: "/history", label: "History", icon: HistoryIcon },
];

const SECONDARY: SidebarItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/help", label: "Help", icon: LifeBuoy },
];

/** Desktop-only navigation rail. Hidden below the lg breakpoint. */
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usingAi, selectedLanguage, providerStatus } = useVoice();
  const selectedVoice = {
    name: "DhanDrishti Voice",
    family: selectedLanguage.label,
    gender: "female",
  };

  const renderItem = (item: SidebarItem) => {
    const active = item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          active
            ? "bg-primary-50 text-primary-700 ring-1 ring-primary-100"
            : "text-foreground-600 hover:bg-background-100 hover:text-foreground-950"
        }`}
      >
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
        {item.label}
      </NavLink>
    );
  };

  return (
    <aside
      aria-label="Primary navigation"
      className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-background-200 bg-background-50 lg:flex"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <BrandMark size="sm" />
        <div className="min-w-0">
          <p className="font-heading text-base font-bold leading-tight text-foreground-950">
            DhanDrishti
          </p>
          <p className="truncate text-xs text-foreground-600">Smart Currency Recognition</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {PRIMARY.map(renderItem)}
        <span aria-hidden="true" className="my-3 h-px bg-background-200" />
        {SECONDARY.map(renderItem)}
      </nav>

      {/* Voice Engine panel */}
      <div className="m-3 overflow-hidden rounded-2xl border border-background-200">
        {/* Header row */}
        <div
          className={`relative flex items-center gap-3 px-4 py-3 ${
            usingAi
              ? "bg-gradient-to-r from-primary-700 to-primary-900"
              : providerStatus.usingFallback
              ? "bg-accent-800"
              : "bg-background-200"
          }`}
        >
          {/* Status dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                usingAi ? "bg-primary-300" : providerStatus.usingFallback ? "bg-accent-400" : "bg-background-400"
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                usingAi ? "bg-primary-200" : providerStatus.usingFallback ? "bg-accent-300" : "bg-background-400"
              }`}
            />
          </span>

          {/* Provider badge */}
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-xs font-bold uppercase tracking-wider ${
                usingAi ? "text-primary-100" : providerStatus.usingFallback ? "text-accent-100" : "text-foreground-600"
              }`}
            >
              {usingAi ? "AI Engine" : "Unavailable"}
            </p>
            <p
              className={`truncate text-sm font-bold ${
                usingAi ? "text-background-50" : providerStatus.usingFallback ? "text-background-100" : "text-foreground-950"
              }`}
            >
              {providerStatus.providerLabel}
            </p>
          </div>

          {/* Icon */}
          {usingAi ? (
            <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-300" />
          ) : providerStatus.usingFallback ? (
            <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-200" />
          ) : (
            <MonitorSpeaker aria-hidden="true" className="h-4 w-4 shrink-0 text-foreground-500" />
          )}
        </div>

        {/* Persona row */}
        <div className="flex items-center gap-3 bg-background-100 px-4 py-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              "bg-secondary-100 text-secondary-700"
            }`}
          >
            <Mic2 aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground-950">{selectedVoice.name}</p>
            <p className="truncate text-xs text-foreground-500">
              {selectedVoice.family} · {selectedVoice.gender}
            </p>
          </div>
        </div>

        {/* Switch voice shortcut */}
        <button
          onClick={() => navigate("/settings")}
          aria-label="Change speech language in Settings"
          className="flex w-full cursor-pointer items-center justify-between gap-2 bg-background-50 px-4 py-2.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-background-100"
        >
          <span>Change language</span>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-primary-500" />
        </button>
      </div>
    </aside>
  );
}
