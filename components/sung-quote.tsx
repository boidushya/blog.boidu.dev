"use client";

import "@braccato/core/styles/variables.css";
import "@braccato/core/styles/lyrics.css";
import { Handwriting } from "@/components/handwriting";
import { PlayButton } from "@/components/play-button";
import { ProgressBar } from "@/components/progress-bar";
import { clock } from "@/utils/clock";
import { IS_DEV } from "@/utils/constants";
import type { BraccatoLyricsElement } from "@braccato/core/element";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "braccato-lyrics": DetailedHTMLProps<HTMLAttributes<BraccatoLyricsElement>, BraccatoLyricsElement>;
    }
  }
}

const THEME = "/* blyrics-letter-wave = false; */";
const END_SLACK_SECONDS = 0.05;
// Chromium crawls the audio clock for a moment after play or seek, so the sweep only runs once the clock keeps pace.
const PROOF_MS = 150;
const MIN_PACE = 0.5;

const cssSeconds = (value: string) => {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return 0;
  return value.trim().endsWith("ms") ? amount / 1000 : amount;
};

const normalizeWords = (text: string) => text.trim().split(/\s+/).join(" ");

type Controls = { toggle: () => void; seek: (fraction: number) => void };

type Props = {
  lyrics: string;
  audio: string;
  children: ReactNode;
};

