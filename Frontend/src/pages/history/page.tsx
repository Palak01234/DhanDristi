import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  History as HistoryIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  BookOpen,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/base/PageHeader";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";
import { getCurrency, formatAmount } from "@/constants/currencies";
import { useApp } from "@/context/AppProvider";
import type { DetectionRecord, DetectionStatus, CounterfeitVerdict } from "@/types";

type FilterKind = "all" | DetectionStatus | "counterfeit_check";

const FILTERS: { key: FilterKind; label: string }[] = [
  { key: "all",               label: "All" },
  { key: "counterfeit_check", label: "Counterfeit" },
  { key: "success",           label: "Success" },
  { key: "low_confidence",    label: "Low conf." },
  { key: "wrong_currency",    label: "Mismatch" },
  { key: "error",             label: "Errors" },
];

// ─── Verdict styles ───────────────────────────────────────────────────────────

const VERDICT_META: Record<CounterfeitVerdict, { Icon: typeof ShieldCheck; bg: string; label: string }> = {
  authentic:   { Icon: ShieldCheck, bg: "bg-primary-50 text-primary-700 ring-1 ring-primary-200",   label: "Authentic" },
  suspicious:  { Icon: ShieldAlert, bg: "bg-accent-50 text-accent-700 ring-1 ring-accent-200",       label: "Suspicious" },
  counterfeit: { Icon: ShieldX,     bg: "bg-red-50 text-red-700 ring-1 ring-red-200",               label: "Counterfeit" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function History() {
  const [filter, setFilter] = useState<FilterKind>("all");
  const [selected, setSelected] = useState<DetectionRecord | null>(null);
  const { history: items, clearHistory, removeHistoryRecord } = useApp();

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "counterfeit_check") return items.filter((i) => i.source === "counterfeit_check");
    return items.filter((i) => i.status === filter && i.source !== "counterfeit_check");
  }, [filter, items]);

  const clearAll = () => { clearHistory(); setSelected(null); };
  const removeOne = (id: string) => {
    removeHistoryRecord(id);
    if (selected?.id === id) setSelected(null);
  };

  return (
    <MainLayout>
      <PageHeader
        title="History"
        subtitle="Your recent currency detections."
        right={
          items.length > 0 ? (
            <button
              onClick={clearAll}
              aria-label="Clear all history"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-background-200 bg-background-50 text-foreground-600 transition-colors hover:bg-background-100"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />

      <div className="px-5 py-6 md:px-8">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" role="tablist" aria-label="Filter history">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const isCf = f.key === "counterfeit_check";
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-xs font-bold whitespace-nowrap transition-colors ${
                  active
                    ? isCf
                      ? "bg-primary-700 text-background-50"
                      : "bg-primary-600 text-background-50"
                    : "bg-background-100 text-foreground-700 ring-1 ring-background-200 hover:bg-background-200"
                }`}
              >
                {isCf && <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Summary */}
        {filter === "counterfeit_check" && filtered.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["authentic", "suspicious", "counterfeit"] as CounterfeitVerdict[]).map((v) => {
              const count = filtered.filter((i) => i.counterfeitVerdict === v).length;
              const meta = VERDICT_META[v];
              return (
                <div key={v} className={`flex flex-col items-center rounded-xl px-3 py-2.5 ${meta.bg}`}>
                  <meta.Icon className="mb-1 h-4 w-4" aria-hidden="true" />
                  <span className="text-lg font-bold">{count}</span>
                  <span className="text-[10px] font-semibold capitalize">{v}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyHistory />
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {filtered.map((item) => (
              <HistoryRow key={item.id} item={item} onOpen={() => setSelected(item)} />
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <HistoryDetail
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={() => removeOne(selected.id)}
        />
      )}
    </MainLayout>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function HistoryRow({ item, onOpen }: { item: DetectionRecord; onOpen: () => void }) {
  const navigate = useNavigate();
  const currency = getCurrency(item.currency);
  const confidence = Math.round(item.confidence * 100);
  const date = new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = new Date(item.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const isCf = item.source === "counterfeit_check";

  return (
    <li>
      <div className="surface overflow-hidden rounded-2xl">
        <button
          onClick={onOpen}
          className="flex w-full cursor-pointer items-center gap-4 p-4 text-left transition-colors hover:bg-background-100"
        >
          {/* Currency avatar */}
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background-100 text-2xl ring-1 ring-background-200"
          >
            {currency.flag}
          </span>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-foreground-950">
                {formatAmount(item.currency, item.denomination)}
              </p>
              {isCf && (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 ring-1 ring-primary-100">
                  Counterfeit Check
                </span>
              )}
            </div>
            <p className="text-xs text-foreground-600">
              {date} · {time} · {confidence}%
            </p>
          </div>

          {/* Status / verdict badge */}
          {isCf && item.counterfeitVerdict ? (
            <CounterfeitBadge verdict={item.counterfeitVerdict} />
          ) : (
            <DetectionBadge status={item.status} />
          )}
        </button>

        {/* Security guide shortcut */}
        {/* <button
          onClick={() => navigate(`/denomination/${item.currency}/${item.denomination}`)}
          aria-label={`View security guide for ${formatAmount(item.currency, item.denomination)}`}
          className="flex w-full cursor-pointer items-center gap-2 border-t border-background-100 px-4 py-2.5 text-left transition-colors hover:bg-background-100"
        >
          <BookOpen aria-hidden="true" className="h-3.5 w-3.5 text-primary-600" />
          <span className="text-xs font-semibold text-primary-700">View security features guide</span>
        </button> */}
      </div>
    </li>
  );
}

function CounterfeitBadge({ verdict }: { verdict: CounterfeitVerdict }) {
  const meta = VERDICT_META[verdict];
  const Icon = meta.Icon;
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg}`}
      aria-label={meta.label}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </span>
  );
}

