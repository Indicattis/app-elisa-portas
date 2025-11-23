import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageCheck, Truck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntregas } from "@/hooks/useEntregas";
import { useInstalacoesCadastradas } from "@/hooks/useInstalacoesCadastradas";
import { ConfirmarCarregamentoSheet } from "@/components/entregas/ConfirmarCarregamentoSheet";
import { ConfirmarCarregamentoInstalacaoSheet } from "@/components/cadastro-instalacao/ConfirmarCarregamentoInstalacaoSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type FiltroTipo = "todos" | "entrega" | "instalacao";

export default function ProducaoCarregamento() {
  const { entregas, loading: loadingEntregas, fetchEntregas } = useEntregas();
  const { instalacoes, loading: loadingInstalacoes, fetchInstalacoes } = useInstalacoesCadastradas();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [entregaSelecionada, setEntregaSelecionada] = useState<any>(null);
  const [instalacaoSelecionada, setInstalacaoSelecionada] = useState<any>(null);
  const [sheetEntregaOpen, setSheetEntregaOpen] = useState(false);
  const [sheetInstalacaoOpen, setSheetInstalacaoOpen] = useState(false);

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
    if (item.tipo === "entrega") {
      setEntregaSelecionada(item);
      setSheetEntregaOpen(true);
    } else {
      setInstalacaoSelecionada(item);
      setSheetInstalacaoOpen(true);
    }
  };

  const handleRefresh = () => {
    fetchEntregas();
    fetchInstalacoes();
  };

  const loading = loadingEntregas || loadingInstalacoes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Carregamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Marque as coletas de entregas e instalações
          </p>
        </div>
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

      {/* Lista Unificada */}
      <Card>
        <CardContent className="p-6">
          <ScrollArea className="h-[calc(100vh-320px)]">
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
              <div className="space-y-3">
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
                        "hover:shadow-md transition-all overflow-hidden",
                        item.status !== 'pronta_fabrica' && "opacity-60"
                      )}
                    >
                      {/* HEADER */}
                      <CardHeader className="h-[40px] py-0 px-4 border-b bg-muted/30 flex items-center justify-center">
                        <div className="flex items-center justify-between w-full gap-4 h-full">
                          <div className="flex items-center gap-3 text-xs">
                            <Badge variant={item.tipo === 'entrega' ? 'default' : 'outline'} className="flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              {item.tipo === 'entrega' ? 'Entrega' : 'Instalação'}
                            </Badge>
                            <span className="font-bold">
                              {item.nome_cliente}
                            </span>
                            {item.pedido?.numero_pedido && (
                              <span className="text-muted-foreground">
                                Pedido #{item.pedido.numero_pedido}
                              </span>
                            )}
                            {data && (
                              <span className="text-muted-foreground">
                                {format(new Date(data), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          <Badge variant={item.status === 'pronta_fabrica' ? 'default' : 'secondary'}>
                            {item.status === 'pronta_fabrica' ? 'Pronta' : 'Aguardando'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      {/* BODY */}
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* LATERAL ESQUERDA - Ícone */}
                          <div className="flex-shrink-0">
                            <div className="h-[100px] w-[100px] rounded-full bg-muted/50 flex items-center justify-center">
                              <Icon className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                          </div>

                          {/* CENTRO - Informações */}
                          <div className="flex-1 space-y-3 min-w-0">
                            {responsavel && (
                              <div>
                                <p className="text-xs text-muted-foreground">Responsável</p>
                                <p className="text-sm font-semibold truncate">{responsavel}</p>
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
                          </div>

                          {/* LATERAL DIREITA - Botão */}
                          <div className="flex-shrink-0">
                            <Button
                              size="lg"
                              variant="default"
                              onClick={() => handleIniciarColeta(item)}
                              disabled={item.status !== 'pronta_fabrica'}
                              className="h-[100px] w-[100px] rounded-full flex flex-col gap-2 p-2"
                            >
                              <PackageCheck className="h-8 w-8" />
                              <span className="text-xs font-semibold">
                                {item.status === 'pronta_fabrica' ? 'Coletar' : 'Aguardar'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sheets para confirmar carregamento */}
      <ConfirmarCarregamentoSheet
        entrega={entregaSelecionada}
        open={sheetEntregaOpen}
        onOpenChange={setSheetEntregaOpen}
        onSuccess={() => {
          setSheetEntregaOpen(false);
          window.location.reload();
        }}
      />

      <ConfirmarCarregamentoInstalacaoSheet
        instalacao={instalacaoSelecionada}
        open={sheetInstalacaoOpen}
        onOpenChange={setSheetInstalacaoOpen}
        onSuccess={() => {
          setSheetInstalacaoOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
