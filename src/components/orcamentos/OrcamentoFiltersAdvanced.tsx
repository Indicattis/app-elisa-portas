import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Search, Calendar, User, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { Lead } from "@/types/lead";

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Recolher" : "Expandir"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buscar */}
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome do cliente"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Em aberto</SelectItem>
                <SelectItem value="congelado">Congelado</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
                <SelectItem value="reprovado">Venda reprovada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Classe */}
          <div className="space-y-2">
            <Label>Classe</Label>
            <Select 
              value={filters.classe} 
              onValueChange={(value) => handleFilterChange("classe", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as classes</SelectItem>
                <SelectItem value="1">Classe 1 (R$ 0 - 20k)</SelectItem>
                <SelectItem value="2">Classe 2 (R$ 20k - 50k)</SelectItem>
                <SelectItem value="3">Classe 3 (R$ 50k - 75k)</SelectItem>
                <SelectItem value="4">Classe 4 (R$ 75k+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            {/* Atendente */}
            <div className="space-y-2">
              <Label>Atendente</Label>
              <Select 
                value={filters.atendente} 
                onValueChange={(value) => handleFilterChange("atendente", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os atendentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os atendentes</SelectItem>
                  {atendentes.map((atendente) => (
                    <SelectItem key={atendente.id} value={atendente.id}>
                      {atendente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <Label>Data Início</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => handleFilterChange("dataInicio", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => handleFilterChange("dataFim", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}