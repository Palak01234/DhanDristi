import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, BookOpen } from "lucide-react";
import { getCurrency, formatAmount } from "@/constants/currencies";
import { CHECKS, DEFAULT_CHECKS } from "@/services/counterfeit/counterfeitService";
import { FEATURE_GUIDES, TOOL_META, DIFFICULTY_META } from "@/data/securityFeatures";
import type { Difficulty, ToolNeeded } from "@/data/securityFeatures";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function QickPickIcon({ tool }: { tool: ToolNeeded }) {
  const meta = TOOL_META[tool];
  return (
    <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm ${meta.bg} ${meta.color}`}>
      <i className={meta.toolIcon} aria-hidden="true" />
    </span>
  );
}

function DifficultyBadge({ level }: { level: Difficulty }) {
  const meta = DIFFICULTY_META[level];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.color}`}>
      {meta.label}
    </span>
  );
}

// ─── Per-currency note image prompts ─────────────────────────────────────────

const NOTE_IMAGES: Record<string, string> = {
  INR: "https://readdy.ai/api/search-image?query=Indian%20Rupee%20banknote%20stylized%20artistic%20illustration%2C%20intricate%20floral%20patterns%20in%20warm%20orange%20and%20violet%20hues%2C%20abstract%20geometric%20ornamental%20design%2C%20soft%20studio%20lighting%2C%20detailed%20currency%20art%2C%20clean%20neutral%20beige%20background&width=800&height=450&seq=denom-inr-hero-v1&orientation=landscape",
  USD: "https://readdy.ai/api/search-image?query=US%20Dollar%20banknote%20stylized%20artistic%20illustration%2C%20intricate%20engraving%20patterns%20in%20green%20and%20charcoal%20tones%2C%20abstract%20ornamental%20portrait%20design%2C%20soft%20studio%20lighting%2C%20detailed%20currency%20art%2C%20clean%20neutral%20background&width=800&height=450&seq=denom-usd-hero-v1&orientation=landscape",
  EUR: "https://readdy.ai/api/search-image?query=Euro%20banknote%20stylized%20artistic%20illustration%2C%20intricate%20architectural%20arch%20patterns%20in%20blue%20and%20gold%20tones%2C%20abstract%20ornamental%20EU%20design%2C%20soft%20studio%20lighting%2C%20detailed%20currency%20art%2C%20clean%20neutral%20background&width=800&height=450&seq=denom-eur-hero-v1&orientation=landscape",
  GBP: "https://readdy.ai/api/search-image?query=British%20Pound%20banknote%20stylized%20artistic%20illustration%2C%20intricate%20portrait%20and%20heraldic%20patterns%20in%20purple%20and%20gold%20tones%2C%20abstract%20ornamental%20design%2C%20soft%20studio%20lighting%2C%20detailed%20currency%20art%2C%20clean%20neutral%20background&width=800&height=450&seq=denom-gbp-hero-v1&orientation=landscape",
  PHP: "https://readdy.ai/api/search-image?query=Philippine%20Peso%20banknote%20stylized%20artistic%20illustration%2C%20intricate%20tropical%20and%20heritage%20patterns%20in%20warm%20brown%20and%20gold%20tones%2C%20abstract%20ornamental%20design%2C%20soft%20studio%20lighting%2C%20detailed%20currency%20art%2C%20clean%20neutral%20background&width=800&height=450&seq=denom-php-hero-v1&orientation=landscape",
};
const FALLBACK_IMAGE = "https://readdy.ai/api/search-image?query=Generic%20banknote%20stylized%20artistic%20illustration%2C%20intricate%20ornamental%20security%20patterns%20in%20neutral%20gold%20and%20charcoal%20tones%2C%20abstract%20currency%20art%2C%20soft%20studio%20lighting%2C%20clean%20neutral%20background&width=800&height=450&seq=denom-default-hero-v1&orientation=landscape";

