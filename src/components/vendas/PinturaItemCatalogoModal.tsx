import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Paintbrush, Loader2 } from 'lucide-react';
import { useCatalogoCores } from '@/hooks/useCatalogoCores';
import type { ProdutoVenda } from '@/hooks/useVendas';
import { getLabelTipoProduto } from '@/utils/tipoProdutoLabels';
import { buscarPrecosPorMedidas } from '@/utils/tabelaPrecosHelper';

interface PinturaItemCatalogoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portas: ProdutoVenda[];
  onConfirm: (pintura: ProdutoVenda) => void;
}

export function PinturaItemCatalogoModal({
  open,
  onOpenChange,
  portas,
  onConfirm,
}: PinturaItemCatalogoModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [corId, setCorId] = useState('');
  const [valorPintura, setValorPintura] = useState('');
  const { coresAtivas } = useCatalogoCores();

  const itensDisponiveis = portas
    .map((p, i) => ({ index: i, label: getItemLabel(p, i), produto: p }))
    .filter(({ produto }) => produto.tipo_produto !== 'pintura_epoxi');

  function getItemLabel(p: ProdutoVenda, i: number) {
    const tipo = getLabelTipoProduto(p.tipo_produto);
    const desc = p.descricao ? ` - ${p.descricao}` : '';
    const medidas = p.largura && p.altura ? ` (${p.largura.toFixed(2)}m × ${p.altura.toFixed(2)}m)` : '';
    return `#${i + 1} ${tipo}${desc}${medidas}`;
  }

  const handleConfirmar = () => {
    const idx = Number(selectedIndex);
    const item = portas[idx];
    if (!item) return;

    const corSelecionada = coresAtivas.find(c => c.id === corId);
    const corNome = corSelecionada?.nome || '';

    const pintura: ProdutoVenda = {
      tipo_produto: 'pintura_epoxi',
      largura: item.largura || 0,
      altura: item.altura || 0,
      valor_produto: Number(valorPintura) || 0,
      valor_pintura: Number(valorPintura) || 0,
      valor_instalacao: 0,
      valor_frete: 0,
      quantidade: 1,
      descricao: `Pintura Eletrostática${corNome ? ` (${corNome})` : ''} - ${item.descricao || getLabelTipoProduto(item.tipo_produto)}`,
      desconto_valor: 0,
      desconto_percentual: 0,
      tipo_desconto: 'valor',
      cor_id: corId || undefined,
    };

    onConfirm(pintura);
    resetState();
  };

  const resetState = () => {
    setSelectedIndex('');
    setCorId('');
    setValorPintura('');
    onOpenChange(false);
  };

  const isValid = selectedIndex !== '' && corId && Number(valorPintura) > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); else onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            Pintura Eletrostática
          </DialogTitle>
          <DialogDescription>
            Selecione o item que receberá pintura, escolha a cor e informe o valor
          </DialogDescription>
        </DialogHeader>

        {itensDisponiveis.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nenhum item adicionado à venda ainda.
            <br />
            <span className="text-xs">Adicione pelo menos um produto antes de configurar pintura.</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Item para pintar</Label>
              <ScrollArea className="max-h-[180px]">
                <RadioGroup value={selectedIndex} onValueChange={setSelectedIndex}>
                  <div className="space-y-1.5">
                    {itensDisponiveis.map(({ index, label }) => (
                      <label
                        key={index}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          selectedIndex === String(index)
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border hover:bg-accent/50'
                        }`}
                      >
                        <RadioGroupItem value={String(index)} />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Cor</Label>
              <Select value={corId} onValueChange={setCorId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione a cor" />
                </SelectTrigger>
                <SelectContent>
                  {coresAtivas.map(cor => (
                    <SelectItem key={cor.id} value={cor.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: cor.codigo_hex }}
                        />
                        {cor.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Valor da Pintura (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={valorPintura}
                onChange={(e) => setValorPintura(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={resetState}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={!isValid}>
            Adicionar Pintura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
