import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Volume2,
  Accessibility as AccessibilityIcon,
  Eye,
  Smartphone,
  Shield,
  ChevronRight,
  UserRound,
  HeartHandshake,
  Trash2,
  LogOut,
  Moon,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";
import { Toggle } from "@/components/base/Toggle";
import { Slider } from "@/components/base/Slider";
import { PageHeader } from "@/components/base/PageHeader";
import { VoiceStudio } from "@/components/feature/VoiceStudio";
import { useApp } from "@/context/AppProvider";
import { useVoice } from "@/context/VoiceProvider";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/constants/currencies";

export default function Settings() {
  const navigate = useNavigate();
  const { preferences, updatePreferences, clearHistory, logout } = useApp();
  const { settings, setSettings } = useVoice();

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const access = preferences.accessibility;
  const toggleDark = (v: boolean) => {
    updatePreferences({ accessibility: { ...access, darkMode: v } });
  };

  const linkRow = (to: string, label: string, desc: string, icon: ReactNode) => (
    <button
      key={to}
      onClick={() => navigate(to)}
      className="surface-muted flex w-full cursor-pointer items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-background-200"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background-50 text-primary-700 ring-1 ring-background-200">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground-950">{label}</p>
        <p className="text-xs text-foreground-600">{desc}</p>
      </div>
      <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-foreground-400" />
    </button>
  );

  return (
    <MainLayout>
      <PageHeader
        title="Settings"
        subtitle="Personalize voice, detection and accessibility."
      />

      <div className="space-y-8 px-5 py-6 md:px-8 lg:grid lg:grid-cols-3 lg:items-start lg:gap-8 lg:space-y-0">
        {/* Voice — full width on desktop */}
        <section aria-label="Voice" className="space-y-4 lg:col-span-2">
          <SectionHeader icon={<Volume2 className="h-5 w-5" />} title="Voice" />
          <VoiceStudio />

          <Card className="divide-y divide-background-200">
            <Toggle
              id="auto-speak"
              label="Auto-speak results"
              description="Speak detection results automatically after a scan."
              checked={settings.autoSpeak}
              onChange={(v) => setSettings({ autoSpeak: v })}
            />
            <Toggle
              id="repeat"
              label="Repeat result"
              description="Say the result twice for confidence."
              checked={settings.repeatResult}
              onChange={(v) => setSettings({ repeatResult: v })}
            />
            <Toggle
              id="vibration"
              label="Vibration"
              description="Vibrate the device on detection."
              checked={settings.vibration}
              onChange={(v) => setSettings({ vibration: v })}
            />
          </Card>
        </section>

        {/* Right column */}
        <div className="space-y-8">
          {/* Accessibility */}
          <section aria-label="Accessibility" className="space-y-4">
            <SectionHeader icon={<Moon className="h-5 w-5" />} title="Display & Accessibility" />
            <Card className="divide-y divide-background-200">
              <Toggle
                id="dark-mode"
                label="Dark mode"
                description="Switch the entire app to a dark theme."
                checked={access.darkMode ?? false}
                onChange={toggleDark}
              />
              <Toggle
                id="high-contrast"
                label="High contrast"
                description="Stronger colors and borders for visibility."
                checked={access.highContrast}
                onChange={(v) => updatePreferences({ accessibility: { ...access, highContrast: v } })}
              />
              <Toggle
                id="large-text"
                label="Large text"
                description="Increase text size across the app."
                checked={access.largeText}
                onChange={(v) => updatePreferences({ accessibility: { ...access, largeText: v } })}
              />
              <div className="pt-2">
                <Slider
                  id="confidence"
                  label="Confidence threshold"
                  min={0.5}
                  max={0.95}
                  step={0.05}
                  value={preferences.confidenceThreshold}
                  onChange={(v) => updatePreferences({ confidenceThreshold: v })}
                  display={`${Math.round(preferences.confidenceThreshold * 100)}%`}
                />
              </div>
            </Card>
          </section>

          {/* Recognition */}
          <section aria-label="Recognition" className="space-y-4">
            <SectionHeader icon={<Eye className="h-5 w-5" />} title="Recognition" />
            <Card className="divide-y divide-background-200">
              <Toggle
                id="auto-scan"
                label="Auto scan"
                description="Start scanning as soon as a note is framed."
                checked={preferences.autoScan}
                onChange={(v) => updatePreferences({ autoScan: v })}
              />
              <Toggle
                id="offline-model"
                label="Offline model"
                description="Use the on-device recognition model when available."
                checked={preferences.offlineModel}
                onChange={(v) => updatePreferences({ offlineModel: v })}
              />
              <div className="space-y-2 px-4 py-4">
                <label htmlFor="default-converter-currency" className="block text-sm font-bold text-foreground-950">
                  Default converter currency
                </label>
                <p className="text-xs text-foreground-600">Choose the currency used as the default conversion target.</p>
                <select
                  id="default-converter-currency"
                  value={preferences.conversionCurrency}
                  onChange={(event) => updatePreferences({ conversionCurrency: event.target.value as CurrencyCode })}
                  className="h-11 w-full cursor-pointer rounded-xl border border-background-300 bg-background-50 px-3 text-sm font-semibold text-foreground-950 focus:border-primary-400 focus:outline-3 focus:outline-primary-400"
                >
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2.5 pt-3">
                {linkRow(
                  "/preferences/currency",
                  "Detection currency",
                  "Change currency, mode and selection",
                  <Smartphone className="h-4 w-4" />,
                )}
                {linkRow(
                  "/preferences/denomination",
                  "Denominations",
                  "Choose which note values to detect",
                  <Eye className="h-4 w-4" />,
                )}
              </div>
            </Card>
          </section>

          {/* Account */}
          <section aria-label="Account" className="space-y-4">
            <SectionHeader icon={<Shield className="h-5 w-5" />} title="Account" />
            <div className="space-y-2.5">
              {linkRow("/profile", "Profile", "Your name, email and preferences", <UserRound className="h-4 w-4" />)}
              {linkRow("/help", "Help & Accessibility", "Scanning guide and support", <HeartHandshake className="h-4 w-4" />)}
            </div>
          </section>

          {/* Privacy */}
          <section aria-label="Privacy and data" className="space-y-4">
            <SectionHeader icon={<Shield className="h-5 w-5" />} title="Privacy & Data" />
            <Card>
              <p className="text-sm leading-relaxed text-foreground-700">
                DhanDrishti never stores camera images by default. Only currency, denomination,
                confidence and timestamps are saved to help you.
              </p>
              <Button
                className="mt-4"
                variant="danger"
                size="md"
                fullWidth
                onClick={() => setConfirmClear(true)}
                icon={<Trash2 aria-hidden="true" className="h-4 w-4" />}
              >
                Clear History
              </Button>
              <Button
                className="mt-2.5"
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => setConfirmLogout(true)}
                icon={<LogOut aria-hidden="true" className="h-4 w-4" />}
              >
                Log out
              </Button>
            </Card>
          </section>
        </div>
      </div>

      {confirmClear && (
        <ConfirmDialog
          title="Clear history?"
          body="This will remove all your saved detection history. This cannot be undone."
          confirmLabel="Clear"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            setConfirmClear(false);
            clearHistory();
            navigate("/history");
          }}
        />
      )}

      {confirmLogout && (
        <ConfirmDialog
          title="Log out?"
          body="You will need to sign in again to access your account."
          confirmLabel="Log out"
          variant="secondary"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => {
            setConfirmLogout(false);
            logout();
            navigate("/login");
          }}
        />
      )}
    </MainLayout>
  );
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2.5 font-heading text-lg font-bold text-foreground-950">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">{icon}</span>
      {title}
    </h2>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = "primary",
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "primary" | "secondary";
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/50 p-6"
    >
      <div className="surface w-full max-w-sm rounded-2xl p-6">
        <h2 className="font-heading text-xl font-bold text-foreground-950">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-700">{body}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" size="md" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={variant} size="md" fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}