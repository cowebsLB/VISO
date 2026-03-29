import { Footer } from "./Footer";
import { Header } from "./Header";
import { DynamicHead } from "./DynamicHead";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DynamicHead />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
