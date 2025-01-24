import { type ReactNode } from "react";
import Ads from "./Ads";
import AffiliateBanner from "./AffiliateBanner";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main content */}
          <main className="lg:col-span-8 xl:col-span-9">
            {children}
          </main>
          
          {/* Sidebar with ads and affiliate content */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
            <Ads
              className="sticky top-4"
              slot="7259669927"
            />
            <AffiliateBanner className="sticky top-[calc(300px+1rem)]" />
          </aside>
        </div>
      </div>
    </div>
  );
}
