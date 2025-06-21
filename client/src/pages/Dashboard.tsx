import { useQuery } from "@tanstack/react-query";
import { Home, Store, Handshake, File, Plus, TrendingUp, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { TimelineStep } from "@/components/TimelineStep";
import { PropertyModal } from "@/components/PropertyModal";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentTransactions, isLoading: recentLoading } = useQuery({
    queryKey: ["/api/dashboard/recent"],
  });

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
      iconBgColor: "hsl(207, 90%, 54%)",
      progress: Math.min((stats?.captacao || 0) * 10, 100),
      subtitle: `${stats?.captacao || 0} captações ativas`
    },
    {
      title: "Ativos no Mercado",
      value: stats?.mercado || 0,
      icon: Store,
      iconBgColor: "hsl(159, 69%, 38%)",
      progress: Math.min((stats?.mercado || 0) * 8, 100),
      subtitle: "Prontos para venda"
    },
    {
      title: "Propostas Pendentes",
      value: stats?.propostas || 0,
      icon: Handshake,
      iconBgColor: "hsl(32, 81%, 46%)",
      progress: Math.min((stats?.propostas || 0) * 15, 100),
      subtitle: "Aguardando negociação"
    },
    {
      title: "Contratos Ativos",
      value: stats?.contratos || 0,
      icon: File,
      iconBgColor: "hsl(0, 72%, 51%)",
      progress: Math.min((stats?.contratos || 0) * 12, 100),
      subtitle: "Em andamento"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Bem-vindo, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-muted-foreground">
            CRECI: {user?.creci || "Não informado"} | Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
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
                  {recentTransactions.map((property: any, index: number) => (
                    <TimelineStep
                      key={property.id}
                      step={property.currentStage}
                      title={`${property.type.charAt(0).toUpperCase() + property.type.slice(1)} - R$ ${Number(property.value).toLocaleString('pt-BR')}`}
                      description={property.address}
                      status={
                        property.currentStage >= 5 ? "completed" :
                        property.currentStage >= 3 ? "active" : "pending"
                      }
                      badge={
                        property.currentStage === 1 ? "Captação" :
                        property.currentStage === 2 ? "Due Diligence" :
                        property.currentStage === 3 ? "Mercado" :
                        property.currentStage === 4 ? "Proposta" :
                        property.currentStage >= 5 ? "Contrato" : "Pendente"
                      }
                      badgeVariant={
                        property.currentStage >= 5 ? "default" :
                        property.currentStage >= 3 ? "secondary" : "outline"
                      }
                    />
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
                <Alert>
                  <Handshake className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats?.propostas} propostas pendentes</strong><br />
                    Revisar negociações em andamento
                  </AlertDescription>
                </Alert>
              )}

              {(stats?.contratos || 0) > 0 && (
                <Alert>
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
              <Button variant="outline" className="w-full justify-start">
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
        onOpenChange={setShowPropertyModal} 
      />
    </div>
  );
}
