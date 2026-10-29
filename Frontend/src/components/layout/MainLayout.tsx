import type { ReactNode } from "react";
import { AppSidebar } from "@/components/feature/AppSidebar";
import { BottomNav } from "@/components/feature/BottomNav";
import { DesktopTopBar } from "@/components/feature/DesktopTopBar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-bg relative min-h-screen">
      <AppSidebar />
      <div className="lg:pl-72">
        {/* Desktop-only top bar sits above <main> */}
        <DesktopTopBar />
        <main className="mx-auto min-h-screen w-full max-w-md pb-28 lg:max-w-6xl lg:min-h-0 lg:pb-16">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}