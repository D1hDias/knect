import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search, Filter, CheckCircle, AlertTriangle, Calendar, User, FileText, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  }>;
  createdAt: string;
  updatedAt?: string;
}

export default function Timeline() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [expandedStages, setExpandedStages] = useState<{[key: string]: boolean}>({});
  const [expandedTimelines, setExpandedTimelines] = useState<{[key: string]: boolean}>({});

  // Function to toggle stage expansion
  const toggleStageExpansion = (timelineId: string, stageId: number) => {
    const key = `${timelineId}-${stageId}`;
    setExpandedStages(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to toggle timeline expansion
  const toggleTimelineExpansion = (timelineId: string) => {
    setExpandedTimelines(prev => ({
      ...prev,
      [timelineId]: !prev[timelineId]
    }));
  };

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  // Function to get Due Diligence status from localStorage
  const getDueDiligenceStatus = (propertyId: string) => {
    const diligenceData = localStorage.getItem(`diligence_${propertyId}`);
    if (!diligenceData) return 'pending';
    
    try {
      const data = JSON.parse(diligenceData);
      const allItems = [
        ...(data.propertyItems || []),
        ...(data.personalItems || [])
      ];
      
      if (allItems.length === 0) return 'pending';
      
      const completedItems = allItems.filter((item: any) => item.status === 'completed');
      const requestedItems = allItems.filter((item: any) => item.status === 'requested' || item.status === 'completed');
      
      if (completedItems.length === allItems.length) return 'completed';
      if (requestedItems.length > 0) return 'in_progress';
      return 'pending';
    } catch {
      return 'pending';
    }
  };

  // Transform properties into timeline data
  const timelines = properties.map((property: Property) => {
    const dueDiligenceStatus = getDueDiligenceStatus(property.id);
    const currentStage = property.currentStage || 1;
    
    // Calculate real progress based on stage completion
    let actualProgress = 0;
    if (currentStage >= 1) {
      actualProgress = 50; // Captação completed = 50%
    }
    if (currentStage >= 2 && dueDiligenceStatus === 'completed') {
      actualProgress = 100; // Due Diligence completed = 100%
    } else if (currentStage >= 2 && dueDiligenceStatus === 'in_progress') {
      actualProgress = 75; // Due Diligence in progress = 75%
    }
    
    // Create 2-stage timeline
    const stages = [
      {
        stage: 1,
        title: "Captação do Imóvel",
        status: currentStage >= 1 ? "completed" : "pending",
        startDate: property.createdAt,
        completedDate: currentStage >= 1 ? property.createdAt : null,
        responsible: property.owners?.[0]?.fullName || "Sistema",
        description: "Cadastro e documentação inicial do imóvel",
        alerts: []
      },
      {
        stage: 2,
        title: "Due Diligence",
        status: currentStage >= 2 ? 
          (dueDiligenceStatus === 'completed' ? 'completed' : 
           dueDiligenceStatus === 'in_progress' ? 'in_progress' : 'pending') : 'pending',
        startDate: currentStage >= 2 ? property.updatedAt : null,
        completedDate: dueDiligenceStatus === 'completed' ? property.updatedAt : null,
        responsible: "Sistema Automático",
        description: "Verificação de documentos e análise jurídica",
        alerts: dueDiligenceStatus === 'in_progress' ? 
          [{ type: "info", message: "Documentos em validação" }] : []
      }
    ];

    return {
      id: property.id,
      sequenceNumber: property.sequenceNumber || '00001',
      property: `${property.type} - ${property.street}, ${property.number}`,
      neighborhood: property.neighborhood,
      city: property.city,
      value: property.value,
      owners: property.owners,
      totalStages: 2,
      currentStage: Math.min(currentStage, 2),
      actualProgress, // Real progress percentage
      stages
    };
  });

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "pending":
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-500 bg-green-50";
      case "in_progress":
        return "border-blue-500 bg-blue-50";
      case "pending":
        return "border-gray-300 bg-gray-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "danger":
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case "warning":
        return <Badge variant="secondary" className="text-xs">Atenção</Badge>;
      case "info":
        return <Badge variant="outline" className="text-xs">Info</Badge>;
      default:
        return null;
    }
  };

  const filteredTimelines = timelines.filter((timeline: any) => {
    const matchesSearch = timeline.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timeline.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timeline.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = selectedProperty === "all" || timeline.property === selectedProperty;
    return matchesSearch && matchesProperty;
  });

  const overallStats = {
    totalProperties: timelines.length,
    completed: timelines.filter(t => t.currentStage === 2 && 
      t.stages[1].status === 'completed').length,
    inProgress: timelines.filter(t => t.currentStage === 2 && 
      t.stages[1].status === 'in_progress').length,
    starting: timelines.filter(t => t.currentStage === 1).length,
    alerts: timelines.reduce((acc, timeline) => {
      return acc + timeline.stages.reduce((stageAcc: number, stage: any) => 
        stageAcc + stage.alerts.length, 0);
    }, 0)
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">
            Acompanhe o progresso de todos os imóveis através das etapas de Captação e Due Diligence
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#15355e] rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalProperties}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#f59e0b] rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Em Captação</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.starting}</p>
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
                <p className="text-sm font-medium text-gray-600">Em Due Diligence</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.inProgress}</p>
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
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por imóvel, endereço ou bairro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por imóvel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os imóveis</SelectItem>
                {timelines.map((timeline) => (
                  <SelectItem key={timeline.id} value={timeline.property}>
                    {timeline.sequenceNumber} - {timeline.property}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="rounded-full border-gray-200 hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Cards */}
      <div className="space-y-6">
        {filteredTimelines.length === 0 ? (
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhum imóvel encontrado</h3>
                <p className="text-gray-600">
                  {searchTerm ? "Tente ajustar sua busca." : "Imóveis aparecerão aqui conforme são cadastrados no sistema."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTimelines.map((timeline: any) => (
            <Card key={timeline.id} className="bg-white rounded-xl shadow-sm border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-green-600 font-medium flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                        {timeline.sequenceNumber}
                      </span>
                      <CardTitle className="text-lg">{timeline.property}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600">
                      {timeline.neighborhood} • {timeline.city}
                    </p>
                    <p className="text-sm text-gray-600">
                      Proprietário: {timeline.owners?.[0]?.fullName || 'Não informado'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Etapa {timeline.currentStage} de {timeline.totalStages} - 
                      {timeline.actualProgress}% concluído
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={timeline.actualProgress} 
                      className="w-32 h-2" 
                    />
                    <span className="text-sm font-medium">
                      {timeline.actualProgress}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Timeline Stages Accordion Header */}
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200 mb-4"
                  onClick={() => toggleTimelineExpansion(timeline.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-700">Etapas do Processo</div>
                    <Badge variant="outline" className="text-xs">
                      {timeline.stages.filter((s: any) => s.status === 'completed').length} de {timeline.stages.length} concluídas
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {expandedTimelines[timeline.id] ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </span>
                    {expandedTimelines[timeline.id] ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Collapsible Timeline Stages */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedTimelines[timeline.id] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="space-y-4">
                  {timeline.stages.map((stage: any, index: number) => {
                    const stageKey = `${timeline.id}-${stage.stage}`;
                    const isExpanded = expandedStages[stageKey] || false;
                    
                    return (
                      <div key={stage.stage} className="relative">
                        {/* Timeline connector */}
                        {index < timeline.stages.length - 1 && (
                          <div className="absolute left-6 top-12 w-px h-16 bg-gray-200"></div>
                        )}
                        
                        <div className={cn(
                          "rounded-lg border-2 transition-all duration-300 ease-in-out overflow-hidden",
                          getStageColor(stage.status)
                        )}>
                          {/* Stage Header - Always visible and clickable */}
                          <div 
                            className="flex items-start gap-4 p-4 cursor-pointer hover:bg-opacity-80 transition-all duration-200"
                            onClick={() => toggleStageExpansion(timeline.id, stage.stage)}
                          >
                            <div className="shrink-0 w-12 h-12 rounded-full bg-white border-2 border-current flex items-center justify-center">
                              {getStageIcon(stage.status)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium flex items-center gap-2">
                                    {stage.stage}. {stage.title}
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    )}
                                  </h4>
                                  <p className="text-sm text-gray-600">{stage.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {stage.alerts.map((alert: any, alertIndex: number) => (
                                    <div key={alertIndex}>
                                      {getAlertBadge(alert.type)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Content */}
                          <div className={cn(
                            "transition-all duration-300 ease-in-out",
                            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                          )}>
                            <div className="px-4 pb-4 ml-16">
                              <div className="border-t border-gray-200 pt-3">
                                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>Responsável: {stage.responsible}</span>
                                  </div>
                                  
                                  {stage.startDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        Iniciado: {new Date(stage.startDate).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {stage.completedDate && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      <span>
                                        Concluído: {new Date(stage.completedDate).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {stage.alerts.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    <h5 className="text-sm font-medium text-gray-700">Alertas:</h5>
                                    {stage.alerts.map((alert: any, alertIndex: number) => (
                                      <div key={alertIndex} className="text-sm">
                                        <div className={cn(
                                          "p-3 rounded-lg border-l-4",
                                          alert.type === "info" && "bg-blue-50 text-blue-800 border-blue-400",
                                          alert.type === "warning" && "bg-yellow-50 text-yellow-800 border-yellow-400",
                                          alert.type === "danger" && "bg-red-50 text-red-800 border-red-400"
                                        )}>
                                          <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="font-medium">{alert.message}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Additional stage-specific information */}
                                {stage.stage === 1 && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Informações da Captação:</h5>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      <p>✓ Imóvel cadastrado no sistema</p>
                                      <p>✓ Dados básicos coletados</p>
                                      <p>✓ Proprietário identificado</p>
                                    </div>
                                  </div>
                                )}

                                {stage.stage === 2 && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Status do Due Diligence:</h5>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      {stage.status === 'completed' && (
                                        <>
                                          <p>✓ Todos os documentos validados</p>
                                          <p>✓ Análise jurídica concluída</p>
                                          <p>✓ Imóvel aprovado para comercialização</p>
                                        </>
                                      )}
                                      {stage.status === 'in_progress' && (
                                        <>
                                          <p>🔄 Documentos em análise</p>
                                          <p>🔄 Validação em andamento</p>
                                          <p>⏳ Aguardando conclusão</p>
                                        </>
                                      )}
                                      {stage.status === 'pending' && (
                                        <>
                                          <p>⏸️ Aguardando início da validação</p>
                                          <p>📋 Documentos ainda não enviados</p>
                                          <p>🎯 Pronto para iniciar due diligence</p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}