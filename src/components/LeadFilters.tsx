import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

interface FilterValues {
  search: string;
  status: string;
  atendente: string;
  cidade: string;
  dataInicio: string;
  dataFim: string;
}

interface LeadFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  atendentes: Map<string, string>;
  cidades: string[];
}

export function LeadFilters({ filters, onFiltersChange, atendentes, cidades }: LeadFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "",
      atendente: "",
      cidade: "",
      dataInicio: "",
      dataFim: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const statusOptions = [
    { value: "novo", label: "Novo", variant: "default" as const },
    { value: "aguardando", label: "Aguardando", variant: "secondary" as const },
    { value: "em_andamento", label: "Em Andamento", variant: "default" as const },
    { value: "pausado", label: "Pausado", variant: "outline" as const },
    { value: "vendido", label: "Vendido", variant: "default" as const },
    { value: "cancelado", label: "Cancelado", variant: "destructive" as const },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca sempre visível */}
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Filtros de status com botões */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.status === "" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("status", "")}
            >
              Todos
            </Button>
            {statusOptions.map((status) => (
              <Button
                key={status.value}
                variant={filters.status === status.value ? status.variant : "outline"}
                size="sm"
                onClick={() => handleFilterChange("status", status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Filtros expandidos */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="aguardando">Aguardando Atendimento</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="atendente">Atendente</Label>
              <Select value={filters.atendente} onValueChange={(value) => handleFilterChange("atendente", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os atendentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os atendentes</SelectItem>
                  <SelectItem value="sem_atendente">Sem atendente</SelectItem>
                  {Array.from(atendentes.entries()).map(([id, nome]) => (
                    <SelectItem key={id} value={id}>{nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Select value={filters.cidade} onValueChange={(value) => handleFilterChange("cidade", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as cidades</SelectItem>
                  {cidades.map((cidade) => (
                    <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filters.dataInicio}
                onChange={(e) => handleFilterChange("dataInicio", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filters.dataFim}
                onChange={(e) => handleFilterChange("dataFim", e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}