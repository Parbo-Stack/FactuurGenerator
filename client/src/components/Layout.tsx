import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { FileText, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: FileText },
    { name: "Financial Overview", href: "/dashboard", icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <nav className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/">
                <a className="flex items-center gap-2 font-bold text-lg text-primary">
                  FacturHero
                </a>
              </Link>

              <div className="hidden md:flex space-x-6">
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
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
        <nav className="flex justify-around p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex flex-col items-center gap-1 text-xs font-medium transition-colors hover:text-primary",
                  location === item.href ? "text-primary" : "text-muted-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto p-4 pb-20 md:pb-4">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 FacturHero. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}