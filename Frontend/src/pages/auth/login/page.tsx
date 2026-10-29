import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/feature/AuthShell";
import { Button } from "@/components/base/Button";
import { InputField } from "@/components/base/InputField";
import { useApp } from "@/context/AppProvider";
import { getLanguages, getPersonasForLanguage } from "@/services/tts/voiceRegistry";
import type { CurrencyCode } from "@/constants/currencies";
import { apiUrl } from "@/services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { preferences, updatePreferences, switchUser } = useApp();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string; name?: string; email?: string; phone?: string; language?: string; conversionCurrency?: CurrencyCode };
      if (!response.ok) {
        setError(data.error ?? "Unable to log in.");
        return;
      }
      window.localStorage.setItem("dd_user", JSON.stringify({ name: data.name, email: data.email, phone: data.phone }));
      switchUser(data.email ?? email);
      const language = getLanguages().find((item) => item.code === data.language) ?? getLanguages()[0];
      const persona = getPersonasForLanguage(language.base).find((item) => item.gender === "female");
      updatePreferences({
        conversionCurrency: data.conversionCurrency ?? preferences.conversionCurrency,
        voice: {
          ...preferences.voice,
          language: language.code,
          voiceId: persona?.id ?? preferences.voice.voiceId,
        },
      });
      setLoading(false);
      navigate("/home");
    } catch {
      setError("Could not connect to the local account server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to DhanDrishti"
      subtitle="Your assistive currency companion, ready for you."
      footer={
        <p className="text-base text-foreground-700">
          Don&apos;t have an account?{" "}
          <button onClick={() => navigate("/signup")} className="font-bold text-primary-700">
            Create Account
          </button>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5" aria-label="Login form">
        <InputField
          id="email"
          type="email"
          label="Email address"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail aria-hidden="true" className="h-5 w-5" />}
        />
        <InputField
          id="password"
          type={show ? "text" : "password"}
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          icon={<Lock aria-hidden="true" className="h-5 w-5" />}
          rightSlot={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="flex h-12 w-12 items-center justify-center text-foreground-500"
            >
              {show ? (
                <EyeOff aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Eye aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          }
        />

        <div className="text-right">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-base font-semibold text-primary-700"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-accent-100 px-4 py-3 text-base font-semibold text-accent-900">
            {error}
          </p>
        )}

        <Button type="submit" size="xl" fullWidth disabled={loading} iconRight={!loading && <ArrowRight aria-hidden="true" className="h-6 w-6" />}>
          {loading ? "Logging in…" : "Login"}
        </Button>

        <div className="my-2 flex items-center gap-3" role="separator" aria-label="or">
          <span className="h-px flex-1 bg-background-200" />
          <span className="text-sm text-foreground-600">or</span>
          <span className="h-px flex-1 bg-background-200" />
        </div>

        {/* <Button variant="outline" size="lg" fullWidth>
          Continue with Google
        </Button> */}
      </form>
    </AuthShell>
  );
}