import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Repeat,
  ScanLine,
  History,
  Settings,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  ariaLabel: string;
}

const LEFT: NavItem[] = [
  { to: "/home", label: "Home", icon: Home, ariaLabel: "Home" },
  { to: "/convert", label: "Convert", icon: Repeat, ariaLabel: "Convert currency" },
];
const RIGHT: NavItem[] = [
  { to: "/history", label: "History", icon: History, ariaLabel: "History" },
  { to: "/settings", label: "Settings", icon: Settings, ariaLabel: "Settings" },
];

/** Mobile-only bottom navigation. Hidden on desktop (lg+). */
export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const scanActive = location.pathname.startsWith("/scan");

  const renderItem = (item: NavItem) => {
    const active = location.pathname.startsWith(item.to);
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        aria-label={item.ariaLabel}
        aria-current={active ? "page" : undefined}
        className={`flex h-full flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl transition-colors no-tap-highlight ${
          active ? "text-primary-700" : "text-foreground-500 hover:text-foreground-900"
        }`}
      >
        <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={active ? 2.6 : 2} />
        <span className={`text-[11px] ${active ? "font-bold" : "font-semibold"}`}>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 safe-bottom lg:hidden"
    >
      <div className="pointer-events-auto mx-auto mb-4 flex h-20 w-full max-w-md items-center justify-between gap-1 rounded-2xl border border-background-200 bg-background-50/95 px-2.5 backdrop-blur-md">
        {LEFT.map(renderItem)}

        <button
          onClick={() => navigate("/scan")}
          aria-label="Scan currency"
          aria-current={scanActive ? "page" : undefined}
          className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-background-50 transition-transform active:scale-95"
        >
          <ScanLine aria-hidden="true" className="h-7 w-7" strokeWidth={2.5} />
        </button>

        {RIGHT.map(renderItem)}
      </div>
    </nav>
  );
}