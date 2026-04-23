import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export type PeriodoMeta = 'semanal' | 'mensal';
export type EscopoMeta = 'individual' | 'global';
export type BonificacaoTipo = 'fixo' | 'percentual';

export interface MetaVendasTier {
  id?: string;
  meta_id?: string;
  ordem: number;
  nome: string;
  valor_alvo: number;
  bonificacao_tipo: BonificacaoTipo;
  bonificacao_valor: number;
  cor: string;
}

export interface MetaVendas {
  id: string;
  nome: string;
  periodo: PeriodoMeta;
  escopo: EscopoMeta;
  vendedor_id: string | null;
  data_inicio_vigencia: string;
  data_fim_vigencia: string | null;
  ativa: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tiers?: MetaVendasTier[];
}

export function useMetasVendas() {
  return useQuery({
    queryKey: ['metas_vendas'],
    queryFn: async () => {
      const { data: metas, error } = await supabase
        .from('metas_vendas' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const ids = (metas as any[] || []).map((m) => m.id);
      let tiersMap: Record<string, MetaVendasTier[]> = {};
      if (ids.length) {
        const { data: tiers, error: tErr } = await supabase
          .from('metas_vendas_tiers' as any)
          .select('*')
          .in('meta_id', ids)
          .order('valor_alvo', { ascending: true });
        if (tErr) throw tErr;
        for (const t of (tiers as any[] || [])) {
          (tiersMap[t.meta_id] ||= []).push(t as MetaVendasTier);
        }
      }
      return ((metas as any[]) || []).map((m) => ({ ...m, tiers: tiersMap[m.id] || [] })) as MetaVendas[];
    },
  });
}

export function useSalvarMetaVendas() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      id?: string;
      nome: string;
      periodo: PeriodoMeta;
      escopo: EscopoMeta;
      vendedor_id: string | null;
      data_inicio_vigencia: string;
      data_fim_vigencia: string | null;
      ativa: boolean;
      tiers: MetaVendasTier[];
    }) => {
      let metaId = input.id;
      const payload = {
        nome: input.nome,
        periodo: input.periodo,
        escopo: input.escopo,
        vendedor_id: input.escopo === 'individual' ? input.vendedor_id : null,
        data_inicio_vigencia: input.data_inicio_vigencia,
        data_fim_vigencia: input.data_fim_vigencia,
        ativa: input.ativa,
        created_by: user?.id ?? null,
      };

      if (metaId) {
        const { error } = await supabase
          .from('metas_vendas' as any)
          .update(payload)
          .eq('id', metaId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('metas_vendas' as any)
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        metaId = (data as any).id;
      }

      // Reset tiers (delete all + insert)
      const { error: delErr } = await supabase
        .from('metas_vendas_tiers' as any)
        .delete()
        .eq('meta_id', metaId!);
      if (delErr) throw delErr;

      const tiersOrdenados = [...input.tiers]
        .sort((a, b) => Number(a.valor_alvo) - Number(b.valor_alvo))
        .map((t, i) => ({
          meta_id: metaId!,
          ordem: i + 1,
          nome: t.nome,
          valor_alvo: Number(t.valor_alvo),
          bonificacao_tipo: t.bonificacao_tipo,
          bonificacao_valor: Number(t.bonificacao_valor),
          cor: t.cor || '#3B82F6',
        }));
      if (tiersOrdenados.length) {
        const { error: insErr } = await supabase
          .from('metas_vendas_tiers' as any)
          .insert(tiersOrdenados);
        if (insErr) throw insErr;
      }
      return metaId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metas_vendas'] });
      qc.invalidateQueries({ queryKey: ['progresso_metas_vendas'] });
      toast({ title: 'Meta salva com sucesso' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao salvar meta', description: err.message, variant: 'destructive' });
    },
  });
}

export function useExcluirMetaVendas() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metas_vendas' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metas_vendas'] });
      qc.invalidateQueries({ queryKey: ['progresso_metas_vendas'] });
      toast({ title: 'Meta excluída' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });
}

export function useToggleMetaAtiva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      const { error } = await supabase
        .from('metas_vendas' as any)
        .update({ ativa })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metas_vendas'] });
      qc.invalidateQueries({ queryKey: ['progresso_metas_vendas'] });
    },
  });
}