function DetectionBadge({ status }: { status: DetectionStatus }) {
  const meta = detectionMeta(status);
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg}`}
      aria-label={meta.label}
    >
      {meta.icon}
    </span>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function HistoryDetail({
  item,
  onClose,
  onDelete,
}: {
  item: DetectionRecord;
  onClose: () => void;
  onDelete: () => void;
}) {
  const currency = getCurrency(item.currency);
  const confidence = Math.round(item.confidence * 100);
  const isCf = item.source === "counterfeit_check";
  const status = detectionMeta(item.status);
  const date = new Date(item.createdAt).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detection details"
      className="fixed inset-0 z-40 flex items-end justify-center bg-foreground-950/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-2xl bg-background-50 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="font-heading text-xl font-bold text-foreground-950">
            {isCf ? "Counterfeit Check Details" : "Detection Details"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-background-100 text-lg text-foreground-800 transition-colors hover:bg-background-200"
          >
            ×
          </button>
        </div>

        {/* Verdict hero for counterfeit checks */}
        {isCf && item.counterfeitVerdict ? (
          <CounterfeitHero verdict={item.counterfeitVerdict} confidence={confidence} currency={currency.flag} code={currency.code} />
        ) : (
          <div className="px-6">
            <Card className="flex flex-col items-center py-6 text-center">
              <span aria-hidden="true" className="text-5xl">{currency.flag}</span>
              <p className="mt-3 font-heading text-4xl font-bold text-foreground-950">
                {formatAmount(item.currency, item.denomination)}
              </p>
              <p className="mt-2 text-sm font-bold text-primary-700">
                {confidence}% confidence · {status.label}
              </p>
            </Card>
          </div>
        )}

        {/* Detail rows */}
        <dl className="mt-4 space-y-2 px-6">
          <DetailRow label="Currency"     value={`${currency.code} — ${currency.name}`} />
          <DetailRow label="Denomination" value={currency.symbol + item.denomination} />
          <DetailRow label="Source"       value={isCf ? "Counterfeit Check" : item.source === "camera" ? "Camera" : "Manual"} />
          <DetailRow label="Date & time"  value={date} />
        </dl>

        {/* Actions */}
        <div className="mt-6 flex gap-3 px-6 pb-6">
          <Button variant="secondary" size="md" fullWidth onClick={onDelete} ariaLabel="Delete record">
            Delete
          </Button>
          <Button variant="outline" size="md" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function CounterfeitHero({
  verdict, confidence, currency, code,
}: {
  verdict: CounterfeitVerdict; confidence: number; currency: string; code: string;
}) {
  const meta = VERDICT_META[verdict];
  const Icon = meta.Icon;
  const bg =
    verdict === "authentic" ? "from-primary-700 to-primary-950" :
    verdict === "suspicious" ? "from-accent-700 to-accent-950" :
    "from-red-800 to-red-950";

  return (
    <div className={`bg-gradient-to-br ${bg} mx-6 rounded-2xl px-5 py-5`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background-50/10">
          <Icon className="h-7 w-7 text-background-50" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-background-300">Verdict</p>
          <p className="font-heading text-2xl font-bold capitalize text-background-50">{verdict}</p>
        </div>
        <span aria-hidden="true" className="ml-auto text-4xl">{currency}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-full bg-background-50/15 px-3 py-1 text-xs font-bold text-background-100">
          {confidence}% confidence
        </span>
        <span className="rounded-full bg-background-50/15 px-3 py-1 text-xs font-bold text-background-100">
          {code}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectionMeta(status: DetectionStatus) {
  switch (status) {
    case "success":
      return { label: "Success",           bg: "bg-primary-50 text-primary-700 ring-1 ring-primary-200",     icon: <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> };
    case "low_confidence":
      return { label: "Low confidence",    bg: "bg-accent-50 text-accent-800 ring-1 ring-accent-200",         icon: <AlertTriangle aria-hidden="true" className="h-4 w-4" /> };
    case "wrong_currency":
      return { label: "Currency mismatch", bg: "bg-secondary-50 text-secondary-700 ring-1 ring-secondary-200",icon: <XCircle aria-hidden="true" className="h-4 w-4" /> };
    default:
      return { label: "Error",             bg: "bg-background-100 text-foreground-700 ring-1 ring-background-200", icon: <XCircle aria-hidden="true" className="h-4 w-4" /> };
  }
}

function EmptyHistory() {
  const navigate = useNavigate();
  return (
    <div className="mt-10 flex flex-col items-center py-10 text-center">
      <HistoryIcon aria-hidden="true" className="h-12 w-12 text-background-400" />
      <p className="mt-4 text-lg font-bold text-foreground-950">No detection history</p>
      <p className="mt-1.5 text-sm text-foreground-600">Scan a currency and your results will appear here.</p>
      <Button className="mt-6" onClick={() => navigate("/scan")}>
        Scan a Currency
      </Button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-background-100 px-4 py-3">
      <dt className="text-xs font-semibold text-foreground-600">{label}</dt>
      <dd className="text-sm font-bold text-foreground-950">{value}</dd>
    </div>
  );
}