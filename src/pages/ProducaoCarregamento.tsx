import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageCheck, Truck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntregas } from "@/hooks/useEntregas";
import { useInstalacoesCadastradas } from "@/hooks/useInstalacoesCadastradas";
import { CarregamentoDownbar } from "@/components/carregamento/CarregamentoDownbar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type FiltroTipo = "todos" | "entrega" | "instalacao";

export default function ProducaoCarregamento() {
  const { entregas, loading: loadingEntregas, fetchEntregas } = useEntregas();
  const { instalacoes, loading: loadingInstalacoes, fetchInstalacoes } = useInstalacoesCadastradas();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  const [downbarOpen, setDownbarOpen] = useState(false);

  // Filtrar apenas entregas e instalações que precisam de carregamento
  const entregasPendentes = entregas
    ?.filter((e) => !e.entrega_concluida && e.pedido_id)
    .sort((a, b) => {
      const dateA = a.data_entrega ? new Date(a.data_entrega).getTime() : 0;
      const dateB = b.data_entrega ? new Date(b.data_entrega).getTime() : 0;
      return dateA - dateB;
    }) || [];

  const instalacoesPendentes = instalacoes
    ?.filter((i) => !i.instalacao_concluida && i.pedido_id)
    .sort((a, b) => {
      const dateA = a.data_instalacao ? new Date(a.data_instalacao).getTime() : 0;
      const dateB = b.data_instalacao ? new Date(b.data_instalacao).getTime() : 0;
      return dateA - dateB;
    }) || [];

  // Combinar entregas e instalações em uma única lista
  const carregamentosCombinados = [
    ...entregasPendentes.map(e => ({ ...e, tipo: 'entrega' as const })),
    ...instalacoesPendentes.map(i => ({ ...i, tipo: 'instalacao' as const }))
  ].sort((a, b) => {
    const dateA = a.tipo === 'entrega' 
      ? (a.data_entrega ? new Date(a.data_entrega).getTime() : 0)
      : (a.data_instalacao ? new Date(a.data_instalacao).getTime() : 0);
    const dateB = b.tipo === 'entrega'
      ? (b.data_entrega ? new Date(b.data_entrega).getTime() : 0)
      : (b.data_instalacao ? new Date(b.data_instalacao).getTime() : 0);
    return dateA - dateB;
  });

  // Aplicar filtro
  const carregamentosFiltrados = carregamentosCombinados.filter(item => {
    if (filtroTipo === "todos") return true;
    return item.tipo === filtroTipo;
  });

  const handleIniciarColeta = (item: any) => {
    setItemSelecionado(item);
    setDownbarOpen(true);
  };

  const handleRefresh = () => {
    fetchEntregas();
    fetchInstalacoes();
  };

  const loading = loadingEntregas || loadingInstalacoes;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filtro Slim */}
      <Tabs value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipo)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="todos">
            Todos ({carregamentosCombinados.length})
          </TabsTrigger>
          <TabsTrigger value="entrega">
            <PackageCheck className="h-4 w-4 mr-2" />
            Entregas ({entregasPendentes.length})
          </TabsTrigger>
          <TabsTrigger value="instalacao">
            <Truck className="h-4 w-4 mr-2" />
            Instalações ({instalacoesPendentes.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid de Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : carregamentosFiltrados.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum carregamento pendente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carregamentosFiltrados.map((item) => {
                  const Icon = item.tipo === 'entrega' ? PackageCheck : Truck;
                  const data = item.tipo === 'entrega' ? item.data_entrega : item.data_instalacao;
                  const responsavel = item.tipo === 'entrega' 
                    ? item.responsavel_entrega_nome 
                    : item.responsavel_instalacao_nome;

            return (
              <Card 
                key={item.id} 
                className={cn(
                  "hover:shadow-md transition-all cursor-pointer",
                  item.status !== 'pronta_fabrica' && "opacity-60"
                )}
                onClick={() => item.status === 'pronta_fabrica' && handleIniciarColeta(item)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={item.tipo === 'entrega' ? 'default' : 'outline'} className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {item.tipo === 'entrega' ? 'Entrega' : 'Instalação'}
                        </Badge>
                        <Badge variant={item.status === 'pronta_fabrica' ? 'default' : 'secondary'}>
                          {item.status === 'pronta_fabrica' ? 'Pronta' : 'Aguardando'}
                        </Badge>
                      </div>
                      <p className="font-bold text-base truncate">{item.nome_cliente}</p>
                      {item.pedido?.numero_pedido && (
                        <p className="text-sm text-muted-foreground">
                          Pedido #{item.pedido.numero_pedido}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="text-sm">{format(new Date(data), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                  )}
                  
                  {responsavel && (
                    <div>
                      <p className="text-xs text-muted-foreground">Responsável</p>
                      <p className="text-sm truncate">{responsavel}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground">Localização</p>
                    <p className="text-sm truncate">{item.cidade} - {item.estado}</p>
                  </div>

                  {item.telefone_cliente && (
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="text-sm">{item.telefone_cliente}</p>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIniciarColeta(item);
                    }}
                    disabled={item.status !== 'pronta_fabrica'}
                    className="w-full"
                  >
                    <PackageCheck className="h-4 w-4 mr-2" />
                    {item.status === 'pronta_fabrica' ? 'Coletar' : 'Aguardar'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Downbar para confirmar carregamento */}
      <CarregamentoDownbar
        item={itemSelecionado}
        open={downbarOpen}
        onOpenChange={setDownbarOpen}
        onSuccess={() => {
          setDownbarOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
