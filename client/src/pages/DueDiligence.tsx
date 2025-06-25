import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle, FileText, Download } from "lucide-react";

export default function DueDiligence() {
  // Mock data for demonstration
  const diligenceItems = [
    {
      id: 1,
      property: "Apartamento Vila Madalena",
      owner: "Maria Santos",
      documents: [
        { name: "Certidão de Ônus", status: "completed", date: "2024-01-15" },
        { name: "IPTU", status: "completed", date: "2024-01-14" },
        { name: "Certidão Negativa Débitos", status: "completed", date: "2024-01-16" },
        { name: "Matrícula do Imóvel", status: "completed", date: "2024-01-13" },
        { name: "Certidão de Inteiro Teor", status: "completed", date: "2024-01-17" }
      ],
      overallStatus: "completed",
      completedAt: "2024-01-17"
    },
    {
      id: 2,
      property: "Casa Jardins",
      owner: "João Oliveira",
      documents: [
        { name: "Certidão de Ônus", status: "completed", date: "2024-01-18" },
        { name: "IPTU", status: "completed", date: "2024-01-18" },
        { name: "Certidão Negativa Débitos", status: "pending", date: null },
        { name: "Matrícula do Imóvel", status: "in_progress", date: null },
        { name: "Certidão de Inteiro Teor", status: "pending", date: null }
      ],
      overallStatus: "in_progress",
      completedAt: null
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>;
      case "in_progress":
        return <Badge variant="secondary">Em Andamento</Badge>;
      case "pending":
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const calculateProgress = (documents: any[]) => {
    const completed = documents.filter(doc => doc.status === "completed").length;
    return (completed / documents.length) * 100;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Due Diligence Automatizada</h1>
          <p className="text-muted-foreground">
            Acompanhe a coleta e validação de documentos dos imóveis
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6" style={{color: "#001f3f"}} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold" style={{color: "#001f3f"}}>1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Docs</p>
                <p className="text-2xl font-bold">10</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due Diligence List */}
      <div className="space-y-6">
        {diligenceItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{item.property}</CardTitle>
                  <p className="text-sm text-muted-foreground">Proprietário: {item.owner}</p>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(item.overallStatus)}
                  {item.overallStatus === "completed" && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Relatório Completo
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso da Documentação</span>
                    <span>{Math.round(calculateProgress(item.documents))}%</span>
                  </div>
                  <Progress value={calculateProgress(item.documents)} className="h-2" />
                </div>

                {/* Documents List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {item.documents.map((doc, index) => (
                    <Card key={index} className="border border-border/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{doc.name}</span>
                          {getStatusIcon(doc.status)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.status === "completed" ? `Coletado em ${doc.date}` : 
                           doc.status === "in_progress" ? "Coleta em andamento..." : 
                           "Aguardando coleta"}
                        </div>
                        {doc.status === "completed" && (
                          <Button variant="ghost" size="sm" className="mt-2 h-8 w-full">
                            <FileText className="h-3 w-3 mr-1" />
                            Visualizar
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Actions */}
                {item.overallStatus === "completed" && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Due Diligence Concluída
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      Todos os documentos foram coletados e validados. Imóvel aprovado para colocação no mercado.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Relatório Detalhado
                      </Button>
                      <Button size="sm">
                        Colocar no Mercado
                      </Button>
                    </div>
                  </div>
                )}

                {item.overallStatus === "in_progress" && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        Coleta em Andamento
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Alguns documentos ainda estão sendo coletados. O sistema notificará quando estiver completo.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
