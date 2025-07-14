import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, Store, Handshake, File, Plus, TrendingUp, Search, Edit, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as propriedades para calcular estatísticas
  const { data: allProperties = [], isLoading: propertiesLoading, error } = useQuery({
    queryKey: ["/api/properties"],
    enabled: !!user, // Só executar se usuário estiver logado
    // Usar o queryFn padrão que já inclui credentials
  });

  // Calcular estatísticas baseadas no status das propriedades
  const stats: Stats = {
    captacao: allProperties.filter((p: any) => 
      p.status === 'captacao' || p.currentStage === 1 || !p.status
    ).length,
    mercado: allProperties.filter((p: any) => 
      p.status === 'mercado' || p.currentStage === 3
    ).length,
    propostas: allProperties.filter((p: any) => 
      p.status === 'proposta' || p.currentStage === 4
    ).length,
    contratos: allProperties.filter((p: any) => 
      p.status === 'contrato' || p.status === 'instrumento' || p.status === 'concluido' || p.currentStage >= 5
    ).length,
  };

  // Calcular quantos estão em Due Diligence  
  const dueDiligenceCount = allProperties.filter((p: any) => 
    p.status === 'diligence' || p.currentStage === 2
  ).length;

  // Propriedades recentes (últimas 5)
  const recentTransactions = allProperties
    .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5)
    .map((prop: any) => ({
      ...prop,
      address: `${prop.street}, ${prop.number}${prop.complement ? ', ' + prop.complement : ''} - ${prop.neighborhood}, ${prop.city}${prop.state ? '/' + prop.state : ''}`
    }));

  // Função para navegar para seções específicas
  const navigateToSection = (section: string) => {
    switch (section) {
      case 'captacao':
        setLocation('/captacao');
        break;
      case 'due-diligence':
        setLocation('/due-diligence');
        break;
      case 'timeline':
        setLocation('/timeline');
        break;
      default:
        break;
    }
  };

  // Função para navegar para detalhes da propriedade
  const handleViewProperty = (property: Property) => {
    console.log('Navegando para propriedade:', property.id);
    setLocation(`/property/${property.id}`);
  };

  // Função para abrir modal de edição
  const handleEditProperty = (property: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProperty(property);
    setShowPropertyModal(true);
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setShowPropertyModal(false);
    setEditingProperty(null);
  };

  // Mutation para deletar propriedade
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      await apiRequest('DELETE', `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Propriedade excluída",
        description: "A propriedade foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a propriedade.",
        variant: "destructive",
      });
    },
  });

  // Função para deletar propriedade com confirmação
  const handleDeleteProperty = (property: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const propertyAddress = `${property.type} - ${property.street}, ${property.number}`;
    
    if (window.confirm(`Tem certeza que deseja excluir a propriedade:\n\n${propertyAddress}\n\nEsta ação não pode ser desfeita.`)) {
      deletePropertyMutation.mutate(property.id!);
    }
  };

  if (propertiesLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
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
      value: Math.max(stats.captacao, allProperties.length > 0 ? allProperties.length : 0),
      icon: Home,
      iconBgColor: "#15355e",
      progress: Math.min(stats.captacao * 10, 100),
      subtitle: `${stats.captacao} captações ativas`,
      onClick: () => navigateToSection('captacao')
    },
    {
      title: "Due Diligence",
      value: dueDiligenceCount,
      icon: Search,
      iconBgColor: "#22c55e",
      progress: Math.min(dueDiligenceCount * 8, 100),
      subtitle: "Verificações pendentes",
      onClick: () => navigateToSection('due-diligence')
    },
    {
      title: "Acompanhamento",
      value: allProperties.length,
      icon: TrendingUp,
      iconBgColor: "#ef4444",
      progress: Math.min(allProperties.length * 5, 100),
      subtitle: "Total de propriedades",
      onClick: () => navigateToSection('timeline')
    },
    {
      title: "Processos Ativos",
      value: stats.contratos,
      icon: File,
      iconBgColor: "#f59e0b",
      progress: Math.min(stats.contratos * 12, 100),
      subtitle: "Em andamento",
      onClick: () => navigateToSection('timeline')
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-1 text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Bem-vindo, {(user as any)?.firstName || "Usuário"} {(user as any)?.lastName || ""} | CRECI: {(user as any)?.creci || "Não informado"}
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
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">Transações Recentes</CardTitle>
                <CardDescription className="text-gray-600">
                  Últimas atualizações em suas propriedades
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowPropertyModal(true)}
                className="bg-[#15355e] hover:bg-[#15355e]/90 text-white rounded-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Captação
              </Button>
            </CardHeader>
            <CardContent>
              {!recentTransactions || recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900">Nenhum imóvel cadastrado</h3>
                  <p className="text-gray-600 mb-4">
                    Comece cadastrando seu primeiro imóvel para começar a usar o sistema.
                  </p>
                  <Button 
                    onClick={() => setShowPropertyModal(true)}
                    className="bg-[#15355e] hover:bg-[#15355e]/90 text-white rounded-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Imóvel
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 hover:space-y-2 transition-all duration-300">
                  {recentTransactions.map((property, index) => {
                    const formattedValue = typeof property.value === 'number' 
                      ? property.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(property.value) || 0);
                      
                    return (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 hover:shadow-md hover:border-green-200 hover:scale-[1.02] cursor-pointer transition-all duration-300 ease-in-out bg-white"
                        onClick={() => handleViewProperty(property)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                            <span className="text-green-600 font-medium">{property.sequenceNumber || '00001'}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {property.type.charAt(0).toUpperCase() + property.type.slice(1)} - {formattedValue}
                            </div>
                            <div className="text-sm text-gray-600">
                              {property.address}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              property.currentStage === 1 ? "bg-orange-100 text-orange-600 border-orange-200 rounded-full" :
                              property.currentStage === 2 ? "bg-blue-100 text-blue-600 border-blue-200 rounded-full" :
                              property.currentStage === 3 ? "bg-green-100 text-green-600 border-green-200 rounded-full" :
                              property.currentStage === 4 ? "bg-purple-100 text-purple-600 border-purple-200 rounded-full" :
                              property.currentStage === 5 ? "bg-indigo-100 text-indigo-600 border-indigo-200 rounded-full" :
                              property.currentStage === 6 ? "bg-teal-100 text-teal-600 border-teal-200 rounded-full" :
                              property.currentStage >= 7 ? "bg-green-100 text-green-600 border-green-200 rounded-full" : 
                              "bg-gray-100 text-gray-600 border-gray-200 rounded-full"
                            }
                          >
                            {property.currentStage === 1 ? "Captação" :
                             property.currentStage === 2 ? "Due Diligence" :
                             property.currentStage === 3 ? "Mercado" :
                             property.currentStage === 4 ? "Proposta" :
                             property.currentStage === 5 ? "Contrato" :
                             property.currentStage === 6 ? "Instrumento" :
                             property.currentStage >= 7 ? "Concluído" : "Pendente"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEditProperty(property, e)}
                            className="hover:bg-blue-50 hover:text-blue-600 rounded-full"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteProperty(property, e)}
                            className="hover:bg-red-50 hover:text-red-600 rounded-full"
                            disabled={deletePropertyMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-gray-900">Alertas e Pendências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50 rounded-xl">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Performance do mês:</strong><br />
                  {stats.captacao} novas captações
                </AlertDescription>
              </Alert>

              {dueDiligenceCount > 0 && (
                <Alert className="cursor-pointer hover:bg-blue-50 border-blue-200 bg-blue-50 rounded-xl" onClick={() => navigateToSection('due-diligence')}>
                  <File className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>{dueDiligenceCount} imóveis em Due Diligence</strong><br />
                    Verificar documentação pendente
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-gray-900">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-full border-gray-200 hover:bg-gray-50"
                onClick={() => setShowPropertyModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Captação
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-full border-gray-200 hover:bg-gray-50"
                onClick={() => navigateToSection('captacao')}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar Imóvel
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-full border-gray-200 hover:bg-gray-50"
              >
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