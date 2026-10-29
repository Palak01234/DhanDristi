import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  Volume2,
  Coins,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useVoice } from "@/context/VoiceProvider";
import { SUPPORTED_CURRENCIES } from "@/constants/currencies";
import { onboardingMessage } from "@/services/voice/voiceMessages";

interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    id: "scan",
    icon: ScanLine,
    title: "Currency Recognition",
    description: "Point your camera at a banknote. DhanDrishti identifies it instantly and announces the value aloud.",
  },
  {
    id: "voice",
    icon: Volume2,
    title: "Voice Results",
    description: "Clear spoken results in a voice you choose — including Kannada, with control over speed and tone.",
  },
  {
    id: "select",
    icon: Coins,
    title: "Currency Selection",
    description: "Focus on the currencies you use most — one, several, or all six supported at once.",
  },
  {
    id: "offline",
    icon: WifiOff,
    title: "Offline Recognition",
    description: "Recognition works even without a network, so you're always supported.",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { speak, settings, isSpeaking, stop } = useVoice();
  const [step, setStep] = useState(0);
  const total = FEATURES.length;
  const current = FEATURES[step];
  const isLast = step === total - 1;

  useEffect(() => {
    if (settings.autoSpeak) {
      speak(onboardingMessage(current.id, settings.language), "normal", settings.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const next = () => {
    if (isLast) navigate("/preferences/currency");
    else setStep((s) => s + 1);
  };

  const playCurrent = () => {
    if (isSpeaking) {
      stop();
      return;
    }
    void speak(onboardingMessage(current.id, settings.language), "normal", settings.language);
  };

  return (
    <div className="app-bg relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden">
      {/* Top controls */}
      <div className="flex items-center justify-between px-5 pt-6">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            aria-label="Previous step"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-background-200 bg-background-50 text-foreground-800 transition-colors hover:bg-background-100"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : (
          <span className="h-11 w-11" aria-hidden="true" />
        )}
        <div className="flex gap-1.5" role="presentation">
          {FEATURES.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? "w-9 bg-primary-600" : i < step ? "w-1.5 bg-primary-300" : "w-1.5 bg-background-300"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => navigate("/preferences/currency")}
          aria-label="Skip onboarding"
          className="h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold text-foreground-600 transition-colors hover:bg-background-100 hover:text-foreground-900 active:bg-background-200"
        >
          Skip
        </button>
      </div>

      {/* Story scene */}
      <div className="relative mt-4 flex flex-1 flex-col px-6">
        <div className="relative flex flex-1 items-center justify-center">
          <StoryScene step={step} />
        </div>

        <div className="animate-fade-up pb-6 text-center" key={step}>
          <h1 className="mx-auto max-w-xs font-heading text-2xl font-bold leading-tight text-foreground-950">
            {current.title}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground-700">
            {current.description}
          </p>
          <button
            type="button"
            onClick={playCurrent}
            aria-label={isSpeaking ? "Stop voice" : "Play this step aloud"}
            title={isSpeaking ? "Stop voice" : "Play this step aloud"}
            className="mx-auto mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 text-xs font-bold text-primary-800 transition-colors hover:bg-primary-100"
          >
            <Volume2 aria-hidden="true" className="h-4 w-4" />
            {isSpeaking ? "Stop voice" : "Play aloud"}
          </button>
        </div>
      </div>

      <div className="px-6 pb-9">
        <button
          onClick={next}
          className="group relative w-full overflow-hidden rounded-2xl cursor-pointer"
          aria-label={isLast ? "Get started" : "Continue to next step"}
        >
          {/* gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 transition-all duration-500 group-hover:from-primary-500 group-hover:via-primary-400 group-hover:to-primary-500" />
          {/* shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden="true" />
          {/* top shine line */}
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden="true" />
          {/* content */}
          <div className="relative flex h-14 items-center justify-center gap-2 px-7">
            <span className="text-base font-bold tracking-tight text-background-50">
              {isLast ? "Get Started" : "Next"}
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5">
              <ChevronRight aria-hidden="true" className="h-4 w-4 text-background-50" />
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

function StoryScene({ step }: { step: number }) {
  return <div className="animate-fade-up w-full">{SCENES[step]}</div>;
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex h-[320px] w-[240px] flex-col items-center justify-center rounded-[2rem] border border-background-200 bg-background-50 p-4">
      <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-background-300" aria-hidden="true" />
      {children}
    </div>
  );
}

const SCENES: React.ReactNode[] = [
  // 1 — Currency Recognition
  (
    <div key="s0" className="relative flex w-full justify-center">
      <PhoneFrame>
        <div className="relative flex h-44 w-40 items-center justify-center overflow-hidden rounded-xl border border-background-50/20 bg-background-950">
          <span aria-hidden="true" className="absolute inset-x-2 top-3 h-1 rounded-full bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 animate-scan-line" />
          <span aria-hidden="true" className="text-5xl">💵</span>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-background-50">
          <ScanLine aria-hidden="true" className="h-4 w-4" />
          <span className="text-xs font-bold">₹500 · 96%</span>
        </div>
      </PhoneFrame>
    </div>
  ),
  // 2 — Voice Results
  (
    <div key="s1" className="relative flex w-full justify-center">
      <PhoneFrame>
        <div className="flex h-24 items-center gap-1.5" aria-hidden="true">
          {[12, 26, 42, 56, 70, 56, 42, 26, 12, 20, 34].map((h, i) => (
            <span
              key={i}
              className="w-2 rounded-full bg-gradient-to-t from-primary-500 to-accent-400"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <p className="mt-4 max-w-[180px] text-center text-xs font-bold text-foreground-900">
          "ಐದು ನೂರು ರೂಪಾಯಿ ಪತ್ತೆಯಾಗಿದೆ"
        </p>
        <span className="mt-3 flex items-center gap-2 rounded-full bg-secondary-500 px-4 py-2 text-background-50">
          <Volume2 aria-hidden="true" className="h-4 w-4" />
          <span className="text-xs font-bold">Ananya · Kannada</span>
        </span>
      </PhoneFrame>
    </div>
  ),
  // 3 — Currency Selection
  (
    <div key="s2" className="relative flex w-full justify-center">
      <PhoneFrame>
        <div className="grid grid-cols-3 gap-3" aria-hidden="true">
          {SUPPORTED_CURRENCIES.map((c) => (
            <div
              key={c.code}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
                c.code === "INR" || c.code === "USD"
                  ? "bg-primary-50 ring-2 ring-primary-400"
                  : "bg-background-100"
              }`}
            >
              {c.flag}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-bold text-foreground-900">Pick the currencies you use</p>
      </PhoneFrame>
    </div>
  ),
  // 4 — Offline Recognition
  (
    <div key="s3" className="relative flex w-full justify-center">
      <PhoneFrame>
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 text-background-50">
          <ShieldCheck aria-hidden="true" className="h-12 w-12" />
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs font-bold text-foreground-900">
          <WifiOff aria-hidden="true" className="h-4 w-4 text-accent-700" />
          Works without the internet
        </p>
        <span className="mt-3 flex items-center gap-2 rounded-full bg-background-100 px-4 py-2 text-xs font-bold text-foreground-700">
          <Smartphone aria-hidden="true" className="h-4 w-4" /> On-device model
        </span>
      </PhoneFrame>
    </div>
  ),
];