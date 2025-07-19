import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DueDiligenceModal } from "@/components/DueDiligenceModal";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  X, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Eye,
  Bot,
  Users,
  Send,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

interface Property {
  id: string;
  sequenceNumber: string;
  type: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  value: string | number;
  currentStage: number;
  status: string;
  owners?: Array<{
    fullName: string;
    phone: string;
    email?: string;
    cpf?: string;
  }>;
  diligenceProgress: number;
  diligenceStatus: 'pending' | 'in_progress' | 'completed' | 'with_issues';
  createdAt: string;
}

// Dados serão carregados da API

export default function DueDiligence() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: [] as string[],
    progress: "all"
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const propertiesPerPage = 10;

  // Carregar propriedades da API
  const { data: allProperties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      return response.json();
    },
  });

  // Filtrar apenas propriedades para Due Diligence
  const properties = allProperties
    .filter((prop: any) => prop.status === 'diligence' || prop.currentStage === 2)
    .map((prop: any, index: number) => {
      // Simular progresso baseado em localStorage ou outros dados
      const diligenceData = localStorage.getItem(`diligence_${prop.id}`);
      let diligenceStatus: 'pending' | 'in_progress' | 'completed' | 'with_issues' = 'pending';
      let diligenceProgress = 0;
      
      if (diligenceData) {
        const data = JSON.parse(diligenceData);
        const allItems = [
          ...(data.propertyItems || []),
          ...(data.personalItems || [])
        ];
        const totalItems = allItems.length;
        const completedItems = allItems.filter((item: any) => item.status === 'completed').length;
        const requestedItems = allItems.filter((item: any) => item.status === 'requested' || item.status === 'completed').length;
        
        if (totalItems > 0) {
          diligenceProgress = Math.round((completedItems / totalItems) * 100);
          
          if (completedItems === totalItems) {
            diligenceStatus = 'completed';
          } else if (requestedItems > 0) {
            diligenceStatus = 'in_progress';
          }
        }
      }

      return {
        id: prop.id.toString(),
        sequenceNumber: prop.sequenceNumber || '00001',
        type: prop.type,
        street: prop.street,
        number: prop.number,
        neighborhood: prop.neighborhood,
        city: prop.city,
        value: (() => {
          const numValue = typeof prop.value === 'number' ? prop.value : parseFloat(prop.value);
          if (isNaN(numValue)) return prop.value;
          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
        })(),
        currentStage: prop.currentStage,
        status: prop.status,
        owners: prop.owners || [],
        diligenceProgress,
        diligenceStatus,
        createdAt: prop.createdAt
      };
    });

  // Calculando estatísticas
  const stats = {
    completed: properties.filter(p => p.diligenceStatus === 'completed').length,
    inProgress: properties.filter(p => p.diligenceStatus === 'in_progress').length,
    pending: properties.filter(p => p.diligenceStatus === 'pending').length,
    total: properties.length
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          badge: <Badge className="bg-green-500 text-white">Concluída</Badge>,
          box: {
            title: 'Due Diligence Concluída',
            message: 'Todos os documentos foram coletados e validados',
            icon: CheckCircle
          }
        };
      case 'in_progress':
        return { 
          badge: <Badge className="bg-blue-500 text-white">Em Andamento</Badge>,
          box: {
            title: 'Due Diligence em andamento',
            message: 'Documentos estão sendo coletados',
            icon: Clock
          }
        };
      case 'pending':
        return { 
          badge: <Badge variant="outline" className="text-orange-600 border-orange-600">Aguardando Início</Badge>,
          box: {
            title: 'Aguardando Início',
            message: 'Due Diligence ainda não foi iniciada para este imóvel',
            icon: AlertTriangle
          }
        };
      case 'with_issues':
        return { 
          badge: <Badge variant="destructive">Com Pendências</Badge>,
          box: {
            title: 'Pendências Encontradas',
            message: 'Foram encontrados problemas que precisam de atenção',
            icon: AlertTriangle
          }
        };
      default:
        return { 
          badge: <Badge variant="outline">Desconhecido</Badge>,
          box: {
            title: 'Status Indefinido',
            message: 'Status não definido',
            icon: AlertTriangle
          }
        };
    }
  };

  const handleStartDiligence = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setIsModalOpen(true);
    }
  };

  // Função para navegar para detalhes da propriedade
  const handleViewProperty = (property: Property) => {
    console.log('Navegando para propriedade:', property.id);
    setLocation(`/property/${property.id}`);
  };

  const handleConfirmStartDiligence = () => {
    // TODO: Implementar atualização via API se necessário
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handleAdvanceStage = async (property: Property, newStage: number) => {
    try {
      const stageStatusMap: { [key: number]: string } = {
        1: 'captacao',
        2: 'diligence',
        3: 'concluido'
      };

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentStage: newStage,
          status: stageStatusMap[newStage]
        }),
      });

      if (response.ok) {
        // Recarregar a página para mostrar as mudanças
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro ao alterar estágio:', error);
    }
  };

  const getStageButtons = (property: Property) => {
    const currentStage = property.currentStage || 2; // Due Diligence é stage 2
    const buttons = [];

    // Botão de retroceder para Captação (se estiver em Due Diligence)
    if (currentStage > 1) {
      buttons.push(
        <Button
          key="prev"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleAdvanceStage(property, currentStage - 1);
          }}
          className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retornar para Captação
        </Button>
      );
    }

    // Botão de avançar para Concluído (se Due Diligence estiver completa)
    if (currentStage === 2 && property.diligenceStatus === 'completed') {
      buttons.push(
        <Button
          key="next"
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleAdvanceStage(property, 3);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <ArrowRight className="h-4 w-4 mr-1" />
          Marcar como Concluído
        </Button>
      );
    }

    return buttons;
  };

  const filteredProperties = properties.filter((property: Property) => {
    const matchesSearch = searchTerm === "" || 
      property.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.sequenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owners?.some(owner => 
        owner.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatusFilter = filters.status.length === 0 || 
      filters.status.includes(property.diligenceStatus || 'pending');

    return matchesSearch && matchesStatusFilter;
  });

  // Paginação
  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  const clearFilters = () => {
    setFilters({ status: [], progress: "all" });
  };

  const hasActiveFilters = filters.status.length > 0 || filters.progress !== "all";

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base text-gray-600">
              Emissão de certidões e pré-análise jurídica com IA
            </p>
          </div>
          <Button 
            className="bg-[#15355e] hover:bg-[#15355e]/90 text-white rounded-full shadow-sm"
            onClick={() => setLocation('/analise-risco')}
          >
            <Bot className="h-4 w-4 mr-2" />
            Análise de Risco
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#15355e] rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#22c55e] rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#ef4444] rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f59e0b] rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por número, endereço ou proprietário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                          {filters.status.length + (filters.progress !== "all" ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80">
                    <div className="p-4 space-y-4">
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                          <X className="h-4 w-4 mr-2" />
                          Limpar Filtros
                        </Button>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties List */}
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Imóveis em Due Diligence ({filteredProperties.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : currentProperties.length > 0 ? (
              <div className="space-y-6 hover:space-y-4 transition-all duration-300 p-6">
                {currentProperties.map((property: Property) => {
                  const statusInfo = getStatusInfo(property.diligenceStatus);
                  const StatusIcon = statusInfo.box.icon;
                  
                  return (
                    <Card 
                      key={property.id} 
                      className="bg-white rounded-xl border-0 shadow-sm hover:bg-gray-50 hover:shadow-md hover:border-green-200 hover:scale-[1.02] cursor-pointer transition-all duration-300 ease-in-out"
                      onClick={() => handleViewProperty(property)}
                    >
                      <CardContent className="p-6">
                        
                        {/* Property Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                            <span className="text-green-600 font-medium">{property.sequenceNumber || '00001'}</span>
                          </div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {property.type} - {property.street}, {property.number}
                              </h3>
                              {statusInfo.badge}
                            </div>
                            <p className="text-sm text-gray-500">
                              {property.neighborhood} • {property.city}
                            </p>
                            <p className="text-sm font-medium text-green-600">
                              Proprietário: {property.owners?.[0]?.fullName || 'Não informado'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{property.value}</p>
                          </div>
                        </div>

                        {/* Progress Bar - só aparece se tiver progresso */}
                        {property.diligenceStatus !== 'pending' && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">
                                {property.diligenceStatus === 'completed' 
                                  ? 'Documentação Concluída' 
                                  : 'Progresso da Validação'
                                }
                              </span>
                              <span className="font-medium">{property.diligenceProgress}% validado</span>
                            </div>
                            <Progress 
                              value={property.diligenceProgress} 
                              className={`h-2 ${property.diligenceStatus === 'completed' ? 'bg-green-100' : ''}`}
                            />
                          </div>
                        )}

                        {/* Status Box */}
                        <div className={
                          property.diligenceStatus === 'completed' ? 'bg-green-50 border border-green-200 rounded-lg p-4 flex-1' :
                          property.diligenceStatus === 'in_progress' ? 'bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1' :
                          property.diligenceStatus === 'pending' ? 'bg-orange-50 border border-orange-200 rounded-lg p-4 flex-1' :
                          property.diligenceStatus === 'with_issues' ? 'bg-red-50 border border-red-200 rounded-lg p-4 flex-1' :
                          'bg-gray-50 border border-gray-200 rounded-lg p-4 flex-1'
                        }>
                          <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className={
                              property.diligenceStatus === 'completed' ? 'h-5 w-5 text-green-600' :
                              property.diligenceStatus === 'in_progress' ? 'h-5 w-5 text-blue-600' :
                              property.diligenceStatus === 'pending' ? 'h-5 w-5 text-orange-600' :
                              property.diligenceStatus === 'with_issues' ? 'h-5 w-5 text-red-600' :
                              'h-5 w-5 text-gray-600'
                            } />
                            <span className={
                              property.diligenceStatus === 'completed' ? 'font-medium text-green-800' :
                              property.diligenceStatus === 'in_progress' ? 'font-medium text-blue-800' :
                              property.diligenceStatus === 'pending' ? 'font-medium text-orange-800' :
                              property.diligenceStatus === 'with_issues' ? 'font-medium text-red-800' :
                              'font-medium text-gray-800'
                            }>
                              {statusInfo.box.title}
                            </span>
                          </div>
                          <p className={
                            property.diligenceStatus === 'completed' ? 'text-sm text-green-700 mb-3' :
                            property.diligenceStatus === 'in_progress' ? 'text-sm text-blue-700 mb-3' :
                            property.diligenceStatus === 'pending' ? 'text-sm text-orange-700 mb-3' :
                            property.diligenceStatus === 'with_issues' ? 'text-sm text-red-700 mb-3' :
                            'text-sm text-gray-700 mb-3'
                          }>
                            {statusInfo.box.message}
                          </p>
                          
                          {/* Action Button */}
                          {property.diligenceStatus === 'pending' && (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDiligence(property.id);
                              }}
                              className="bg-[#15355e] hover:bg-[#15355e]/90 text-white rounded-full"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Iniciar Due Diligence
                            </Button>
                          )}
                          
                          {property.diligenceStatus === 'in_progress' && (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDiligence(property.id);
                              }}
                              className="bg-[#22c55e] hover:bg-[#22c55e]/90 text-white rounded-full"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Continuar Due Diligence
                            </Button>
                          )}
                          
                          {property.diligenceStatus === 'completed' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-full border-gray-200 hover:bg-gray-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Ver Relatório
                              </Button>
                            </div>
                          )}

                          {/* Botões de Navegação entre Etapas */}
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                            {getStageButtons(property)}
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum imóvel encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProperties.length)} de {filteredProperties.length} imóveis
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Due Diligence Modal */}
        {selectedProperty && (
          <DueDiligenceModal 
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            property={{
              id: selectedProperty.id,
              sequenceNumber: selectedProperty.sequenceNumber,
              street: selectedProperty.street,
              number: selectedProperty.number,
              type: selectedProperty.type,
              owners: selectedProperty.owners
            }}
          />
        )}

      </div>
    </div>
  );
}