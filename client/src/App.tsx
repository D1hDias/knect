import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import PropertyCapture from "@/pages/PropertyCapture";
import DueDiligence from "@/pages/DueDiligence";
import MarketListing from "@/pages/MarketListing";
import Proposals from "@/pages/Proposals";
import Contracts from "@/pages/Contracts";
import FinalInstrument from "@/pages/FinalInstrument";
import Timeline from "@/pages/Timeline";
import Settings from "@/pages/Settings";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-60 ml-0 transition-all duration-300">
        <TopHeader />
        <main className="min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  const isAuthenticated = true; // Temporário
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </>
      ) : (
        <>
          <Route path="/">
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </Route>
          <Route path="/captacao">
            <AuthenticatedLayout>
              <PropertyCapture />
            </AuthenticatedLayout>
          </Route>
          <Route path="/diligence">
            <AuthenticatedLayout>
              <DueDiligence />
            </AuthenticatedLayout>
          </Route>
          <Route path="/mercado">
            <AuthenticatedLayout>
              <MarketListing />
            </AuthenticatedLayout>
          </Route>
          <Route path="/propostas">
            <AuthenticatedLayout>
              <Proposals />
            </AuthenticatedLayout>
          </Route>
          <Route path="/contratos">
            <AuthenticatedLayout>
              <Contracts />
            </AuthenticatedLayout>
          </Route>
          <Route path="/instrumento">
            <AuthenticatedLayout>
              <FinalInstrument />
            </AuthenticatedLayout>
          </Route>
          <Route path="/timeline">
            <AuthenticatedLayout>
              <Timeline />
            </AuthenticatedLayout>
          </Route>
          <Route path="/configuracoes">
            <AuthenticatedLayout>
              <Settings />
            </AuthenticatedLayout>
          </Route>
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
