import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <nav className="flex h-16 items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 font-bold text-lg text-primary">
                FacturHero
              </a>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {location === "/" ? (
                <Link href="/login">
                  <Button>Sign In</Button>
                </Link>
              ) : (
                <Link href="/">
                  <Button variant="ghost">Back to Home</Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {children}

      {/* Footer */}
      <footer className="mt-auto border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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