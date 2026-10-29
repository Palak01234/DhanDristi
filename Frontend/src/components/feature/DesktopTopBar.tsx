import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Moon, Sun, Wifi, WifiOff, UserRound, Settings, LogOut, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppProvider";

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/home":                    { title: "Home",                subtitle: "DhanDrishti is ready to scan currency." },
  "/scan":                    { title: "Scan Currency",       subtitle: "Point the camera at a note." },
  "/scan/result":             { title: "Detection Result",    subtitle: "Latest recognition output." },
  "/convert":                 { title: "Currency Converter",  subtitle: "Convert amounts between currencies." },
  "/history":                 { title: "History",             subtitle: "Your recent currency detections." },
  "/settings":                { title: "Settings",            subtitle: "Personalize voice, detection and accessibility." },
  "/profile":                 { title: "Profile",             subtitle: "Your account and detection preferences." },
  "/help":                    { title: "Help & Accessibility", subtitle: "Guides, tips, and support." },
  "/admin":                   { title: "Admin Dashboard",     subtitle: "Analytics and system status." },
  "/preferences/currency":    { title: "Detection Currency",  subtitle: "How should DhanDrishti scan?" },
  "/preferences/denomination":{ title: "Denominations",       subtitle: "Which note values to detect?" },
};

function usePageMeta() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, "") || "/home";
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;
  // prefix match (for dynamic sub-routes)
  const prefixMatch = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname.startsWith(k));
  return prefixMatch ? PAGE_TITLES[prefixMatch] : { title: "DhanDrishti", subtitle: "" };
}

export function DesktopTopBar() {
  const navigate = useNavigate();
  const { preferences, updatePreferences, logout } = useApp();
  const meta = usePageMeta();

  const [online, setOnline] = useState(window.navigator.onLine);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const darkMode = preferences.accessibility.darkMode;

  // track live network status
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const toggleDark = () => {
    updatePreferences({
      accessibility: { ...preferences.accessibility, darkMode: !darkMode },
    });
  };

  return (
    <header
      aria-label="Desktop top bar"
      className="sticky top-0 z-20 hidden h-16 w-full items-center justify-between gap-4 border-b border-background-200 bg-background-50/90 px-6 backdrop-blur-md lg:flex"
    >
      {/* Page title */}
      <div className="min-w-0">
        <h2 className="truncate font-heading text-lg font-bold leading-tight text-foreground-950">
          {meta.title}
        </h2>
        {meta.subtitle && (
          <p className="truncate text-xs text-foreground-600">{meta.subtitle}</p>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Network status */}
        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
            online
              ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200"
              : "bg-accent-50 text-accent-800 ring-1 ring-accent-200"
          }`}
          title={online ? "Network: online" : "Network: offline"}
        >
          {online ? (
            <Wifi aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <WifiOff aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          <span className="hidden xl:inline">{online ? "Online" : "Offline"}</span>
        </span>

        {/* Dark / light toggle */}
        <button
          onClick={toggleDark}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-background-200 bg-background-50 text-foreground-600 transition-colors hover:bg-background-100"
        >
          {darkMode ? (
            <Sun aria-hidden="true" className="h-4 w-4 text-accent-600" />
          ) : (
            <Moon aria-hidden="true" className="h-4 w-4" />
          )}
        </button>

        {/* Profile menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((p) => !p)}
            aria-haspopup="true"
            aria-expanded={profileOpen}
            aria-label="Profile menu"
            className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-background-200 bg-background-50 pl-2 pr-3 transition-colors hover:bg-background-100"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 font-heading text-[10px] font-bold text-background-50"
            >
              DD
            </span>
            <span className="hidden text-sm font-semibold text-foreground-950 xl:inline">Dhan User</span>
            <ChevronDown
              aria-hidden="true"
              className={`h-3.5 w-3.5 text-foreground-400 transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-background-200 bg-background-50 py-1"
            >
              <div className="border-b border-background-200 px-4 py-3">
                <p className="text-sm font-bold text-foreground-950">Dhan User</p>
                <p className="text-xs text-foreground-600">dhan@example.com</p>
              </div>

              <MenuItem
                icon={<UserRound aria-hidden="true" className="h-4 w-4" />}
                label="Profile"
                onClick={() => { setProfileOpen(false); navigate("/profile"); }}
              />
              <MenuItem
                icon={<Settings aria-hidden="true" className="h-4 w-4" />}
                label="Settings"
                onClick={() => { setProfileOpen(false); navigate("/settings"); }}
              />

              <div className="border-t border-background-200 pt-1">
                <MenuItem
                  icon={<LogOut aria-hidden="true" className="h-4 w-4 text-accent-700" />}
                  label="Log out"
                  labelClass="text-accent-800"
                  onClick={() => { setProfileOpen(false); logout(); navigate("/login"); }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  icon,
  label,
  labelClass = "",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  labelClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-background-100"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-600">
        {icon}
      </span>
      <span className={`font-semibold text-foreground-950 ${labelClass}`}>{label}</span>
    </button>
  );
}