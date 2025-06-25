import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { CloudUpload, Plus, Trash2 } from "lucide-react";
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
  id: z.string(),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(11, "CPF é obrigatório"),
  rg: z.string().min(1, "RG/CNH é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  maritalStatus: z.string().min(1, "Estado civil é obrigatório"),
  fatherName: z.string().min(1, "Nome do pai é obrigatório"),
  motherName: z.string().min(1, "Nome da mãe é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
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
  registrationNumber: z.string().min(1, "Número da matrícula é obrigatório"),
  municipalRegistration: z.string().min(1, "Inscrição Municipal é obrigatória"),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyModal({ open, onOpenChange }: PropertyModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [owners, setOwners] = useState([{
    id: crypto.randomUUID(),
    fullName: '',
    cpf: '',
    rg: '',
    birthDate: '',
    maritalStatus: '',
    fatherName: '',
    motherName: '',
    phone: '',
    email: ''
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
        rg: '',
        birthDate: '',
        maritalStatus: '',
        fatherName: '',
        motherName: '',
        phone: '',
        email: ''
      }],
      registrationNumber: "",
      municipalRegistration: "",
    },
  });

  const addOwner = () => {
    const newOwner = {
      id: crypto.randomUUID(),
      fullName: '',
      cpf: '',
      rg: '',
      birthDate: '',
      maritalStatus: '',
      fatherName: '',
      motherName: '',
      phone: '',
      email: ''
    };
    const currentOwners = form.getValues('owners');
    form.setValue('owners', [...currentOwners, newOwner]);
    setOwners([...owners, newOwner]);
  };

  const removeOwner = (ownerId: string) => {
    if (owners.length > 1) {
      const updatedOwners = owners.filter(owner => owner.id !== ownerId);
      setOwners(updatedOwners);
      form.setValue('owners', updatedOwners);
    }
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) return null;
      
      return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      };
    } catch (error) {
      return null;
    }
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se não tem números, retorna 0,00
    if (!numbers || numbers === '') {
      return '0,00';
    } 

    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers) / 100;
    
    // Se o resultado é NaN ou inválido, retorna 0,00
    if (isNaN(amount)) {
      return '0,00';
    }

    // Formata como moeda brasileira
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const propertyData = {
        ...data,
        value: data.value,
      };
      
      return await apiRequest("POST", "/api/properties", propertyData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Imóvel cadastrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent"] });
      onOpenChange(false);
      form.reset();
      setFiles([]);
      setOwners([{
        id: crypto.randomUUID(),
        fullName: '',
        cpf: '',
        rg: '',
        birthDate: '',
        maritalStatus: '',
        fatherName: '',
        motherName: '',
        phone: '',
        email: ''
      }]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar imóvel.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PropertyFormData) => {
    createPropertyMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Captação de Imóvel</DialogTitle>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <SelectItem value="outo">Outro</SelectItem>
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
                    <FormLabel>Valor de Venda (R$)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium">
                          R$
                        </span>
                        <Input 
                          placeholder="0,00"
                          {...field}
                          className="pl-8"
                          onChange={(e) => {
                            const formatted = formatCurrency(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-medium mb-4">Endereço Completo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto 123" {...field} />
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
                        <Input placeholder="Digite aqui..." {...field} />
                      </FormControl>
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
                        <Input placeholder="Digite aqui..." {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
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
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-medium">Dados do(s) Proprietário(s)</h3>

              {owners.map((owner, index) => (
                <div key={owner.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">
                      Proprietário {index + 1}
                      {index > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Cônjuge, Familiar, etc.)
                        </span>
                      )}
                    </h4>
                    {owners.length > 1 && (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`owners.${index}.fullName`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                    <FormField
                      control={form.control}
                      name={`owners.${index}.rg`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG/CNH</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`owners.${index}.birthDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`owners.${index}.maritalStatus`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado Civil</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                              <SelectItem value="casado">Casado(a)</SelectItem>
                              <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                              <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                              <SelectItem value="separado">Separado(a)</SelectItem>
                              <SelectItem value="uniao-estavel">União Estável</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`owners.${index}.fatherName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Pai</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`owners.${index}.motherName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Mãe</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                    <FormField
                      control={form.control}
                      name={`owners.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="exemplo@email.com" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addOwner}
                      className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 font-medium px-3 py-1 text-sm"
                    >
                      <Plus className="h-3 w-3" />
                      Adicionar Proprietário
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Documentação do Imóvel</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Matrícula</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Upload de Documentos</h3>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <CloudUpload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="mb-2 font-medium">Clique aqui ou arraste arquivos para fazer upload</p>
                <p className="text-sm text-muted-foreground mb-4">PDF, JPG, PNG até 10MB cada</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  Selecionar Arquivos
                </Button>
                {files.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm font-medium mb-2">Arquivos selecionados:</p>
                    <ul className="text-xs space-y-1">
                      {files.map((file, index) => (
                        <li key={index} className="text-muted-foreground">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPropertyMutation.isPending}>
                {createPropertyMutation.isPending ? "Salvando..." : "Salvar Captação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}