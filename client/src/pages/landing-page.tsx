import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Calculator, Globe } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative isolate">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Professional Invoices Made Simple
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Create, manage, and send professional invoices in minutes. Perfect for freelancers and small businesses.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group relative rounded-xl border p-6 hover:border-primary/50 transition-colors">
            <div className="mt-3">
              <FileText className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Professional Templates</h3>
              <p className="mt-2 text-muted-foreground">
                Choose from beautifully designed invoice templates that match your brand identity.
              </p>
            </div>
          </div>

          <div className="group relative rounded-xl border p-6 hover:border-primary/50 transition-colors">
            <div className="mt-3">
              <Calculator className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Automatic Calculations</h3>
              <p className="mt-2 text-muted-foreground">
                Let us handle VAT calculations and totals while you focus on your business.
              </p>
            </div>
          </div>

          <div className="group relative rounded-xl border p-6 hover:border-primary/50 transition-colors">
            <div className="mt-3">
              <Globe className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Multi-Language Support</h3>
              <p className="mt-2 text-muted-foreground">
                Create invoices in multiple languages to serve your international clients.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col items-center">
          <p className="text-sm text-muted-foreground">
            © 2025 FacturHero. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
