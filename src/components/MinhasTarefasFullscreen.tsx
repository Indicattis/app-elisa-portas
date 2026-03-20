import { useState } from 'react';
import { X, CheckCircle2, Circle, Target, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useTarefas, Tarefa } from '@/hooks/useTarefas';
import { useMissoes, Missao } from '@/hooks/useMissoes';
import { format, isPast, startOfDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MinhasTarefasFullscreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinhasTarefasFullscreen({ open, onOpenChange }: MinhasTarefasFullscreenProps) {
  const { user } = useAuth();
  const { tarefas, marcarConcluida, reabrirTarefa } = useTarefas(user?.id);
  const { missoes, toggleCheckbox } = useMissoes();

  const minhasMissoes = missoes.filter(m => m.responsavel_id === user?.id);

  // Tarefas pendentes da semana atual
  const agora = new Date();
  const inicioSemana = startOfWeek(agora, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(agora, { weekStartsOn: 1 });

  const tarefasDaSemana = tarefas.filter(t => {
    if (t.status !== 'em_andamento') return false;
    if (!t.data_referencia) return false;
    const data = new Date(t.data_referencia + 'T00:00:00');
    return isWithinInterval(data, { start: inicioSemana, end: fimSemana });
  });

  const handleToggleTarefa = (tarefa: Tarefa) => {
    if (tarefa.status === 'concluida') {
      reabrirTarefa.mutate(tarefa.id);
    } else {
      marcarConcluida.mutate(tarefa.id);
    }
  };

  const getMissaoProgress = (missao: Missao) => {
    const total = missao.missao_checkboxes.length;
    if (total === 0) return 0;
    const concluidas = missao.missao_checkboxes.filter(c => c.concluida).length;
    return Math.round((concluidas / total) * 100);
  };

  const getMissaoAtrasada = (missao: Missao) => {
    return missao.missao_checkboxes.some(
      c => !c.concluida && c.prazo && isPast(startOfDay(new Date(c.prazo + 'T00:00:00')))
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Panel - slides from right */}
      <div
        className={cn(
          'fixed inset-0 z-[61] transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
      >
        <div className="h-full w-full bg-black overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-semibold text-white">Minhas Tarefas</h1>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-6 space-y-8">
            {/* === TAREFAS DA SEMANA === */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                  Tarefas da Semana
                </h2>
                {tarefasDaSemana.length > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    {tarefasDaSemana.length}
                  </Badge>
                )}
              </div>

              {tarefasDaSemana.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">Nenhuma tarefa pendente esta semana</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tarefasDaSemana.map(tarefa => (
                    <button
                      key={tarefa.id}
                      onClick={() => handleToggleTarefa(tarefa)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-3 text-left hover:bg-white/10 transition-colors active:scale-[0.98]"
                    >
                      <Circle className="w-5 h-5 text-white/30 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 text-sm leading-snug">{tarefa.descricao}</p>
                        {tarefa.data_referencia && (
                          <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(tarefa.data_referencia + 'T00:00:00'), "dd MMM", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* === MISSÕES SECTION (inline checkboxes) === */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                  Minhas Missões
                </h2>
                {minhasMissoes.length > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    {minhasMissoes.length}
                  </Badge>
                )}
              </div>

              {minhasMissoes.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <Target className="w-8 h-8 text-blue-400/30 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">Nenhuma missão atribuída</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {minhasMissoes.map(missao => {
                    const progresso = getMissaoProgress(missao);
                    const atrasada = getMissaoAtrasada(missao);
                    const total = missao.missao_checkboxes.length;
                    const concluidas = missao.missao_checkboxes.filter(c => c.concluida).length;

                    return (
                      <div
                        key={missao.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-white/90 text-sm font-medium leading-snug flex-1">{missao.titulo}</h3>
                          {atrasada && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <Progress value={progresso} className="h-1.5 flex-1 bg-white/10" />
                          <span className="text-white/50 text-xs font-medium whitespace-nowrap">
                            {concluidas}/{total}
                          </span>
                        </div>

                        {/* All checkboxes inline */}
                        <div className="space-y-2">
                          {missao.missao_checkboxes.map(cb => {
                            const atrasado = !cb.concluida && cb.prazo && isPast(startOfDay(new Date(cb.prazo + 'T00:00:00')));
                            return (
                              <label
                                key={cb.id}
                                className="flex items-start gap-2.5 cursor-pointer group"
                              >
                                <Checkbox
                                  checked={cb.concluida}
                                  onCheckedChange={(checked) => {
                                    toggleCheckbox.mutate({ id: cb.id, concluida: !!checked });
                                  }}
                                  className="mt-0.5 border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className={cn(
                                    'text-xs leading-snug',
                                    cb.concluida ? 'text-white/30 line-through' : 'text-white/70 group-hover:text-white/90'
                                  )}>
                                    {cb.descricao}
                                  </span>
                                  {atrasado && (
                                    <span className="ml-1.5 text-amber-400 text-[10px] font-medium">atrasado</span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
