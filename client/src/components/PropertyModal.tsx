import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { Upload, X, CloudUpload, CheckCircle, Eye, Download, Plus, Trash2 } from "lucide-react";

const BRAZILIAN_STATES = [
  { value: "AC", label: "AC" },
  { value: "AL", label: "AL" },
  { value: "AP", label: "AP" },
  { value: "AM", label: "AM" },
  { value: "BA", label: "BA" },
  { value: "CE", label: "CE" },
  { value: "DF", label: "DF" },
  { value: "ES", label: "ES" },
  { value: "GO", label: "GO" },
  { value: "MA", label: "MA" },
  { value: "MT", label: "MT" },
  { value: "MS", label: "MS" },
  { value: "MG", label: "MG" },
  { value: "PA", label: "PA" },
  { value: "PB", label: "PB" },
  { value: "PR", label: "PR" },
  { value: "PE", label: "PE" },
  { value: "PI", label: "PI" },
  { value: "RJ", label: "RJ" },
  { value: "RN", label: "RN" },
  { value: "RS", label: "RS" },
  { value: "RO", label: "RO" },
  { value: "RR", label: "RR" },
  { value: "SC", label: "SC" },
  { value: "SP", label: "SP" },
  { value: "SE", label: "SE" },
  { value: "TO", label: "TO" }
];

const ownerSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  birthDate: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().refine((email) => {
    if (email === '') return true; // Permite vazio
    return /\S+@\S+\.\S+/.test(email); // Valida formato se não estiver vazio
  }, "E-mail inválido"),
  rg: z.string().optional(),
  maritalStatus: z.string().optional(),
});

