import { ReactNode } from "react";
import Ads from "./Ads";
import AffiliateBanner from "./AffiliateBanner";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top banner ad */}
      <Ads 
        className="w-full py-2 bg-background border-b" 
        slot="1234567890" // Replace with your actual AdSense slot ID
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <main className="lg:col-span-3">
            {children}
          </main>
          
          {/* Sidebar with affiliate banner */}
          <aside className="space-y-6">
            <AffiliateBanner />
            <Ads 
              className="sticky top-6" 
              slot="0987654321" // Replace with your actual AdSense slot ID
            />
          </aside>
        </div>
      </div>
      
      {/* Bottom banner ad */}
      <div className="mt-8">
        <Ads 
          className="w-full py-2 bg-background border-t" 
          slot="5678901234" // Replace with your actual AdSense slot ID
        />
      </div>
    </div>
  );
}
