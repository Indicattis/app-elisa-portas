import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, MapPin, Hash, Package } from "lucide-react";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { LinhasCategorizadas } from "@/components/pedidos/LinhasCategorizadas";
import { useEffect } from "react";

export default function PedidoPreparacao() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: pedido, isLoading: pedidoLoading } = useQuery({
    queryKey: ['pedido-preparacao', id],
    queryFn: async () => {
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos_producao')
        .select('*')
        .eq('id', id)
        .single();

      if (pedidoError) throw pedidoError;

      // Buscar venda separadamente
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .select(`
          *,
          produtos_vendas (*)
        `)
        .eq('id', pedidoData.venda_id)
        .single();

      if (vendaError) throw vendaError;

      return {
        ...pedidoData,
        vendas: vendaData
      };
    },
    enabled: !!id
  });

  const {
    linhas,
    isLoading: linhasLoading,
    adicionarLinha,
    removerLinha,
    popularLinhasSeparacao,
  } = usePedidoLinhas(id || '');

  // Popular automaticamente linhas de separação ao carregar
  useEffect(() => {
    if (pedido?.venda_id && linhas.length === 0) {
      popularLinhasSeparacao(pedido.venda_id).catch(() => {
        // Silenciar erro se já existirem linhas
      });
    }
  }, [pedido?.venda_id, linhas.length]);

  if (pedidoLoading || linhasLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-sm text-muted-foreground">Pedido não encontrado</p>
        <Button onClick={() => navigate('/dashboard/pedidos')} variant="outline" size="sm">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Voltar
        </Button>
      </div>
    );
  }

  const venda = pedido.vendas;
  const produtos = venda?.produtos_vendas || [];
  const portasEnrolar = produtos.filter((p: any) => 
    p.tipo_produto === 'porta_enrolar' && p.medidas
  );

  const calcularPeso = (medidas: string) => {
    const match = medidas.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/);
    if (!match) return null;
    const largura = parseFloat(match[1]);
    const altura = parseFloat(match[2]);
    return (largura * altura * 3).toFixed(1);
  };

  const calcularMeiaCanas = (medidas: string) => {
    const match = medidas.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/);
    if (!match) return null;
    const altura = parseFloat(match[2]);
    return Math.ceil(altura / 0.08);
  };

  const isReadOnly = pedido.etapa_atual !== 'aberto';

  return (
    <div className="container mx-auto py-4 space-y-3 max-w-6xl">
      {/* Header Compacto */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/pedidos')}
            className="h-8"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Voltar
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-base font-semibold">Preparação {pedido.numero_pedido}</h1>
        </div>
        <Badge variant="secondary" className="text-xs">
          {pedido.etapa_atual}
        </Badge>
      </div>

      {/* Grid Cliente/Pedido Compacto */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            <div className="flex items-start gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{venda?.cliente_nome}</p>
              </div>
            </div>
            {venda?.cliente_telefone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">{venda.cliente_telefone}</p>
              </div>
            )}
            {(venda?.cep || venda?.cidade) && (
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {venda.cep && `${venda.cep} - `}
                  {venda.bairro && `${venda.bairro}, `}
                  {venda.cidade && `${venda.cidade}`}
                  {venda.estado && `/${venda.estado}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Número</p>
                <p className="font-medium">{pedido.numero_pedido}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Venda</p>
                <p className="font-medium">#{pedido.numero_pedido}</p>
              </div>
              {venda?.valor_venda && (
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valor_venda)}
                  </p>
                </div>
              )}
              {venda?.created_at && (
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos da Venda (Portas Enrolar) */}
      {portasEnrolar.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Produtos da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            {portasEnrolar.map((produto: any, idx: number) => {
              const peso = calcularPeso(produto.medidas);
              const meiaCanas = calcularMeiaCanas(produto.medidas);

              return (
                <Card key={produto.id} className="p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        [{idx + 1}] {produto.descricao}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Qtd: {produto.quantidade}</span>
                        {peso && <span>⚖️ Peso: {peso}kg</span>}
                        {meiaCanas && <span>📏 Meia canas: {meiaCanas}un</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Linhas Categorizadas */}
      <LinhasCategorizadas
        linhas={linhas}
        isReadOnly={isReadOnly}
        onAdicionarLinha={adicionarLinha}
        onRemoverLinha={removerLinha}
      />

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/pedidos')}
          size="sm"
        >
          Voltar
        </Button>
      </div>
    </div>
  );
}
