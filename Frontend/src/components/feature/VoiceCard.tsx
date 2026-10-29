import { Play, Pause, Check, Volume2, Sparkles, Mic } from "lucide-react";
import type { VoicePersona } from "@/services/tts/voiceRegistry";
import { WaveformBars } from "@/components/feature/WaveformBars";

interface VoiceCardProps {
  persona: VoicePersona;
  selected: boolean;
  isPlaying: boolean;
  usingAi: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

/** A single premium voice card in the DhanDrishti voice studio. */
export function VoiceCard({
  persona,
  selected,
  isPlaying,
  usingAi,
  onSelect,
  onPreview,
}: VoiceCardProps) {
  const isFemale = persona.gender === "female";

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      onClick={onSelect}
      className={`group relative flex cursor-pointer flex-col rounded-2xl border p-4 transition-all duration-200 ${
        selected
          ? "border-primary-500 bg-primary-50/60 ring-glow"
          : "surface hover:border-primary-300 hover:bg-background-100/60"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Avatar / waveform */}
        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
            selected
              ? "bg-gradient-to-br from-primary-500 to-primary-700"
              : isFemale
                ? "bg-secondary-100"
                : "bg-accent-100"
          }`}
        >
          {isPlaying ? (
            <span className="flex h-full w-full items-end justify-center gap-0.5 p-2.5">
              <WaveformBars barClass="bg-background-50" barCount={14} />
            </span>
          ) : (
            <span
              className={`font-heading text-lg font-bold ${
                selected ? "text-background-50" : isFemale ? "text-secondary-700" : "text-accent-800"
              }`}
            >
              {persona.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold tracking-tight text-foreground-950">
              {persona.name}
            </h3>
            {selected && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600">
                <Check aria-hidden="true" className="h-3 w-3 text-background-50" />
              </span>
            )}
            {persona.featured && !selected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-bold text-accent-800">
                <Sparkles aria-hidden="true" className="h-2.5 w-2.5" />
                Featured
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs font-semibold text-foreground-600">
            {isFemale ? "Female" : "Male"} · {persona.personality}
          </p>
          <p className="mt-1 text-xs leading-snug text-foreground-500">{persona.description}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-background-100 px-2 py-0.5 text-[11px] font-semibold text-foreground-600 ring-1 ring-background-200">
          <Mic aria-hidden="true" className="h-3 w-3" />
          {persona.languageBase.toUpperCase()}
        </span>
        {usingAi ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 ring-1 ring-primary-200">
            <Sparkles aria-hidden="true" className="h-3 w-3" />
            AI Voice
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-800 ring-1 ring-accent-200">
            <Volume2 aria-hidden="true" className="h-3 w-3" />
            Unavailable
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3.5 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          aria-label={
            isPlaying
              ? `Stop previewing ${persona.name} voice`
              : `Preview ${persona.name} ${persona.languageBase.toUpperCase()} voice`
          }
          className={`flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
            isPlaying
              ? "bg-primary-600 text-background-50 hover:bg-primary-700"
              : "bg-background-100 text-foreground-800 ring-1 ring-background-200 hover:bg-background-200"
          }`}
        >
          {isPlaying ? (
            <>
              <Pause aria-hidden="true" className="h-3.5 w-3.5" />
              Playing
            </>
          ) : (
            <>
              <Play aria-hidden="true" className="h-3.5 w-3.5" />
              Preview
            </>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          aria-pressed={selected}
          aria-label={`Select ${persona.name} voice`}
          className={`flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
            selected
              ? "bg-primary-600 text-background-50 hover:bg-primary-700"
              : "bg-background-100 text-foreground-800 ring-1 ring-background-200 hover:bg-background-200"
          }`}
        >
          {selected ? (
            <>
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
              Selected
            </>
          ) : (
            "Select"
          )}
        </button>
      </div>
    </div>
  );
}