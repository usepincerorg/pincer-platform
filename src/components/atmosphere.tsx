import { cn } from "@/lib/utils";

/**
 * The light behind a stage: a soft cool wash on the ink, with an optional
 * photograph shown with only a touch of softness, as depth of field. A dark
 * pool sits behind the centred copy so the photograph shows around the text
 * rather than through it, and the photograph fades into the ink at the bottom.
 * The image is a CSS background, so the stage renders cleanly as plain ink if
 * the file is missing. Position the parent relatively and give it `isolate`.
 */
export function Atmosphere({
  image,
  className,
  focus = "50% 0%",
}: {
  image?: string;
  className?: string;
  /** Where the wash is centred, as a CSS position. */
  focus?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {image && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-[760px] bg-cover bg-center opacity-60 blur-[2px] saturate-[0.9] [mask-image:linear-gradient(180deg,#000_55%,transparent_100%)] md:h-[1100px] md:opacity-80"
            style={{ backgroundImage: `url(${image})` }}
          />
          {/* The pool behind the copy: darkest under the headline, open at the edges */}
          <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_62%_48%_at_50%_42%,rgb(7_9_13/0.88)_0%,rgb(7_9_13/0.6)_45%,transparent_78%)] md:h-[1100px] md:bg-[radial-gradient(ellipse_60%_38%_at_50%_34%,rgb(7_9_13/0.86)_0%,rgb(7_9_13/0.62)_50%,transparent_82%)]" />
        </>
      )}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 55% 45% at ${focus}, rgb(180 189 214 / 0.13), transparent 70%)` }}
      />
      <div className="grain" />
    </div>
  );
}

/** The hairline rails at the shell edges. Render once per page. */
export function Rails() {
  return <div aria-hidden="true" className="rails hidden md:block" />;
}

/** A hairline across the shell with a small square at each rail, between sections. */
export function Seam({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("seam hidden md:block", className)} />;
}

/** A glass shell. `strong` raises its fill for cards that sit over busy atmosphere. */
export function Glass({
  as: Tag = "div",
  strong,
  pill,
  className,
  children,
  ...rest
}: {
  as?: "div" | "section" | "article" | "aside" | "ol" | "ul" | "li" | "header" | "figure";
  strong?: boolean;
  pill?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn("glass", strong && "glass-strong", pill && "glass-pill", className)} {...rest}>
      {children}
    </Tag>
  );
}
