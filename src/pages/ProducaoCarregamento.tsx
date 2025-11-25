import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageCheck, Truck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";
import { CarregamentoDownbar } from "@/components/carregamento/CarregamentoDownbar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemCarregamento } from "@/types/ordemCarregamento";

type FiltroTipo = "todos" | "elisa" | "autorizados";

export default function ProducaoCarregamento() {
  const { ordens, isLoading, concluirCarregamento } = useOrdensCarregamento();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [itemSelecionado, setItemSelecionado] = useState<OrdemCarregamento | null>(null);
  const [downbarOpen, setDownbarOpen] = useState(false);

  // Filtrar ordens pendentes ou agendadas (não concluídas)
  const ordensDisponiveis = ordens.filter(ordem => 
    !ordem.carregamento_concluido && 
    (ordem.status === 'pendente' || ordem.status === 'agendada')
  );

  // Aplicar filtro por tipo de carregamento
  const ordensFiltradas = ordensDisponiveis.filter(ordem => {
    if (filtroTipo === "todos") return true;
    return ordem.tipo_carregamento === filtroTipo;
  });

  // Ordenar por data de carregamento
  const ordensOrdenadas = ordensFiltradas.sort((a, b) => {
    const dateA = a.data_carregamento ? new Date(a.data_carregamento).getTime() : 0;
    const dateB = b.data_carregamento ? new Date(b.data_carregamento).getTime() : 0;
    return dateA - dateB;
  });

  const podeIniciarColeta = (ordem: OrdemCarregamento) => {
    return !ordem.carregamento_concluido;
  };

  const handleIniciarColeta = (ordem: OrdemCarregamento) => {
    if (!podeIniciarColeta(ordem)) return;
    setItemSelecionado(ordem);
    setDownbarOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Filtro por tipo de carregamento */}
      <Tabs value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipo)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="todos">
            Todos ({ordensOrdenadas.length})
          </TabsTrigger>
          <TabsTrigger value="elisa">
            <Truck className="h-4 w-4 mr-2" />
            Elisa ({ordensOrdenadas.filter(o => o.tipo_carregamento === 'elisa').length})
          </TabsTrigger>
          <TabsTrigger value="autorizados">
            <PackageCheck className="h-4 w-4 mr-2" />
            Autorizados ({ordensOrdenadas.filter(o => o.tipo_carregamento === 'autorizados').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid de Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : ordensOrdenadas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma ordem de carregamento pendente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordensOrdenadas.map((ordem) => {
            const podeCarregar = podeIniciarColeta(ordem);
            const Icon = ordem.tipo_carregamento === 'elisa' ? Truck : PackageCheck;

            return (
              <Card 
                key={ordem.id} 
                className={cn(
                  "hover:shadow-md transition-all cursor-pointer",
                  !podeCarregar && "opacity-60"
                )}
                onClick={() => podeCarregar && handleIniciarColeta(ordem)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={ordem.tipo_carregamento === 'elisa' ? 'default' : 'outline'} className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {ordem.tipo_carregamento === 'elisa' ? 'Elisa' : 'Autorizado'}
                        </Badge>
                        <Badge variant={podeCarregar ? 'default' : 'secondary'}>
                          {ordem.status === 'agendada' ? 'Agendada' : ordem.status}
                        </Badge>
                      </div>
                      <p className="font-bold text-base truncate">{ordem.nome_cliente}</p>
                      {ordem.pedido?.numero_pedido && (
                        <p className="text-sm text-muted-foreground">
                          Pedido #{ordem.pedido.numero_pedido}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ordem.data_carregamento && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data Agendada</p>
                      <p className="text-sm font-medium">
                        {format(new Date(ordem.data_carregamento), "dd/MM/yyyy", { locale: ptBR })}
                        {ordem.hora && ` às ${ordem.hora}`}
                      </p>
                    </div>
                  )}
                  
                  {ordem.responsavel_carregamento_nome && (
                    <div>
                      <p className="text-xs text-muted-foreground">Responsável</p>
                      <p className="text-sm truncate">{ordem.responsavel_carregamento_nome}</p>
                    </div>
                  )}

                  {ordem.venda && (
                    <div>
                      <p className="text-xs text-muted-foreground">Localização</p>
                      <p className="text-sm truncate">
                        {ordem.venda.cidade} - {ordem.venda.estado}
                      </p>
                    </div>
                  )}

                  {ordem.venda?.cliente_telefone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="text-sm">{ordem.venda.cliente_telefone}</p>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIniciarColeta(ordem);
                    }}
                    disabled={!podeCarregar}
                    className="w-full"
                  >
                    <PackageCheck className="h-4 w-4 mr-2" />
                    {podeCarregar ? 'Iniciar Coleta' : 'Aguardando'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Downbar para confirmar carregamento */}
      {itemSelecionado && (
        <CarregamentoDownbar
          ordem={itemSelecionado}
          open={downbarOpen}
          onOpenChange={setDownbarOpen}
          onConcluir={concluirCarregamento}
          onSuccess={() => {
            setDownbarOpen(false);
            setItemSelecionado(null);
          }}
        />
      )}
    </div>
  );
}
