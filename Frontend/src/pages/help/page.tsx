import { useNavigate } from "react-router-dom";
import {
  Camera,
  Volume2,
  Smartphone,
  Eye,
  Hand,
  Coins,
  ChevronRight,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/base/PageHeader";
import { Card } from "@/components/base/Card";
import { SUPPORTED_CURRENCIES } from "@/constants/currencies";

interface HelpItem {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const ITEMS: HelpItem[] = [
  {
    icon: <Camera aria-hidden="true" className="h-5 w-5" />,
    title: "How to scan",
    body: "Open the Scan screen, point your camera at the banknote, and make sure it fills the guide frame. Hold steady and tap the large Scan button. DhanDrishti will announce the currency and value out loud.",
  },
  {
    icon: <Smartphone aria-hidden="true" className="h-5 w-5" />,
    title: "Camera positioning",
    body: "Hold the phone flat and roughly 15–25 cm from the note. Keep the whole note inside the frame. Avoid glare and shadows from your fingers. Tilt the phone slightly if the light is uneven.",
  },
  {
    icon: <Volume2 aria-hidden="true" className="h-5 w-5" />,
    title: "Voice controls",
    body: "You control the voice in Settings. Choose your language, pick a real voice, test it, and adjust speed and volume. You can also enable auto-speak and repeating results.",
  },
  {
    icon: <Hand aria-hidden="true" className="h-5 w-5" />,
    title: "Low confidence & errors",
    body: "If detection is uncertain, the app will tell you. It never claims a note is fake based on confidence alone — it simply asks you to try again in better light. For mismatched currencies, you can change your selection.",
  },
  {
    icon: <Eye aria-hidden="true" className="h-5 w-5" />,
    title: "Accessibility",
    body: "Enable high contrast and large text in Settings. Buttons are at least 48px so they are easy to tap. Everything works with a screen reader and can be operated with a keyboard.",
  },
];

export default function Help() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageHeader title="Help & Accessibility" subtitle="Simple guides to get the most out of DhanDrishti." />

      <div className="px-5 py-6 md:px-8 lg:grid lg:grid-cols-2 lg:gap-5">
        <div className="space-y-4 lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
          {ITEMS.map((item) => (
            <Card key={item.title}>
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  {item.icon}
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground-950">{item.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground-700">{item.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-4 lg:col-span-2 lg:mt-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-800">
              <Coins aria-hidden="true" className="h-5 w-5" />
            </span>
            <h2 className="text-base font-bold text-foreground-950">Supported currencies</h2>
          </div>
          <p className="mt-3 text-sm text-foreground-700">
            DhanDrishti recognizes these six currencies and their denominations.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {SUPPORTED_CURRENCIES.map((c) => (
              <li key={c.code} className="rounded-xl bg-background-100 px-3 py-3 text-center ring-1 ring-background-200">
                <span aria-hidden="true" className="text-2xl">{c.flag}</span>
                <span className="mt-1 block text-sm font-bold text-foreground-950">{c.code}</span>
              </li>
            ))}
          </ul>
        </Card>

        <button
          onClick={() => navigate("/settings")}
          className="surface mt-4 flex w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-4 transition-colors hover:bg-background-100 lg:col-span-2 lg:mt-0"
        >
          <span className="text-sm font-bold text-foreground-950">
            Open Voice &amp; Accessibility Settings
          </span>
          <ChevronRight aria-hidden="true" className="h-5 w-5 text-foreground-400" />
        </button>
      </div>
    </MainLayout>
  );
}