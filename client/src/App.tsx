import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import { ThemeProvider } from "@/components/ThemeProvider";
import PublicLayout from "@/components/PublicLayout";
import FinancialOverview from "@/pages/financial-overview";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <PublicLayout>
          <LandingPage />
        </PublicLayout>
      )} />
      <Route path="/dashboard" component={() => (
        <PublicLayout>
          <FinancialOverview />
        </PublicLayout>
      )} />
      <Route component={() => (
        <PublicLayout>
          <NotFound />
        </PublicLayout>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;