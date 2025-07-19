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
import Settings from "./pages/Settings";
import DueDiligence from "./pages/DueDiligence";
import RiskAnalysis from "./pages/RiskAnalysis";
import Timeline from "./pages/Timeline";
import PropertyDetails from "./pages/PropertyDetails";

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
    return <Login />;
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
    return <Layout><Dashboard /></Layout>;
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
      <Route path="/configuracoes">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

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

      <Route path="/analise-risco">
        <ProtectedRoute>
          <RiskAnalysis />
        </ProtectedRoute>
      </Route>

      <Route path="/timeline">
        <ProtectedRoute>
          <Timeline />
        </ProtectedRoute>
      </Route>

      <Route path="/property/:id">
        <ProtectedRoute>
          <PropertyDetails />
        </ProtectedRoute>
      </Route>


      {/* Rota padrão - redirecionando para dashboard com autenticação */}
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