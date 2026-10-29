import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  DetectionResult,
  UserPreferences,
} from "@/types";
import { DEFAULT_PREFERENCES } from "@/data/defaults";
import type { DetectionRecord } from "@/types";
import { apiUrl } from "@/services/api";

export interface AppContextValue {
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  lastResult: DetectionResult | null;
  setLastResult: (r: DetectionResult | null) => void;
  isDemoUser: boolean;
  isAuthenticated: boolean;
  history: DetectionRecord[];
  addHistoryRecord: (record: DetectionRecord) => Promise<void>;
  removeHistoryRecord: (id: string) => void;
  clearHistory: () => void;
  switchUser: (email: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const PREF_KEY = "dd_preferences";
function loadPreferences(): UserPreferences {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserPreferences>;
        return { ...DEFAULT_PREFERENCES, ...parsed, voice: { ...DEFAULT_PREFERENCES.voice, ...(parsed.voice ?? {}) } };
      }
    } catch {
      /* ignore corrupt/unavailable storage */
    }
  }
  return DEFAULT_PREFERENCES;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(loadPreferences);
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);
  const [isDemoUser] = useState(true);
  const [activeEmail, setActiveEmail] = useState<string | null>(() => {
    try {
      return (JSON.parse(window.localStorage.getItem("dd_user") ?? "null") as { email?: string } | null)?.email ?? null;
    } catch {
      return null;
    }
  });
  const [history, setHistory] = useState<DetectionRecord[]>([]);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const addHistoryRecord = useCallback(async (record: DetectionRecord) => {
    setHistory((prev) => [record, ...prev]);
    if (activeEmail) {
      const response = await fetch(apiUrl("/api/history"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: activeEmail, record }) });
      if (!response.ok) throw new Error("History could not be saved to MongoDB");
    }
  }, [activeEmail]);
  const removeHistoryRecord = useCallback((id: string) => {
    setHistory((prev) => prev.filter((record) => record.id !== id));
    if (activeEmail) void fetch(apiUrl(`/api/history/${encodeURIComponent(id)}?email=${encodeURIComponent(activeEmail)}`), { method: "DELETE" });
  }, [activeEmail]);
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (activeEmail) void fetch(apiUrl(`/api/history?email=${encodeURIComponent(activeEmail)}`), { method: "DELETE" });
  }, [activeEmail]);
  const switchUser = useCallback((email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    setActiveEmail(normalizedEmail);
    setHistory([]);
    setLastResult(null);
    void fetch(apiUrl(`/api/history?email=${encodeURIComponent(normalizedEmail)}`))
      .then((response) => response.ok ? response.json() as Promise<DetectionRecord[]> : [])
      .then((records) => setHistory(records));
  }, []);
  const logout = useCallback(() => {
    setActiveEmail(null);
    setHistory([]);
    setLastResult(null);
    try {
      window.localStorage.removeItem("dd_user");
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  useEffect(() => {
    if (!activeEmail) return;
    let cancelled = false;
    void fetch(apiUrl(`/api/history?email=${encodeURIComponent(activeEmail)}`))
      .then((response) => response.ok ? response.json() as Promise<DetectionRecord[]> : [])
      .then((records) => {
        if (!cancelled) setHistory(records);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [activeEmail]);

  useEffect(() => {
    document.body.classList.toggle("high-contrast", preferences.accessibility.highContrast);
    document.body.classList.toggle("large-text", preferences.accessibility.largeText);
    document.documentElement.classList.toggle("dark", preferences.accessibility.darkMode);
    try {
      window.localStorage.setItem(PREF_KEY, JSON.stringify(preferences));
    } catch {
      /* storage may be unavailable */
    }
  }, [preferences]);

  const value = useMemo(
    () => ({
      preferences,
      updatePreferences,
      resetPreferences,
      lastResult,
      setLastResult,
      isDemoUser,
      isAuthenticated: Boolean(activeEmail),
      history,
      addHistoryRecord,
      removeHistoryRecord,
      clearHistory,
      switchUser,
      logout,
    }),
    [
      preferences,
      updatePreferences,
      resetPreferences,
      lastResult,
      isDemoUser,
      activeEmail,
      history,
      addHistoryRecord,
      removeHistoryRecord,
      clearHistory,
      switchUser,
      logout,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}