import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Search, Calendar, User, RotateCcw } from "lucide-react";
import { useState } from "react";


interface OrcamentoFiltersAdvanced {
  search: string;
  status: string;
  classe: string;
  atendente: string;
  dataInicio: string;
  dataFim: string;
}

interface OrcamentoFiltersAdvancedProps {
  filters: OrcamentoFiltersAdvanced;
  setFilters: (filters: OrcamentoFiltersAdvanced) => void;
  atendentes: Array<{ id: string; nome: string; }>;
}

export function OrcamentoFiltersAdvanced({ 
  filters, 
  setFilters, 
  atendentes 
}: OrcamentoFiltersAdvancedProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof OrcamentoFiltersAdvanced, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "todos",
      classe: "todas",
      atendente: "todos",
      dataInicio: "",
      dataFim: ""
    });
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-2 sm:p-3 max-h-[100px] overflow-hidden">
        <div className="flex flex-col gap-2">
          {/* Header compacto */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Filtros</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          </div>

          {/* Filtros em linha horizontal com scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {/* Buscar */}
            <div className="flex-shrink-0 w-32 sm:w-40">
              <div className="relative">
                <Search className="absolute left-1.5 top-1.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Cliente"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="h-7 pl-6 text-xs"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex-shrink-0 w-28 sm:w-36">
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  <SelectItem value="todos" className="text-xs">Todos</SelectItem>
                  <SelectItem value="pendente" className="text-xs">Em aberto</SelectItem>
                  <SelectItem value="congelado" className="text-xs">Congelado</SelectItem>
                  <SelectItem value="perdido" className="text-xs">Perdido</SelectItem>
                  <SelectItem value="vendido" className="text-xs">Vendido</SelectItem>
                  <SelectItem value="reprovado" className="text-xs">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Classe */}
            <div className="flex-shrink-0 w-28 sm:w-36">
              <Select 
                value={filters.classe} 
                onValueChange={(value) => handleFilterChange("classe", value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  <SelectItem value="todas" className="text-xs">Todas</SelectItem>
                  <SelectItem value="1" className="text-xs">Classe 1</SelectItem>
                  <SelectItem value="2" className="text-xs">Classe 2</SelectItem>
                  <SelectItem value="3" className="text-xs">Classe 3</SelectItem>
                  <SelectItem value="4" className="text-xs">Classe 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Atendente */}
            <div className="flex-shrink-0 w-32 sm:w-40">
              <Select 
                value={filters.atendente} 
                onValueChange={(value) => handleFilterChange("atendente", value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Atendente" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background max-h-[200px]">
                  <SelectItem value="todos" className="text-xs">Todos</SelectItem>
                  {atendentes.map((atendente) => (
                    <SelectItem key={atendente.id} value={atendente.id} className="text-xs">
                      {atendente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="flex-shrink-0 w-32 sm:w-36">
              <div className="relative">
                <Calendar className="absolute left-1.5 top-1.5 h-3 w-3 text-muted-foreground pointer-events-none z-10" />
                <Input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => handleFilterChange("dataInicio", e.target.value)}
                  className="h-7 pl-6 text-xs"
                />
              </div>
            </div>

            {/* Data Fim */}
            <div className="flex-shrink-0 w-32 sm:w-36">
              <div className="relative">
                <Calendar className="absolute left-1.5 top-1.5 h-3 w-3 text-muted-foreground pointer-events-none z-10" />
                <Input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => handleFilterChange("dataFim", e.target.value)}
                  className="h-7 pl-6 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}