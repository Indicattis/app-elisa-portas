import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoFiltrosProps {
  tipoOrdem: string;
  setTipoOrdem: (tipo: string) => void;
  dataInicio?: Date;
  setDataInicio: (data?: Date) => void;
  dataFim?: Date;
  setDataFim: (data?: Date) => void;
  busca: string;
  setBusca: (busca: string) => void;
}

export function HistoricoFiltros({
  tipoOrdem,
  setTipoOrdem,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  busca,
  setBusca,
}: HistoricoFiltrosProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <Label htmlFor="tipo-ordem">Tipo de Ordem</Label>
        <Select value={tipoOrdem} onValueChange={setTipoOrdem}>
          <SelectTrigger id="tipo-ordem">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="soldagem">Soldagem</SelectItem>
            <SelectItem value="perfiladeira">Perfiladeira</SelectItem>
            <SelectItem value="separacao">Separação</SelectItem>
            <SelectItem value="qualidade">Qualidade</SelectItem>
            <SelectItem value="pintura">Pintura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="data-inicio">Data Início</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="data-inicio"
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dataInicio}
              onSelect={setDataInicio}
              locale={ptBR}
            />
            {dataInicio && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setDataInicio(undefined)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="data-fim">Data Fim</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="data-fim"
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dataFim}
              onSelect={setDataFim}
              locale={ptBR}
            />
            {dataFim && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setDataFim(undefined)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="busca">Buscar</Label>
        <Input
          id="busca"
          placeholder="Cliente, nº ordem ou pedido..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
    </div>
  );
}
