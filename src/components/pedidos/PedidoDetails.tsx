import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, User, Phone, FileText, Plus, CheckCircle2 } from "lucide-react";
import { Pedido } from "@/hooks/useVendasPedidos";
import { PedidoLinhasEditor } from "./PedidoLinhasEditor";
import { type PedidoLinha as PedidoLinhaCompleta } from "@/hooks/usePedidoLinhas";
import { GerarOrdemButton } from "./GerarOrdemButton";
import { OrdemCard } from "./OrdemCard";

interface PedidoDetailsProps {
  pedido: Pedido;
  ordens: any[];
  onAdicionarLinha: (linha: any) => Promise<any>;
  onRemoverLinha: (linhaId: string) => Promise<void>;
  onConfirmarPreenchimento: () => Promise<void>;
  onGerarOrdens: (tipos: string[]) => Promise<void>;
  onConcluirOrdem: (ordemId: string, tipo: string) => Promise<void>;
  onDarBaixa: () => Promise<void>;
  onDownloadPDF: () => void;
}

export const PedidoDetails = ({
  pedido,
  ordens,
  onAdicionarLinha,
  onRemoverLinha,
  onConfirmarPreenchimento,
  onGerarOrdens,
  onConcluirOrdem,
  onDarBaixa,
  onDownloadPDF,
}: PedidoDetailsProps) => {
  const isPendente = pedido.status_preenchimento === "pendente";
  const isPreenchido = pedido.status_preenchimento === "preenchido";
  const temLinhas = pedido.pedido_linhas && pedido.pedido_linhas.length > 0;
  const todasOrdensConcluidas = ordens.length > 0 && ordens.every((o) => o.status === "concluido");
  const podedarBaixa = todasOrdensConcluidas && pedido.status !== "concluido";

  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Pedido #{pedido.id.slice(0, 8)}</CardTitle>
                <div className="flex gap-2 mt-1">
                  <Badge variant={isPendente ? "secondary" : "default"}>
                    {isPendente ? "Pendente" : "Preenchido"}
                  </Badge>
                  <Badge variant="outline">{pedido.status}</Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onDownloadPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{pedido.cliente_nome}</span>
            </div>
            {pedido.cliente_telefone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{pedido.cliente_telefone}</span>
              </div>
            )}
            {pedido.data_entrega && (
              <div className="flex items-center gap-2 col-span-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Entrega: {new Date(pedido.data_entrega).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Produtos do Pedido
            </h3>
            
             <PedidoLinhasEditor
              linhas={pedido.pedido_linhas as unknown as PedidoLinhaCompleta[] || []}
              isReadOnly={isPreenchido}
              onAdicionarLinha={onAdicionarLinha}
              onRemoverLinha={onRemoverLinha}
            />

            {isPendente && temLinhas && (
              <Button
                className="w-full mt-4"
                onClick={onConfirmarPreenchimento}
              >
                <Plus className="h-4 w-4 mr-2" />
                Confirmar Preenchimento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isPreenchido && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Ordens de Produção</h3>
            <GerarOrdemButton onGerarOrdens={onGerarOrdens} temOrdens={ordens.length > 0} />
          </div>

          {ordens.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ordens.map((ordem) => (
                  <OrdemCard 
                    key={ordem.id} 
                    ordem={ordem} 
                    onConcluir={onConcluirOrdem}
                  />
                ))}
              </div>

              {podedarBaixa && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={onDarBaixa}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Dar Baixa no Pedido
                </Button>
              )}

              {!todasOrdensConcluidas && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ℹ️ Conclua todas as ordens de produção para liberar os checkboxes de verificação e poder dar baixa no pedido.
                  </p>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              <p>Nenhuma ordem de produção gerada ainda.</p>
              <p className="text-sm mt-2">Clique no botão acima para gerar as ordens necessárias.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
