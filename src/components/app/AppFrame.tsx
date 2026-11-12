"use client";

import { AuthProvider, PRIVY_APP_ID } from "@/lib/pincer/auth";
import { SandboxProvider, useIsClient } from "@/lib/pincer/store";
import { AppShell } from "./AppShell";
import { Splash } from "./Onboarding";

/** Mounts sign-in and the shared state in the browser only, since Privy runs client-side. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();
  if (!isClient) {
    return (
      <div className="flex min-h-screen">
        <Splash />
      </div>
    );
  }
  if (!PRIVY_APP_ID) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-[480px] p-8">
          <h1 className="text-[24px]">Sign-in isn&apos;t set up yet</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-tide">
            Put NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET in .env, then restart the server. Both values are listed under App settings in the Privy dashboard.
          </p>
        </div>
      </div>
    );
  }
  return (
    <AuthProvider>
      <SandboxProvider>
        <AppShell>{children}</AppShell>
      </SandboxProvider>
    </AuthProvider>
  );
}
