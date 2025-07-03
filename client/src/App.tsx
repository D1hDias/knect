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
import PropertiesMarket from "./pages/MarketListing";
import Proposals from "./pages/Proposals";
import Contracts from "./pages/Contracts";
import DefinitiveInstrument from "./pages/FinalInstrument";
import Timeline from "./pages/Timeline";
import PropertyDetails from "./pages/PropertyDetails";
import SimuladorValorRegistro from "./pages/SimuladorValorRegistro";
import SimuladorFinanciamento from "./pages/SimuladorFinanciamento";
import SimuladorMetroQuadrado from "./pages/SimuladorMetroQuadrado";
import SimuladorValorImovel from "./pages/SimuladorValorImovel";

// Components
import Layout from "./components/Layout.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Teste: removendo autenticação - vai direto para o layout
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

      <Route path="/property/:id">
        <ProtectedRoute>
          <PropertyDetails />
        </ProtectedRoute>
      </Route>

      {/* Rotas dos Simuladores */}
      <Route path="/simulador-valor-registro">
        <ProtectedRoute>
          <SimuladorValorRegistro />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-financiamento">
        <ProtectedRoute>
          <SimuladorFinanciamento />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-metro-quadrado">
        <ProtectedRoute>
          <SimuladorMetroQuadrado />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-valor-imovel">
        <ProtectedRoute>
          <SimuladorValorImovel />
        </ProtectedRoute>
      </Route>

      {/* Rota padrão - redirecionando direto para dashboard */}
      <Route path="/">
        <Layout>
          <Dashboard />
        </Layout>
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