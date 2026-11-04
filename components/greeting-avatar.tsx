"use client";

import logo from "@/assets/images/logo.jpg";
import { Handwriting } from "@/components/handwriting";
import { play } from "cuelume";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const WAVE_AT_MS = [600, 5000];
const GIVE_UP_MS = 10000;
const SHRUG_MS = 1500;
const LINGER_MS = 4500;
// Readers who answered on this many visits, or ignored it this many in a row, are not asked again.
const ANSWERED_KEY = "greeting-answered";
const IGNORED_KEY = "greeting-ignored";
const ENOUGH_ANSWERS = 3;
const ENOUGH_IGNORES = 2;
const FAINT_MS = 2600;
const SULK_MS = 10000;
// Each click adds one to the annoyance; a calm stretch drains it one step every CALM_MS.
const CALM_MS = 1250;
const CHAT = ["the post is down there, fyi", "sup?", "i'm flattered, really", "quit lollygagging"];
const IDLE = ["boop", "hehe", "yes?", "still here"];
const GRUDGE = ["you again?", "that wasn't nice, y'know?"];
const FED_UP = ["this is a hostile workplace", "okay, i'm telling my mom", "wait till HR hears about this"];

const pick = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)];

const count = (key: string) => Number(localStorage.getItem(key)) || 0;

function hello() {
  const hour = new Date().getHours();
  if (hour < 5) return "isn't it, like, way past your bedtime?";
  if (hour < 12) return "top of the mornin'";
  if (hour < 18) return "hi :)";
  return "evening!";
}

type Side = "left" | "below";
type Tail = { side: "left" } | { side: "below"; x: number; y: number };

const EDGE_PX = 8;
const TAIL_GAP_PX = 4;
const MIN_TAIL_PX = 8;

// Shrinks the note to its widest wrapped line, so the bubble hugs the words instead of the max width.
function fitToWords(note: HTMLElement) {
  note.style.width = "";
  const words = Array.from(note.querySelectorAll<HTMLElement>(".inline-block"));
  if (!words.length) return;
  const left = Math.min(...words.map(w => w.offsetLeft));
  const right = Math.max(...words.map(w => w.offsetLeft + w.offsetWidth));
  const style = getComputedStyle(note);
  const wordPadding = Number.parseFloat(style.fontSize) * 0.5;
  const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
  note.style.width = `${Math.ceil(right - left - wordPadding + padding) + 1}px`;
}

function fits(note: HTMLElement, side: Side, oneLine: boolean) {
  note.dataset.side = side;
  note.toggleAttribute("data-one-line", oneLine);
  fitToWords(note);
  const box = note.getBoundingClientRect();
  return box.left >= EDGE_PX && box.right <= window.innerWidth - EDGE_PX;
}

// Falls back to below the byline row so the bubble never covers the byline.
function place(note: HTMLElement, avatar: HTMLElement, stayBelow: boolean): Tail {
  note.style.top = "";
  if (!stayBelow && (fits(note, "left", true) || fits(note, "left", false))) return { side: "left" };
  const row = avatar.closest(".blog__meta") ?? avatar;
  const rowBottom = Math.max(...Array.from(row.children, child => child.getBoundingClientRect().bottom));
  const tip = avatar.offsetHeight + TAIL_GAP_PX;
  const top = Math.max(tip + MIN_TAIL_PX, rowBottom + TAIL_GAP_PX - avatar.getBoundingClientRect().top);
  note.style.top = `${top}px`;
  if (!fits(note, "below", true)) fits(note, "below", false);
  return { side: "below", x: avatar.offsetWidth / 2 - note.offsetLeft, y: tip - top };
}

type Point = [string, ...number[]];

const draw = (points: Point[], at: (x: number, y: number) => [number, number]) =>
  points
    .map(([command, ...xy]) => {
      const coords: number[] = [];
      for (let i = 0; i < xy.length; i += 2) coords.push(...at(xy[i], xy[i + 1]));
      return `${command} ${coords.map(v => v.toFixed(1)).join(" ")}`;
    })
    .join(" ");

