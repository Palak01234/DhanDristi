import type { CurrencyCode } from "@/constants/currencies";
import { getTTSFunctionUrl } from "@/services/tts/config";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { isNativeApp } from "@/services/platform";

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function startContinuousVoiceCommand(
  language: string,
  onCommand: (transcript: string) => void,
): () => void {
  if (isNativeApp) {
    return startNativeVoiceCommand(language, onCommand);
  }

  const Recognition = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
  if (!Recognition) return () => undefined;

  let stopped = false;
  let restartTimer: number | null = null;
  const recognition = new Recognition();

  const scheduleRestart = () => {
    if (stopped || restartTimer !== null) return;
    restartTimer = window.setTimeout(() => {
      restartTimer = null;
      startRecognition();
    }, 500);
  };

  const startRecognition = () => {
    if (stopped) return;
    try {
      recognition.start();
    } catch {
      scheduleRestart();
    }
  };

  recognition.lang = language || "en-IN";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) =>
        event.results[index]?.[0]?.transcript?.trim() ?? "",
      ).filter(Boolean).join(" ");
      if (transcript) onCommand(transcript);
  };
  recognition.onerror = (event) => {
    if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
      stopped = true;
      return;
    }
    if (event?.error !== "aborted") {
      scheduleRestart();
    }
  };
  recognition.onend = scheduleRestart;

  // Reuse one recognition session object for the authenticated app lifetime.
  startRecognition();

  return () => {
    stopped = true;
    if (restartTimer !== null) window.clearTimeout(restartTimer);
    recognition.stop();
  };
}

function startNativeVoiceCommand(
  language: string,
  onCommand: (transcript: string) => void,
): () => void {
  let stopped = false;
  let listening = false;
  let retryTimer: number | null = null;
  let permissionsRequested = false;
  let restartDelay = 1000;
  let partialResultsHandle: { remove: () => Promise<void> } | null = null;
  let listeningStateHandle: { remove: () => Promise<void> } | null = null;

  const scheduleRestart = () => {
    if (stopped || retryTimer !== null) return;
    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      void listen();
    }, restartDelay);
    restartDelay = Math.min(restartDelay * 2, 5000);
  };

  const listen = async () => {
    if (stopped || listening) return;
    listening = true;
    try {
      if (!permissionsRequested) {
        const permissions = await SpeechRecognition.requestPermissions();
        if (permissions.speechRecognition === "denied") {
          stopped = true;
          return;
        }
        permissionsRequested = true;
      }
      await SpeechRecognition.start({
        language: language || "en-IN",
        maxResults: 5,
        partialResults: true,
        popup: false,
      });
      restartDelay = 1000;
    } catch {
      scheduleRestart();
    } finally {
      listening = false;
    }
  };

  void SpeechRecognition.addListener("partialResults", (event) => {
    for (const match of event.matches) {
      const transcript = match.trim();
      if (transcript) onCommand(transcript);
    }
  }).then((handle) => {
    partialResultsHandle = handle;
  });
  void SpeechRecognition.addListener("listeningState", (event) => {
    if (event.status === "started") {
      restartDelay = 1000;
    } else {
      scheduleRestart();
    }
  }).then((handle) => {
    listeningStateHandle = handle;
  });
  void listen();

  return () => {
    stopped = true;
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    void partialResultsHandle?.remove();
    void listeningStateHandle?.remove();
    if (listening) void SpeechRecognition.stop();
  };
}

export function listenForVoiceCommand(language: string, timeoutMs = 15000): Promise<string | null> {
  const Recognition = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
  return Recognition
    ? listenWithBrowserRecognition(Recognition, language, timeoutMs)
    : listenOnceWithElevenLabs(language, timeoutMs);
}

function listenWithBrowserRecognition(
  Recognition: SpeechRecognitionConstructor,
  language: string,
  timeoutMs: number,
): Promise<string | null> {
  return new Promise((resolve) => {
    const recognition = new Recognition();
    let settled = false;
    let hasResult = false;
    let restartCount = 0;
    let microphone: MediaStream | null = null;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      recognition.stop();
      microphone?.getTracks().forEach((track) => track.stop());
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), timeoutMs);

    recognition.lang = language || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      hasResult = true;
      finish(transcript || null);
    };
    recognition.onerror = (event) => {
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        finish(null);
        return;
      }
      if (restartCount < 3) {
        restartCount += 1;
        window.setTimeout(() => {
          try { recognition.start(); } catch { finish(null); }
        }, 300);
        return;
      }
      finish(null);
    };
    recognition.onend = () => {
      if (settled || hasResult) return;
      if (restartCount < 3) {
        restartCount += 1;
        window.setTimeout(() => {
          try { recognition.start(); } catch { finish(null); }
        }, 250);
        return;
      }
      window.setTimeout(() => finish(null), 400);
    };

    void navigator.mediaDevices?.getUserMedia({ audio: true })
      .then((stream) => {
        if (settled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        microphone = stream;
        recognition.start();
      })
      .catch(() => finish(null));
  });
}

