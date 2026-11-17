"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { STEPS } from "@/components/demo/ConsoleDemo";
import "./film.css";

/*
 * A 60 second introduction to Pincer at 1920 × 1080. Every frame is a pure
 * function of t (seconds), so the capture script can step through it at any
 * frame rate. The product scene plays the homepage's Console demo views
 * (the same components, driven by this clock instead of their own).
 */

export const FILM_W = 1920;
export const FILM_H = 1080;
export const DURATION = 60;

/* ------------------------------------------------------------------ */
/* Timing helpers                                                      */
/* ------------------------------------------------------------------ */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Eased 0 to 1 between a and b (expo out: quick start, long settle). */
const rise = (t: number, a: number, b: number) => outExpo(prog(t, a, b));
/** Eased 0 to 1 between a and b (cubic in and out). */
const glideK = (t: number, a: number, b: number) => inOut(prog(t, a, b));
/** 0 before a, 1 from a+fi to b-fo, 0 after b: a scene's presence. */
const envelope = (t: number, a: number, b: number, fi = 0.9, fo = 0.9) => Math.min(glideK(t, a, a + fi), 1 - glideK(t, b - fo, b));

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

const S1 = [0, 7.4] as const; // cold open
const S2 = [6.8, 13.6] as const; // brand reveal
const S3 = [13.0, 44.4] as const; // the product
const S4 = [43.6, 52.2] as const; // transparency
const S5 = [51.4, 60.5] as const; // end card

/* The Console steps, back to back from STEP0 */
const STEP0 = 14.6;
const STEP_STARTS = STEPS.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? STEP0 : acc[i - 1] + STEPS[i - 1].dur], []);

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

