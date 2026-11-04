"use client";

import "@braccato/core/styles/variables.css";
import "@braccato/core/styles/lyrics.css";
import { Handwriting } from "@/components/handwriting";
import { PlayButton } from "@/components/play-button";
import { ProgressBar } from "@/components/progress-bar";
import { IS_DEV } from "@/utils/constants";
import { observeReveal } from "@/utils/reveal";
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

type Controls = { toggle: () => void; seek: (fraction: number) => void; runSilently: () => void };

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
  const [opened, setOpened] = useState(false);
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
    let silenced = false;
    let span = { begin: 0, end: 0 };

    const write = (time: number, isPlaying: boolean) => {
      view.currentTime = time;
      view.playing = isPlaying;
      setSung(time >= span.end);
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

    const takeOver = () => {
      silenced = true;
      setOpened(true);
    };

    const runSilently = () => {
      if (silenced) return;
      setOpened(true);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        write(span.end, false);
        return;
      }
      const start = performance.now();
      loop(() => {
        const time = Math.min(span.begin + (performance.now() - start) / 1000, span.end);
        const done = time >= span.end;
        write(time, !done);
        return !done;
      });
    };

    sound.addEventListener(
      "play",
      () => {
        takeOver();
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
        takeOver();
        if (sound.paused) cancelAnimationFrame(frame);
        sound.currentTime = fraction * sound.duration;
        writeAudio();
      },
      runSilently,
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
      const first = sungLines[0];
      const last = sungLines[sungLines.length - 1];
      if (!first || !last) return;
      span = { begin: first.startTimeMs / 1000, end: (last.startTimeMs + last.durationMs) / 1000 };

      if (IS_DEV) {
        const sungText = normalizeWords(sungLines.map(line => line.words).join(" "));
        const quoteText = normalizeWords(quote.textContent ?? "");
        if (sungText !== quoteText)
          console.warn(`SungQuote: ${lyrics} does not match the quote text`, { sungText, quoteText });
      }

      view.host = { getScrollElement: () => view };
      view.theme = THEME;
      view.lyrics = parsed;
      setDuration(sound.duration);
    })();

    return () => {
      lifetime.abort();
      cancelAnimationFrame(frame);
      sound.pause();
      controls.current = undefined;
    };
  }, [lyrics, audio]);

  // Observed only once the quote has its final height, so the first reading is not taken off the tall pre-render layout.
  useEffect(() => {
    const figure = figureRef.current;
    if (!rendered || !figure) return;
    return observeReveal(figure, 0.8, () => controls.current?.runSilently());
  }, [rendered]);

  return (
    <figure ref={figureRef} className="sung-quote">
      <div className="sung-quote-text">
        <span className="sung-quote-open" aria-hidden="true">
          <Handwriting text="“" shown={opened} />
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
          label={playing ? "Pause" : "Play the quote"}
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
