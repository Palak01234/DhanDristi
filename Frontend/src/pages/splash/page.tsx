import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2 } from "lucide-react";
import { BrandMark } from "@/components/base/BrandMark";
import { useVoice } from "@/context/VoiceProvider";
import { useApp } from "@/context/AppProvider";
import { voiceMessage } from "@/services/voice/voiceMessages";

let mediaPermissionRequest: Promise<void> | null = null;

function requestMediaPermissions(): Promise<void> {
  if (mediaPermissionRequest) return mediaPermissionRequest;

  mediaPermissionRequest = (async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      // The app can still open; individual pages will show their own camera or mic state.
    }
  })();

  return mediaPermissionRequest;
}

export default function Splash() {
  const navigate = useNavigate();
  const { speak, settings } = useVoice();
  const { isAuthenticated } = useApp();
  const welcomeMessage = voiceMessage("welcome", settings.language);
  const completedRef = useRef(false);

  useEffect(() => {
    if (settings.vibration) {
      try {
        navigator.vibrate?.([80, 60, 80]);
      } catch {
        /* ignore */
      }
    }
    let cancelled = false;
    const playWelcomeAndContinue = async () => {
      await requestMediaPermissions();
      await speak(welcomeMessage, "confirmation", settings.language);
      if (!cancelled && !completedRef.current) {
        completedRef.current = true;
        navigate(isAuthenticated ? "/scan" : "/login");
      }
    };
    void playWelcomeAndContinue();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, navigate, settings.language, settings.vibration, speak, welcomeMessage]);

  return (
    <div className="app-bg app-bg-dark relative mx-auto flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="animate-fade-up flex flex-col items-center">
        <div className="animate-float">
          <BrandMark size="xl" dark />
        </div>

        <h1 className="animate-fade-up mt-9 font-heading text-5xl font-bold tracking-tight text-background-50">
          DhanDrishti
        </h1>
        <p className="animate-fade-up mt-3 text-base font-semibold uppercase tracking-[0.2em] text-accent-400">
          Smart Currency Recognition
        </p>

        <div className="animate-fade-up mt-8 flex items-center gap-3 rounded-full border border-background-50/15 bg-background-50/5 px-5 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/20">
            <Volume2 aria-hidden="true" className="h-4 w-4 text-accent-400" />
          </span>
          <span className="text-sm font-bold text-background-50">See Money. Hear Money.</span>
        </div>
      </div>

      <div aria-hidden="true" className="mt-12 flex gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-background-50/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-background-50/30" />
        <span className="h-1.5 w-8 animate-shimmer rounded-full bg-gradient-to-r from-primary-400 to-accent-400" />
      </div>

      <p className="sr-only">
        DhanDrishti. Smart Currency Recognition for visually impaired users. See money, hear money.
      </p>
    </div>
  );
}