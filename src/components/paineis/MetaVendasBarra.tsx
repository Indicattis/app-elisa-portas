import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';
import type { MetaProgresso, VendedorProgresso } from '@/hooks/useProgressoMetasVendas';

function getInitials(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

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
  // Próximo tier (objetivo): primeiro tier ainda não atingido.
  // Se já atingiu todos, usa o último (tier máximo).
  const proximoIdx = tiersSorted.findIndex((t) => total < Number(t.valor_alvo));
  const proximoTier =
    proximoIdx >= 0
      ? tiersSorted[proximoIdx]
      : tiersSorted[tiersSorted.length - 1] || null;
  // Tier anterior ao próximo (base do segmento atual). Se não existe, base = 0.
  const baseAnterior =
    proximoIdx > 0
      ? Number(tiersSorted[proximoIdx - 1].valor_alvo)
      : proximoIdx === -1 && tiersSorted.length > 1
        ? Number(tiersSorted[tiersSorted.length - 2].valor_alvo)
        : 0;
  const alvoAtual = proximoTier ? Number(proximoTier.valor_alvo) : maxAlvo;
  const denom = Math.max(alvoAtual - baseAnterior, 1);
  const pct = Math.min(Math.max(((total - baseAnterior) / denom) * 100, 0), 100);
  const corPreenchimento = proximoTier?.cor || tierAtual?.cor || '#3B82F6';

  const mesLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex flex-col lg:flex-row gap-5 items-stretch">
      {/* Foto grande */}
      <Avatar className="h-32 w-32 rounded-2xl shrink-0 border border-white/10">
        <AvatarImage src={vendedor.foto_perfil_url || undefined} alt={vendedor.nome} className="object-cover" />
        <AvatarFallback
          className="rounded-2xl text-2xl font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${corPreenchimento}55, ${corPreenchimento}22)` }}
        >
          {getInitials(vendedor.nome) || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-2xl font-bold text-white truncate">{vendedor.nome}</div>
            <div className="text-sm text-white/50 truncate">{metaNome} — {escopoLabel}</div>
          </div>
          <div className="flex items-baseline gap-4 flex-wrap">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-white/40">Comissão atual</div>
              <div
                className="text-3xl font-extrabold tabular-nums"
                style={{ color: tierAtual?.cor || 'rgba(255,255,255,0.5)' }}
              >
                {formatCurrency(vendedor.bonificacao_calculada)}
              </div>
            </div>
          </div>
        </div>

        {/* Barra segmentada: cada tier ocupa uma fatia proporcional ao seu intervalo */}
        <div className="relative h-16 rounded-md bg-white/5 overflow-hidden border border-white/10 flex">
          {tiersSorted.map((t, i) => {
            const base = i === 0 ? 0 : Number(tiersSorted[i - 1].valor_alvo);
            const alvo = Number(t.valor_alvo);
            const range = Math.max(alvo - base, 1);
            const widthPct = (range / maxAlvo) * 100;
            const segPct = Math.min(Math.max(((total - base) / range) * 100, 0), 100);
            return (
              <div
                key={t.id || t.nome}
                className="relative h-full border-r border-white/20 last:border-r-0"
                style={{ width: `${widthPct}%` }}
              >
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
                  style={{
                    width: `${segPct}%`,
                    background: `linear-gradient(90deg, ${t.cor}55, ${t.cor})`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-end pr-2 text-sm font-semibold text-white/70 tabular-nums pointer-events-none">
                  <div className="flex flex-col items-end leading-tight">
                    <span>{formatCurrency(alvo)}</span>
                    <span className="text-[10px] font-medium" style={{ color: t.cor }}>
                      {t.bonificacao_tipo === 'fixo'
                        ? formatCurrency(Number(t.bonificacao_valor))
                        : `${Number(t.bonificacao_valor)}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Painel lateral: total vendido no mês */}
      <div className="lg:w-56 shrink-0 lg:border-l lg:border-t-0 border-t border-white/10 lg:pl-5 pt-4 lg:pt-0 flex flex-col justify-center">
        <div className="text-xs uppercase tracking-wider text-sky-300/70">Vendido no mês</div>
        <div className="text-3xl font-extrabold tabular-nums text-sky-300 mt-1">
          {formatCurrency(vendedor.total_vendido_mes)}
        </div>
        <div className="text-xs text-white/40 mt-1 capitalize">{mesLabel}</div>
        <div className="text-xs uppercase tracking-wider text-amber-300/70 mt-4">Vendido na semana</div>
        <div className="text-2xl font-bold tabular-nums text-amber-300 mt-1">
          {formatCurrency(vendedor.total_vendido_semana)}
        </div>
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