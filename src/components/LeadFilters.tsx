import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { leadTags } from "@/utils/leadTags";
interface FilterValues {
  search: string;
  status: string;
  atendente: string;
  cidade: string;
  dataInicio: string;
  dataFim: string;
  etiqueta: string;
}
interface LeadFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  atendentes: Map<string, string>;
  cidades: string[];
}
export function LeadFilters({
  filters,
  onFiltersChange,
  atendentes,
  cidades
}: LeadFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    // Converter "all" de volta para string vazia para etiqueta
    const finalValue = key === "etiqueta" && value === "all" ? "" : value;
    onFiltersChange({
      ...filters,
      [key]: finalValue
    });
  };
  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "",
      atendente: "",
      cidade: "",
      dataInicio: "",
      dataFim: "",
      etiqueta: ""
    });
  };
  const hasActiveFilters = Object.values(filters).some(value => value !== "");
  const statusOptions = [{
    value: "aguardando_atendente",
    label: "Aguardando atendente",
    variant: "secondary" as const
  }, {
    value: "em_andamento",
    label: "Em andamento",
    variant: "default" as const
  }, {
    value: "aguardando_aprovacao_venda",
    label: "Aguardando aprovação de venda",
    variant: "outline" as const
  }, {
    value: "vendido",
    label: "Vendido",
    variant: "default" as const
  }, {
    value: "venda_perdida",
    label: "Venda perdida",
    variant: "destructive" as const
  }, {
    value: "desqualificado",
    label: "Desqualificado",
    variant: "destructive" as const
  }, {
    value: "pausado",
    label: "Pausado",
    variant: "outline" as const
  }];

  // Converter string vazia para "all" para o componente Select
  const etiquetaValue = filters.etiqueta === "" ? "all" : filters.etiqueta;
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
          <div className="flex gap-2">
            {hasActiveFilters && <Button variant="outline" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>}
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Menos filtros" : "Mais filtros"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca sempre visível */}
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou telefone..." value={filters.search} onChange={e => handleFilterChange("search", e.target.value)} className="max-w-md" />
        </div>

        {/* Filtro de etiqueta sempre visível */}
        <div className="space-y-2">
          <Label htmlFor="etiqueta">Etiqueta</Label>
          <Select value={etiquetaValue} onValueChange={value => handleFilterChange("etiqueta", value)}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Todas as etiquetas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etiquetas</SelectItem>
              {leadTags.map(tag => <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{
                  backgroundColor: tag.bgColor
                }} />
                    {tag.name}
                  </div>
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Filtros de status com botões */}
        

        {/* Filtros expandidos */}
        {isExpanded && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="atendente">Atendente</Label>
              <Select value={filters.atendente} onValueChange={value => handleFilterChange("atendente", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os atendentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_attendants">Todos os atendentes</SelectItem>
                  <SelectItem value="sem_atendente">Sem atendente</SelectItem>
                  {Array.from(atendentes.entries()).map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Select value={filters.cidade} onValueChange={value => handleFilterChange("cidade", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_cities">Todas as cidades</SelectItem>
                  {cidades.map(cidade => <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input id="dataInicio" type="date" value={filters.dataInicio} onChange={e => handleFilterChange("dataInicio", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input id="dataFim" type="date" value={filters.dataFim} onChange={e => handleFilterChange("dataFim", e.target.value)} />
            </div>
          </div>}
      </CardContent>
    </Card>;
}