import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { MetaVendasBarra } from '@/components/paineis/MetaVendasBarra';
import { useProgressoMetasVendas } from '@/hooks/useProgressoMetasVendas';
import { formatarPeriodo } from '@/lib/periodoMeta';
import { formatCurrency } from '@/lib/utils';

export default function PaineisMetasVendas() {
  const { data: progressos, isLoading } = useProgressoMetasVendas();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <MinimalistLayout
      title="Metas de Vendas"
      subtitle="Progresso em tempo real com tiers de bonificação"
      backPath="/paineis"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Painéis', path: '/paineis' },
        { label: 'Metas de Vendas' },
      ]}
    >
      <div className="space-y-4">
        {isLoading && <p className="text-sm text-white/50">Carregando metas...</p>}

        {!isLoading && (progressos?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center">
            <Target className="h-10 w-10 text-white/30 mx-auto mb-2" />
            <p className="text-sm text-white/60">Nenhuma meta ativa no período.</p>
          </div>
        )}

        {(progressos || []).map((p) => (
          <div key={p.meta.id} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2 px-1">
              <div className="text-xs uppercase tracking-wider text-white/50">
                {formatarPeriodo(p.meta.periodo, now)}
              </div>
              <div className="text-xs text-white/60">
                Total no período: <span className="text-white font-semibold">{formatCurrency(p.totalGlobal)}</span>
              </div>
            </div>
            <MetaVendasBarra progresso={p} />
          </div>
        ))}
      </div>
    </MinimalistLayout>
  );
}