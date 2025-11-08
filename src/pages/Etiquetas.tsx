import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEtiquetas } from '@/hooks/useEtiquetas';
import { PedidosList } from '@/components/etiquetas/PedidosList';
import { LinhasList } from '@/components/etiquetas/LinhasList';
import { EtiquetasDetalhes } from '@/components/etiquetas/EtiquetasDetalhes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Package2, ListChecks, Printer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { gerarPDFEtiquetas, getTotalEtiquetas } from '@/utils/etiquetasPDFGenerator';

export default function Etiquetas() {
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const [selectedLinhaId, setSelectedLinhaId] = useState<string | null>(null);
  const [filtroPedido, setFiltroPedido] = useState('');
  const [filtroLinha, setFiltroLinha] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
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

  const handleImprimirEtiquetas = async () => {
    if (!selectedPedidoId) return;

    setIsGeneratingPDF(true);
    const toastId = toast.loading('Gerando PDF de etiquetas...');

    try {
      // Buscar todas as linhas do pedido
      const linhasPedido = await buscarLinhasPedido(selectedPedidoId);

      if (!linhasPedido || linhasPedido.length === 0) {
        toast.error('Pedido sem linhas para impressão', { id: toastId });
        return;
      }

      // Calcular etiquetas para cada linha
      const calculos = linhasPedido.map(linha => calcularEtiquetas(linha));

      // Encontrar o número do pedido
      const pedidoSelecionado = pedidos.find(p => p.id === selectedPedidoId);
      const numeroPedido = pedidoSelecionado?.numero_pedido || 'N/A';

      // Gerar PDF
      const pdf = gerarPDFEtiquetas(calculos, numeroPedido);

      // Abrir PDF em nova aba
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      toast.success('PDF de etiquetas aberto em nova aba!', { id: toastId });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF de etiquetas', { id: toastId });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Calcular total de etiquetas para o pedido selecionado
  const totalEtiquetas = selectedPedidoId && linhas.length > 0
    ? getTotalEtiquetas(linhas.map(linha => calcularEtiquetas(linha)))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="h-8 w-8" />
            Etiquetas de Produção
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize e calcule a quantidade de etiquetas necessárias por pedido e linha de produção
          </p>
        </div>
        <Button
          onClick={handleImprimirEtiquetas}
          disabled={!selectedPedidoId || isGeneratingPDF}
          className="gap-2"
          size="lg"
        >
          <Printer className="h-4 w-4" />
          Imprimir Etiquetas
          {totalEtiquetas > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalEtiquetas}
            </Badge>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna 1 - Pedidos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package2 className="h-4 w-4" />
              Pedidos
            </CardTitle>
            <Input
              placeholder="Filtrar pedidos..."
              value={filtroPedido}
              onChange={(e) => setFiltroPedido(e.target.value)}
              className="h-8 text-sm"
            />
          </CardHeader>
          <CardContent className="pb-3">
            <PedidosList
              pedidos={pedidos}
              loading={loadingPedidos}
              selectedPedidoId={selectedPedidoId}
              onSelectPedido={handleSelectPedido}
              filtro={filtroPedido}
            />
          </CardContent>
        </Card>

        {/* Coluna 2 - Linhas do Pedido */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4" />
              Linhas do Pedido
            </CardTitle>
            {selectedPedidoId && (
              <Input
                placeholder="Filtrar linhas..."
                value={filtroLinha}
                onChange={(e) => setFiltroLinha(e.target.value)}
                className="h-8 text-sm"
              />
            )}
          </CardHeader>
          <CardContent className="pb-3">
            {!selectedPedidoId ? (
              <Alert className="py-2">
                <AlertDescription className="text-sm">
                  Selecione um pedido para visualizar suas linhas
                </AlertDescription>
              </Alert>
            ) : (
              <LinhasList
                linhas={linhas}
                loading={loadingLinhas}
                selectedLinhaId={selectedLinhaId}
                onSelectLinha={handleSelectLinha}
                filtro={filtroLinha}
              />
            )}
          </CardContent>
        </Card>

        {/* Coluna 3 - Detalhes de Etiquetas */}
        <div>
          {!selectedLinhaId ? (
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4" />
                  Cálculo de Etiquetas
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <Alert className="py-2">
                  <AlertDescription className="text-sm">
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
