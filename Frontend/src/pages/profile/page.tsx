import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/base/PageHeader";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";
import { useApp } from "@/context/AppProvider";
import { getCurrency } from "@/constants/currencies";
import { apiUrl } from "@/services/api";

interface UserRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
}

function UserRow({ icon, label, value }: UserRowProps) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background-100 text-primary-700 ring-1 ring-background-200">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-foreground-600">{label}</p>
        <p className="truncate text-sm font-bold text-foreground-950">{value}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { preferences } = useApp();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const session = JSON.parse(window.localStorage.getItem("dd_user") ?? "null") as { email?: string } | null;
      if (!session?.email) return;
      void fetch(apiUrl(`/api/auth/profile?email=${encodeURIComponent(session.email)}`))
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as ProfileData;
        })
        .then((data) => {
          if (!cancelled && data) setProfile(data);
        })
        .catch(() => undefined);
    } catch {
      /* Ignore unavailable or malformed local session data. */
    }
    return () => { cancelled = true; };
  }, []);

  const detection = getCurrency(preferences.detectionCurrency);
  const conversion = getCurrency(preferences.conversionCurrency);

  const modeLabel =
    preferences.detectionMode === "single"
      ? "Single"
      : preferences.detectionMode === "multiple"
        ? "Multiple"
        : "Automatic";

  return (
    <MainLayout>
      <PageHeader title="Profile" subtitle="Your account and detection preferences." />

      <div className="px-5 py-6 md:px-8 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
        <Card className="flex flex-col items-center py-8 text-center lg:col-span-1">
          <span
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 font-heading text-2xl font-bold text-background-50"
          >
            DD
          </span>
          <p className="mt-4 font-heading text-xl font-bold text-foreground-950">{profile?.name ?? "Dhan User"}</p>
          <p className="text-sm text-foreground-600">Member</p>
          <span className="mt-3 flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 ring-1 ring-primary-200">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Account active
          </span>
        </Card>

        <div className="mt-5 space-y-5 lg:col-span-2 lg:mt-0">
          <Card className="space-y-4">
            <UserRow
              icon={<UserRound aria-hidden="true" className="h-4 w-4" />}
              label="Name"
              value={profile?.name ?? "Loading…"}
            />
            <UserRow
              icon={<Mail aria-hidden="true" className="h-4 w-4" />}
              label="Email"
              value={profile?.email ?? "Loading…"}
            />
            <UserRow
              icon={<Phone aria-hidden="true" className="h-4 w-4" />}
              label="Phone"
              value={profile?.phone ?? "Loading…"}
            />
          </Card>

          <div className="space-y-3">
            <SettingsRow
              label="Detection currency"
              value={`${detection.flag} ${detection.code}`}
              onClick={() => navigate("/preferences/currency")}
            />
            <SettingsRow
              label="Conversion currency"
              value={`${conversion.flag} ${conversion.code}`}
              onClick={() => navigate("/convert")}
            />
            <SettingsRow
              label="Detection mode"
              value={modeLabel}
              onClick={() => navigate("/preferences/currency")}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" size="lg" fullWidth onClick={() => navigate("/settings")}>
              Edit Settings
            </Button>
            {/* <Button variant="ghost" size="lg" fullWidth onClick={() => navigate("/admin")}>
              Admin Dashboard
            </Button> */}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function SettingsRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="surface flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-background-100"
    >
      <span className="text-sm font-bold text-foreground-950">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground-600">{value}</span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 text-foreground-400" />
      </span>
    </button>
  );
}