// Feature images keyed by checkId
const FEATURE_IMAGES: Record<string, string> = {
  watermark: "https://readdy.ai/api/search-image?query=Close-up%20of%20a%20banknote%20held%20up%20to%20bright%20backlight%20revealing%20a%20translucent%20portrait%20watermark%20embedded%20in%20paper%2C%20macro%20photography%2C%20warm%20natural%20light%2C%20clean%20white%20background%2C%20high%20detail&width=400&height=280&seq=feat-watermark-v1&orientation=landscape",
  thread:    "https://readdy.ai/api/search-image?query=Close-up%20macro%20of%20banknote%20paper%20showing%20a%20thin%20metallic%20security%20thread%20embedded%20inside%20the%20paper%2C%20backlighting%20reveals%20microtext%20along%20thread%2C%20high%20detail%20macro%20photography%2C%20clean%20background&width=400&height=280&seq=feat-thread-v1&orientation=landscape",
  ink:       "https://readdy.ai/api/search-image?query=Close-up%20of%20colour-shifting%20ink%20on%20a%20banknote%20denomination%20numeral%2C%20showing%20green%20to%20blue%20colour%20shift%20effect%2C%20macro%20photography%2C%20shallow%20depth%20of%20field%2C%20studio%20lighting%2C%20high%20detail&width=400&height=280&seq=feat-ink-v1&orientation=landscape",
  ribbon:    "https://readdy.ai/api/search-image?query=Close-up%20of%20a%20blue%20woven%20security%20ribbon%20embedded%20in%20a%20banknote%20showing%20motion%20security%20bells%20and%20numbers%2C%20macro%20photography%2C%20high%20detail%2C%20studio%20lighting&width=400&height=280&seq=feat-ribbon-v1&orientation=landscape",
  hologram:  "https://readdy.ai/api/search-image?query=Close-up%20macro%20of%20a%20gold%20foil%20hologram%20patch%20on%20a%20banknote%20showing%20iridescent%20rainbow%20colour%20shifts%20and%20multiple%20hidden%20images%2C%20studio%20lighting%2C%20high%20detail&width=400&height=280&seq=feat-hologram-v1&orientation=landscape",
  emerald:   "https://readdy.ai/api/search-image?query=Close-up%20macro%20of%20an%20emerald%20number%20on%20a%20banknote%20showing%20shimmering%20light%20effect%20moving%20through%20the%20numeral%2C%20macro%20photography%2C%20studio%20lighting%2C%20high%20detail&width=400&height=280&seq=feat-emerald-v1&orientation=landscape",
  micro:     "https://readdy.ai/api/search-image?query=Extreme%20close-up%20macro%20of%20microprinting%20on%20a%20banknote%20showing%20tiny%20legible%20text%20visible%20under%20magnification%2C%20magnifying%20glass%2C%20studio%20lighting%2C%20high%20detail&width=400&height=280&seq=feat-micro-v1&orientation=landscape",
  serial:    "https://readdy.ai/api/search-image?query=Close-up%20of%20a%20banknote%20serial%20number%20printed%20in%20green%20ink%20with%20ascending%20font%20size%2C%20sharp%20macro%20photography%2C%20studio%20lighting%2C%20clean%20background%2C%20high%20detail&width=400&height=280&seq=feat-serial-v1&orientation=landscape",
  uv:        "https://readdy.ai/api/search-image?query=Banknote%20under%20ultraviolet%20UV%20black%20light%20showing%20glowing%20security%20fibres%20and%20fluorescent%20patterns%20in%20bright%20blue%20and%20green%2C%20dark%20background%2C%20macro%20photography%2C%20high%20detail&width=400&height=280&seq=feat-uv-v1&orientation=landscape",
  intaglio:  "https://readdy.ai/api/search-image?query=Close-up%20macro%20of%20intaglio%20printed%20banknote%20portrait%20showing%20raised%20tactile%20ink%20texture%20with%20fine%20ridge%20detail%2C%20side%20raking%20light%20emphasizes%20relief%2C%20studio%20photography%2C%20high%20detail&width=400&height=280&seq=feat-intaglio-v1&orientation=landscape",
  paper:     "https://readdy.ai/api/search-image?query=Close-up%20macro%20of%20banknote%20security%20paper%20showing%20embedded%20coloured%20cotton%20fibres%20and%20crisp%20texture%2C%20backlit%20paper%20surface%2C%20high%20detail%20macro%20photography%2C%20studio%20lighting&width=400&height=280&seq=feat-paper-v1&orientation=landscape",
};

const FALLBACK_FEATURE_IMAGE = "https://readdy.ai/api/search-image?query=Close-up%20macro%20of%20banknote%20security%20feature%20detail%2C%20sharp%20studio%20photography%2C%20warm%20neutral%20background%2C%20high%20detail&width=400&height=280&seq=feat-default-v1&orientation=landscape";

// ─── Quick tips ───────────────────────────────────────────────────────────────