// A hand-drawn speech bubble around a w by h box, its tail pointing at the avatar. Beside the avatar,
// coordinates are relative to the tail tip, so a change of size grows the bubble away from the avatar.
// The stroke closes a little past where it began, the way a pen loop does.
function bubblePath(w: number, h: number, tail: Tail) {
  const r = h * 0.45;
  const mid = h / 2;
  if (tail.side === "below") {
    const t = tail.x;
    return draw(
      [
        ["M", t + 5, 1.6],
        ["C", w * 0.45, 0.6, w * 0.75, 2, w - r, 1.4],
        ["Q", w - 0.8, 1, w - 1, mid],
        ["Q", w - 0.8, h - 1, w - r, h - 1.4],
        ["C", w * 0.7, h - 0.4, w * 0.35, h - 2, r, h - 1.2],
        ["Q", 0.8, h - 1, 1, mid],
        ["Q", 1.2, 1.4, t - 5, 1.5],
        ["L", t - 1, tail.y],
        ["L", t + 5.5, 2.4],
      ],
      (x, y) => [x, y]
    );
  }
  const points: Point[] = [
    ["M", r + 2, 1.5],
    ["C", w * 0.4, 0.6, w * 0.7, 2, w - 9 - r, 1.4],
    ["Q", w - 8.4, 1, w - 8.6, mid - 4],
    ["L", w - 0.5, mid + 1],
    ["L", w - 8.8, mid + 4],
    ["Q", w - 8.6, h - 1, w - 9 - r, h - 1.4],
    ["C", w * 0.6, h - 0.4, w * 0.3, h - 2, r, h - 1.2],
    ["Q", 0.8, h - 1, 1, mid],
    ["Q", 1.2, 1.6, r + 7, 2.6],
  ];
  return draw(points, (x, y) => [x - w, y - mid]);
}

function restart(el: HTMLElement | null, attribute: string, value = "") {
  if (!el) return;
  el.removeAttribute(attribute);
  void el.offsetWidth;
  el.setAttribute(attribute, value);
}

