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
  const pct = Math.min((total / maxAlvo) * 100, 100);
  const corPreenchimento = tierAtual?.cor || '#3B82F6';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex gap-5 items-stretch">
      {/* Foto grande */}
      <Avatar className="h-28 w-28 rounded-2xl shrink-0 border border-white/10">
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
            <div className="text-xl font-semibold text-white truncate">{vendedor.nome}</div>
            <div className="text-xs text-white/50 truncate">{metaNome} — {escopoLabel}</div>
          </div>
          <div className="flex items-baseline gap-4 flex-wrap">
            <div className="text-sm tabular-nums">
              <span className="font-semibold text-white">{formatCurrency(total)}</span>
              <span className="text-white/40"> / {formatCurrency(maxAlvo)}</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/40">Comissão atual</div>
              <div
                className="text-base font-bold tabular-nums"
                style={{ color: tierAtual?.cor || 'rgba(255,255,255,0.5)' }}
              >
                {formatCurrency(vendedor.bonificacao_calculada)}
              </div>
            </div>
          </div>
        </div>

        {/* Barra segmentada por tier */}
        <div className="relative h-7 rounded-md bg-white/5 overflow-hidden border border-white/10">
          {/* Preenchimento principal com cor do tier atual */}
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: tierAtual
                ? `linear-gradient(90deg, ${corPreenchimento}55, ${corPreenchimento})`
                : 'linear-gradient(90deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.35))',
            }}
          />
          {/* Marcadores de tier (linhas verticais) */}
          {tiersSorted.map((t) => {
            const left = (Number(t.valor_alvo) / maxAlvo) * 100;
            const atingido = total >= Number(t.valor_alvo);
            return (
              <div
                key={t.id || t.nome}
                className="absolute top-0 bottom-0 w-px"
                style={{ left: `${left}%`, background: atingido ? t.cor : 'rgba(255,255,255,0.25)' }}
              />
            );
          })}
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