const QUICK_TIPS = [
  { icon: "ri-sun-line",         label: "Hold to light",  desc: "Reveals watermarks and threads"           },
  { icon: "ri-shake-hands-line", label: "Tilt the note",  desc: "Activates colour-shifting features"       },
  { icon: "ri-fingerprint-line", label: "Feel the print", desc: "Genuine intaglio ink is raised to touch"  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DenominationDetail() {
  const navigate = useNavigate();
  const { currency = "INR", denomination = "500" } = useParams<{ currency: string; denomination: string }>();

  const currencyInfo = getCurrency(currency);
  const denomValue = Number(denomination);

  const checks = useMemo(() => CHECKS[currency] ?? DEFAULT_CHECKS, [currency]);
  const heroImage = NOTE_IMAGES[currency] ?? FALLBACK_IMAGE;

  return (
    <div className="min-h-screen bg-background-50">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-950 px-5 pb-8 pt-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-background-50/10 text-background-50 transition-colors hover:bg-background-50/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-300">Security Guide</p>
            <h1 className="font-heading text-2xl font-bold text-background-50">
              {currencyInfo.flag} {formatAmount(currency, denomValue)}
            </h1>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-background-50/10 px-3 py-1.5 ring-1 ring-background-50/20">
            <ShieldCheck className="h-4 w-4 text-primary-300" />
            <span className="text-xs font-bold text-primary-200">{checks.length} Features</span>
          </span>
        </div>

        {/* Note artwork */}
        <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-background-50/15">
          <img
            src={heroImage}
            alt={`${currencyInfo.name} ${formatAmount(currency, denomValue)} note illustration`}
            className="h-48 w-full object-cover object-center"
          />
        </div>

        {/* Currency meta pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-background-50/10 px-3 py-1 text-xs font-bold text-primary-200 ring-1 ring-background-50/15">
            {currencyInfo.code} — {currencyInfo.name}
          </span>
          <span className="rounded-full bg-background-50/10 px-3 py-1 text-xs font-bold text-primary-200 ring-1 ring-background-50/15">
            {currencyInfo.symbol}{denomValue} note
          </span>
        </div>
      </div>

      {/* ── Quick Tips ── */}
      <div className="px-5 py-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground-500">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Quick Verification Steps
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {QUICK_TIPS.map((tip) => (
            <div
              key={tip.label}
              className="flex flex-col items-center gap-2 rounded-2xl bg-background-100 px-3 py-4 text-center ring-1 ring-background-200"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-lg text-primary-700">
                <i className={tip.icon} aria-hidden="true" />
              </span>
              <p className="text-xs font-bold text-foreground-950">{tip.label}</p>
              <p className="text-[10px] leading-tight text-foreground-500">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Security Features ── */}
      <div className="px-5 pb-10">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground-500">
          Security Feature Analysis
        </h2>

        <div className="space-y-4">
          {checks.map((check, i) => {
            const guide = FEATURE_GUIDES[check.id];
            const featureImage = FEATURE_IMAGES[check.id] ?? FALLBACK_FEATURE_IMAGE;

            return (
              <FeatureCard
                key={check.id}
                index={i + 1}
                check={check}
                guide={guide}
                featureImage={featureImage}
              />
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="mt-8 rounded-2xl bg-background-100 px-5 py-4 text-xs leading-relaxed text-foreground-500 ring-1 ring-background-200">
          This guide is for educational purposes only. Security feature specifications may vary by denomination series and year of issue. Always consult an authorised bank for definitive verification.
        </p>
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({
  index,
  check,
  guide,
  featureImage,
}: {
  index: number;
  check: { id: string; label: string; description: string };
  guide: typeof FEATURE_GUIDES[string] | undefined;
  featureImage: string;
}) {
  if (!guide) {
    return (
      <div className="overflow-hidden rounded-2xl bg-background-50 ring-1 ring-background-200">
        <div className="flex items-start gap-4 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background-100 text-sm font-bold text-foreground-500">
            {index}
          </span>
          <div>
            <p className="font-bold text-foreground-950">{check.label}</p>
            <p className="mt-1 text-sm text-foreground-500">{check.description}</p>
          </div>
        </div>
      </div>
    );
  }

  const toolMeta = TOOL_META[guide.tool];

  return (
    <div className="overflow-hidden rounded-2xl bg-background-50 ring-1 ring-background-200">
      {/* Feature image */}
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={featureImage}
          alt={`${check.label} visual guide`}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/60 via-transparent to-transparent" aria-hidden="true" />
        {/* Index badge */}
        <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-background-950/60 text-xs font-bold text-background-50 backdrop-blur-sm">
          {index}
        </span>
        {/* Label overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <p className="font-heading text-base font-bold text-background-50 drop-shadow">{check.label}</p>
          <DifficultyBadge level={guide.difficulty} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* What to look for */}
        <p className="text-sm text-foreground-700">{guide.whatToLookFor}</p>

        {/* Tool needed */}
        <div className="mt-3 flex items-center gap-2">
          <QickPickIcon tool={guide.tool} />
          <span className={`text-xs font-semibold ${toolMeta.color}`}>{toolMeta.label}</span>
        </div>

        {/* How to check steps */}
        <ol className="mt-4 space-y-2.5">
          {guide.howToCheck.map((step, si) => (
            <li key={si} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[10px] font-bold text-primary-700">
                {si + 1}
              </span>
              <p className="text-sm leading-snug text-foreground-700">{step}</p>
            </li>
          ))}
        </ol>

        {/* Fun fact */}
        <div className="mt-4 rounded-xl bg-background-100 px-4 py-3 ring-1 ring-background-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-400">Did you know?</p>
          <p className="mt-1 text-xs leading-relaxed text-foreground-600">{guide.funFact}</p>
        </div>
      </div>
    </div>
  );
}