/** The author's avatar on a post: it waves at new readers and talks back when poked. */
export function GreetingAvatar() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const below = useRef(false);
  const [message, setMessage] = useState<{ text: string; id: number; fresh: boolean } | null>(null);
  const state = useRef({
    chat: -1,
    answered: false,
    idle: 0,
    annoyance: 0,
    lastClick: 0,
    fainted: false,
    grudge: false,
    faints: 0,
    sulking: false,
    current: "",
  });
  const timers = useRef<{ intro: ReturnType<typeof setTimeout>[]; hide?: ReturnType<typeof setTimeout> }>({
    intro: [],
  });

  const act = (name: "wave" | "spin" | "getup") => restart(buttonRef.current, "data-act", name);

  const hide = () => {
    noteRef.current?.setAttribute("data-off", "");
    state.current.current = "";
  };

  const say = (text: string, linger = LINGER_MS) => {
    clearTimeout(timers.current.hide);
    noteRef.current?.removeAttribute("data-off");
    if (text !== state.current.current) {
      const fresh = state.current.current === "";
      state.current.current = text;
      setMessage(previous => ({ text, id: (previous?.id ?? 0) + 1, fresh }));
    }
    if (linger) timers.current.hide = setTimeout(hide, linger);
  };

  useLayoutEffect(() => {
    const note = noteRef.current;
    const svg = svgRef.current;
    const avatar = buttonRef.current;
    if (!message || !note || !svg || !avatar) return;
    // Once a bubble has dropped below the byline, later ones stay there instead of hopping sides.
    const tail = place(note, avatar, below.current);
    below.current = tail.side === "below";
    const d = bubblePath(note.offsetWidth, note.offsetHeight, tail);
    for (const path of Array.from(svg.children)) path.setAttribute("d", d);
    if (message.fresh) restart(note, "data-drawn");
  }, [message]);

  useEffect(() => {
    const t = timers.current;
    const asked = count(ANSWERED_KEY) < ENOUGH_ANSWERS && count(IGNORED_KEY) < ENOUGH_IGNORES;
    if (!asked) {
      t.intro = [setTimeout(() => act("wave"), WAVE_AT_MS[0])];
    } else {
      t.intro = WAVE_AT_MS.map((at, i) =>
        setTimeout(() => {
          act("wave");
          if (i === 0) say("wave back?", 0);
        }, at)
      );
      t.intro.push(
        setTimeout(() => {
          localStorage.setItem(IGNORED_KEY, String(count(IGNORED_KEY) + 1));
          const box = buttonRef.current?.getBoundingClientRect();
          if (box && box.bottom > 0 && box.top < window.innerHeight) say("fair enough", SHRUG_MS);
          else hide();
        }, GIVE_UP_MS)
      );
    }
    return () => {
      t.intro.forEach(clearTimeout);
      clearTimeout(t.hide);
    };
  }, []);

  const faint = () => {
    const s = state.current;
    s.fainted = true;
    s.annoyance = 0;
    buttonRef.current?.removeAttribute("data-act");
    buttonRef.current?.setAttribute("data-fainted", "");
    say("x_x", 0);
    play("close", { theme: "bubble", emphasis: "strong" });
    setTimeout(() => {
      buttonRef.current?.removeAttribute("data-fainted");
      s.fainted = false;
      s.grudge = true;
      s.faints += 1;
      act("getup");
      if (s.faints % 3 === 0) {
        s.sulking = true;
        setTimeout(() => {
          s.sulking = false;
        }, SULK_MS);
        say(pick(FED_UP));
      } else {
        say("...what happened?");
      }
      play("open", { theme: "bubble" });
    }, FAINT_MS);
  };

  const onClick = () => {
    const s = state.current;
    timers.current.intro.forEach(clearTimeout);
    if (!s.answered) {
      s.answered = true;
      localStorage.setItem(ANSWERED_KEY, String(count(ANSWERED_KEY) + 1));
      localStorage.removeItem(IGNORED_KEY);
    }
    if (s.fainted || s.sulking) return play("tap", { theme: "bubble", emphasis: "subtle" });
    const now = performance.now();
    s.annoyance = Math.max(0, s.annoyance - (now - s.lastClick) / CALM_MS) + 1;
    s.lastClick = now;
    play("tap", { theme: "bubble" });
    if (s.annoyance >= 9) return faint();
    if (s.annoyance >= 3.5) {
      act("spin");
      return say(s.annoyance >= 7 ? "getting dizzy @_@" : s.annoyance >= 5 ? "hey, stop that" : "whoa whoa");
    }
    act("wave");
    if (s.grudge) {
      s.grudge = false;
      return say(pick(GRUDGE));
    }
    s.chat += 1;
    say(s.chat === 0 ? hello() : s.chat <= CHAT.length ? CHAT[s.chat - 1] : IDLE[s.idle++ % IDLE.length]);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Say hi to Boidushya"
      onClick={onClick}
      className="greeting-avatar relative z-10 rounded-full pressable focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
    >
      <Image src={logo} placeholder="blur" alt="" className="w-8 h-8 border rounded-full border-accent-600" />
      <span ref={noteRef} aria-live="polite" className="greeting-avatar__note">
        <svg ref={svgRef} aria-hidden="true">
          <path className="greeting-avatar__fill" />
          <path className="greeting-avatar__stroke" pathLength={1} />
        </svg>
        {message && (
          <Handwriting
            key={message.id}
            text={message.text}
            shown
            delay={message.fresh ? 0.42 : 0.06}
            className="relative"
          />
        )}
      </span>
    </button>
  );
}