export async function listenOnceWithElevenLabs(language: string, timeoutMs = 8000): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return null;
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const recording = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "audio/mp4" }));
    });
    recorder.start();
    await new Promise((resolve) => window.setTimeout(resolve, Math.min(timeoutMs, 8000)));
    recorder.stop();
    const audio = await recording;
    const form = new FormData();
    form.append("action", "transcribe");
    form.append("languageCode", language);
    form.append("audio", audio, "voice-command.m4a");
    const response = await fetch(getTTSFunctionUrl(), { method: "POST", body: form });
    if (!response.ok) return null;
    const data = (await response.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch {
    return null;
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

export function isYesCommand(value: string | null): boolean {
  return Boolean(value && /\b(yes|yeah|yep|sure|okay|ok|convert|yess|yas|haan|han|haudu|avunu|aam|aamaam|athe|ho|hoy)\b|हाँ|हां|हाँ जी|ಹೌದು|ಅವನು|అవును|అవునూ|ஆம்|ஆமாம்|അതെ|हो|होय/i.test(value));
}

export function isNoCommand(value: string | null): boolean {
  return Boolean(value && /\b(no|nope|not now|cancel|stop|nahi|illa|ledu|vendam|venda|alla|nako)\b|नहीं|नही|ಇಲ್ಲ|లేదు|வேண்டாம்|இல்லை|ഇല്ല|नको|नाही/i.test(value));
}

export function isOpenScanCommand(value: string | null): boolean {
  if (!value) return false;
  const text = value.toLowerCase().replace(/[.,!?]/g, " ");
  const asksToOpen = /\b(hey|hello|hi|open|start|begin)\b/.test(text);
  const mentionsScan = /\b(scan|scanner|scanning|currency|money)\b/.test(text);
  return asksToOpen && mentionsScan;
}

export function parseCurrencyCommand(value: string | null): CurrencyCode | null {
  if (!value) return null;
  const text = value.toLowerCase().replace(/[.,-]/g, " ").trim();
  const compact = text.replace(/\s+/g, "");
  const matches: Array<[CurrencyCode, RegExp]> = [
    ["INR", /\b(inr|rupee|rupees|indian)\b/],
    ["USD", /\b(usd|dollar|dollars|us)\b/],
    ["PHP", /\b(php|peso|pesos|philippine)\b/],
    ["EUR", /\b(eur|euro|euros)\b/],
    ["AUD", /\b(aud|australian)\b/],
    ["CAD", /\b(cad|canadian)\b/],
  ];
  const direct = matches.find(([, pattern]) => pattern.test(text))?.[0];
  if (direct) return direct;

  const letters: Record<string, string> = {
    a: "a", ay: "a", b: "b", bee: "b", c: "c", see: "c", d: "d", dee: "d",
    e: "e", ee: "e", f: "f", ef: "f", g: "g", gee: "g", h: "h", aitch: "h",
    i: "i", eye: "i", j: "j", jay: "j", k: "k", kay: "k", l: "l", el: "l",
    m: "m", em: "m", n: "n", en: "n", o: "o", oh: "o", p: "p", pee: "p",
    q: "q", cue: "q", r: "r", ar: "r", are: "r", s: "s", ess: "s", t: "t",
    tee: "t", u: "u", you: "u", v: "v", vee: "v", w: "w", doubleyou: "w",
    x: "x", ex: "x", y: "y", why: "y", z: "z", zee: "z", zed: "z",
  };
  const spokenLetters = text
    .split(/\s+/)
    .filter((word) => word !== "and")
    .map((word) => letters[word])
    .join("");
  const normalized = spokenLetters || compact;
  return (["INR", "USD", "PHP", "EUR", "AUD", "CAD"] as CurrencyCode[])
    .find((code) => code.toLowerCase() === normalized)
    ?? null;
}
