"use client";

import "@braccato/core/styles/variables.css";
import "@braccato/core/styles/lyrics.css";
import { Handwriting } from "@/components/handwriting";
import { PlayButton } from "@/components/play-button";
import { ProgressBar } from "@/components/progress-bar";
import { IS_DEV } from "@/utils/constants";
import type { BraccatoLyricsElement } from "@braccato/core/element";
import { type DetailedHTMLProps, type HTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";
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

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

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
  const [now, setNow] = useState(formatTime(0));
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

    const write = (time: number, isPlaying: boolean) => {
      view.currentTime = time;
      view.playing = isPlaying;
      setSung(time >= sungEnd);
    };

    const writeAudio = () => {
      const time = sound.currentTime;
      write(time, !sound.paused);
      setProgress(sound.duration ? time / sound.duration : 0);
      setNow(formatTime(time));
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

    controls.current = {
      toggle: () => {
        if (!sound.paused) return sound.pause();
        if (sound.ended || sound.currentTime >= sound.duration - END_SLACK_SECONDS) sound.currentTime = 0;
        void sound.play();
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

    const metadata = new Promise(resolve => sound.addEventListener("loadedmetadata", resolve, { once: true, signal }));

    (async () => {
      const [, { detectParser }, ttml] = await Promise.all([
        import("@braccato/core/element"),
        import("@braccato/parsers"),
        fetch(lyrics).then(response => response.text()),
        metadata,
      ]);
      if (signal.aborted) return;

      const parsed = detectParser(ttml).parse(ttml, sound.duration * 1000);
      const sungLines = parsed.filter(line => !line.isInstrumental);
      const last = sungLines[sungLines.length - 1];
      if (!last) return;
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
      write(sungEnd, false);
      setDuration(sound.duration);
    })();

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
        <braccato-lyrics ref={viewRef} aria-hidden="true" />
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
          total={formatTime(duration)}
          max={duration}
          label="Seek"
          onSeek={fraction => controls.current?.seek(fraction)}
        />
      </div>
    </figure>
  );
}
