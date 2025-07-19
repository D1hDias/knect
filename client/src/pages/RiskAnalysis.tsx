import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  FileText, 
  Upload, 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Shield,
  Scale,
  Building,
  Users,
  CreditCard,
  FileCheck,
  Download,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

interface BusinessNature {
  id: string;
  label: string;
  description: string;
}

interface Question {
  id: string;
  text: string;
  type: 'radio' | 'checkbox';
  options: string[];
  required: boolean;
}

interface DocumentCategory {
  id: string;
  name: string;
  icon: any;
  required: boolean;
  files: File[];
}

interface RiskAnalysisData {
  id: string;
  timestamp: string;
  businessNature: {
    type: string;
    label: string;
    description: string;
  };
  questionnaire: {
    [key: string]: {
      question: string;
      answer: string;
      timestamp: string;
    };
  };
  documents: {
    [categoryId: string]: {
      categoryName: string;
      required: boolean;
      files: Array<{
        name: string;
        size: number;
        type: string;
        uploadTimestamp: string;
      }>;
    };
  };
  analysisPath: {
    steps: string[];
    recommendations: string[];
    generatedAt: string;
  } | null;
  aiAnalysis: {
    prompt: string;
    context: string;
    result: any;
    processedAt: string;
  } | null;
  currentStep: number;
  completed: boolean;
}

