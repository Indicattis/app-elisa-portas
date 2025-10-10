import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Package, Calendar, Search, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Venda } from "@/hooks/useVendasPedidos";
import { ProdutosIcons } from "@/components/pedidos/ProdutosIcons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface VendasListProps {
  vendas: Venda[];
  selectedVendaId: string | null;
  onSelectVenda: (vendaId: string) => void;
}

export const VendasList = ({ vendas, selectedVendaId, onSelectVenda }: VendasListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroPortasEnrolar, setFiltroPortasEnrolar] = useState(false);
  const [filtroCor, setFiltroCor] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  // Extrair cores únicas das vendas
  const coresDisponiveis = useMemo(() => {
    const cores = new Set<string>();
    vendas.forEach((venda) => {
      venda.portas_vendas?.forEach((porta) => {
        if (porta.cor) cores.add(porta.cor);
      });
    });
    return Array.from(cores).sort();
  }, [vendas]);

  // Filtrar vendas
  const vendasFiltradas = useMemo(() => {
    return vendas.filter((venda) => {
      // Filtro de pesquisa (ID, nome ou telefone)
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        venda.id.toLowerCase().includes(searchLower) ||
        venda.cliente_nome.toLowerCase().includes(searchLower) ||
        venda.cliente_telefone?.toLowerCase().includes(searchLower);

      if (!matchSearch) return false;

      // Filtro de portas de enrolar
      if (filtroPortasEnrolar) {
        const temPortaEnrolar = venda.portas_vendas?.some(
          (porta) => porta.tipo_produto?.toLowerCase().includes("enrolar")
        );
        if (!temPortaEnrolar) return false;
      }

      // Filtro de cor
      if (filtroCor) {
        const temCor = venda.portas_vendas?.some(
          (porta) => porta.cor?.toLowerCase() === filtroCor.toLowerCase()
        );
        if (!temCor) return false;
      }

      // Filtro de data
      if (dataInicio || dataFim) {
        const dataVenda = new Date(venda.created_at);
        if (dataInicio && dataVenda < dataInicio) return false;
        if (dataFim && dataVenda > dataFim) return false;
      }

      return true;
    });
  }, [vendas, searchTerm, filtroPortasEnrolar, filtroCor, dataInicio, dataFim]);

  const limparFiltros = () => {
    setSearchTerm("");
    setFiltroPortasEnrolar(false);
    setFiltroCor("");
    setDataInicio(undefined);
    setDataFim(undefined);
  };

  const temFiltrosAtivos =
    searchTerm || filtroPortasEnrolar || filtroCor || dataInicio || dataFim;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Vendas</h2>
        <Badge variant="secondary">{vendasFiltradas.length}</Badge>
      </div>

      {/* Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Buscar por ID, nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {temFiltrosAtivos && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="font-semibold">Filtros</div>

              {/* Portas de Enrolar */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enrolar"
                  checked={filtroPortasEnrolar}
                  onCheckedChange={(checked) => setFiltroPortasEnrolar(!!checked)}
                />
                <Label htmlFor="enrolar" className="cursor-pointer">
                  Somente Portas de Enrolar
                </Label>
              </div>

              {/* Filtro de Cor */}
              <div className="space-y-2">
                <Label>Cor do Produto</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={filtroCor}
                  onChange={(e) => setFiltroCor(e.target.value)}
                >
                  <option value="">Todas as cores</option>
                  {coresDisponiveis.map((cor) => (
                    <option key={cor} value={cor}>
                      {cor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro de Data */}
              <div className="space-y-2">
                <Label>Período</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        {dataInicio ? format(dataInicio, "dd/MM/yy") : "Início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dataInicio}
                        onSelect={setDataInicio}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        {dataFim ? format(dataFim, "dd/MM/yy") : "Fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dataFim}
                        onSelect={setDataFim}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {temFiltrosAtivos && (
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-2 pr-4">
          {vendasFiltradas.map((venda) => {
            const isSelected = venda.id === selectedVendaId;
            const temPedido = venda.pedidos_producao && venda.pedidos_producao.length > 0;

            return (
              <Card
                key={venda.id}
                className={`p-3 cursor-pointer transition-all duration-300 hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg scale-[1.02]"
                    : "hover:scale-[1.01]"
                }`}
                onClick={() => onSelectVenda(venda.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">
                      {venda.cliente_nome}
                    </span>
                    {temPedido && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                        Com Pedido
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(venda.created_at), "dd/MM/yy", { locale: ptBR })}
                    </div>
                    <span className="text-xs opacity-60">#{venda.id.slice(0, 8)}</span>
                  </div>

                  {venda.portas_vendas && venda.portas_vendas.length > 0 && (
                    <div className="pt-1 border-t">
                      <ProdutosIcons produtos={venda.portas_vendas} />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {vendasFiltradas.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma venda encontrada</p>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