/** Words that rise out of a blur one after another, starting at `at`; they leave together at `out`. */
function Words({ text, t, at, out, stagger = 0.07, dur = 1.1, className, style }: { text: string; t: number; at: number; out?: number; stagger?: number; dur?: number; className?: string; style?: CSSProperties }) {
  const leave = out === undefined ? 0 : glideK(t, out, out + 0.6);
  return (
    <span className={className} style={style}>
      {text.split(" ").map((w, i) => {
        const p = rise(t, at + i * stagger, at + i * stagger + dur);
        const o = p * (1 - leave);
        return (
          <span
            key={i}
            className="fw"
            style={{
              opacity: o,
              transform: `translateY(${(1 - p) * 0.32 - leave * 0.12}em)`,
              filter: `blur(${(1 - p) * 14 + leave * 10}px)`,
            }}
          >
            {w}
            {i < text.split(" ").length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
}

function Background({ src, opacity, scale = 1, x = 0, y = 0, style }: { src: string; opacity: number; scale?: number; x?: number; y?: number; style?: CSSProperties }) {
  if (opacity <= 0.001) return null;
  return <div className="bgl" style={{ backgroundImage: `url(${src})`, opacity, transform: `translate(${x}px, ${y}px) scale(${scale})`, ...style }} />;
}

function Brand({ size, k = 1 }: { size: number; k?: number }) {
  return (
    <div className="brand" style={{ fontSize: size, gap: size * 0.32 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo-mark.png" alt="" style={{ width: size * 1.3, height: size * 1.3, opacity: k, transform: `scale(${lerp(0.82, 1, k)}) rotate(${(1 - k) * -10}deg)`, filter: `blur(${(1 - k) * 10}px)` }} />
      <span>Pincer</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 1: cold open                                                  */
/* ------------------------------------------------------------------ */

function ColdOpen({ t }: { t: number }) {
  const e = envelope(t, S1[0], S1[1], 0.01, 0.8);
  if (e <= 0) return null;
  return (
    <div className="scene" style={{ opacity: e }}>
      <div className="center-copy" style={{ top: 330 }}>
        <h1 className="display headline" style={{ fontSize: 112 }}>
          <Words text="The best companies are" t={t} at={0.5} out={3.3} />
          <br />
          <Words text="staying private longer." t={t} at={0.85} out={3.3} />
        </h1>
      </div>
      <div className="center-copy" style={{ top: 400 }}>
        <h1 className="display headline quiet-grad" style={{ fontSize: 124 }}>
          <Words text="Their shareholders wait." t={t} at={3.9} />
        </h1>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2: brand reveal under the beam                                */
/* ------------------------------------------------------------------ */

function Reveal({ t }: { t: number }) {
  const e = envelope(t, S2[0], S2[1], 0.6, 0.8);
  if (e <= 0) return null;
  const k = rise(t, 7.6, 9.2);
  const word = rise(t, 8.1, 9.5);
  return (
    <div className="scene" style={{ opacity: e }}>
      <div className="halo" style={{ left: 960, top: 420, opacity: 0.95 * k }} />
      <div className="center-copy" style={{ top: 300 }}>
        <div style={{ opacity: word, transform: `translateY(${(1 - word) * 18}px)`, filter: `blur(${(1 - word) * 8}px)` }}>
          <Brand size={128} k={k} />
        </div>
      </div>
      <div className="center-copy" style={{ top: 500 }}>
        <p className="display headline quiet-grad" style={{ fontSize: 58 }}>
          <Words text="Private stock tokens, issued by the company itself." t={t} at={9.9} stagger={0.06} />
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3: the Console, playing                                       */
/* ------------------------------------------------------------------ */

const CAPTIONS: [string, string][] = [
  ["Set the rules.", "The token enforces them."],
  ["Raise capital.", "Settled in stablecoins."],
  ["Every transfer,", "checked on-chain."],
  ["Open liquidity.", "On your terms."],
];

const WIN_W = 1260;
const K = WIN_W / 1200;
const WIN_H = 40 + 750 * K;

function ConsoleWindow({ t, cam }: { t: number; cam: { z: number; fx: number; fy: number } }) {
  // Which step plays, how far in, and the one before it while it fades out.
  let i = STEPS.length - 1;
  for (let j = 0; j < STEPS.length; j++) if (t < STEP_STARTS[j] + STEPS[j].dur) { i = j; break; }
  const local = Math.max(0, Math.min(STEPS[i].dur, t - STEP_STARTS[i]));
  const fade = i > 0 ? rise(t, STEP_STARTS[i], STEP_STARTS[i] + 0.5) : 1;
  const Cur = STEPS[i].View;
  const Prev = i > 0 ? STEPS[i - 1].View : null;
  return (
    <figure className="hd-win film-win" style={{ width: WIN_W }}>
      <div className="hd-bar">
        <span className="hd-lights">
          <i />
          <i />
          <i />
        </span>
        <span className="hd-tab">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-mark.png" alt="" width={14} height={14} />
          Pincer Console
        </span>
        <span className="hd-url">{STEPS[i].path}</span>
        <span className="hd-gap" />
      </div>
      <div className="hd-view" style={{ "--k": K } as CSSProperties}>
        <div className="zoom" style={{ transform: `scale(${cam.z})`, transformOrigin: `${cam.fx * 100}% ${cam.fy * 100}%` }}>
        {Prev && fade < 1 && (
          <div className="hd-stage">
            <Prev t={STEPS[i - 1].dur} dur={STEPS[i - 1].dur} />
          </div>
        )}
        <div className="hd-stage" style={{ opacity: fade }}>
          <Cur t={local} dur={STEPS[i].dur} />
        </div>
        </div>
      </div>
    </figure>
  );
}

/* Where each step's action happens, as a fraction of the window, for the camera to push toward */
const FOCUS: [number, number][] = [
  [0.86, 0.68],
  [0.84, 0.42],
  [0.8, 0.6],
  [0.78, 0.72],
];

function camera(t: number) {
  let z = 1;
  let fx = 0.8;
  let fy = 0.55;
  for (let j = 0; j < STEPS.length; j++) {
    const a = STEP_STARTS[j];
    const b = a + STEPS[j].dur;
    const k = Math.min(glideK(t, a + 0.6, a + 2.0), 1 - glideK(t, b - 1.3, b - 0.1));
    if (t >= a - 0.5 && t < b) {
      z = 1 + 0.3 * k;
      [fx, fy] = FOCUS[j];
    }
  }
  return { z, fx, fy };
}

function Product({ t }: { t: number }) {
  const e = envelope(t, S3[0], S3[1], 0.9, 1.0);
  if (e <= 0) return null;
  const enter = rise(t, 13.2, 15.4);
  const leave = glideK(t, 43.4, 44.4);
  const drift = prog(t, 13.2, 44);
  const winStyle: CSSProperties = {
    left: 1920 - WIN_W - 70,
    top: (1080 - WIN_H) / 2 + (1 - enter) * 120,
    opacity: enter,
    transform: `perspective(3200px) rotateY(${lerp(-7, -3, drift) - (1 - enter) * 8}deg) rotateX(${lerp(14, 1.5, enter) + leave * 4}deg) scale(${lerp(0.92, 1, enter) - leave * 0.04})`,
    filter: `blur(${leave * 6}px)`,
  };
  const cam = camera(t);

  // Caption for the step that plays; it changes a beat after the step does.
  let c = 0;
  for (let j = 0; j < STEPS.length; j++) if (t >= STEP_STARTS[j] - 0.3) c = j;
  return (
    <div className="scene" style={{ opacity: e }}>
      <div className="win-shadow" style={{ left: winStyle.left as number, top: 160, opacity: enter * 0.9 }} />
      <div className="win-wrap" style={winStyle}>
        <ConsoleWindow t={t} cam={cam} />
      </div>
      <div className="caption">
        {CAPTIONS.map(([a, b], j) => {
          const at = j === 0 ? 14.2 : STEP_STARTS[j] - 0.3;
          const out = j < CAPTIONS.length - 1 ? STEP_STARTS[j + 1] - 0.9 : 43.2;
          if (t < at - 0.1 || t > out + 0.8) return null;
          return (
            <h2 key={j} className="display headline cap" style={{ fontSize: 74 }}>
              <Words text={a} t={t} at={at} out={out} />
              <br />
              <Words text={b} t={t} at={at + 0.25} out={out} className="quiet-grad" />
            </h2>
          );
        })}
        <div className="steps" style={{ opacity: rise(t, 14.6, 15.6) * (1 - leave) }}>
          {STEPS.map((s, j) => (
            <i key={s.id}>
              <b style={{ transform: `scaleX(${prog(t, STEP_STARTS[j], STEP_STARTS[j] + s.dur)})` }} />
            </i>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 4: every share, on the record                                 */
/* ------------------------------------------------------------------ */

const EVENTS = [
  { name: "SharesIssued", summary: "250,000 LKW-B issued to 0x58aa…903c", tx: "0x9a41…c2e0" },
  { name: "Subscribed", summary: "40,000 USDG committed to the Series B offering", tx: "0x17fd…08b3" },
  { name: "WindowCleared", summary: "15,000 LKW-B cleared at 24.00 USDG", tx: "0x6c3d…1f88" },
  { name: "DistributionFunded", summary: "Dividend of 0.42 USDG per share funded", tx: "0xe20b…77a1" },
  { name: "VoteCast", summary: "Vote recorded on proposal 3, board election", tx: "0x3b90…d4c6" },
];
const EV0 = 45.0;
const EV_GAP = 1.05;
const ROW_H = 84;

function Record({ t }: { t: number }) {
  const e = envelope(t, S4[0], S4[1], 0.9, 0.9);
  if (e <= 0) return null;
  const card = rise(t, 44.4, 46.0);
  return (
    <div className="scene" style={{ opacity: e }}>
      <div className="corner-copy" style={{ left: 120, top: 150 }}>
        <h2 className="display headline" style={{ fontSize: 124, textAlign: "left" }}>
          <Words text="Every share." t={t} at={44.2} />
          <br />
          <Words text="On the record." t={t} at={44.55} className="quiet-grad" />
        </h2>
      </div>
      <div className="glass glass-strong feed" style={{ opacity: card, transform: `translateY(${(1 - card) * 40}px)`, filter: `blur(${(1 - card) * 8}px)` }}>
        <div className="feed-head">
          <div>
            <div className="feed-title">Latest events</div>
            <div className="feed-sub">Events from Pincer contracts, newest at the top.</div>
          </div>
          <span className="feed-co">Larkway Labs</span>
        </div>
        <ul className="feed-list">
          {EVENTS.map((ev, i) => {
            const at = EV0 + i * EV_GAP;
            const p = rise(t, at, at + 0.7);
            if (p <= 0) return null;
            let y = 0;
            for (let j = i + 1; j < EVENTS.length; j++) y += glideK(t, EV0 + j * EV_GAP, EV0 + j * EV_GAP + 0.55) * ROW_H;
            return (
              <li key={ev.name} className="feed-row" style={{ transform: `translateY(${y}px)`, opacity: p, filter: `blur(${(1 - p) * 6}px)` }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[17px] font-medium text-lagoon">{ev.name}</span>
                    <span className="font-mono text-[15px] text-fog">LKW-B</span>
                  </div>
                  <p className="mt-1 text-[19px] leading-snug text-navy">{ev.summary}</p>
                </div>
                <span className="font-mono text-[15px] text-fog">{ev.tx}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 5: end card                                                   */
/* ------------------------------------------------------------------ */

function EndCard({ t }: { t: number }) {
  const e = envelope(t, S5[0], S5[1], 0.9, 0.01);
  if (e <= 0) return null;
  const k = rise(t, 52.0, 53.6);
  const url = rise(t, 55.0, 56.4);
  return (
    <div className="scene" style={{ opacity: e }}>
      <div className="center-copy" style={{ top: 200 }}>
        <div style={{ opacity: k, transform: `translateY(${(1 - k) * 16}px)` }}>
          <Brand size={76} k={k} />
        </div>
      </div>
      <div className="center-copy" style={{ top: 360 }}>
        <h2 className="display headline" style={{ fontSize: 112 }}>
          <Words text="Own private stock tokens" t={t} at={52.7} />
          <br />
          <Words text="on Robinhood Chain" t={t} at={53.1} className="quiet-grad" />
        </h2>
      </div>
      <div className="center-copy" style={{ top: 660 }}>
        <span className="url" style={{ opacity: url, filter: `blur(${(1 - url) * 6}px)` }}>
          usepincer.org
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The film                                                            */
/* ------------------------------------------------------------------ */

function Frame({ t }: { t: number }) {
  // Backgrounds, each with a slow camera move of its own.
  const b1a = envelope(t, S1[0], S1[1], 0.01, 0.8);
  const b2 = envelope(t, S2[0], S2[1], 0.6, 0.8);
  const b3 = envelope(t, S3[0], S3[1], 0.9, 1.0);
  const b4 = envelope(t, S4[0], S4[1], 0.9, 0.9);
  const b1b = envelope(t, S5[0], S5[1], 0.9, 0.01);
  const beam = rise(t, 6.9, 9.0);
  return (
    <div className="film" style={{ width: FILM_W, height: FILM_H }}>
      <Background src="/motion/bg-1.webp" opacity={b1a} scale={lerp(1.0, 1.1, prog(t, 0, 7.4))} y={lerp(30, -10, prog(t, 0, 7.4))} />
      <Background
        src="/motion/bg-2.webp"
        opacity={b2}
        scale={lerp(1.08, 1.0, prog(t, 6.8, 13.6))}
        style={{
          WebkitMaskImage: `linear-gradient(to top, #000 ${beam * 120 - 20}%, transparent ${beam * 120}%)`,
          maskImage: `linear-gradient(to top, #000 ${beam * 120 - 20}%, transparent ${beam * 120}%)`,
        }}
      />
      <Background src="/motion/bg-3.webp" opacity={b3 * 0.85} scale={lerp(1.04, 1.14, prog(t, 13, 44.4))} x={lerp(30, -40, prog(t, 13, 44.4))} />
      <Background src="/motion/bg-4.webp" opacity={b4} scale={lerp(1.0, 1.08, prog(t, 43.6, 52.2))} x={lerp(-20, 30, prog(t, 43.6, 52.2))} y={lerp(20, -20, prog(t, 43.6, 52.2))} />
      <Background src="/motion/bg-1.webp" opacity={b1b * 0.85} scale={lerp(1.44, 1.38, prog(t, 51.4, 60))} y={lerp(215, 195, prog(t, 51.4, 60))} />
      <div className="vignette" />

      <ColdOpen t={t} />
      <Reveal t={t} />
      <Product t={t} />
      <Record t={t} />
      <EndCard t={t} />

      <div className="grain" />
    </div>
  );
}

declare global {
  interface Window {
    __setT?: (t: number) => void;
    __filmReady?: boolean;
  }
}

export function Film(): ReactNode {
  const [t, setT] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    window.__setT = (v: number) => flushSync(() => setT(v));
    if (q.has("t")) {
      setT(Number(q.get("t")));
    } else if (!q.has("capture")) {
      let id = 0;
      const t0 = performance.now();
      const tick = () => {
        setT(((performance.now() - t0) / 1000) % DURATION);
        id = requestAnimationFrame(tick);
      };
      id = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(id);
    }
    document.fonts.ready.then(() => (window.__filmReady = true));
  }, []);

  return <Frame t={t} />;
}
