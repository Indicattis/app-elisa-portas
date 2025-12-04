import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProdutoVenda } from '@/hooks/useVendas';
import { calcularDescontoTotal, calcularPercentualDesconto, calcularTotalVenda } from '@/utils/descontoVendasRules';
import { X } from 'lucide-react';

interface VendaResumoProps {
  produtos: ProdutoVenda[];
  valorFrete?: number;
  valorCredito?: number;
  percentualCredito?: number;
  onRemoverCredito?: () => void;
}

export function VendaResumo({ 
  produtos, 
  valorFrete = 0, 
  valorCredito = 0,
  percentualCredito = 0,
  onRemoverCredito
}: VendaResumoProps) {
  const totais = produtos.reduce((acc, produto) => {
    const valorBase = (
      produto.valor_produto + 
      produto.valor_pintura + 
      produto.valor_instalacao
    ) * produto.quantidade;
    
    const descontoAplicado = produto.tipo_desconto === 'valor' 
      ? produto.desconto_valor 
      : valorBase * (produto.desconto_percentual / 100);
    
    const valorFinal = valorBase - descontoAplicado;
    
    return {
      produto: acc.produto + (produto.valor_produto * produto.quantidade),
      pintura: acc.pintura + (produto.valor_pintura * produto.quantidade),
      instalacao: acc.instalacao + (produto.valor_instalacao * produto.quantidade),
      total: acc.total + valorFinal
    };
  }, {
    produto: 0,
    pintura: 0,
    instalacao: 0,
    total: 0
  });

  const totalVendaSemDesconto = calcularTotalVenda(produtos);
  const descontoAplicado = calcularDescontoTotal(produtos);
  const percentualDescontoCalc = calcularPercentualDesconto(descontoAplicado, totalVendaSemDesconto);
  
  // Total final = produtos + frete + crédito da venda
  const valorTotalFinal = totais.total + valorFrete + valorCredito;

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
        {descontoAplicado > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span className="font-medium">Desconto Aplicado:</span>
            <span className="font-semibold">
              -R$ {descontoAplicado.toFixed(2)} ({percentualDescontoCalc.toFixed(2)}%)
            </span>
          </div>
        )}
        {valorCredito > 0 && (
          <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
            <span className="font-medium">Crédito Aplicado:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                +R$ {valorCredito.toFixed(2)} ({percentualCredito.toFixed(2)}%)
              </span>
              {onRemoverCredito && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={onRemoverCredito}
                  title="Remover crédito"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="h-px bg-border my-2" />
        <div className="flex justify-between text-lg">
          <span className="font-bold">Total:</span>
          <span className="font-bold text-primary">R$ {valorTotalFinal.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
