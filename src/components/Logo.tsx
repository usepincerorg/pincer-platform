import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MarkProps {
  size?: number;
  className?: string;
}

/** The Pincer mark: a faceted shard, cut out and centered so it sits on any ground. */
export function Mark({ size = 36, className }: MarkProps) {
  return (
    <Image
      src="/images/logo-mark.png"
      alt=""
      width={size}
      height={size}
      priority
      aria-hidden="true"
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

interface LogoProps {
  /** Pixel size of the mark. */
  size?: number;
  withWordmark?: boolean;
  className?: string;
  href?: string;
}

export function Logo({ size = 32, withWordmark = true, className, href = "/" }: LogoProps) {
  return (
    <Link href={href} aria-label="Pincer homepage" className={cn("group inline-flex items-center gap-2 text-navy", className)}>
      <Mark size={size} />
      {withWordmark && <span className="text-[19px] font-semibold tracking-[-0.025em]">Pincer</span>}
    </Link>
  );
}
