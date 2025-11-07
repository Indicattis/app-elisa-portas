import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { QuickFiltersBar } from "@/components/vendas/QuickFiltersBar";

interface InstalacoesFiltrosProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterEstado: string;
  onFilterEstadoChange: (value: string) => void;
  estados: string[];
  quickFilter: string;
  onQuickFilterChange: (value: string) => void;
}

export function InstalacoesFiltros({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterEstado,
  onFilterEstadoChange,
  estados,
  quickFilter,
  onQuickFilterChange,
}: InstalacoesFiltrosProps) {
  
  const quickFilters = [
    { id: "all", label: "Todas", active: quickFilter === "all" },
    { id: "pendentes", label: "Pendentes", active: quickFilter === "pendentes" },
    { id: "prontas", label: "Prontas", active: quickFilter === "prontas" },
    { id: "concluidas", label: "Concluídas", active: quickFilter === "concluidas" },
    { id: "sem_responsavel", label: "Sem Responsável", active: quickFilter === "sem_responsavel" },
    { id: "atrasadas", label: "Atrasadas", active: quickFilter === "atrasadas" },
  ];

  const handleQuickFilterToggle = (filterId: string) => {
    if (filterId === quickFilter) {
      onQuickFilterChange("all");
    } else {
      onQuickFilterChange(filterId);
      // Resetar o filtro de status quando um quick filter é selecionado
      if (filterId !== "all") {
        onFilterStatusChange("all");
      }
    }
  };

  const handleClearFilters = () => {
    onSearchChange("");
    onFilterStatusChange("all");
    onFilterEstadoChange("all");
    onQuickFilterChange("all");
  };

  return (
    <div className="space-y-4">
      {/* Linha 1: Busca e Selects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou telefone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Select de Status */}
        <Select 
          value={filterStatus} 
          onValueChange={(value) => {
            onFilterStatusChange(value);
            if (value !== "all") {
              onQuickFilterChange("all");
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pendente_producao">Pendente Produção</SelectItem>
            <SelectItem value="pronta_fabrica">Pronta Fábrica</SelectItem>
            <SelectItem value="finalizada">Finalizada</SelectItem>
          </SelectContent>
        </Select>

        {/* Select de Estado */}
        <Select value={filterEstado} onValueChange={onFilterEstadoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Estados</SelectItem>
            {estados.map((estado) => (
              <SelectItem key={estado} value={estado}>
                {estado}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Linha 2: Quick Filters */}
      <QuickFiltersBar
        filters={quickFilters}
        onFilterToggle={handleQuickFilterToggle}
        onClearAll={handleClearFilters}
      />
    </div>
  );
}
