import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface OrdensFiltrosProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  tipoOrdem: string;
  onTipoOrdemChange: (value: string) => void;
  mostrarHistorico: boolean;
  onMostrarHistoricoChange: (value: boolean) => void;
  onReset: () => void;
}

export function OrdensFiltros({
  search,
  onSearchChange,
  status,
  onStatusChange,
  tipoOrdem,
  onTipoOrdemChange,
  mostrarHistorico,
  onMostrarHistoricoChange,
  onReset,
}: OrdensFiltrosProps) {
  const hasActiveFilters = search || status || tipoOrdem || mostrarHistorico;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Cliente ou número..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Ordem</Label>
          <Select value={tipoOrdem} onValueChange={onTipoOrdemChange}>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="soldagem">Soldagem</SelectItem>
              <SelectItem value="perfiladeira">Perfiladeira</SelectItem>
              <SelectItem value="separacao">Separação</SelectItem>
              <SelectItem value="pintura">Pintura</SelectItem>
              <SelectItem value="qualidade">Qualidade</SelectItem>
              <SelectItem value="instalacao">Instalação</SelectItem>
              <SelectItem value="carregamento">Carregamento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="historico">Mostrar Histórico</Label>
          <div className="flex items-center space-x-2 h-10">
            <Switch
              id="historico"
              checked={mostrarHistorico}
              onCheckedChange={onMostrarHistoricoChange}
            />
            <Label htmlFor="historico" className="cursor-pointer">
              {mostrarHistorico ? 'Sim' : 'Não'}
            </Label>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
