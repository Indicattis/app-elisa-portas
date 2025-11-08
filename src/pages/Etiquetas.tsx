import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEtiquetas } from '@/hooks/useEtiquetas';
import { PedidosList } from '@/components/etiquetas/PedidosList';
import { LinhasList } from '@/components/etiquetas/LinhasList';
import { TagsList } from '@/components/etiquetas/TagsList';
import { Package2, ListChecks } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

export default function Etiquetas() {
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const [selectedLinhaId, setSelectedLinhaId] = useState<string | null>(null);
  const [filtroPedido, setFiltroPedido] = useState('');
  const [filtroLinha, setFiltroLinha] = useState('');
  
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

  const pedidoSelecionado = pedidos.find(p => p.id === selectedPedidoId);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-6 bg-card">
        <div>
          <h1 className="text-3xl font-bold mb-2">Etiquetas de Produção</h1>
          <p className="text-muted-foreground">
            Selecione um pedido e uma linha para imprimir etiquetas individuais
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-3 overflow-hidden">
        {/* Column 1: Orders */}
        <div className="border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              Pedidos
            </h2>
            <Input
              placeholder="Filtrar pedidos..."
              value={filtroPedido}
              onChange={(e) => setFiltroPedido(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <PedidosList
              pedidos={pedidos}
              loading={loadingPedidos}
              selectedPedidoId={selectedPedidoId}
              onSelectPedido={handleSelectPedido}
              filtro={filtroPedido}
            />
          </div>
        </div>

        {/* Column 2: Lines */}
        <div className="border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Linhas do Pedido
            </h2>
            {selectedPedidoId && (
              <Input
                placeholder="Filtrar linhas..."
                value={filtroLinha}
                onChange={(e) => setFiltroLinha(e.target.value)}
                className="h-8"
              />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {!selectedPedidoId ? (
              <div className="p-6">
                <Alert>
                  <AlertDescription>
                    Selecione um pedido para visualizar suas linhas
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <LinhasList
                linhas={linhas}
                loading={loadingLinhas}
                selectedLinhaId={selectedLinhaId}
                onSelectLinha={handleSelectLinha}
                filtro={filtroLinha}
              />
            )}
          </div>
        </div>

        {/* Column 3: Individual Tags */}
        <div className="bg-card">
          {!selectedLinhaId ? (
            <div className="p-6">
              <Alert>
                <AlertDescription>
                  Selecione uma linha do pedido para ver as etiquetas
                </AlertDescription>
              </Alert>
            </div>
          ) : calculoEtiquetas ? (
            <TagsList 
              calculo={calculoEtiquetas} 
              numeroPedido={pedidoSelecionado?.numero_pedido || 'N/A'}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
