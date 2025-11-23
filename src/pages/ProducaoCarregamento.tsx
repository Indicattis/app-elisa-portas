import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageCheck, Truck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntregas } from "@/hooks/useEntregas";
import { useInstalacoesCadastradas } from "@/hooks/useInstalacoesCadastradas";
import { ConfirmarCarregamentoSheet } from "@/components/entregas/ConfirmarCarregamentoSheet";
import { ConfirmarCarregamentoInstalacaoSheet } from "@/components/cadastro-instalacao/ConfirmarCarregamentoInstalacaoSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProducaoCarregamento() {
  const { entregas, loading: loadingEntregas, fetchEntregas } = useEntregas();
  const { instalacoes, loading: loadingInstalacoes, fetchInstalacoes } = useInstalacoesCadastradas();

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

  const handleIniciarColeta = (item: any, tipo: "entrega" | "instalacao") => {
    if (tipo === "entrega") {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna de Entregas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5" />
                Entregas
              </div>
              <Badge variant="secondary">{entregasPendentes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-280px)]">
              {loadingEntregas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : entregasPendentes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PackageCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma entrega pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entregasPendentes.map((entrega) => (
                    <Card 
                      key={entrega.id} 
                      className={cn(
                        "hover:shadow-md transition-all overflow-hidden",
                        entrega.status !== 'pronta_fabrica' && "opacity-60"
                      )}
                    >
                      {/* HEADER */}
                      <CardHeader className="h-[40px] py-0 px-4 border-b bg-muted/30 flex items-center justify-center">
                        <div className="flex items-center justify-between w-full gap-4 h-full">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-bold">
                              {entrega.nome_cliente}
                            </span>
                            {entrega.pedido?.numero_pedido && (
                              <span className="text-muted-foreground">
                                Pedido #{entrega.pedido.numero_pedido}
                              </span>
                            )}
                            {entrega.data_entrega && (
                              <span className="text-muted-foreground">
                                {format(new Date(entrega.data_entrega), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          <Badge variant={entrega.status === 'pronta_fabrica' ? 'default' : 'secondary'}>
                            {entrega.status === 'pronta_fabrica' ? 'Pronta' : 'Aguardando'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      {/* BODY */}
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* LATERAL ESQUERDA - Ícone */}
                          <div className="flex-shrink-0">
                            <div className="h-[100px] w-[100px] rounded-full bg-muted/50 flex items-center justify-center">
                              <PackageCheck className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                          </div>

                          {/* CENTRO - Informações */}
                          <div className="flex-1 space-y-3 min-w-0">
                            {entrega.responsavel_entrega_nome && (
                              <div>
                                <p className="text-xs text-muted-foreground">Responsável</p>
                                <p className="text-sm font-semibold truncate">{entrega.responsavel_entrega_nome}</p>
                              </div>
                            )}

                            <div>
                              <p className="text-xs text-muted-foreground">Localização</p>
                              <p className="text-sm truncate">{entrega.cidade} - {entrega.estado}</p>
                            </div>

                            {entrega.telefone_cliente && (
                              <div>
                                <p className="text-xs text-muted-foreground">Telefone</p>
                                <p className="text-sm">{entrega.telefone_cliente}</p>
                              </div>
                            )}
                          </div>

                          {/* LATERAL DIREITA - Botão */}
                          <div className="flex-shrink-0">
                            <Button
                              size="lg"
                              variant="default"
                              onClick={() => handleIniciarColeta(entrega, "entrega")}
                              disabled={entrega.status !== 'pronta_fabrica'}
                              className="h-[100px] w-[100px] rounded-full flex flex-col gap-2 p-2"
                            >
                              <PackageCheck className="h-8 w-8" />
                              <span className="text-xs font-semibold">
                                {entrega.status === 'pronta_fabrica' ? 'Coletar' : 'Aguardar'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Coluna de Instalações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Instalações
              </div>
              <Badge variant="secondary">{instalacoesPendentes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-280px)]">
              {loadingInstalacoes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : instalacoesPendentes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma instalação pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {instalacoesPendentes.map((instalacao) => (
                    <Card 
                      key={instalacao.id} 
                      className={cn(
                        "hover:shadow-md transition-all overflow-hidden",
                        instalacao.status !== 'pronta_fabrica' && "opacity-60"
                      )}
                    >
                      {/* HEADER */}
                      <CardHeader className="h-[40px] py-0 px-4 border-b bg-muted/30 flex items-center justify-center">
                        <div className="flex items-center justify-between w-full gap-4 h-full">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-bold">
                              {instalacao.nome_cliente}
                            </span>
                            {instalacao.pedido?.numero_pedido && (
                              <span className="text-muted-foreground">
                                Pedido #{instalacao.pedido.numero_pedido}
                              </span>
                            )}
                            {instalacao.data_instalacao && (
                              <span className="text-muted-foreground">
                                {format(new Date(instalacao.data_instalacao), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          <Badge variant={instalacao.status === 'pronta_fabrica' ? 'default' : 'secondary'}>
                            {instalacao.status === 'pronta_fabrica' ? 'Pronta' : 'Aguardando'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      {/* BODY */}
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* LATERAL ESQUERDA - Ícone */}
                          <div className="flex-shrink-0">
                            <div className="h-[100px] w-[100px] rounded-full bg-muted/50 flex items-center justify-center">
                              <Truck className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                          </div>

                          {/* CENTRO - Informações */}
                          <div className="flex-1 space-y-3 min-w-0">
                            {instalacao.responsavel_instalacao_nome && (
                              <div>
                                <p className="text-xs text-muted-foreground">Responsável</p>
                                <p className="text-sm font-semibold truncate">{instalacao.responsavel_instalacao_nome}</p>
                              </div>
                            )}

                            <div>
                              <p className="text-xs text-muted-foreground">Localização</p>
                              <p className="text-sm truncate">{instalacao.cidade} - {instalacao.estado}</p>
                            </div>

                            {instalacao.telefone_cliente && (
                              <div>
                                <p className="text-xs text-muted-foreground">Telefone</p>
                                <p className="text-sm">{instalacao.telefone_cliente}</p>
                              </div>
                            )}
                          </div>

                          {/* LATERAL DIREITA - Botão */}
                          <div className="flex-shrink-0">
                            <Button
                              size="lg"
                              variant="default"
                              onClick={() => handleIniciarColeta(instalacao, "instalacao")}
                              disabled={instalacao.status !== 'pronta_fabrica'}
                              className="h-[100px] w-[100px] rounded-full flex flex-col gap-2 p-2"
                            >
                              <PackageCheck className="h-8 w-8" />
                              <span className="text-xs font-semibold">
                                {instalacao.status === 'pronta_fabrica' ? 'Coletar' : 'Aguardar'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

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
