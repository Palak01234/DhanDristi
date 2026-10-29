import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { Fragment, createElement, useEffect } from "react";
import routes from "./config";
import { useVoice } from "@/context/VoiceProvider";
import { useApp } from "@/context/AppProvider";
import { isOpenScanCommand, startContinuousVoiceCommand } from "@/services/voice/voiceCommands";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

function GlobalVoiceNavigation() {
  const navigate = useNavigate();
  const { stop, settings } = useVoice();
  const { isAuthenticated } = useApp();

  useEffect(() => {
    if (!isAuthenticated) return;

    let listening = true;
    const stopListening = startContinuousVoiceCommand(settings.language || "en-IN", (command) => {
      if (listening && isOpenScanCommand(command)) {
        listening = false;
        stopListening();
        navigate("/scan");
      }
    });

    return () => {
      listening = false;
      stopListening();
      stop();
    };
  }, [isAuthenticated, navigate, settings.language, stop]);

  return null;
}

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    navigateResolver(window.REACT_APP_NAVIGATE);
  });
  return createElement(Fragment, null, createElement(GlobalVoiceNavigation), element);
}
