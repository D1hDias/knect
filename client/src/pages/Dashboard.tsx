import { useQuery } from "@tanstack/react-query";
import { Home, Store, Handshake, File, Plus, TrendingUp, Search, Edit } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/KPICard";
import { TimelineStep } from "@/components/TimelineStep";
import { PropertyModal } from "@/components/PropertyModal";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Garantir que crypto está disponível
if (typeof crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

// Interfaces corrigidas
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  creci?: string;
}

interface Stats {
  captacao: number;
  mercado: number;
  propostas: number;
  contratos: number;
}

interface Property {
  id: string;
  type: string;
  address?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  value: string | number;
  currentStage: number;
  createdAt: string;
  updatedAt: string;
  owners?: any[];
  registrationNumber?: string;
  municipalRegistration?: string;
}

export default function Dashboard() {
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentTransactions, isLoading: recentLoading } = useQuery<Property[]>({
    queryKey: ["/api/dashboard/recent"],
  });

  // Função para navegar para seções específicas
  const navigateToSection = (section: string) => {
    switch (section) {
      case 'captacao':
        setLocation('/captacao');
        break;
      case 'mercado':
        setLocation('/mercado');
        break;
      case 'propostas':
        setLocation('/propostas');
        break;
      case 'contratos':
        setLocation('/contratos');
        break;
      default:
        break;
    }
  };

  // Função para abrir modal de edição
  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowPropertyModal(true);
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setShowPropertyModal(false);
    setEditingProperty(null);
  };

  if (statsLoading || recentLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const kpiData = [
    {
      title: "Imóveis em Captação",
      value: stats?.captacao || 0,
      icon: Home,
      iconBgColor: "#001f3f",
      progress: Math.min((stats?.captacao || 0) * 10, 100),
      subtitle: `${stats?.captacao || 0} captações ativas`,
      onClick: () => navigateToSection('captacao')
    },
    {
      title: "Ativos no Mercado",
      value: stats?.mercado || 0,
      icon: Store,
      iconBgColor: "hsl(159, 69%, 38%)",
      progress: Math.min((stats?.mercado || 0) * 8, 100),
      subtitle: "Prontos para venda",
      onClick: () => navigateToSection('mercado')
    },
    {
      title: "Propostas Pendentes",
      value: stats?.propostas || 0,
      icon: Handshake,
      iconBgColor: "hsl(32, 81%, 46%)",
      progress: Math.min((stats?.propostas || 0) * 15, 100),
      subtitle: "Aguardando negociação",
      onClick: () => navigateToSection('propostas')
    },
    {
      title: "Contratos Ativos",
      value: stats?.contratos || 0,
      icon: File,
      iconBgColor: "hsl(0, 72%, 51%)",
      progress: Math.min((stats?.contratos || 0) * 12, 100),
      subtitle: "Em andamento",
      onClick: () => navigateToSection('contratos')
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Bem-vindo, {(user as any)?.firstName || "Usuário"} {(user as any)?.lastName || ""}
          </h1>
          <p className="text-muted-foreground">
            CRECI: {(user as any)?.creci || "Não informado"} | Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* KPI Cards - Agora clicáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={kpi.onClick}
          >
            <KPICard {...kpi} />
          </div>
        ))}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>
                  Últimas atualizações em suas propriedades
                </CardDescription>
              </div>
              <Button onClick={() => setShowPropertyModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Captação
              </Button>
            </CardHeader>
            <CardContent>
              {!recentTransactions || recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum imóvel cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece cadastrando seu primeiro imóvel para começar a usar o sistema.
                  </p>
                  <Button onClick={() => setShowPropertyModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Imóvel
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((property, index) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleEditProperty(property)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <span className="text-primary font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {property.type.charAt(0).toUpperCase() + property.type.slice(1)} - R$ {Number(property.value).toLocaleString('pt-BR')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {property.address}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            property.currentStage >= 5 ? "default" :
                            property.currentStage >= 3 ? "secondary" : "outline"
                          }
                        >
                          {property.currentStage === 1 ? "Captação" :
                           property.currentStage === 2 ? "Due Diligence" :
                           property.currentStage === 3 ? "Mercado" :
                           property.currentStage === 4 ? "Proposta" :
                           property.currentStage >= 5 ? "Contrato" : "Pendente"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProperty(property);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas e Pendências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Performance do mês:</strong><br />
                  {stats?.captacao || 0} novas captações
                </AlertDescription>
              </Alert>
              
              {(stats?.propostas || 0) > 0 && (
                <Alert className="cursor-pointer hover:bg-accent/50" onClick={() => navigateToSection('propostas')}>
                  <Handshake className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats?.propostas} propostas pendentes</strong><br />
                    Revisar negociações em andamento
                  </AlertDescription>
                </Alert>
              )}

              {(stats?.contratos || 0) > 0 && (
                <Alert className="cursor-pointer hover:bg-accent/50" onClick={() => navigateToSection('contratos')}>
                  <File className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats?.contratos} contratos ativos</strong><br />
                    Acompanhar prazos e documentação
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowPropertyModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Captação
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigateToSection('captacao')}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar Imóvel
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <File className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PropertyModal 
        open={showPropertyModal} 
        onOpenChange={handleCloseModal}
        property={editingProperty}
      />
    </div>
  );
}