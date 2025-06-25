import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PropertyCapture from "./pages/PropertyCapture";
import DueDiligence from "./pages/DueDiligence";
import PropertiesMarket from "./pages/MarketListing";
import Proposals from "./pages/Proposals";
import Contracts from "./pages/Contracts";
import DefinitiveInstrument from "./pages/FinalInstrument";
import Timeline from "./pages/Timeline";

// Components
import Layout from "./components/Layout.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    window.location.href = "/dashboard";
    return null;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      
      <Route path="/register">
        <PublicRoute>
          <Register />
        </PublicRoute>
      </Route>

      {/* Rotas protegidas */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/captacao">
        <ProtectedRoute>
          <PropertyCapture />
        </ProtectedRoute>
      </Route>

      <Route path="/due-diligence">
        <ProtectedRoute>
          <DueDiligence />
        </ProtectedRoute>
      </Route>

      <Route path="/mercado">
        <ProtectedRoute>
          <PropertiesMarket />
        </ProtectedRoute>
      </Route>

      <Route path="/propostas">
        <ProtectedRoute>
          <Proposals />
        </ProtectedRoute>
      </Route>

      <Route path="/contratos">
        <ProtectedRoute>
          <Contracts />
        </ProtectedRoute>
      </Route>

      <Route path="/instrumento">
        <ProtectedRoute>
          <DefinitiveInstrument />
        </ProtectedRoute>
      </Route>

      <Route path="/timeline">
        <ProtectedRoute>
          <Timeline />
        </ProtectedRoute>
      </Route>

      {/* Rota padrão - redireciona para dashboard se logado, senão para login */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;