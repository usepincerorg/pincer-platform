import type { Metadata } from "next";
import { AppFrame } from "@/components/app/AppFrame";

export const metadata: Metadata = {
  title: { default: "Pincer apps", template: "%s | Pincer" },
  description: "Pincer Console, Portfolio and Explorer: where private company shares are issued, held and traded on Robinhood Chain.",
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
