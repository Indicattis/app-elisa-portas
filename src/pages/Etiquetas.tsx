import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEtiquetas } from '@/hooks/useEtiquetas';
import { PedidosList } from '@/components/etiquetas/PedidosList';
import { LinhasList } from '@/components/etiquetas/LinhasList';
import { EtiquetasDetalhes } from '@/components/etiquetas/EtiquetasDetalhes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Package2, ListChecks } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Etiquetas() {
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const [selectedLinhaId, setSelectedLinhaId] = useState<string | null>(null);
  
  const { pedidos, loadingPedidos, buscarLinhasPedido, calcularEtiquetas } = useEtiquetas();

  // Query para buscar linhas do pedido selecionado
  const { data: linhas = [], isLoading: loadingLinhas } = useQuery({
    queryKey: ['etiquetas-linhas', selectedPedidoId],
    queryFn: () => buscarLinhasPedido(selectedPedidoId!),
    enabled: !!selectedPedidoId,
  });

  // Encontrar a linha selecionada e calcular etiquetas
  const linhaSelecionada = linhas.find(l => l.id === selectedLinhaId);
  const calculoEtiquetas = linhaSelecionada ? calcularEtiquetas(linhaSelecionada) : null;

  const handleSelectPedido = (pedidoId: string) => {
    setSelectedPedidoId(pedidoId);
    setSelectedLinhaId(null); // Reset linha selecionada
  };

  const handleSelectLinha = (linhaId: string) => {
    setSelectedLinhaId(linhaId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Tag className="h-8 w-8" />
          Etiquetas de Produção
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualize e calcule a quantidade de etiquetas necessárias por pedido e linha de produção
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 - Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package2 className="h-5 w-5" />
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PedidosList
              pedidos={pedidos}
              loading={loadingPedidos}
              selectedPedidoId={selectedPedidoId}
              onSelectPedido={handleSelectPedido}
            />
          </CardContent>
        </Card>

        {/* Coluna 2 - Linhas do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5" />
              Linhas do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPedidoId ? (
              <Alert>
                <AlertDescription>
                  Selecione um pedido para visualizar suas linhas
                </AlertDescription>
              </Alert>
            ) : (
              <LinhasList
                linhas={linhas}
                loading={loadingLinhas}
                selectedLinhaId={selectedLinhaId}
                onSelectLinha={handleSelectLinha}
              />
            )}
          </CardContent>
        </Card>

        {/* Coluna 3 - Detalhes de Etiquetas */}
        <div>
          {!selectedLinhaId ? (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5" />
                  Cálculo de Etiquetas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    Selecione uma linha para visualizar o cálculo de etiquetas
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : calculoEtiquetas ? (
            <EtiquetasDetalhes calculo={calculoEtiquetas} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
