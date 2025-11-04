import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { QuickFiltersBar } from "@/components/vendas/QuickFiltersBar";
interface EntregasFiltrosProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterEstado: string;
  onEstadoChange: (value: string) => void;
  estados: string[];
  quickFilter: string;
  onQuickFilterChange: (value: string) => void;
}
export function EntregasFiltros({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterEstado,
  onEstadoChange,
  estados,
  quickFilter,
  onQuickFilterChange
}: EntregasFiltrosProps) {
  const quickFilters = [{
    id: "all",
    label: "Todas",
    active: quickFilter === "all"
  }, {
    id: "pendentes",
    label: "Pendentes",
    active: quickFilter === "pendentes"
  }, {
    id: "em_producao",
    label: "Em Produção",
    active: quickFilter === "em_producao"
  }, {
    id: "prontas",
    label: "Prontas",
    active: quickFilter === "prontas"
  }, {
    id: "concluidas",
    label: "Concluídas",
    active: quickFilter === "concluidas"
  }, {
    id: "atrasadas",
    label: "Atrasadas",
    active: quickFilter === "atrasadas"
  }];
  const handleQuickFilterToggle = (filterId: string) => {
    if (filterId === quickFilter) {
      onQuickFilterChange("all");
    } else {
      onQuickFilterChange(filterId);
      // Reset status filter when using quick filters
      if (["pendentes", "em_producao", "prontas", "concluidas", "atrasadas"].includes(filterId)) {
        onStatusChange("all");
      }
    }
  };
  const handleClearFilters = () => {
    onQuickFilterChange("all");
    onStatusChange("all");
  };
  return <div className="space-y-4">
      
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar por cliente..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="pl-10" />
        </div>

        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pendente_producao">Pendente Produção</SelectItem>
            <SelectItem value="em_producao">Em Produção</SelectItem>
            <SelectItem value="em_qualidade">Em Qualidade</SelectItem>
            <SelectItem value="aguardando_pintura">Aguardando Pintura</SelectItem>
            <SelectItem value="pronta_fabrica">Pronta para Coleta</SelectItem>
            <SelectItem value="finalizada">Finalizada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterEstado} onValueChange={onEstadoChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Estados</SelectItem>
            {estados.map(estado => <SelectItem key={estado} value={estado}>
                {estado}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>;
}