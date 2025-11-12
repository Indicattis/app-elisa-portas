import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAllUsers } from "@/hooks/useAllUsers";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  return (
    <Card>
      <CardContent className="pt-6">
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
              <SelectContent>
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
              <SelectContent>
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
              <SelectContent>
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
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={setDataSelecionada}
                  initialFocus
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
      </CardContent>
    </Card>
  );
}
