import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { ProdutoVenda } from '@/hooks/useVendas';

interface CreditoVendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtos: ProdutoVenda[];
  onAplicarCredito: (produtos: ProdutoVenda[]) => void;
}

export function CreditoVendaModal({ open, onOpenChange, produtos, onAplicarCredito }: CreditoVendaModalProps) {
  const [tipoCredito, setTipoCredito] = useState<'valor' | 'percentual'>('percentual');
  const [creditoPorProduto, setCreditoPorProduto] = useState<Record<number, number>>({});

  const handleAplicar = () => {
    const produtosAtualizados = produtos.map((produto, index) => {
      const creditoInput = creditoPorProduto[index] || 0;
      
      if (creditoInput === 0) return produto;
      
      // Verificar se produto tem desconto
      if ((produto.desconto_valor || 0) > 0 || (produto.desconto_percentual || 0) > 0) {
        return produto;
      }
      
      const valorBase = (produto.valor_produto + produto.valor_pintura + produto.valor_instalacao);
      
      let valorCredito = 0;
      let percentualCredito = 0;
      
      if (tipoCredito === 'valor') {
        valorCredito = creditoInput;
        percentualCredito = (creditoInput / valorBase) * 100;
      } else {
        percentualCredito = creditoInput;
        valorCredito = (valorBase * creditoInput) / 100;
      }
      
      return {
        ...produto,
        valor_credito: valorCredito,
        percentual_credito: percentualCredito
      };
    });
    
    onAplicarCredito(produtosAtualizados);
    onOpenChange(false);
    setCreditoPorProduto({});
  };

  const produtosPossiveis = produtos.filter(p => 
    (p.desconto_valor || 0) === 0 && (p.desconto_percentual || 0) === 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Adicionar Crédito (Markup)
          </DialogTitle>
          <DialogDescription>
            Aplique um valor adicional quando o produto for vendido por um preço maior que o padrão
          </DialogDescription>
        </DialogHeader>

        {produtosPossiveis.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não há produtos elegíveis para crédito. Produtos com desconto não podem ter crédito adicional.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Esta funcionalidade está disponível apenas para produtos <strong>SEM desconto</strong>
              </AlertDescription>
            </Alert>

            <RadioGroup value={tipoCredito} onValueChange={(v) => setTipoCredito(v as 'valor' | 'percentual')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentual" id="percentual" />
                <Label htmlFor="percentual">Aplicar por Percentual (%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="valor" id="valor" />
                <Label htmlFor="valor">Aplicar por Valor (R$)</Label>
              </div>
            </RadioGroup>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Produtos Disponíveis:</h4>
              {produtosPossiveis.map((produto, index) => {
                const indexOriginal = produtos.indexOf(produto);
                const valorBase = (produto.valor_produto + produto.valor_pintura + produto.valor_instalacao);
                const creditoAtual = creditoPorProduto[indexOriginal] || 0;
                
                let valorCreditoCalculado = 0;
                if (tipoCredito === 'valor') {
                  valorCreditoCalculado = creditoAtual;
                } else {
                  valorCreditoCalculado = (valorBase * creditoAtual) / 100;
                }
                
                const valorFinal = valorBase + valorCreditoCalculado;

                return (
                  <div key={indexOriginal} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline">{produto.tipo_produto}</Badge>
                        <p className="text-sm font-medium mt-1">
                          {produto.descricao || `${produto.largura}x${produto.altura}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valor base: R$ {valorBase.toFixed(2)} × {produto.quantidade}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`credito-${indexOriginal}`} className="text-xs">
                          Crédito {tipoCredito === 'percentual' ? '(%)' : '(R$)'}
                        </Label>
                        <Input
                          id={`credito-${indexOriginal}`}
                          type="number"
                          min="0"
                          step={tipoCredito === 'percentual' ? '0.1' : '0.01'}
                          value={creditoPorProduto[indexOriginal] || ''}
                          onChange={(e) => setCreditoPorProduto(prev => ({
                            ...prev,
                            [indexOriginal]: parseFloat(e.target.value) || 0
                          }))}
                          placeholder="0"
                        />
                      </div>
                      {creditoAtual > 0 && (
                        <div className="flex-1 text-sm">
                          <p className="text-xs text-muted-foreground">Valor com crédito:</p>
                          <p className="font-semibold text-blue-600">
                            R$ {valorFinal.toFixed(2)}
                            <span className="text-xs ml-1">
                              (+R$ {valorCreditoCalculado.toFixed(2)})
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setCreditoPorProduto({});
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAplicar}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={Object.values(creditoPorProduto).every(v => v === 0)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Aplicar Crédito
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
