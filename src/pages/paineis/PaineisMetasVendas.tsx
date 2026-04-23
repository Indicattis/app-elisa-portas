import { useState, useEffect } from 'react';
import { ArrowLeft, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MetaVendasBarra } from '@/components/paineis/MetaVendasBarra';
import { useProgressoMetasVendas } from '@/hooks/useProgressoMetasVendas';
import { useVendasSemanaAtual } from '@/hooks/useVendasDashboard';
import { formatarPeriodo } from '@/lib/periodoMeta';
import { formatCurrency } from '@/lib/utils';

export default function PaineisMetasVendas() {
  const { data: progressos, isLoading } = useProgressoMetasVendas();
  const { data: vendasSemana } = useVendasSemanaAtual();
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => navigate('/paineis')}
        className="fixed top-4 left-4 z-50 h-10 w-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center hover:bg-white/10 transition-colors"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-5 w-5 text-white/80" />
      </button>

      <div className="max-w-6xl mx-auto space-y-6 pt-12">
        {isLoading && <p className="text-sm text-white/50">Carregando metas...</p>}

        {!isLoading && (progressos?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center">
            <Target className="h-10 w-10 text-white/30 mx-auto mb-2" />
            <p className="text-sm text-white/60">Nenhuma meta ativa no período.</p>
          </div>
        )}

        {(progressos || []).map((p) => (
          <div key={p.meta.id} className="space-y-3">
            <div className="flex items-baseline justify-between gap-2 px-1">
              <div className="text-xs uppercase tracking-wider text-white/50">
                {formatarPeriodo(p.meta.periodo, now)}
              </div>
              <div className="flex items-baseline gap-4 text-xs text-white/60">
                <div>
                  Semana: <span className="text-white font-semibold">{formatCurrency(vendasSemana?.total ?? 0)}</span>
                </div>
                <div>
                  Total no período: <span className="text-white font-semibold">{formatCurrency(p.totalGlobal)}</span>
                </div>
              </div>
            </div>
            <MetaVendasBarra progresso={p} />
          </div>
        ))}
      </div>
    </div>
  );
}