import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { FileText, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import Ads from "./Ads";
import AffiliateBanner from "./AffiliateBanner";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Create Invoice", href: "/", icon: FileText },
    { name: "Financial Overview", href: "/finances", icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-6 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <a className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    location === item.href ? "text-primary" : "text-muted-foreground"
                  )}>
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

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