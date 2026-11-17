import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Film } from "./Film";

/*
 * The intro film, drawn from one clock so it can be captured frame by frame
 * (scripts/capture-film.mjs). Development only: it never ships.
 *
 *   /motion           plays in real time
 *   /motion?t=24.5    holds the frame at 24.5 s
 */
export const metadata: Metadata = { title: "Film", robots: { index: false, follow: false } };

export default function MotionPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Film />;
}
