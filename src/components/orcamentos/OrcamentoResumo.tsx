import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrcamentoProduto } from '@/types/produto';

interface OrcamentoResumoProps {
  produtos: OrcamentoProduto[];
  valorFrete?: number;
}

export function OrcamentoResumo({ produtos, valorFrete = 0 }: OrcamentoResumoProps) {
  const totais = produtos.reduce((acc, produto) => {
    const valorBase = produto.valor * (produto.quantidade || 1);
    const valorPintura = (produto.valor_pintura || 0) * (produto.quantidade || 1);
    const valorInstalacao = (produto.preco_instalacao || 0) * (produto.quantidade || 1);
    
    const descontoAplicado = produto.tipo_desconto === 'valor' 
      ? (produto.desconto_valor || 0)
      : (valorBase + valorPintura + valorInstalacao) * ((produto.desconto_percentual || 0) / 100);
    
    const valorFinal = valorBase + valorPintura + valorInstalacao - descontoAplicado;
    
    return {
      produto: acc.produto + valorBase,
      pintura: acc.pintura + valorPintura,
      instalacao: acc.instalacao + valorInstalacao,
      desconto: acc.desconto + descontoAplicado,
      total: acc.total + valorFinal
    };
  }, {
    produto: 0,
    pintura: 0,
    instalacao: 0,
    desconto: 0,
    total: 0
  });

  const valorTotalComFrete = totais.total + valorFrete;
  const percentualDesconto = totais.desconto > 0 && (totais.produto + totais.pintura + totais.instalacao) > 0
    ? (totais.desconto / (totais.produto + totais.pintura + totais.instalacao)) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Orçamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor Produtos:</span>
          <span className="font-semibold">R$ {totais.produto.toFixed(2)}</span>
        </div>
        {totais.pintura > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor Pintura:</span>
            <span className="font-semibold">R$ {totais.pintura.toFixed(2)}</span>
          </div>
        )}
        {totais.instalacao > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor Instalação:</span>
            <span className="font-semibold">R$ {totais.instalacao.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor Frete:</span>
          <span className="font-semibold">R$ {valorFrete.toFixed(2)}</span>
        </div>
        {totais.desconto > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span className="font-medium">Desconto Aplicado:</span>
            <span className="font-semibold">
              -R$ {totais.desconto.toFixed(2)} ({percentualDesconto.toFixed(2)}%)
            </span>
          </div>
        )}
        <div className="h-px bg-border my-2" />
        <div className="flex justify-between text-lg">
          <span className="font-bold">Total:</span>
          <span className="font-bold text-primary">R$ {valorTotalComFrete.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}