export function SungQuote({ lyrics, audio, children }: Props) {
  const figureRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const viewRef = useRef<BraccatoLyricsElement>(null);
  const controls = useRef<Controls>(undefined);
  const [rendered, setRendered] = useState(false);
  const [closeSlot, setCloseSlot] = useState<HTMLElement | null>(null);
  const [sung, setSung] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [now, setNow] = useState(clock(0));
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const quote = quoteRef.current;
    const view = viewRef.current;
    if (!quote || !view) return;

    const lifetime = new AbortController();
    const { signal } = lifetime;
    const sound = new Audio(audio);
    sound.preload = "metadata";
    let frame = 0;
    let sungEnd = 0;
    let proof: { at: number; time: number } | null = null;
    let following = false;
    let animating: boolean | null = null;

    const resetProof = () => {
      proof = null;
      following = false;
    };

    const follows = (time: number) => {
      if (following) return true;
      const now = performance.now();
      if (!proof || now - proof.at < PROOF_MS) {
        proof ??= { at: now, time };
        return false;
      }
      following = ((time - proof.time) * 1000) / (now - proof.at) >= MIN_PACE;
      proof = following ? null : { at: now, time };
      return following;
    };

    const write = (time: number, isPlaying: boolean) => {
      if (isPlaying !== animating) {
        animating = isPlaying;
        // Braccato leads the sweep while it animates; a still frame shows the exact time instead.
        const style = getComputedStyle(view);
        view.tickOptions = isPlaying
          ? {}
          : {
              richsyncOffsetTrim: cssSeconds(style.getPropertyValue("--blyrics-richsync-timing-offset")),
              lineOffsetTrim: cssSeconds(style.getPropertyValue("--blyrics-timing-offset")),
            };
      }
      // Braccato resyncs a still sweep only on a paused seek, so it pauses before the time write.
      if (isPlaying) {
        view.currentTime = time;
        view.playing = true;
      } else {
        view.playing = false;
        view.currentTime = time;
      }
      setSung(time >= sungEnd);
    };

    const writeAudio = () => {
      const time = sound.currentTime;
      write(time, !sound.paused && follows(time));
      setProgress(sound.duration ? time / sound.duration : 0);
      setNow(clock(time / 60));
    };

    const loop = (tick: () => boolean) => {
      cancelAnimationFrame(frame);
      const step = () => {
        if (tick()) frame = requestAnimationFrame(step);
      };
      step();
    };

    sound.addEventListener(
      "play",
      () => {
        setPlaying(true);
        resetProof();
        loop(() => {
          writeAudio();
          return !sound.paused;
        });
      },
      { signal }
    );
    sound.addEventListener(
      "pause",
      () => {
        setPlaying(false);
        cancelAnimationFrame(frame);
        writeAudio();
      },
      { signal }
    );

    sound.addEventListener("seeking", resetProof, { signal });
    sound.addEventListener("waiting", resetProof, { signal });

    controls.current = {
      toggle: () => {
        if (!sound.paused) return sound.pause();
        if (sound.ended || sound.currentTime >= sound.duration - END_SLACK_SECONDS) sound.currentTime = 0;
        sound.play().catch((error: unknown) => console.error("SungQuote: playback failed", error));
      },
      seek: fraction => {
        if (!sound.duration) return;
        if (sound.paused) cancelAnimationFrame(frame);
        sound.currentTime = fraction * sound.duration;
        writeAudio();
      },
    };

    view.addEventListener(
      "braccato:lyrics-loaded",
      () => {
        const groups = view.querySelectorAll(".blyrics-bidi-run:not(.blyrics-highlight-run) .blyrics-word-group");
        const lastGroup = groups[groups.length - 1];
        if (!lastGroup) return;
        const slot = document.createElement("span");
        slot.className = "sung-quote-close";
        slot.setAttribute("aria-hidden", "true");
        lastGroup.append(slot);
        setCloseSlot(slot);
        setRendered(true);
      },
      { signal }
    );

    sound.addEventListener("loadedmetadata", () => setDuration(sound.duration), { signal });
    const metadata = new Promise((resolve, reject) => {
      sound.addEventListener("loadedmetadata", resolve, { once: true, signal });
      sound.addEventListener("error", () => reject(sound.error), { once: true, signal });
    });

    (async () => {
      const [, { detectParser }, ttml] = await Promise.all([
        import("@braccato/core/element"),
        import("@braccato/parsers"),
        fetch(lyrics).then(response => {
          if (!response.ok) throw new Error(`${lyrics} answered ${response.status}`);
          return response.text();
        }),
        metadata,
      ]);
      if (signal.aborted) return;

      const parsed = detectParser(ttml).parse(ttml, sound.duration * 1000);
      const sungLines = parsed.filter(line => !line.isInstrumental);
      const last = sungLines[sungLines.length - 1];
      if (!last) throw new Error(`${lyrics} has no sung lines`);
      sungEnd = (last.startTimeMs + last.durationMs) / 1000;

      if (IS_DEV) {
        const sungText = normalizeWords(sungLines.map(line => line.words).join(" "));
        const quoteText = normalizeWords(quote.textContent ?? "");
        if (sungText !== quoteText)
          console.warn(`SungQuote: ${lyrics} does not match the quote text`, { sungText, quoteText });
      }

      view.host = { getScrollElement: () => view };
      view.theme = THEME;
      view.lyrics = parsed;
      if (sound.currentTime) writeAudio();
      else write(sungEnd, false);
    })().catch((error: unknown) => {
      // The quote stays as plain text; the player still plays the clip.
      if (!signal.aborted) console.error("SungQuote: lyrics failed to load", error);
    });

    return () => {
      lifetime.abort();
      cancelAnimationFrame(frame);
      sound.pause();
      controls.current = undefined;
    };
  }, [lyrics, audio]);

  return (
    <figure ref={figureRef} className="sung-quote">
      <div className="sung-quote-text">
        <span className="sung-quote-open" aria-hidden="true">
          <Handwriting text="“" shown={rendered} />
        </span>
        <blockquote ref={quoteRef} className={rendered ? "sr-only" : undefined}>
          {children}
        </blockquote>
        <braccato-lyrics ref={viewRef} aria-hidden="true" inert />
        {closeSlot && createPortal(<Handwriting text="”" shown={sung} />, closeSlot)}
      </div>
      <div className="sung-quote-player">
        <PlayButton
          playing={playing}
          onToggle={() => controls.current?.toggle()}
          label={playing ? "Pause the quote" : "Play the quote"}
        />
        <ProgressBar
          progress={progress}
          now={now}
          total={clock(duration / 60)}
          max={duration}
          label="Seek"
          onSeek={fraction => controls.current?.seek(fraction)}
        />
      </div>
    </figure>
  );
}
