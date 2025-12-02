import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface OrdensFiltrosProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  tipoOrdem: string;
  onTipoOrdemChange: (value: string) => void;
  onReset: () => void;
}

export function OrdensFiltros({
  search,
  onSearchChange,
  status,
  onStatusChange,
  tipoOrdem,
  onTipoOrdemChange,
  onReset,
}: OrdensFiltrosProps) {
  const hasActiveFilters = search || status !== "todos" || tipoOrdem !== "todos";

  return (
    <div className="bg-card border rounded-lg p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente ou pedido..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tipoOrdem} onValueChange={onTipoOrdemChange}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Tipos</SelectItem>
            <SelectItem value="soldagem">Soldagem</SelectItem>
            <SelectItem value="perfiladeira">Perfiladeira</SelectItem>
            <SelectItem value="separacao">Separação</SelectItem>
            <SelectItem value="pintura">Pintura</SelectItem>
            <SelectItem value="qualidade">Qualidade</SelectItem>
            <SelectItem value="instalacao">Instalação</SelectItem>
            <SelectItem value="carregamento">Carregamento</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
