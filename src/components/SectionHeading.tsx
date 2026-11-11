import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  /** Split sets the description in a narrower column to the right on large screens; stack keeps it under the title. */
  layout?: "stack" | "split";
  align?: "left" | "center";
}

/** A section opens on its headline and nothing else above it. */
export function SectionHeading({ title, description, className, layout = "split", align = "left" }: SectionHeadingProps) {
  const centered = align === "center";
  const split = !centered && layout === "split";
  return (
    <div className={cn(split ? "grid gap-6 lg:grid-cols-12 lg:gap-12" : "max-w-3xl", centered && "mx-auto text-center", className)}>
      <h2 className={cn("display text-[38px] md:text-[52px] lg:text-[58px] [text-wrap:balance]", split && "lg:col-span-7")}>{title}</h2>
      {description && (
        <p className={cn("text-[16px] leading-[1.65] text-tide md:text-[17px]", split ? "lg:col-span-5 lg:self-end lg:pb-2" : "mt-6 max-w-2xl", centered && "mx-auto")}>
          {description}
        </p>
      )}
    </div>
  );
}
