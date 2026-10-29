interface WaveformBarsProps {
  barCount?: number;
  barClass?: string;
  animated?: boolean;
}

/**
 * Animated audio equalizer — a subtle, pure-CSS waveform.
 * When `animated` is false it renders a static representation.
 */
export function WaveformBars({ barCount = 14, barClass = "bg-primary-500", animated = true }: WaveformBarsProps) {
  const bars = Array.from({ length: barCount }, (_, i) => {
    const h = 30 + Math.abs(Math.sin((i + 1) * 0.9)) * 70;
    const delay = `${(i % 7) * 0.08}s`;
    return { h, delay };
  });
  return (
    <div aria-hidden="true" className="flex h-full w-full items-end justify-center gap-0.5">
      {bars.map((b, i) => (
        <span
          key={i}
          className={`w-1 rounded-full ${barClass} ${animated ? "wave-bar" : ""}`}
          style={{ height: `${b.h}%`, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
}