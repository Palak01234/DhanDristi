import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";
import { MOCK_ADMIN_STATS } from "@/mocks/admin";
import { getCurrency } from "@/constants/currencies";

export default function Admin() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const stats = MOCK_ADMIN_STATS;

  if (!authorized) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center px-8 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background-100 text-foreground-600 ring-1 ring-background-200">
            <Lock aria-hidden="true" className="h-8 w-8" />
          </span>
          <h2 className="mt-6 text-xl font-bold text-foreground-950">Administrator only</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground-700">
            This dashboard shows user, scan and model statistics. It is a demo gate — connect real
            administrative authentication before exposing this data.
          </p>
          <Button
            className="mt-8 max-w-xs"
            size="xl"
            fullWidth
            onClick={() => setAuthorized(true)}
            icon={<ShieldCheck aria-hidden="true" className="h-5 w-5" />}
          >
            Continue as Demo Admin
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <header className="flex items-center gap-3 px-5 pt-7 md:px-8">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-background-200 bg-background-50 text-foreground-800 transition-colors hover:bg-background-100"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground-950">Admin Dashboard</h1>
          <p className="text-sm text-foreground-600">System overview</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 px-5 py-6 md:px-8 lg:grid-cols-4">
        <StatTile icon={<Users aria-hidden="true" className="h-5 w-5" />} label="Users" value={stats.totalUsers.toLocaleString()} />
        <StatTile icon={<ScanLine aria-hidden="true" className="h-5 w-5" />} label="Total scans" value={stats.totalScans.toLocaleString()} />
        <StatTile icon={<CheckCircle2 aria-hidden="true" className="h-5 w-5" />} label="Success rate" value={`${(stats.successRate * 100).toFixed(1)}%`} />
        <StatTile icon={<AlertTriangle aria-hidden="true" className="h-5 w-5" />} label="Low confidence" value={stats.lowConfidenceCount.toLocaleString()} />
      </div>

      <div className="px-5 pb-8 md:px-8 lg:grid lg:grid-cols-2 lg:gap-6">
        <Card>
          <h2 className="text-base font-bold text-foreground-950">Currency usage</h2>
          <p className="text-xs text-foreground-600">Detections by currency across all users.</p>
          <ul className="mt-4 space-y-3">
            {stats.currencyUsage.map((cu) => {
              const total = stats.totalScans;
              const pct = Math.round((cu.count / total) * 100);
              const cur = getCurrency(cu.code);
              return (
                <li key={cu.code}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground-950">{cur.flag} {cu.code}</span>
                    <span className="text-foreground-600">{cu.count.toLocaleString()}</span>
                  </div>
                  <div
                    className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-background-100"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${cu.code} usage`}
                  >
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="mt-5 lg:mt-0">
          <h2 className="text-base font-bold text-foreground-950">Model performance</h2>
          <p className="text-xs text-foreground-600">Average accuracy per currency (demo).</p>
          <ul className="mt-4 space-y-3">
            {stats.modelAccuracy.map((m) => (
              <li key={m.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground-950">{m.label}</span>
                  <span className="text-foreground-600">{(m.value * 100).toFixed(1)}%</span>
                </div>
                <div
                  className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-background-100"
                  role="progressbar"
                  aria-valuenow={Math.round(m.value * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${m.label} accuracy`}
                >
                  <div className="h-full rounded-full bg-accent-500" style={{ width: `${m.value * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="mt-5 lg:col-span-2">
          <h2 className="text-base font-bold text-foreground-950">Recent activity</h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {stats.recentActivity.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-background-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground-950">{a.action}</p>
                  <p className="text-xs text-foreground-600">{a.user}</p>
                </div>
                <span className="shrink-0 text-xs text-foreground-600">{a.time}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </MainLayout>
  );
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatTile({ icon, label, value }: StatTileProps) {
  return (
    <Card className="flex flex-col items-start">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
        {icon}
      </span>
      <p className="mt-3 font-heading text-2xl font-bold text-foreground-950">{value}</p>
      <p className="text-xs text-foreground-600">{label}</p>
    </Card>
  );
}