const propertySchema = z.object({
  type: z.string().min(1, "Tipo é obrigatório"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  cep: z.string().min(8, "CEP deve ter 8 dígitos").max(9, "CEP inválido"),
  value: z.string().min(1, "Valor é obrigatório"),
  owners: z.array(ownerSchema).min(1, "Pelo menos um proprietário é obrigatório"),
  registrationNumber: z.string().optional(),
  municipalRegistration: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface Property {
  id?: string;
  sequenceNumber?: string;
  type: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  value: string | number;
  owners?: any[];
  registrationNumber?: string;
  municipalRegistration?: string;
}

interface PropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  onDocumentUpdate?: () => void; // Callback para notificar parent sobre atualizações
}

// Estender File para incluir categoria
interface FileWithCategory extends File {
  category?: string;
  ownerIndex?: number;
}

async function fetchAddressByCep(cep: string) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      return null;
    }
    
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

export function PropertyModal({ open, onOpenChange, property, onDocumentUpdate }: PropertyModalProps) {
  const [files, setFiles] = useState<FileWithCategory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [propertyDocuments, setPropertyDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [recentlyUploaded, setRecentlyUploaded] = useState<string[]>([]); // Para mostrar mensagem de sucesso permanente
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!property;


  const [owners, setOwners] = useState([{
    id: crypto.randomUUID(),
    fullName: '',
    cpf: '',
    birthDate: '',
    fatherName: '',
    motherName: '',
    phone: '',
    email: '',
    rg: '',
    maritalStatus: ''
  }]);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",      
      value: "",
      owners: [{
        id: crypto.randomUUID(),
        fullName: '',
        cpf: '',
        birthDate: '',
        fatherName: '',
        motherName: '',
        phone: '',
        email: '',
        rg: '',
        maritalStatus: ''
      }],
      registrationNumber: "",
      municipalRegistration: "",
    },
  });

  // Efeito para popular formulário quando editing
  useEffect(() => {
    if (property && open) {
      // Formatar valor para exibição
      const formatValue = (value: string | number) => {
        const numValue = Number(value);
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(numValue);
      };

      // Popular campos básicos
      form.reset({
        type: property.type || "",
        street: property.street || "",
        number: property.number || "",
        complement: property.complement || "",
        neighborhood: property.neighborhood || "",
        city: property.city || "",
        state: property.state || "",
        cep: property.cep || "",
        value: formatValue(property.value),
        registrationNumber: property.registrationNumber || "",
        municipalRegistration: property.municipalRegistration || "",
        owners: property.owners && property.owners.length > 0 ? 
          property.owners.map(owner => ({
            id: owner.id || crypto.randomUUID(),
            fullName: owner.fullName || '',
            cpf: owner.cpf || '',
            birthDate: owner.birthDate ? 
              // Converter de YYYY-MM-DD para DD/MM/YYYY se necessário
              (owner.birthDate.includes('-') ? 
                owner.birthDate.split('-').reverse().join('/') : 
                owner.birthDate) : '',
            fatherName: owner.fatherName || '',
            motherName: owner.motherName || '',
            phone: owner.phone || '',
            email: owner.email || '',
            rg: owner.rg || '',
            maritalStatus: owner.maritalStatus || ''
          })) : [{
            id: crypto.randomUUID(),
            fullName: '',
            cpf: '',
            birthDate: '',
            fatherName: '',
            motherName: '',
            phone: '',
            email: '',
            rg: '',
            maritalStatus: ''
          }]
      });

      setOwners(property.owners ? property.owners.map(owner => ({
        ...owner,
        birthDate: owner.birthDate ? 
          (owner.birthDate.includes('-') ? 
            owner.birthDate.split('-').reverse().join('/') : 
            owner.birthDate) : ''
      })) : [{
        id: crypto.randomUUID(),
        fullName: '',
        cpf: '',
        birthDate: '',
        fatherName: '',
        motherName: '',
        phone: '',
        email: '',
        rg: '',
        maritalStatus: ''
      }]);
    } else if (!property && open) {
      // Reset para novo
      form.reset({
        type: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        cep: "",      
        value: "",
        owners: [{
          id: crypto.randomUUID(),
          fullName: '',
          cpf: '',
          birthDate: '',
          fatherName: '',
          motherName: '',
          phone: '',
          email: '',
          rg: '',
          maritalStatus: ''
        }],
        registrationNumber: "",
        municipalRegistration: "",
      });
      setOwners([{
        id: crypto.randomUUID(),
        fullName: '',
        cpf: '',
        birthDate: '',
        fatherName: '',
        motherName: '',
        phone: '',
        email: '',
        rg: '',
        maritalStatus: ''
      }]);
    }
  }, [property, open, form]);

  const addOwner = () => {
    const newOwner = {
      id: crypto.randomUUID(),
      fullName: '',
      cpf: '',
      birthDate: '',
      fatherName: '',
      motherName: '',
      phone: '',
      email: '',
      rg: '',
      maritalStatus: ''
    };
    const currentOwners = form.getValues('owners');
    const updatedOwners = [...currentOwners, newOwner];
    form.setValue('owners', updatedOwners);
    setOwners(updatedOwners);
  };

  const removeOwner = (ownerId: string) => {
    const currentOwners = form.getValues('owners');
    if (currentOwners.length > 1) {
      const updatedOwners = currentOwners.filter(owner => owner.id !== ownerId);
      form.setValue('owners', updatedOwners);
      setOwners(updatedOwners);
    }
  };

  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const endpoint = isEditing ? `/api/properties/${property?.id}` : "/api/properties";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiRequest(method, endpoint, data);
      return await response.json();
    },
    onSuccess: (createdProperty) => {
      // Upload arquivos se houver
      if (files.length > 0) {
        uploadFilesToSupabase(createdProperty.id || property?.id).catch(console.error);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent"] });
      
      toast({
        title: isEditing ? "Imóvel atualizado!" : "Imóvel cadastrado!",
        description: isEditing ? "Os dados foram atualizados com sucesso." : "Nova captação registrada no sistema.",
      });
      
      onOpenChange(false);
      form.reset();
      setFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Erro ao atualizar" : "Erro ao cadastrar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const uploadFilesToSupabase = async (propertyId: string) => {
    setUploading(true);

    console.log("=== UPLOAD DEBUG ===");
    console.log("PropertyId:", propertyId);
    console.log("Files:", files);
    console.log("==================");

    try {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${propertyId}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('property-documents')
          .upload(filePath, file);

        if (error) {
          console.error("Supabase error:", {
            message: error.message,
            code: error.statusCode,
            details: error
          });
          throw new Error(`Erro no Supabase: ${error.message || 'Bucket não encontrado'}`);
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('property-documents')
          .getPublicUrl(filePath);

        // Preparar dados para API
        const documentData = {
          propertyId: parseInt(propertyId),
          fileName: file.name,
          fileUrl: publicUrl,
          fileType: file.type,
          category: file.category, // ADICIONAR CATEGORIA
        };

        console.log("Enviando para API:", documentData);

        // Salvar metadata no banco via API
        const response = await apiRequest('POST', '/api/property-documents', documentData);
        console.log("Resposta da API:", response);
      }
      
    } catch (error: any) {
      console.error("Upload error:", {
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      
      // Mostrar mensagem mais amigável ao usuário
      if (error.message?.includes('Bucket not found')) {
        throw new Error('Bucket de armazenamento não configurado. Verifique a configuração do Supabase.');
      }
      
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: PropertyFormData) => {
    // Converter valor brasileiro para formato numérico
    let cleanValue = data.value;
    if (typeof cleanValue === 'string') {
      // Remove R$, espaços e pontos (milhares), mantém apenas números e vírgula
      cleanValue = cleanValue
        .replace(/R\$|\s/g, '') // Remove R$ e espaços
        .replace(/\./g, '') // Remove pontos dos milhares
        .replace(',', '.'); // Troca vírgula por ponto decimal
    }
    
    const propertyData = {
      ...data,
      value: cleanValue,
    };
    
    
    createPropertyMutation.mutate(propertyData);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles) as FileWithCategory[]);
    }
  };

  // Buscar documentos quando abrir modal de edição
  useEffect(() => {
    if (open && property?.id) {
      fetchPropertyDocuments(property.id.toString());
    }
  }, [open, property?.id]);

  const fetchPropertyDocuments = async (propertyId: string) => {
    setLoadingDocuments(true);
    console.log("=== FETCH DOCUMENTS DEBUG ===");
    console.log("Fetching documents for property:", propertyId);
    
    try {
      const response = await apiRequest('GET', `/api/properties/${propertyId}/documents`);
      const documents = await response.json();
      console.log("Documents fetched:", documents);
      setPropertyDocuments(documents);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!property?.id || files.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione arquivos para fazer upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Marcar categorias como recém-enviadas ANTES de limpar files
      const uploadedCategories = files.map(f => f.category).filter(Boolean) as string[];
      
      await uploadFilesToSupabase(property.id);
      setFiles([]);
      
      setRecentlyUploaded(uploadedCategories);
      
      // Recarregar lista de documentos
      await fetchPropertyDocuments(property.id.toString());
      
      // Notificar parent sobre atualização (para refresh da barra de progresso)
      if (onDocumentUpdate) {
        onDocumentUpdate();
      }
      
      // TOAST REMOVIDO - confirmação agora fica dentro das DIVs
      // Mensagem de sucesso fica permanente até ser deletada
      
      // NÃO FECHAR O MODAL - apenas fazer refresh interno
      
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar documentos.",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (documentId: number, documentName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o documento "${documentName}"?`)) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/property-documents/${documentId}`);
      
      // REMOVER DA LISTA IMEDIATAMENTE (sem esperar o servidor)
      setPropertyDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // Remover da lista de recém-enviados se estiver lá
      setRecentlyUploaded(prev => prev.filter(category => {
        const doc = propertyDocuments.find(d => d.id === documentId);
        return !doc || !doc.fileName || !files.some(f => f.category === category && f.name === doc.fileName);
      }));
      
      // Notificar parent sobre atualização (para refresh da barra de progresso)
      if (onDocumentUpdate) {
        onDocumentUpdate();
      }
      
      toast({
        title: "Documento deletado!",
        description: `${documentName} foi removido com sucesso.`,
      });
      
    } catch (error: any) {
      console.error("Error deleting document:", error);
      
      // Se der erro, recarregar para restaurar o estado correto
      if (property?.id) {
        await fetchPropertyDocuments(property.id.toString());
      }
      
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o documento.",
        variant: "destructive",
      });
    }
  };

  // Helper para verificar se um documento já foi enviado
  const hasDocument = (category: string) => {
    return propertyDocuments.some(doc => 
      doc.fileName?.toLowerCase().includes(category.toLowerCase()) ||
      doc.category === category
    );
  };

  // Helper para obter documento específico
  const getDocument = (category: string) => {
    return propertyDocuments.find(doc => 
      doc.fileName?.toLowerCase().includes(category.toLowerCase()) ||
      doc.category === category
    );
  };

  // Componente para campo de upload com status visual
  const DocumentUploadField = ({ 
    category, 
    title, 
    icon, 
    inputId 
  }: { 
    category: string; 
    title: string; 
    icon: string; 
    inputId: string; 
  }) => {
    const existingDoc = getDocument(category);
    const hasFile = hasDocument(category);
    const pendingFile = files.find(f => f.category === category);
    const wasRecentlyUploaded = recentlyUploaded.includes(category);
    
    // Debug logs removidos

    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{icon}</span>
          <h5 className="font-medium text-sm">{title}</h5>
        </div>
        
        {/* Mensagem de sucesso permanente com todas as informações */}
        {wasRecentlyUploaded && (() => {
          
          // Encontrar documento por categoria (preferência) ou por nome do arquivo
          const recentDoc = propertyDocuments
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
            .find(doc => {
              // Primeiro: verificar categoria exata
              if (doc.category === category) {
                return true;
              }
              
              // Segundo: verificar nome do arquivo como fallback
              if (!doc.fileName && !doc.name) return false;
              
              const fileName = (doc.fileName || doc.name || '').toLowerCase();
              let matchByName = false;
              
              if (category === 'ONUS_REAIS' && (fileName.includes('onus') || fileName.includes('ônus'))) matchByName = true;
              if (category === 'ESPELHO_IPTU' && fileName.includes('iptu')) matchByName = true;
              if (category === 'RG_CNH' && (fileName.includes('rg') || fileName.includes('cnh'))) matchByName = true;
              if (category === 'CERTIDAO_ESTADO_CIVIL' && (fileName.includes('certid') || fileName.includes('civil'))) matchByName = true;
              if (category === 'COMPROVANTE_RESIDENCIA' && (fileName.includes('residencia') || fileName.includes('comprovante'))) matchByName = true;
              
              return matchByName;
            });

          return recentDoc ? (
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
              <div className="space-y-3">
                {/* Header com ícone de sucesso */}
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-bold text-green-800">✅ Arquivo enviado com sucesso!</span>
                </div>
                
                {/* Informações do documento */}
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Nome do arquivo:</span>
                      <p className="text-sm text-gray-900">{recentDoc.fileName || recentDoc.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Data do envio:</span>
                      <p className="text-sm text-gray-600">
                        {new Date(recentDoc.uploadedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/documents/${recentDoc.id}/view`, '_blank')}
                      className="text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
                      title="Visualizar documento"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/documents/${recentDoc.id}/download`, '_blank')}
                      className="text-green-600 hover:text-green-800 border-green-200 hover:bg-green-50"
                      title="Baixar documento"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      deleteDocument(recentDoc.id, recentDoc.fileName || recentDoc.name);
                      setRecentlyUploaded(prev => prev.filter(cat => cat !== category));
                    }}
                    className="text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
                    title="Deletar documento"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Deletar
                  </Button>
                </div>
              </div>
            </div>
          ) : null;
        })()}
        
        {/* Documento já enviado (servidor) */}
        {hasFile && !pendingFile && !wasRecentlyUploaded ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <span className="text-sm font-medium text-green-700">Documento enviado</span>
                  <p className="text-xs text-green-600">{existingDoc?.fileName}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => existingDoc && deleteDocument(existingDoc.id, existingDoc.fileName)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : pendingFile && !wasRecentlyUploaded ? (
          /* Arquivo selecionado (pendente para upload) - DENTRO DA BOX VERDE */
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <span className="text-sm font-medium text-green-700">Arquivo selecionado</span>
                  <p className="text-xs text-green-600">{pendingFile.name}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFiles(files.filter(f => f !== pendingFile))}
                disabled={uploading}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : !wasRecentlyUploaded ? (
          /* Campo de upload vazio */
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
            <label htmlFor={inputId} className="cursor-pointer">
              <div className="text-center">
                <CloudUpload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <span className="text-xs font-medium text-gray-600">Clique para enviar</span>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
                </div>
              </div>
              <input
                id={inputId}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const fileWithCategory = Object.assign(file, { category }) as FileWithCategory;
                    setFiles(prev => [...prev, fileWithCategory]);
                  }
                }}
                disabled={uploading}
              />
            </label>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? `Editar Imóvel ${property?.sequenceNumber || '00000'}` 
              : 'Nova Captação'
            }
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite as informações do imóvel e seus proprietários.' 
              : 'Cadastre um novo imóvel e seus proprietários no sistema.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Imóvel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="apartamento">Apartamento</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="cobertura">Cobertura</SelectItem>
                        <SelectItem value="terreno">Terreno</SelectItem>
                        <SelectItem value="sala">Sala</SelectItem>
                        <SelectItem value="loja">Loja</SelectItem>
                        <SelectItem value="galpao">Galpão</SelectItem>
                        <SelectItem value="chacara">Chácara</SelectItem>
                        <SelectItem value="fazenda">Fazenda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Imóvel</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 500.000,00"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formattedValue = new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(Number(value) / 100);
                          field.onChange(formattedValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Endereço</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000-000"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const formattedCep = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                            field.onChange(formattedCep);
                          }}
                          onBlur={async () => {
                            const cleanCep = field.value.replace(/\D/g, '');
                            if (cleanCep.length === 8) {
                              const addressData = await fetchAddressByCep(cleanCep);
                              if (addressData) {
                                form.setValue('street', addressData.street);
                                form.setValue('neighborhood', addressData.neighborhood);
                                form.setValue('city', addressData.city);
                                form.setValue('state', addressData.state);
                              }
                            }
                          }}
                          maxLength={9}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BRAZILIAN_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Rua/Avenida</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua ABC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto 45" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Proprietários */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Proprietários</h3>
              </div>

              {form.watch('owners').map((owner, index) => (
                <div key={owner.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Proprietário {index + 1}
                      {index === 0 && (
                        <span className="text-sm text-muted-foreground ml-2">(Principal)</span>
                      )}
                    </h4>
                    {form.watch('owners').length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOwner(owner.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Nome Completo */}
                    <FormField
                      control={form.control}
                      name={`owners.${index}.fullName`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* CPF */}
                    <FormField
                      control={form.control}
                      name={`owners.${index}.cpf`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="000.000.000-00" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                const formattedCpf = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                                field.onChange(formattedCpf);
                              }}
                              maxLength={14}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Data de Nascimento */}
                    <FormField
                      control={form.control}
                      name={`owners.${index}.birthDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input 
                              id="DN"
                              name="DataNascimento"
                              type="text"
                              placeholder="DD/MM/AAAA" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                const formattedDate = value.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
                                field.onChange(formattedDate);
                              }}
                              maxLength={10}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Nome do Pai */}
                    <FormField
                      control={form.control}
                      name={`owners.${index}.fatherName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Pai</FormLabel>
                          <FormControl>
                            <Input 
                              id="txtPai"
                              name="NomePai"
                              type="text"
                              placeholder="Nome completo do pai"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Nome da Mãe */}
                    <FormField
                      control={form.control}
                      name={`owners.${index}.motherName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Mãe</FormLabel>
                          <FormControl>
                            <Input 
                              id="txtMae"
                              name="NomeMae"
                              type="text"
                              placeholder="Nome completo da mãe"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Telefone */}
                    <FormField
                      control={form.control}
                      name={`owners.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                const formattedPhone = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                                field.onChange(formattedPhone);
                              }}
                              maxLength={15}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* E-mail */}
                    <FormField
                      control={form.control}
                      name={`owners.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="email@exemplo.com" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={addOwner}
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Proprietário
                </button>
              </div>
            </div>

            {/* Documentação */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Documentação</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Matrícula</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="municipalRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inscrição Municipal</FormLabel>
                      <FormControl>
                        <Input placeholder="789012" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Upload de Documentos Específicos - VERSÃO ATUALIZADA */}
              <div className="space-y-4">
                <h4 className="font-medium">Documentos Obrigatórios</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Envie cada documento na seção correspondente
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ÔNUS REAIS */}
                  <DocumentUploadField 
                    category="ONUS_REAIS"
                    title="Ônus Reais"
                    icon="⚖️"
                    inputId="file-ONUS_REAIS"
                  />

                  {/* ESPELHO DE IPTU */}
                  <DocumentUploadField 
                    category="ESPELHO_IPTU"
                    title="Espelho de IPTU"
                    icon="🏠"
                    inputId="file-ESPELHO_IPTU"
                  />

                  {/* RG/CNH - DINÂMICO BASEADO NA QUANTIDADE DE PROPRIETÁRIOS */}
                  {form.watch('owners').map((owner, ownerIndex) => (
                    <div key={`rg-${owner.id}-${ownerIndex}`} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">📄</span>
                        <h5 className="font-medium text-sm">
                          RG/CNH - {owner.fullName || `Proprietário ${ownerIndex + 1}`}
                        </h5>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                        <label htmlFor={`file-RG_CNH_${ownerIndex}`} className="cursor-pointer">
                          <div className="text-center">
                            <CloudUpload className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-600">Clique para enviar</span>
                              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
                            </div>
                          </div>
                          <input
                            id={`file-RG_CNH_${ownerIndex}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const fileWithCategory = Object.assign(file, { 
                                  category: `RG_CNH_${ownerIndex}`,
                                  ownerIndex: ownerIndex 
                                }) as FileWithCategory;
                                setFiles(prev => [...prev, fileWithCategory]);
                              }
                            }}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      {files.filter(f => f.category === `RG_CNH_${ownerIndex}`).map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiles(files.filter(f => f !== file))}
                            disabled={uploading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* CERTIDÃO DE ESTADO CIVIL */}
                  <DocumentUploadField 
                    category="CERTIDAO_ESTADO_CIVIL"
                    title="Certidão de Estado Civil"
                    icon="💍"
                    inputId="file-CERTIDAO_ESTADO_CIVIL"
                  />

                  {/* COMPROVANTE DE RESIDÊNCIA */}
                  <DocumentUploadField 
                    category="COMPROVANTE_RESIDENCIA"
                    title="Comprovante de Residência"
                    icon="📮"
                    inputId="file-COMPROVANTE_RESIDENCIA"
                  />
                </div>

                {/* Status do upload */}
                {uploading && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Enviando arquivos...</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              
              {/* Botão para upload independente de documentos */}
              {files.length > 0 && isEditing && (
                <Button 
                  type="button"
                  onClick={handleDocumentUpload}
                  disabled={uploading}
                  className="mr-2"
                >
                  {uploading ? "Enviando..." : "Atualizar Documentos"}
                </Button>
              )}
              
              <Button 
                type="submit" 
                disabled={createPropertyMutation.isPending || uploading}
              >
                {uploading 
                  ? "Enviando arquivos..." 
                  : createPropertyMutation.isPending 
                    ? (isEditing ? "Atualizando..." : "Cadastrando...") 
                    : (isEditing ? "Atualizar" : "Cadastrar")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}