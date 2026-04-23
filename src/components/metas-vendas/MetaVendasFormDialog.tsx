import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TierEditor } from './TierEditor';
import {
  useSalvarMetaVendas,
  type MetaVendas,
  type MetaVendasTier,
  type PeriodoMeta,
  type EscopoMeta,
} from '@/hooks/useMetasVendas';
import { useVendedoresElegiveis } from '@/hooks/useProgressoMetasVendas';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meta?: MetaVendas | null;
}

export function MetaVendasFormDialog({ open, onOpenChange, meta }: Props) {
  const salvar = useSalvarMetaVendas();
  const { data: vendedores } = useVendedoresElegiveis();
  const { toast } = useToast();

  const [nome, setNome] = useState('');
  const [periodo, setPeriodo] = useState<PeriodoMeta>('semanal');
  const [escopo, setEscopo] = useState<EscopoMeta>('individual');
  const [vendedorId, setVendedorId] = useState<string>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [ativa, setAtiva] = useState(true);
  const [tiers, setTiers] = useState<MetaVendasTier[]>([]);

  useEffect(() => {
    if (open) {
      if (meta) {
        setNome(meta.nome);
        setPeriodo(meta.periodo);
        setEscopo(meta.escopo);
        setVendedorId(meta.vendedor_id || '');
        setDataInicio(meta.data_inicio_vigencia);
        setDataFim(meta.data_fim_vigencia || '');
        setAtiva(meta.ativa);
        setTiers(meta.tiers || []);
      } else {
        setNome('');
        setPeriodo('semanal');
        setEscopo('individual');
        setVendedorId('');
        setDataInicio(new Date().toISOString().slice(0, 10));
        setDataFim('');
        setAtiva(true);
        setTiers([{
          ordem: 1,
          nome: 'Bronze',
          valor_alvo: 10000,
          bonificacao_tipo: 'fixo',
          bonificacao_valor: 200,
          cor: '#CD7F32',
        }]);
      }
    }
  }, [open, meta]);

  const submit = () => {
    if (!nome.trim()) {
      toast({ title: 'Informe um nome', variant: 'destructive' });
      return;
    }
    if (tiers.length === 0) {
      toast({ title: 'Adicione ao menos um tier', variant: 'destructive' });
      return;
    }
    if (tiers.some((t) => !t.nome.trim() || Number(t.valor_alvo) <= 0 || Number(t.bonificacao_valor) <= 0)) {
      toast({ title: 'Preencha todos os tiers (valor alvo e bonificação devem ser > 0)', variant: 'destructive' });
      return;
    }
    salvar.mutate(
      {
        id: meta?.id,
        nome: nome.trim(),
        periodo,
        escopo,
        vendedor_id: escopo === 'individual' ? (vendedorId || null) : null,
        data_inicio_vigencia: dataInicio,
        data_fim_vigencia: dataFim || null,
        ativa,
        tiers,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meta ? 'Editar Meta' : 'Nova Meta de Vendas'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Meta Semanal Equipe" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Período</Label>
              <RadioGroup value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoMeta)} className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="semanal" /> Semanal
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="mensal" /> Mensal
                </label>
              </RadioGroup>
            </div>
            <div>
              <Label>Escopo</Label>
              <RadioGroup value={escopo} onValueChange={(v) => setEscopo(v as EscopoMeta)} className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="individual" /> Individual
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="global" /> Global (equipe)
                </label>
              </RadioGroup>
            </div>
          </div>

          {escopo === 'individual' && (
            <div>
              <Label>Vendedor (opcional)</Label>
              <Select value={vendedorId || 'todos'} onValueChange={(v) => setVendedorId(v === 'todos' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Todos os vendedores" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os vendedores (cada um com sua meta)</SelectItem>
                  {(vendedores || []).map((v) => (
                    <SelectItem key={v.user_id} value={v.user_id}>{v.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Início da vigência</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Label>Fim da vigência (opcional)</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={ativa} onCheckedChange={setAtiva} />
            <Label>Meta ativa</Label>
          </div>

          <TierEditor tiers={tiers} onChange={setTiers} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}