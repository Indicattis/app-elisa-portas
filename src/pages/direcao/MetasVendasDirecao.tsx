import { useState } from 'react';
import { Plus, Edit, Copy, Trash2, Power, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { MetaVendasFormDialog } from '@/components/metas-vendas/MetaVendasFormDialog';
import { useMetasVendas, useExcluirMetaVendas, useToggleMetaAtiva, useSalvarMetaVendas, type MetaVendas } from '@/hooks/useMetasVendas';
import { formatCurrency } from '@/lib/utils';

export default function MetasVendasDirecao() {
  const { data: metas, isLoading } = useMetasVendas();
  const excluir = useExcluirMetaVendas();
  const toggle = useToggleMetaAtiva();
  const salvar = useSalvarMetaVendas();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MetaVendas | null>(null);

  const novo = () => {
    setEditing(null);
    setOpen(true);
  };

  const editar = (m: MetaVendas) => {
    setEditing(m);
    setOpen(true);
  };

  const duplicar = (m: MetaVendas) => {
    salvar.mutate({
      nome: `${m.nome} (cópia)`,
      periodo: m.periodo,
      escopo: m.escopo,
      vendedor_id: m.vendedor_id,
      data_inicio_vigencia: m.data_inicio_vigencia,
      data_fim_vigencia: m.data_fim_vigencia,
      ativa: false,
      tiers: (m.tiers || []).map((t) => ({ ...t, id: undefined, meta_id: undefined })),
    });
  };

  return (
    <MinimalistLayout
      title="Metas de Vendas"
      subtitle="Configure metas semanais ou mensais com tiers de bonificação"
      backPath="/direcao/metas"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Direção', path: '/direcao' },
        { label: 'Metas', path: '/direcao/metas' },
        { label: 'Vendas' },
      ]}
      headerActions={
        <Button onClick={novo}>
          <Plus className="h-4 w-4 mr-1" /> Nova Meta
        </Button>
      }
    >
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-white/50">Carregando...</p>}
        {!isLoading && (metas?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center">
            <Target className="h-10 w-10 text-white/30 mx-auto mb-2" />
            <p className="text-sm text-white/60">Nenhuma meta cadastrada ainda.</p>
          </div>
        )}

        {(metas || []).map((m) => (
          <div key={m.id} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white">{m.nome}</h3>
                  <Badge variant="outline" className="capitalize">{m.periodo}</Badge>
                  <Badge variant="outline" className="capitalize">{m.escopo}</Badge>
                  {!m.ativa && <Badge variant="secondary">Inativa</Badge>}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Vigência: {m.data_inicio_vigencia}{m.data_fim_vigencia ? ` → ${m.data_fim_vigencia}` : ' → indefinido'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggle.mutate({ id: m.id, ativa: !m.ativa })}>
                  <Power className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => duplicar(m)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => editar(m)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Excluir meta "${m.nome}"?`)) excluir.mutate(m.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>

            {/* Tiers */}
            <div className="flex flex-wrap gap-2">
              {(m.tiers || []).map((t) => (
                <div
                  key={t.id || t.nome}
                  className="px-2.5 py-1 rounded-md border text-xs flex items-center gap-2"
                  style={{ borderColor: t.cor + '80', background: t.cor + '15' }}
                >
                  <span className="font-medium text-white">{t.nome}</span>
                  <span className="text-white/60">{formatCurrency(Number(t.valor_alvo))}</span>
                  <span className="text-white/40">→</span>
                  <span className="text-white/80">
                    {t.bonificacao_tipo === 'fixo'
                      ? `+${formatCurrency(Number(t.bonificacao_valor))}`
                      : `+${Number(t.bonificacao_valor)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <MetaVendasFormDialog open={open} onOpenChange={setOpen} meta={editing} />
    </MinimalistLayout>
  );
}