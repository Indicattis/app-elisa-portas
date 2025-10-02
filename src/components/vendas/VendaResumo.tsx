import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortaVenda } from '@/hooks/useVendas';

interface VendaResumoProps {
  portas: PortaVenda[];
}

export function VendaResumo({ portas }: VendaResumoProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calcularTotais = () => {
    return portas.reduce(
      (acc, porta) => {
        const valorBase = porta.valor_produto + porta.valor_pintura + porta.valor_instalacao;
        const valorComDesconto = valorBase * (1 - (porta.desconto_percentual || 0) / 100);
        const valorTotal = valorComDesconto + porta.valor_frete;

        return {
          totalPortas: acc.totalPortas + 1,
          totalProdutos: acc.totalProdutos + porta.valor_produto,
          totalPintura: acc.totalPintura + porta.valor_pintura,
          totalFrete: acc.totalFrete + porta.valor_frete,
          totalInstalacao: acc.totalInstalacao + porta.valor_instalacao,
          valorTotal: acc.valorTotal + valorTotal
        };
      },
      {
        totalPortas: 0,
        totalProdutos: 0,
        totalPintura: 0,
        totalFrete: 0,
        totalInstalacao: 0,
        valorTotal: 0
      }
    );
  };

  const totais = calcularTotais();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da Venda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total de Portas:</span>
          <span className="font-semibold">{totais.totalPortas}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Valor Total de Produtos:</span>
          <span className="font-semibold">{formatCurrency(totais.totalProdutos)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Valor Total de Pintura:</span>
          <span className="font-semibold">{formatCurrency(totais.totalPintura)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Valor Total de Frete:</span>
          <span className="font-semibold">{formatCurrency(totais.totalFrete)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Valor Total de Instalação:</span>
          <span className="font-semibold">{formatCurrency(totais.totalInstalacao)}</span>
        </div>
        <div className="h-px bg-border my-2" />
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Valor Total da Venda:</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(totais.valorTotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