export default function RiskAnalysis() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedNature, setSelectedNature] = useState<string>("");
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [documents, setDocuments] = useState<DocumentCategory[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Usar ref para evitar loops mas manter dados para N8N
  const analysisDataRef = useRef<RiskAnalysisData>({
    id: `analysis_${Date.now()}`,
    timestamp: new Date().toISOString(),
    businessNature: {
      type: "",
      label: "",
      description: ""
    },
    questionnaire: {},
    documents: {},
    analysisPath: null,
    aiAnalysis: null,
    currentStep: 1,
    completed: false
  });

  // Estado simplificado apenas para renderização
  const [analysisData] = useState<RiskAnalysisData>(analysisDataRef.current);

  const businessNatures: BusinessNature[] = [
    { id: "compra_venda", label: "Compra e venda", description: "Transferência onerosa de propriedade" },
    { id: "doacao", label: "Doação", description: "Transferência gratuita de propriedade" },
    { id: "usucapiao", label: "Usucapião", description: "Aquisição por posse prolongada" },
    { id: "permuta", label: "Permuta", description: "Troca de imóveis" },
    { id: "alienacao_fiduciaria", label: "Alienação fiduciária", description: "Garantia com transferência de propriedade" },
    { id: "incorporacao", label: "Incorporação imobiliária", description: "Construção para venda de unidades" },
    { id: "adjudicacao", label: "Adjudicação compulsória", description: "Transferência judicial forçada" }
  ];

  const questions: Question[] = [
    {
      id: "registro_anterior",
      text: "Há registro anterior?",
      type: "radio",
      options: ["Sim", "Não"],
      required: true
    },
    {
      id: "imovel_quitado",
      text: "Imóvel quitado?",
      type: "radio",
      options: ["Sim", "Não"],
      required: true
    },
    {
      id: "vendedor_tipo",
      text: "Vendedor é pessoa física ou jurídica?",
      type: "radio",
      options: ["Física", "Jurídica"],
      required: true
    },
    {
      id: "outros_titulares",
      text: "Existem outros titulares?",
      type: "radio",
      options: ["Sim", "Não"],
      required: true
    },
    {
      id: "financiamento",
      text: "Financiamento envolvido?",
      type: "radio",
      options: ["Sim", "Não"],
      required: true
    }
  ];

  const initializeDocumentCategories = () => {
    const categories: DocumentCategory[] = [
      { id: "matricula", name: "Matrícula atualizada", icon: FileText, required: true, files: [] },
      { id: "certidoes_pessoais", name: "Certidões pessoais", icon: Users, required: true, files: [] },
      { id: "certidoes_fiscais", name: "Certidões fiscais", icon: CreditCard, required: true, files: [] },
      { id: "planta_habite", name: "Planta e habite-se", icon: Building, required: false, files: [] },
      { id: "contratos_anteriores", name: "Contratos anteriores", icon: FileCheck, required: false, files: [] }
    ];
    setDocuments(categories);
  };

  useEffect(() => {
    initializeDocumentCategories();
  }, []);

  const saveAnalysisData = () => {
    try {
      localStorage.setItem('currentRiskAnalysis', JSON.stringify(analysisData));
    } catch (error) {
      console.error('Erro ao salvar dados da análise:', error);
    }
  };

  const updateAnalysisData = (updates: Partial<RiskAnalysisData>) => {
    // Função removida temporariamente para evitar loops
    // mas mantida para compatibilidade
    console.log('updateAnalysisData called with:', updates);
  };

  // Função separada para save manual quando necessário
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('currentRiskAnalysis', JSON.stringify(analysisData));
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleNatureSelect = (nature: string) => {
    setSelectedNature(nature);
    
    // Atualizar ref sem causar re-render
    const selectedBusinessNature = businessNatures.find(b => b.id === nature);
    if (selectedBusinessNature) {
      analysisDataRef.current.businessNature = {
        type: nature,
        label: selectedBusinessNature.label,
        description: selectedBusinessNature.description
      };
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Atualizar ref sem causar re-render
    const question = questions.find(q => q.id === questionId);
    if (question) {
      analysisDataRef.current.questionnaire[questionId] = {
        question: question.text,
        answer: value,
        timestamp: new Date().toISOString()
      };
    }
  };

  const handleFileUpload = (categoryId: string, files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    setDocuments(prev => prev.map(category => 
      category.id === categoryId 
        ? { ...category, files: [...category.files, ...newFiles] }
        : category
    ));

    // Atualizar dados da análise
    const category = documents.find(d => d.id === categoryId);
    if (category) {
      const filesData = newFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTimestamp: new Date().toISOString()
      }));

      // Temporariamente removido para evitar loops
      // updateAnalysisData({ documents: { ... } });
    }
  };

  const removeFile = (categoryId: string, fileIndex: number) => {
    setDocuments(prev => prev.map(category => 
      category.id === categoryId 
        ? { ...category, files: category.files.filter((_, index) => index !== fileIndex) }
        : category
    ));

    // Atualizar dados da análise
    if (analysisData.documents[categoryId]) {
      const updatedFiles = analysisData.documents[categoryId].files.filter((_, index) => index !== fileIndex);
      // Temporariamente removido para evitar loops
      // updateAnalysisData({ documents: { ... } });
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedNature !== "";
      case 2:
        return questions.every(q => !q.required || answers[q.id]);
      case 4:
        return documents.filter(d => d.required).every(d => d.files.length > 0);
      default:
        return true;
    }
  };

  const generateAnalysisPath = () => {
    // Geração de caminho baseado no contexto completo
    const { businessNature, questionnaire } = analysisDataRef.current;
    
    // Debug: verificar se o contexto está sendo capturado
    console.log("🔍 Contexto atual para IA:", {
      businessNature,
      questionnaire,
      totalQuestions: Object.keys(questionnaire).length
    });
    
    let steps = ["Verificação da documentação básica"];
    let recommendations = [];

    // Customizar baseado na natureza do negócio
    switch (businessNature.type) {
      case "compra_venda":
        steps.push("Análise da regularidade jurídica", "Verificação de débitos e ônus", "Validação da capacidade financeira");
        recommendations.push("Solicitar certidão de matrícula atualizada (máximo 30 dias)");
        break;
      case "doacao":
        steps.push("Verificação de capacidade civil", "Análise de impostos sobre doação");
        recommendations.push("Verificar necessidade de anuência conjugal");
        break;
      case "usucapiao":
        steps.push("Análise temporal da posse", "Verificação de requisitos legais", "Análise de documentos probatórios");
        recommendations.push("Comprovar posse mansa e pacífica por período legal");
        break;
      // Adicionar outros casos conforme necessário
    }

    // Customizar baseado nas respostas do questionário
    if (questionnaire.financiamento?.answer === "Sim") {
      steps.push("Análise de viabilidade financeira");
      recommendations.push("Verificar aprovação de crédito e garantias");
    }

    if (questionnaire.outros_titulares?.answer === "Sim") {
      recommendations.push("Obter anuência de todos os titulares");
    }

    if (questionnaire.imovel_quitado?.answer === "Não") {
      recommendations.push("Verificar saldo devedor e condições de quitação");
    }

    const analysisPath = {
      steps,
      recommendations,
      generatedAt: new Date().toISOString()
    };

    // Salvar o caminho gerado no ref
    analysisDataRef.current.analysisPath = analysisPath;

    return analysisPath;
  };

  const buildAIPrompt = () => {
    const { businessNature, questionnaire, documents, analysisPath } = analysisDataRef.current;
    
    const context = `
ANÁLISE DE RISCO IMOBILIÁRIO - CONTEXTO COMPLETO

1. NATUREZA DO NEGÓCIO:
   - Tipo: ${businessNature.label}
   - Descrição: ${businessNature.description}

2. QUESTIONÁRIO RESPONDIDO:
${Object.entries(questionnaire).map(([key, data]) => 
  `   - ${data.question}: ${data.answer}`
).join('\n')}

3. DOCUMENTOS ENVIADOS:
${Object.entries(documents).map(([categoryId, categoryData]) => 
  `   - ${categoryData.categoryName} (${categoryData.required ? 'Obrigatório' : 'Opcional'}): ${categoryData.files.length} arquivo(s)`
).join('\n')}

4. CAMINHO DE ANÁLISE GERADO:
   Etapas: ${analysisPath?.steps.join(', ') || 'Não gerado'}
   Recomendações: ${analysisPath?.recommendations.join(', ') || 'Não gerado'}

SOLICITAÇÃO:
Baseado neste contexto completo, realize uma análise jurídica detalhada e retorne OBRIGATORIAMENTE um JSON válido no seguinte formato:

{
  "riskLevel": "baixo|médio|alto",
  "summary": "Resumo da análise de risco",
  "alerts": ["Alerta 1", "Alerta 2", "Alerta 3"],
  "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"],
  "pendencies": ["Pendência 1", "Pendência 2", "Pendência 3"],
  "contractModels": ["Modelo 1", "Modelo 2", "Modelo 3"]
}

IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional antes ou depois. Considere especialmente a natureza "${businessNature.label}" e as respostas fornecidas no questionário.
`;

    return context;
  };

  const performAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    const prompt = buildAIPrompt();
    
    try {
      // Preparar payload para API do OpenRouter
      const aiPayload = {
        model: "moonshotai/kimi-k2:free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      };

      console.log("📋 Payload validado para OpenRouter:", {
        model: aiPayload.model,
        hasPrompt: !!prompt,
        temperature: aiPayload.temperature
      });
      
      // 🚀 CONECTANDO COM OPENROUTER
      console.log("🚀 Enviando para OpenRouter:", {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: aiPayload.model
      });
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'KNECT - Sistema Imobiliário'
        },
        body: JSON.stringify(aiPayload)
      });

      if (!response.ok) {
        throw new Error(`Erro na API do OpenRouter: ${response.status} ${response.statusText}`);
      }

      const openrouterResponse = await response.json();
      console.log("📥 Resposta do OpenRouter:", openrouterResponse);
      
      // Verificar se há erro na resposta
      if (openrouterResponse.error) {
        console.error("❌ Erro na API OpenRouter:", openrouterResponse.error);
        console.log("🔄 Usando simulação como fallback...");
        const result = generateIntelligentResult();
        setAnalysisResult(result);
        setCurrentStep(6);
        alert(`Erro no OpenRouter: ${openrouterResponse.error.message}. Usando análise simulada.`);
        return;
      }
      
      // Extrair conteúdo da resposta e fazer parse do JSON
      const content = openrouterResponse.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Resposta da IA não contém conteúdo válido");
      }
      
      let aiResult;
      try {
        // Tentar extrair JSON da resposta
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : content;
        aiResult = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error("❌ Erro ao fazer parse do JSON:", parseError);
        throw new Error("IA retornou formato inválido");
      }
      
      // Verificar se tem todos os campos obrigatórios
      const requiredFields = ['riskLevel', 'summary', 'alerts', 'recommendations', 'pendencies', 'contractModels'];
      const missingFields = requiredFields.filter(field => !aiResult[field]);
      
      if (missingFields.length > 0) {
        console.error("❌ Campos obrigatórios ausentes:", missingFields);
        console.log("🔄 Usando simulação como fallback...");
        const result = generateIntelligentResult();
        setAnalysisResult(result);
        setCurrentStep(6);
        alert(`Resposta incompleta da IA. Campos ausentes: ${missingFields.join(', ')}`);
        return;
      }
      
      // Usar resultado do OpenRouter se tudo estiver correto
      const result = aiResult;
      
      console.log("✅ Análise OpenRouter concluída com sucesso:", {
        riskLevel: result.riskLevel,
        alertsCount: result.alerts?.length || 0,
        recommendationsCount: result.recommendations?.length || 0,
        pendenciesCount: result.pendencies?.length || 0,
        contractModelsCount: result.contractModels?.length || 0
      });

      // Temporariamente removido para evitar loops
      // updateAnalysisData({ aiAnalysis: { ... }, completed: true });

      setAnalysisResult(result);
      setCurrentStep(6);
      
    } catch (error) {
      console.error('❌ Erro na análise com IA:', error);
      
      // Fallback para simulação em caso de erro
      console.log("🔄 Usando simulação como fallback...");
      const result = generateIntelligentResult();
      setAnalysisResult(result);
      setCurrentStep(6);
      
      // Mostrar erro amigável para o usuário
      alert('Erro de conexão com OpenRouter. Usando análise simulada como backup.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateIntelligentResult = () => {
    const { businessNature, questionnaire } = analysisDataRef.current;
    
    let riskLevel = "baixo";
    let alerts: string[] = [];
    let recommendations: string[] = [];
    let pendencies: string[] = [];

    // Ajustar baseado na natureza do negócio
    switch (businessNature.type) {
      case "compra_venda":
        if (questionnaire.imovel_quitado?.answer === "Não") {
          riskLevel = "médio";
          alerts.push("Imóvel não quitado - verificar saldo devedor");
          pendencies.push("Quitação total do financiamento anterior");
        }
        if (questionnaire.outros_titulares?.answer === "Sim") {
          alerts.push("Múltiplos titulares - necessária anuência de todos");
          pendencies.push("Anuência expressa de todos os cotitulares");
        }
        break;
      
      case "usucapiao":
        riskLevel = "alto";
        alerts.push("Usucapião exige comprovação rigorosa de posse");
        recommendations.push("Contratar advogado especializado em usucapião");
        pendencies.push("Documentos probatórios de posse mansa e pacífica");
        break;
        
      case "doacao":
        if (questionnaire.vendedor_tipo?.answer === "Jurídica") {
          alerts.push("Doação por pessoa jurídica - verificar fins sociais");
        }
        recommendations.push("Avaliar implicações tributárias da doação");
        break;
    }

    // Ajustar baseado em financiamento
    if (questionnaire.financiamento?.answer === "Sim") {
      recommendations.push("Verificar aprovação prévia do financiamento");
      pendencies.push("Carta de aprovação da instituição financeira");
    }

    return {
      riskLevel,
      summary: `Transação de ${businessNature.label.toLowerCase()} apresenta risco ${riskLevel} baseado no contexto analisado.`,
      alerts,
      recommendations: [
        "Solicitar certidão de matrícula atualizada (máximo 30 dias)",
        "Verificar quitação de impostos municipais",
        ...recommendations
      ],
      pendencies: [
        "Certidão negativa de débitos trabalhistas",
        ...pendencies
      ],
      contractModels: [
        `Contrato de ${businessNature.label.toLowerCase()} personalizado`,
        "Declaração de quitação de débitos",
        "Relatório de análise de risco detalhado"
      ]
    };
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleção da Natureza do Negócio</h2>
              <p className="text-gray-600">Escolha o tipo de transação que será analisada</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessNatures.map((nature) => (
                <Card 
                  key={nature.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedNature === nature.id 
                      ? 'border-[#15355e] bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleNatureSelect(nature.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Checkbox 
                            checked={selectedNature === nature.id}
                            onChange={() => {}}
                            className="pointer-events-none"
                          />
                          <h3 className="font-semibold text-gray-900">{nature.label}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{nature.description}</p>
                      </div>
                      <Scale className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Questionário Inteligente</h2>
              <p className="text-gray-600">Responda às perguntas para personalizar a análise</p>
            </div>

            <div className="space-y-6">
              {questions.map((question) => (
                <Card key={question.id} className="border-gray-200">
                  <CardContent className="p-6">
                    <Label className="text-base font-medium text-gray-900 mb-4 block">
                      {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <RadioGroup
                      value={answers[question.id] || ""}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      {question.options.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                          <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        const analysisPath = generateAnalysisPath();
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Caminho de Análise Gerado</h2>
              <p className="text-gray-600">Baseado nas suas respostas, este é o procedimento recomendado</p>
              
              {/* Indicador de contexto capturado */}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg inline-block">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <Bot className="h-4 w-4" />
                  <span>
                    Contexto IA: {analysisDataRef.current.businessNature.label || 'Não selecionado'} • 
                    {Object.keys(analysisDataRef.current.questionnaire).length} respostas capturadas
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Passo-a-passo do Procedimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisPath.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-white">
                          {index + 1}
                        </Badge>
                        <span className="text-green-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <AlertTriangle className="h-5 w-5" />
                    Recomendações e Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisPath.recommendations.map((rec, index) => (
                      <Alert key={index} className="border-blue-200 bg-white">
                        <AlertDescription className="text-blue-700">
                          {rec}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload de Documentos</h2>
              <p className="text-gray-600">Envie os documentos necessários para análise</p>
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Importante:</strong> A qualidade dos arquivos enviados influencia diretamente na precisão da análise. 
                  Priorize sempre documentos em formato digital nativo (PDF, não escaneados).
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-6">
              {documents.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Card key={category.id} className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-[#15355e]" />
                        {category.name}
                        {category.required && <Badge variant="destructive">Obrigatório</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleFileUpload(category.id, e.target.files)}
                        className="border-dashed border-2 border-gray-300 hover:border-gray-400 p-6 text-center cursor-pointer"
                      />
                      
                      {category.files.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Arquivos enviados:</h4>
                          {category.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="text-sm text-gray-700">{file.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(category.id, index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remover
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Análise em Andamento</h2>
              <p className="text-gray-600">Nossa IA está processando os documentos e gerando o relatório</p>
            </div>

            <Card className="border-blue-200 bg-blue-50 text-center p-8">
              <CardContent>
                <Bot className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  {isAnalyzing ? "Conectando com OpenRouter..." : "Processando Análise"}
                </h3>
                <p className="text-blue-700 mb-6">
                  {isAnalyzing 
                    ? "Enviando dados para o OpenRouter e aguardando resposta..."
                    : "Estamos utilizando IA avançada para analisar dados, detectar inconsistências e identificar riscos"
                  }
                </p>
                <Progress value={75} className="w-full mb-4" />
                <p className="text-sm text-blue-600">Analisando documentos... 75% concluído</p>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                onClick={performAIAnalysis}
                disabled={isAnalyzing}
                className="bg-[#15355e] hover:bg-[#15355e]/90 text-white"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Conectando com OpenRouter...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Iniciar Análise com OpenRouter
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 6:
        if (!analysisResult) return null;
        
        const getRiskColor = (level: string) => {
          switch (level) {
            case "baixo": return "text-green-600 bg-green-50 border-green-200";
            case "médio": return "text-yellow-600 bg-yellow-50 border-yellow-200";
            case "alto": return "text-red-600 bg-red-50 border-red-200";
            default: return "text-gray-600 bg-gray-50 border-gray-200";
          }
        };

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Relatório de Análise de Risco</h2>
              <p className="text-gray-600">Análise completa baseada nos documentos e informações fornecidas</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className={`border-2 ${getRiskColor(analysisResult.riskLevel)}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Diagnóstico de Risco
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <Badge className={`text-lg px-4 py-2 ${getRiskColor(analysisResult.riskLevel)}`}>
                      Risco {analysisResult.riskLevel.toUpperCase()}
                    </Badge>
                    <p className="text-sm mt-2 text-gray-600">{analysisResult.summary}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Alertas de Risco
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysisResult.alerts.map((alert: string, index: number) => (
                      <Alert key={index} className="border-orange-200 bg-orange-50">
                        <AlertDescription className="text-orange-800">{alert}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Recomendações Jurídicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Lista de Pendências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.pendencies.map((pendency: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{pendency}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Download className="h-5 w-5" />
                  Modelos e Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analysisResult.contractModels.map((model: string, index: number) => (
                    <Button key={index} variant="outline" className="justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      {model}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-1 text-gray-900">Análise de Risco</h1>
          <p className="text-gray-600">Módulo automatizado de análise de risco em transações imobiliárias</p>
        </div>
        {currentStep === 1 && (
          <Button 
            onClick={() => {
              setCurrentStep(2);
              // updateAnalysisData({ currentStep: 2 });
            }}
            disabled={!canProceedToNextStep()}
            className="bg-[#15355e] hover:bg-[#15355e]/90 text-white rounded-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Análise
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      {currentStep > 1 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {[
                { step: 1, label: "Natureza", completed: currentStep > 1 },
                { step: 2, label: "Questionário", completed: currentStep > 2 },
                { step: 3, label: "Caminho", completed: currentStep > 3 },
                { step: 4, label: "Documentos", completed: currentStep > 4 },
                { step: 5, label: "Análise", completed: currentStep > 5 },
                { step: 6, label: "Relatório", completed: currentStep === 6 }
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.completed ? 'bg-green-500 text-white' : 
                    currentStep === item.step ? 'bg-[#15355e] text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {item.completed ? <CheckCircle className="h-5 w-5" /> : item.step}
                  </div>
                  <span className={`ml-2 text-sm ${
                    item.completed || currentStep === item.step ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                  {index < 5 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      item.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {currentStep > 1 && currentStep < 6 && (
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              const newStep = currentStep - 1;
              setCurrentStep(newStep);
              // updateAnalysisData({ currentStep: newStep });
            }}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          {currentStep < 5 && (
            <Button 
              onClick={() => {
                const newStep = currentStep + 1;
                setCurrentStep(newStep);
                // updateAnalysisData({ currentStep: newStep });
                }}
              disabled={!canProceedToNextStep()}
              className="bg-[#15355e] hover:bg-[#15355e]/90 text-white rounded-full"
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}