import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
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
import { PropertyModal } from "@/components/PropertyModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyCapture() {
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: properties, isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  const filteredProperties = properties?.filter((property: any) =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
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
                          {property.type.charAt(0).toUpperCase() + property.type.slice(1)} - {property.address.split(',')[0]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {property.bedrooms}q • {property.bathrooms}b • {property.area}m² • R$ {Number(property.value).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.ownerName}</div>
                        <div className="text-sm text-muted-foreground">{property.ownerPhone}</div>
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
