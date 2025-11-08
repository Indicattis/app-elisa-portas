import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageCheck, Truck, Calendar, MapPin, Phone, User } from "lucide-react";
import { useEntregas } from "@/hooks/useEntregas";
import { useInstalacoesCadastradas } from "@/hooks/useInstalacoesCadastradas";
import { ConfirmarCarregamentoSheet } from "@/components/entregas/ConfirmarCarregamentoSheet";
import { ConfirmarCarregamentoInstalacaoSheet } from "@/components/cadastro-instalacao/ConfirmarCarregamentoInstalacaoSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProducaoCarregamento() {
  const { entregas, loading: loadingEntregas } = useEntregas();
  const { instalacoes, loading: loadingInstalacoes } = useInstalacoesCadastradas();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Truck className="h-8 w-8" />
          Carregamento
        </h1>
        <p className="text-muted-foreground mt-1">
          Marque as coletas de entregas e instalações
        </p>
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
                    <Card key={entrega.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold text-lg">{entrega.nome_cliente}</h3>
                            {entrega.pedido?.numero_pedido && (
                              <Badge variant="outline" className="text-xs">
                                Pedido #{entrega.pedido.numero_pedido}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          {entrega.data_entrega && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(entrega.data_entrega), "dd 'de' MMMM", { locale: ptBR })}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{entrega.cidade} - {entrega.estado}</span>
                          </div>

                          {entrega.telefone_cliente && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{entrega.telefone_cliente}</span>
                            </div>
                          )}

                          {entrega.responsavel_entrega_nome && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{entrega.responsavel_entrega_nome}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleIniciarColeta(entrega, "entrega")}
                          className="w-full"
                          size="lg"
                        >
                          <PackageCheck className="h-5 w-5 mr-2" />
                          Iniciar Coleta
                        </Button>
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
                    <Card key={instalacao.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold text-lg">{instalacao.nome_cliente}</h3>
                            {instalacao.pedido?.numero_pedido && (
                              <Badge variant="outline" className="text-xs">
                                Pedido #{instalacao.pedido.numero_pedido}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          {instalacao.data_instalacao && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(instalacao.data_instalacao), "dd 'de' MMMM", { locale: ptBR })}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{instalacao.cidade} - {instalacao.estado}</span>
                          </div>

                          {instalacao.telefone_cliente && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{instalacao.telefone_cliente}</span>
                            </div>
                          )}

                          {instalacao.responsavel_instalacao_nome && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{instalacao.responsavel_instalacao_nome}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleIniciarColeta(instalacao, "instalacao")}
                          className="w-full"
                          size="lg"
                        >
                          <PackageCheck className="h-5 w-5 mr-2" />
                          Iniciar Coleta
                        </Button>
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
