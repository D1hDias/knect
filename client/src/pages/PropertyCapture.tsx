import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { PropertyModal } from "@/components/PropertyModal";
import { Skeleton } from "@/components/ui/skeleton";

interface Filters {
  status: string[];
  type: string[];
  priceRange: string;
  city: string[];
}

export default function PropertyCapture() {
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: [],
    type: [],
    priceRange: "all",
    city: [],
  });

  const { data: properties, isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  // Aplicar filtros
  const filteredProperties = properties?.filter((property: any) => {
    // Busca por texto
    const address = `${property.street || ''} ${property.number || ''} ${property.neighborhood || ''}`;
    const ownerName = property.owners && property.owners.length > 0 ? property.owners[0].fullName || '' : '';
    const type = property.type || '';
    
    const matchesSearch = address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro por status
    if (filters.status.length > 0) {
      const currentStage = property.currentStage || 1;
      const status = currentStage === 1 ? 'captacao' : currentStage === 2 ? 'analise' : 'concluido';
      if (!filters.status.includes(status)) return false;
    }

    // Filtro por tipo
    if (filters.type.length > 0) {
      if (!filters.type.includes(property.type)) return false;
    }

    // Filtro por cidade
    if (filters.city.length > 0) {
      if (!filters.city.includes(property.city)) return false;
    }

    // Filtro por faixa de preço
    if (filters.priceRange !== "all") {
      const value = Number(property.value);
      switch (filters.priceRange) {
        case "0-300k":
          if (value > 300000) return false;
          break;
        case "300k-500k":
          if (value < 300000 || value > 500000) return false;
          break;
        case "500k-1m":
          if (value < 500000 || value > 1000000) return false;
          break;
        case "1m+":
          if (value < 1000000) return false;
          break;
      }
    }

    return true;
  }) || [];

  // Obter valores únicos para filtros
  const uniqueTypes = [...new Set(properties?.map((p: any) => p.type) || [])];
  const uniqueCities = [...new Set(properties?.map((p: any) => p.city) || [])];

  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters(prev => {
      if (filterType === 'priceRange') {
        return { ...prev, [filterType]: value };
      } else {
        const currentValues = prev[filterType] as string[];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        return { ...prev, [filterType]: newValues };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      type: [],
      priceRange: "all",
      city: [],
    });
  };

  const getActiveFiltersCount = () => {
    return filters.status.length + 
           filters.type.length + 
           filters.city.length + 
           (filters.priceRange !== "all" ? 1 : 0);
  };

  const getStatusBadge = (currentStage: number) => {
    switch (currentStage) {
      case 1:
        return <Badge variant="outline">Em Captação</Badge>;
      case 2:
        return <Badge variant="secondary">Em Análise</Badge>;
      default:
        return <Badge>Concluído</Badge>;
    }
  };

  const getDocumentationProgress = (currentStage: number) => {
    // Simplified progress calculation based on stage
    return currentStage === 1 ? 60 : currentStage === 2 ? 85 : 100;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Captação de Imóveis</h1>
        <Button onClick={() => setShowPropertyModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Captação
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por endereço, proprietário ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    <ChevronDown className="h-4 w-4 ml-2" />
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Filtros
                    {getActiveFiltersCount() > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Status Filter */}
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filters.status.includes("captacao")}
                    onCheckedChange={() => handleFilterChange("status", "captacao")}
                  >
                    Em Captação
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.status.includes("analise")}
                    onCheckedChange={() => handleFilterChange("status", "analise")}
                  >
                    Em Análise
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.status.includes("concluido")}
                    onCheckedChange={() => handleFilterChange("status", "concluido")}
                  >
                    Concluído
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />

                  {/* Type Filter */}
                  <DropdownMenuLabel>Tipo de Imóvel</DropdownMenuLabel>
                  {uniqueTypes.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={filters.type.includes(type)}
                      onCheckedChange={() => handleFilterChange("type", type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />

                  {/* Price Range Filter */}
                  <DropdownMenuLabel>Faixa de Preço</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleFilterChange("priceRange", "all")}>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${filters.priceRange === "all" ? "bg-primary" : "bg-transparent border border-border"}`} />
                      Todos os valores
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("priceRange", "0-300k")}>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${filters.priceRange === "0-300k" ? "bg-primary" : "bg-transparent border border-border"}`} />
                      Até R$ 300.000
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("priceRange", "300k-500k")}>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${filters.priceRange === "300k-500k" ? "bg-primary" : "bg-transparent border border-border"}`} />
                      R$ 300.000 - R$ 500.000
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("priceRange", "500k-1m")}>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${filters.priceRange === "500k-1m" ? "bg-primary" : "bg-transparent border border-border"}`} />
                      R$ 500.000 - R$ 1.000.000
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("priceRange", "1m+")}>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${filters.priceRange === "1m+" ? "bg-primary" : "bg-transparent border border-border"}`} />
                      Acima de R$ 1.000.000
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* City Filter */}
                  <DropdownMenuLabel>Cidade</DropdownMenuLabel>
                  {uniqueCities.map((city) => (
                    <DropdownMenuCheckboxItem
                      key={city}
                      checked={filters.city.includes(city)}
                      onCheckedChange={() => handleFilterChange("city", city)}
                    >
                      {city}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.status.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  Status: {status === 'captacao' ? 'Em Captação' : status === 'analise' ? 'Em Análise' : 'Concluído'}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("status", status)} />
                </Badge>
              ))}
              {filters.type.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1">
                  Tipo: {type.charAt(0).toUpperCase() + type.slice(1)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("type", type)} />
                </Badge>
              ))}
              {filters.city.map((city) => (
                <Badge key={city} variant="secondary" className="gap-1">
                  Cidade: {city}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("city", city)} />
                </Badge>
              ))}
              {filters.priceRange !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Preço: {filters.priceRange === "0-300k" ? "Até R$ 300k" : 
                          filters.priceRange === "300k-500k" ? "R$ 300k - R$ 500k" :
                          filters.priceRange === "500k-1m" ? "R$ 500k - R$ 1M" : "Acima de R$ 1M"}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("priceRange", "all")} />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Imóveis em Captação ({filteredProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhum imóvel encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tente ajustar sua busca." : "Comece cadastrando seu primeiro imóvel."}
                </p>
              </div>
              {!searchTerm && (
                <Button onClick={() => setShowPropertyModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Imóvel
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documentação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property: any) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {property.type.charAt(0).toUpperCase() + property.type.slice(1)} - {property.street}, {property.number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {property.neighborhood} • R$ {Number(property.value).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.owners?.[0]?.fullName || 'Não informado'}</div>
                        <div className="text-sm text-muted-foreground">{property.owners?.[0]?.phone || 'Não informado'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(property.currentStage)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Progress value={getDocumentationProgress(property.currentStage)} className="h-2" />
                        <div className="text-sm text-muted-foreground">
                          {getDocumentationProgress(property.currentStage)}% completo
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PropertyModal 
        open={showPropertyModal} 
        onOpenChange={setShowPropertyModal} 
      />
    </div>
  );
}
