import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertCircle, DollarSign } from 'lucide-react';

interface CreditoVendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valorTotalVenda: number;
  temDesconto: boolean;
  valorCreditoAtual?: number;
  percentualCreditoAtual?: number;
  onAplicarCredito: (valorCredito: number, percentualCredito: number) => void;
}

export function CreditoVendaModal({ 
  open, 
  onOpenChange, 
  valorTotalVenda,
  temDesconto,
  valorCreditoAtual = 0,
  percentualCreditoAtual = 0,
  onAplicarCredito 
}: CreditoVendaModalProps) {
  const [tipoCredito, setTipoCredito] = useState<'valor' | 'percentual'>('percentual');
  const [creditoInput, setCreditoInput] = useState<number>(0);

  // Inicializar com valores atuais quando o modal abre
  useEffect(() => {
    if (open) {
      if (percentualCreditoAtual > 0) {
        setTipoCredito('percentual');
        setCreditoInput(percentualCreditoAtual);
      } else if (valorCreditoAtual > 0) {
        setTipoCredito('valor');
        setCreditoInput(valorCreditoAtual);
      } else {
        setCreditoInput(0);
      }
    }
  }, [open, valorCreditoAtual, percentualCreditoAtual]);

  const handleAplicar = () => {
    let valorCredito = 0;
    let percentualCredito = 0;
    
    if (tipoCredito === 'valor') {
      valorCredito = creditoInput;
      percentualCredito = valorTotalVenda > 0 ? (creditoInput / valorTotalVenda) * 100 : 0;
    } else {
      percentualCredito = creditoInput;
      valorCredito = (valorTotalVenda * creditoInput) / 100;
    }
    
    onAplicarCredito(valorCredito, percentualCredito);
    onOpenChange(false);
    setCreditoInput(0);
  };

  // Calcular valores para preview
  let valorCreditoCalculado = 0;
  if (tipoCredito === 'valor') {
    valorCreditoCalculado = creditoInput;
  } else {
    valorCreditoCalculado = (valorTotalVenda * creditoInput) / 100;
  }
  const valorFinal = valorTotalVenda + valorCreditoCalculado;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Adicionar Crédito (Markup)
          </DialogTitle>
          <DialogDescription>
            Aplique um valor adicional quando a venda for realizada por um preço maior que o padrão
          </DialogDescription>
        </DialogHeader>

        {temDesconto ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não é possível adicionar crédito. Vendas com desconto não podem ter crédito adicional.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                O crédito será aplicado sobre o valor total da venda (sem desconto)
              </AlertDescription>
            </Alert>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor base da venda:</p>
              <p className="text-lg font-semibold">R$ {valorTotalVenda.toFixed(2)}</p>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="credito-input">
                Crédito {tipoCredito === 'percentual' ? '(%)' : '(R$)'}
              </Label>
              <Input
                id="credito-input"
                type="number"
                min="0"
                step={tipoCredito === 'percentual' ? '0.1' : '0.01'}
                value={creditoInput || ''}
                onChange={(e) => setCreditoInput(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            {creditoInput > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">Valor com crédito:</p>
                <p className="text-xl font-bold text-blue-600">
                  R$ {valorFinal.toFixed(2)}
                  <span className="text-sm font-normal ml-2">
                    (+R$ {valorCreditoCalculado.toFixed(2)})
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setCreditoInput(0);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAplicar}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={creditoInput === 0}
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
