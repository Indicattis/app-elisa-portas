import { useState } from "react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { useRankingAutorizadosInstalacao, PeriodoFiltro, RankingAutorizado } from "@/hooks/useRankingAutorizadosInstalacao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Medal, Calendar, CalendarDays, CalendarRange, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const periodosOptions: { value: PeriodoFiltro; label: string; icon: React.ElementType }[] = [
  { value: 'mes', label: 'Este Mês', icon: Calendar },
  { value: 'ano', label: 'Este Ano', icon: CalendarDays },
  { value: 'todos', label: 'Todo Período', icon: CalendarRange },
];

function classificarPorta(metragem: number | null | undefined): string | null {
  if (!metragem || metragem <= 0) return null;
  if (metragem < 25) return 'P';
  if (metragem <= 50) return 'G';
  return 'GG';
}

function getMedalIcon(posicao: number) {
  if (posicao <= 3) {
    const colors: Record<number, string> = {
      1: 'bg-gradient-to-br from-yellow-400 to-amber-600',
      2: 'bg-gradient-to-br from-gray-300 to-slate-500',
      3: 'bg-gradient-to-br from-orange-400 to-amber-700',
    };
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${colors[posicao]}`}>
        {posicao === 1 ? (
          <Trophy className="w-5 h-5 text-white drop-shadow" />
        ) : (
          <Medal className="w-5 h-5 text-white drop-shadow" />
        )}
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
      <span className="text-white/60 font-bold">{posicao}º</span>
    </div>
  );
}

function getCardStyles(posicao: number) {
  switch (posicao) {
    case 1: return 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-amber-500/5';
    case 2: return 'border-gray-400/30 bg-gradient-to-r from-gray-400/10 to-slate-400/5';
    case 3: return 'border-orange-700/30 bg-gradient-to-r from-orange-700/10 to-amber-700/5';
    default: return 'border-white/10 bg-white/5';
  }
}

function getProgressColor(posicao: number) {
  switch (posicao) {
    case 1: return '[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-amber-500';
    case 2: return '[&>div]:bg-gradient-to-r [&>div]:from-gray-300 [&>div]:to-slate-400';
    case 3: return '[&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-amber-600';
    default: return '';
  }
}

export default function RankingAutorizadosInstalacao() {
  const { ranking, loading, periodo, setPeriodo, maxInstalacoes } = useRankingAutorizadosInstalacao();
  const [selectedAutorizado, setSelectedAutorizado] = useState<RankingAutorizado | null>(null);

  const breadcrumbItems = [
    { label: 'Home', path: '/home' },
    { label: 'Logística', path: '/logistica' },
    { label: 'Instalações', path: '/logistica/instalacoes' },
    { label: 'Ranking Autorizados' }
  ];

  return (
    <MinimalistLayout
      title="Ranking de Autorizados"
      subtitle="Desempenho dos parceiros autorizados nas instalações"
      backPath="/logistica/instalacoes"
      breadcrumbItems={breadcrumbItems}
    >
      {/* Filtros de Período */}
      <div className="mb-6">
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 inline-flex gap-1">
          {periodosOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = periodo === opt.value;
            return (
              <Button
                key={opt.value}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriodo(opt.value)}
                className={`gap-2 ${isActive
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Lista Vazia */}
      {!loading && ranking.length === 0 && (
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto text-white/30 mb-4" />
            <p className="text-white/60">Nenhuma instalação concluída por autorizados neste período</p>
          </div>
        </div>
      )}

      {/* Ranking Cards */}
      {!loading && ranking.length > 0 && (
        <div className="space-y-3">
          {ranking.map((autorizado, index) => {
            const posicao = index + 1;
            const progressPercent = maxInstalacoes > 0
              ? (autorizado.quantidade_instalacoes / maxInstalacoes) * 100
              : 0;

            return (
              <div
                key={autorizado.autorizado_id}
                className={`p-1.5 rounded-xl backdrop-blur-xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${getCardStyles(posicao)}`}
                onClick={() => setSelectedAutorizado(autorizado)}
              >
                <Card className="bg-transparent border-0 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {getMedalIcon(posicao)}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate mb-1">
                          {autorizado.autorizado_nome}
                        </h3>

                        <div className="mb-2">
                          <Progress
                            value={progressPercent}
                            className={`h-2 bg-white/10 ${getProgressColor(posicao)}`}
                          />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>
                            <strong className="text-white">{autorizado.quantidade_instalacoes}</strong> instalações
                          </span>
                          {autorizado.metragem_total > 0 && (
                            <span>
                              <strong className="text-white">{autorizado.metragem_total.toFixed(1)}</strong> m²
                            </span>
                          )}
                          {autorizado.ultima_instalacao && (
                            <span className="hidden sm:inline">
                              Última: {format(new Date(autorizado.ultima_instalacao), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <div className="px-4 py-2 rounded-lg font-bold text-lg text-white bg-white/15">
                          {autorizado.quantidade_instalacoes}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedAutorizado} onOpenChange={(open) => !open && setSelectedAutorizado(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{selectedAutorizado?.autorizado_nome} — Instalações</DialogTitle>
          </DialogHeader>

          {selectedAutorizado && selectedAutorizado.instalacoes_detalhes.length === 0 && (
            <p className="text-white/50 text-center py-6">Nenhuma instalação no período</p>
          )}

          {selectedAutorizado && selectedAutorizado.instalacoes_detalhes.length > 0 && (
            <div className="space-y-2 mt-2">
              {selectedAutorizado.instalacoes_detalhes.map((inst) => {
                const tamanho = classificarPorta(inst.metragem);
                return (
                  <div key={inst.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{inst.nome_cliente}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                          {inst.data_conclusao && (
                            <span>{format(new Date(inst.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}</span>
                          )}
                          {inst.metragem && inst.metragem > 0 && (
                            <span>{inst.metragem.toFixed(1)} m²</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {tamanho && (
                          <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                            {tamanho}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            inst.origem === 'pedido'
                              ? 'border-blue-500/40 text-blue-400'
                              : 'border-emerald-500/40 text-emerald-400'
                          }`}
                        >
                          {inst.origem === 'pedido' ? 'Pedido' : 'Avulso'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MinimalistLayout>
  );
}
