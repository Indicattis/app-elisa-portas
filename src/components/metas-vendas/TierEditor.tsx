import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MetaVendasTier, BonificacaoTipo } from '@/hooks/useMetasVendas';

interface Props {
  tiers: MetaVendasTier[];
  onChange: (tiers: MetaVendasTier[]) => void;
}

const CORES_PADRAO = ['#CD7F32', '#C0C0C0', '#FFD700', '#3B82F6', '#A855F7', '#EF4444'];

export function TierEditor({ tiers, onChange }: Props) {
  const update = (idx: number, patch: Partial<MetaVendasTier>) => {
    const next = tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange(next);
  };
  const remove = (idx: number) => onChange(tiers.filter((_, i) => i !== idx));
  const add = () => {
    const idx = tiers.length;
    onChange([
      ...tiers,
      {
        ordem: idx + 1,
        nome: `Tier ${idx + 1}`,
        valor_alvo: 0,
        bonificacao_tipo: 'fixo',
        bonificacao_valor: 0,
        cor: CORES_PADRAO[idx % CORES_PADRAO.length],
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Tiers (níveis)</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Tier
        </Button>
      </div>

      {tiers.length === 0 && (
        <p className="text-xs text-muted-foreground">Adicione ao menos um tier.</p>
      )}

      <div className="space-y-2">
        {tiers.map((t, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg border border-white/10 bg-white/5"
          >
            <div className="col-span-3">
              <Label className="text-xs">Nome</Label>
              <Input value={t.nome} onChange={(e) => update(i, { nome: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Valor alvo (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={t.valor_alvo}
                onChange={(e) => update(i, { valor_alvo: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Bonificação</Label>
              <Select
                value={t.bonificacao_tipo}
                onValueChange={(v) => update(i, { bonificacao_tipo: v as BonificacaoTipo })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixo">Fixo (R$)</SelectItem>
                  <SelectItem value="percentual">% do vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Valor</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={t.bonificacao_valor}
                onChange={(e) => update(i, { bonificacao_valor: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Cor</Label>
              <Input
                type="color"
                value={t.cor}
                onChange={(e) => update(i, { cor: e.target.value })}
                className="h-10 p-1"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}