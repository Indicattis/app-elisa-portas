import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAllUsers } from "@/hooks/useAllUsers";
import { Calendar as CalendarIcon, Filter, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ChecklistFiltrosProps {
  usuarioSelecionado: string;
  setUsuarioSelecionado: (value: string) => void;
  tipoSelecionado: string;
  setTipoSelecionado: (value: string) => void;
  statusSelecionado: string;
  setStatusSelecionado: (value: string) => void;
  dataSelecionada: Date | undefined;
  setDataSelecionada: (date: Date | undefined) => void;
}

export function ChecklistFiltros({
  usuarioSelecionado,
  setUsuarioSelecionado,
  tipoSelecionado,
  setTipoSelecionado,
  statusSelecionado,
  setStatusSelecionado,
  dataSelecionada,
  setDataSelecionada,
}: ChecklistFiltrosProps) {
  const { data: todosUsuarios } = useAllUsers();
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeFilters = [
    usuarioSelecionado !== "todos",
    tipoSelecionado !== "todos",
    statusSelecionado !== "todos",
    dataSelecionada !== undefined,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
        {/* Mobile: Collapsible */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="md:hidden">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Filtros</span>
                {activeFilters > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {activeFilters}
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Filtro de Responsável */}
              <div className="space-y-1.5">
                <Label htmlFor="usuario-mobile" className="text-xs">Responsável</Label>
                <Select value={usuarioSelecionado} onValueChange={setUsuarioSelecionado}>
                  <SelectTrigger id="usuario-mobile" className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="todos">Todos</SelectItem>
                    {todosUsuarios?.map((usuario) => (
                      <SelectItem key={usuario.user_id} value={usuario.user_id}>
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Tipo */}
              <div className="space-y-1.5">
                <Label htmlFor="tipo-mobile" className="text-xs">Tipo</Label>
                <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                  <SelectTrigger id="tipo-mobile" className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="unica">Única</SelectItem>
                    <SelectItem value="recorrente">Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Status */}
              <div className="space-y-1.5">
                <Label htmlFor="status-mobile" className="text-xs">Status</Label>
                <Select value={statusSelecionado} onValueChange={setStatusSelecionado}>
                  <SelectTrigger id="status-mobile" className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="em_andamento">Pendente</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Data */}
              <div className="space-y-1.5">
                <Label className="text-xs">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !dataSelecionada && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">
                        {dataSelecionada ? format(dataSelecionada, "dd/MM", { locale: ptBR }) : "Todas"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover" align="start">
                    <Calendar
                      mode="single"
                      selected={dataSelecionada}
                      onSelect={setDataSelecionada}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    {dataSelecionada && (
                      <div className="p-3 border-t">
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => setDataSelecionada(undefined)}
                        >
                          Limpar filtro
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Desktop: Always visible */}
        <div className="hidden md:block">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Responsável */}
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-xs">Responsável</Label>
              <Select value={usuarioSelecionado} onValueChange={setUsuarioSelecionado}>
                <SelectTrigger id="usuario">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todos os usuários</SelectItem>
                  {todosUsuarios?.map((usuario) => (
                    <SelectItem key={usuario.user_id} value={usuario.user_id}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-xs">Tipo</Label>
              <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="unica">Única</SelectItem>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs">Status</Label>
              <Select value={statusSelecionado} onValueChange={setStatusSelecionado}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="em_andamento">Pendente</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Data */}
            <div className="space-y-2">
              <Label className="text-xs">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataSelecionada && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataSelecionada ? format(dataSelecionada, "dd/MM/yyyy", { locale: ptBR }) : "Todas"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={dataSelecionada}
                    onSelect={setDataSelecionada}
                    initialFocus
                    className="pointer-events-auto"
                  />
                  {dataSelecionada && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setDataSelecionada(undefined)}
                      >
                        Limpar filtro
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}