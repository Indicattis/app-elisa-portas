import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { useVendasPedidos } from "@/hooks/useVendasPedidos";
import { VendasList } from "@/components/pedidos/VendasList";
import { PedidoDetails } from "@/components/pedidos/PedidoDetails";
import { useToast } from "@/hooks/use-toast";

export default function Pedidos() {
  const { toast } = useToast();
  const {
    vendas,
    selectedVendaId,
    setSelectedVendaId,
    pedidoAtual,
    ordens,
    criarPedidoPrincipal,
    adicionarLinha,
    removerLinha,
    confirmarPreenchimento,
    gerarOrdens,
  } = useVendasPedidos();

  const handleCriarPedido = async () => {
    if (!selectedVendaId) return;
    await criarPedidoPrincipal(selectedVendaId);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Produção</h1>
          <p className="text-muted-foreground">Gerencie pedidos e ordens de produção</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <VendasList vendas={vendas} selectedVendaId={selectedVendaId} onSelectVenda={setSelectedVendaId} />
        </div>

        <div className="lg:col-span-2">
          {!selectedVendaId ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Selecione uma Venda</h3>
              <p className="text-muted-foreground">Escolha uma venda na lista ao lado</p>
            </Card>
          ) : !pedidoAtual ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Nenhum Pedido Principal</h3>
              <Button size="lg" onClick={handleCriarPedido}><Package className="h-5 w-5 mr-2" />Gerar Pedido Principal</Button>
            </Card>
          ) : (
            <PedidoDetails
              pedido={pedidoAtual}
              ordens={ordens}
              onAdicionarLinha={(linha) => adicionarLinha({ pedidoId: pedidoAtual.id, linha })}
              onRemoverLinha={removerLinha}
              onConfirmarPreenchimento={() => confirmarPreenchimento(pedidoAtual.id)}
              onGerarOrdens={(tipos) => gerarOrdens({ pedidoId: pedidoAtual.id, tipos })}
              onDownloadPDF={() => toast({ title: "PDF em desenvolvimento" })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
