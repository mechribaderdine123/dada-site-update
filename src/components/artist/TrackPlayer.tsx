import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

function fmtTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
// Module-level so every player on the page shares it: only one track ever plays.
let activeAudio: HTMLAudioElement | null = null;

export function TrackPlayer({
  url,
  title,
  accent,
  className = "mt-4",
}: {
  url: string;
  title: string;
  accent: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      setTime(0);
      el.currentTime = 0;
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnd);
      if (activeAudio === el) activeAudio = null;
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      if (activeAudio && activeAudio !== el) activeAudio.pause();
      activeAudio = el;
      void el.play();
    } else {
      el.pause();
    }
  };

  const seek = (value: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = value;
    setTime(value);
  };

  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div className={"flex items-center gap-3 " + className}>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Mettre en pause ${title}` : `Écouter ${title}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full shadow-lg transition hover:scale-105 active:scale-95"
        style={{ backgroundColor: accent, color: "#0e0e0e" }}
      >
        {playing ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
        )}
      </button>
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/50">
        {fmtTime(time)}
      </span>
      <div className="relative h-1.5 flex-1 rounded-full bg-white/12">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150"
          style={{ width: `${pct}%`, backgroundColor: accent }}
        />
        <span
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow transition-[left] duration-150"
          style={{ left: `calc(${pct}% - 6px)`, opacity: duration > 0 ? 1 : 0 }}
        />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label={`Position dans ${title}`}
          className="absolute -inset-y-2.5 left-0 h-6 w-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
      </div>
      <span className="w-9 shrink-0 text-[11px] tabular-nums text-white/50">
        {fmtTime(duration)}
      </span>
      <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
    </div>
  );
}
