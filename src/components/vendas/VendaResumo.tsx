import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProdutoVenda } from '@/hooks/useVendas';

interface VendaResumoProps {
  produtos: ProdutoVenda[];
  valorFrete?: number;
}

export function VendaResumo({ produtos, valorFrete = 0 }: VendaResumoProps) {
  const totais = portas.reduce((acc, produto) => {
    const valorBase = (
      produto.valor_produto + 
      produto.valor_pintura + 
      produto.valor_instalacao
    ) * produto.quantidade;
    
    const descontoAplicado = produto.tipo_desconto === 'valor' 
      ? produto.desconto_valor 
      : valorBase * (produto.desconto_percentual / 100);
    
    const valorComDesconto = valorBase - descontoAplicado;
    
    return {
      produto: acc.produto + (produto.valor_produto * produto.quantidade),
      pintura: acc.pintura + (produto.valor_pintura * produto.quantidade),
      instalacao: acc.instalacao + (produto.valor_instalacao * produto.quantidade),
      total: acc.total + valorComDesconto
    };
  }, {
    produto: 0,
    pintura: 0,
    instalacao: 0,
    total: 0
  });

  const valorTotalComFrete = totais.total + valorFrete;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da Venda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor Produtos:</span>
          <span className="font-semibold">R$ {totais.produto.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor Pintura:</span>
          <span className="font-semibold">R$ {totais.pintura.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor Instalação:</span>
          <span className="font-semibold">R$ {totais.instalacao.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor Frete:</span>
          <span className="font-semibold">R$ {valorFrete.toFixed(2)}</span>
        </div>
        <div className="h-px bg-border my-2" />
        <div className="flex justify-between text-lg">
          <span className="font-bold">Total:</span>
          <span className="font-bold text-primary">R$ {valorTotalComFrete.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
