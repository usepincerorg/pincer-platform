"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import "./step-window.css";

/*
 * An app shown working, drawn live in HTML instead of recorded.
 *
 * A demo is a list of steps, { id, name, dur, path, View }. View({ t, dur })
 * draws everything inside the window at a fixed design size (W × H) for `t`
 * seconds into its step, from `t` alone: the same t gives the same frame. The
 * window scales that stage to its own width with one number (--k), plays the
 * steps in a loop only while it is on screen and the tab is shown, and under
 * prefers-reduced-motion shows each step's end frame, still. A bar along the
 * foot names the steps and fills as each plays; a click plays that one.
 */

export const W = 1200;
export const H = 750;

export type StepView = ComponentType<{ t: number; dur: number }>;
export interface Step {
  id: string;
  /** 1 to 3 words, as the steps bar shows it. */
  name: string;
  dur: number;
  /** The address the window's bar shows during this step. */
  path?: string;
  View: StepView;
}

const lessMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** How far `t` is through the stretch from `a` to `b`, eased in and out (0 before a, 1 after b). */
export function ease(t: number, a: number, b: number) {
  const x = clamp01((t - a) / (b - a));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** `text` as typed by `t`: nothing before `a`, all of it by `b`. */
export function typed(text: string, t: number, a: number, b: number) {
  return text.slice(0, Math.round(text.length * clamp01((t - a) / (b - a))));
}

/** The value of the last cue whose time has come; `before` until the first. */
export function cue<T>(t: number, cues: [number, T][], before: T): T {
  let v = before;
  for (const [at, value] of cues) {
    if (t < at) break;
    v = value;
  }
  return v;
}

/** Whether a click that lands at `at` is still pressed (about 0.16 s, a person's click). */
export const held = (t: number, at: number, len = 0.16) => t >= at && t < at + len;

/**
 * Where the pointer is at `t`, from `t` alone, so a scrub or a frozen frame
 * puts it exactly where it belongs. `path` is [[from, to, x, y], …]: it
 * travels to (x, y), eased, between `from` and `to` seconds; the first entry,
 * [0, 0, x, y], is where it starts. `clicks` are the moments it presses.
 */
export function glide(t: number, path: [number, number, number, number][], clicks: number[] = []) {
  let [, , x, y] = path[0];
  for (let j = 1; j < path.length; j++) {
    const [a, b, nx, ny] = path[j];
    if (t <= a) break;
    const k = ease(t, a, b);
    x += (nx - x) * k;
    y += (ny - y) * k;
  }
  return { x, y, move: 0, press: clicks.some((at) => held(t, at)) };
}

const ARROW =
  "M5.17 5.18Q5 5 5 5.25L5 15.9Q5 16.4 5.5 16.46L8.6 16.86Q8.9 16.9 9.01 17.18L9.64 18.76Q9.95 19.55 10.76 19.29L10.84 19.26Q11.65 19 11.38 18.19L10.05 14.23Q9.95 13.95 10.25 13.91L12.8 13.57Q13.3 13.5 12.95 13.14Z";

/** The pointer, its tip on (x, y) of the stage, pressed while `press`, faded while `hide`. Render it last. */
export function Cursor({ x, y, press = false, hide = false, move = 0.7 }: { x: number; y: number; press?: boolean; hide?: boolean; move?: number }) {
  return (
    <span
      className={`hd-cursor${press ? " press" : ""}${hide ? " away" : ""}`}
      style={{ transform: `translate(${x - 5}px, ${y - 5}px)`, transitionDuration: `${move}s, 0.3s` }}
      aria-hidden="true"
    >
      <svg width="32" height="32" viewBox="0 0 32 32" overflow="visible">
        <path d={ARROW} fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        <path d={ARROW} fill="#000" />
      </svg>
    </span>
  );
}

type At = { i: number; t: number };

/**
 * The steps' clock: which step plays and how far in. It runs only while the
 * window is at least 15% on screen and the tab is shown, never jumps more
 * than a quarter second at once, and loops. Under reduced motion it stands
 * still on each step's end. `start` freezes it at that frame, for screenshots.
 */
export function useStepClock(steps: Step[], root: React.RefObject<HTMLElement | null>, { still, start }: { still?: boolean; start?: At } = {}) {
  const [calm] = useState(() => still ?? lessMotion());
  const [at, setAt] = useState<At>(() => start ?? { i: 0, t: calm ? steps[0].dur : 0 });
  const [paused, setPaused] = useState(!!start);
  const now = useRef(at);

  useEffect(() => {
    if (calm || paused) return;
    let shown = false;
    let last = performance.now();
    const io = new IntersectionObserver(
      ([e]) => {
        shown = e.isIntersecting;
        last = performance.now();
      },
      { threshold: 0.15 }
    );
    if (root.current) io.observe(root.current);
    const id = setInterval(() => {
      const t0 = performance.now();
      const dt = Math.min(0.25, (t0 - last) / 1000);
      last = t0;
      if (!shown || document.hidden) return;
      let { i, t } = now.current;
      t += dt;
      if (t >= steps[i].dur) {
        i = (i + 1) % steps.length;
        t = 0;
      }
      now.current = { i, t };
      setAt(now.current);
    }, 40);
    return () => {
      clearInterval(id);
      io.disconnect();
    };
  }, [calm, paused, steps, root]);

  return {
    i: at.i,
    t: at.t,
    still: calm,
    /** Plays step `i` from its start (its end, under reduced motion). */
    play: (i: number) => {
      now.current = { i, t: calm ? steps[i].dur : 0 };
      setAt(now.current);
    },
    pause: () => setPaused(true),
    resume: () => setPaused(false),
  };
}

/**
 * A browser window that plays `steps`: its bar with the tab and the address
 * of the step that plays, the app at W × H scaled to fit, and the steps bar.
 */
export default function StepWindow({ steps, tab, label, start }: { steps: Step[]; tab: React.ReactNode; label: string; start?: At }) {
  const root = useRef<HTMLDivElement>(null);
  const clock = useStepClock(steps, root, { start });
  const view = useRef<HTMLDivElement>(null);

  // Scaled to the window: one number for the whole stage.
  useLayoutEffect(() => {
    const el = view.current;
    if (!el) return;
    const fit = () => el.style.setProperty("--k", String(el.clientWidth / W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const step = steps[clock.i];
  const { View } = step;
  return (
    <div className="hd" ref={root}>
      <figure className={`hd-win${start ? " hd-frozen" : ""}`}>
        <div className="hd-bar" aria-hidden="true">
          <span className="hd-lights">
            <i />
            <i />
            <i />
          </span>
          <span className="hd-tab">{tab}</span>
          <span className="hd-url">{step.path}</span>
          <span className="hd-gap" />
        </div>
        <div className="hd-view" ref={view} role="img" aria-label={`${label}: ${steps.map((s) => s.name).join(", ")}`}>
          <div className="hd-stage" key={step.id}>
            <View t={clock.t} dur={step.dur} />
          </div>
        </div>
        <ol className="hd-steps" aria-label={`${label}, step by step`}>
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={i === clock.i ? "on" : ""}
                aria-current={i === clock.i ? "step" : undefined}
                onClick={() => clock.play(i)}
              >
                <span className="hd-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="hd-label">{s.name}</span>
                <i style={{ "--p": i === clock.i ? Math.min(1, clock.t / s.dur) : i < clock.i ? 1 : 0 } as CSSProperties} />
              </button>
            </li>
          ))}
        </ol>
      </figure>
    </div>
  );
}
