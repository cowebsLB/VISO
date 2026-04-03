import { Footer } from "./Footer";
import { Header } from "./Header";
import { DynamicHead } from "./DynamicHead";
import { PwaInstallBanner } from "./PwaInstallBanner";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <DynamicHead />
      <Header />
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
      <PwaInstallBanner />
      <Footer />
    </div>
  );
}
