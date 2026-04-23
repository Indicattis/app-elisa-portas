import { CheckCircle2, Circle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { MetaProgresso, VendedorProgresso } from '@/hooks/useProgressoMetasVendas';

interface Props {
  progresso: MetaProgresso;
}

function BarraVendedor({
  vendedor,
  tiers,
  metaNome,
  escopoLabel,
}: {
  vendedor: VendedorProgresso;
  tiers: MetaProgresso['tiers'];
  metaNome: string;
  escopoLabel: string;
}) {
  const tiersSorted = [...tiers].sort((a, b) => Number(a.valor_alvo) - Number(b.valor_alvo));
  const maxAlvo = Math.max(...tiersSorted.map((t) => Number(t.valor_alvo)), 1);
  const total = vendedor.total_vendido;
  const tierAtual = vendedor.tier_atingido;
  const corPreenchimento = tierAtual?.cor || '#3B82F6';
  const pct = Math.min((total / maxAlvo) * 100, 100);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-white/60 truncate">{metaNome} — {escopoLabel}:</span>
          <span className="text-sm font-semibold text-white truncate">{vendedor.nome}</span>
        </div>
        <div className="text-sm tabular-nums">
          <span className="font-semibold text-white">{formatCurrency(total)}</span>
          <span className="text-white/40"> / {formatCurrency(maxAlvo)}</span>
        </div>
      </div>

      {/* Barra */}
      <div className="relative h-6 rounded-md bg-white/5 overflow-hidden border border-white/10">
        <div
          className="h-full rounded-md transition-[width] duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${corPreenchimento}66, ${corPreenchimento})`,
          }}
        />
        {/* Marcadores de tier */}
        {tiersSorted.map((t) => {
          const left = (Number(t.valor_alvo) / maxAlvo) * 100;
          return (
            <div
              key={t.id || t.nome}
              className="absolute top-0 bottom-0 w-px bg-white/40"
              style={{ left: `${left}%` }}
            />
          );
        })}
      </div>

      {/* Tiers */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${tiersSorted.length}, minmax(0,1fr))` }}>
        {tiersSorted.map((t) => {
          const atingido = total >= Number(t.valor_alvo);
          const bonifTexto =
            t.bonificacao_tipo === 'fixo'
              ? formatCurrency(Number(t.bonificacao_valor))
              : `${Number(t.bonificacao_valor)}% = ${formatCurrency(total * (Number(t.bonificacao_valor) / 100))}`;
          return (
            <div
              key={t.id || t.nome}
              className={`rounded-md border p-2 text-xs transition-opacity ${atingido ? 'border-white/20 bg-white/5' : 'border-white/5 opacity-50'}`}
              style={atingido ? { borderColor: t.cor } : undefined}
            >
              <div className="flex items-center gap-1.5">
                {atingido ? (
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: t.cor }} />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-white/30" />
                )}
                <span className="font-medium text-white truncate" style={atingido ? { color: t.cor } : undefined}>
                  {t.nome}
                </span>
              </div>
              <div className="text-white/50 mt-0.5">{formatCurrency(Number(t.valor_alvo))}</div>
              <div className={`mt-0.5 ${atingido ? 'text-white' : 'text-white/40'}`}>+ {bonifTexto}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MetaVendasBarra({ progresso }: Props) {
  const escopoLabel = progresso.meta.escopo === 'global' ? 'Equipe' : 'Vendedor';

  if (progresso.vendedores.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
        <div className="text-sm text-white/60">{progresso.meta.nome}</div>
        <div className="text-xs text-white/40 mt-1">Sem vendas no período.</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {progresso.vendedores.map((v) => (
        <BarraVendedor
          key={v.vendedor_id}
          vendedor={v}
          tiers={progresso.tiers}
          metaNome={progresso.meta.nome}
          escopoLabel={escopoLabel}
        />
      ))}
    </div>
  );
}