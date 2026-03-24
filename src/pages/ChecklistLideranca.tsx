import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas } from "@/hooks/useTarefas";
import { useMissoes } from "@/hooks/useMissoes";
import { useTarefasCalendario } from "@/hooks/useTarefasCalendario";
import { NovaRecorrenteModal } from "@/components/todo/NovaRecorrenteModal";
import { NovaMissaoModal } from "@/components/todo/NovaMissaoModal";
import { DetalhesMissaoModal } from "@/components/todo/DetalhesMissaoModal";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, CalendarDays, History, Target, CheckCircle2, ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format, isPast, startOfDay, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ChecklistLideranca() {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  // Missões states
  const [modalMissaoAberto, setModalMissaoAberto] = useState(false);
  const [modalRecorrenteAberto, setModalRecorrenteAberto] = useState(false);

  // Calendar state
  const [semanaBase, setSemanaBase] = useState(new Date());

  const { criarTemplate } = useTarefas();
  const { missoes, isLoading: loadingMissoes, criarMissao, deletarMissao, toggleCheckbox, editarCheckbox, reordenarCheckboxes, deletarCheckbox } = useMissoes();
  const [missaoSelecionada, setMissaoSelecionada] = useState<import("@/hooks/useMissoes").Missao | null>(null);

  const { data: calendarioData, isLoading: loadingCalendario } = useTarefasCalendario(semanaBase);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';

  const hoje = new Date();
  const inicioSemana = startOfWeek(semanaBase, { weekStartsOn: 0 });
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));

  const headerActions = (
    <div className="flex gap-2">
      <button
        onClick={() => navigate('/direcao/checklist-lideranca/historico')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10
                   hover:bg-white/10 text-white/70 hover:text-white text-sm transition-all duration-200"
      >
        <History className="h-4 w-4" />
        <span className="hidden md:inline">Histórico</span>
      </button>
      <button
        onClick={() => navigate('/direcao/checklist-lideranca/programacao')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30
                   hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 text-sm transition-all duration-200"
      >
        <CalendarDays className="h-4 w-4" />
        <span className="hidden md:inline">Programação</span>
      </button>
      <button
        onClick={() => setModalMissaoAberto(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10
                   hover:bg-white/10 text-white/70 hover:text-white text-sm transition-all duration-200"
      >
        <Target className="h-4 w-4" />
        <span className="hidden md:inline">Nova Missão</span>
      </button>
    </div>
  );

  return (
    <MinimalistLayout
      title="Checklist Liderança"
      subtitle="Gerencie tarefas semanais da equipe"
      backPath="/direcao"
      headerActions={headerActions}
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Direção', path: '/direcao' },
        { label: 'Checklist Liderança' }
      ]}
    >
      <div className="space-y-8">
        {/* Calendário de Tarefas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Calendário de Tarefas</h2>
                <p className="text-sm text-white/40">
                  {format(inicioSemana, "dd 'de' MMMM", { locale: ptBR })} - {format(addDays(inicioSemana, 6), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSemanaBase(prev => subWeeks(prev, 1))}
                className="h-8 w-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button
                onClick={() => setSemanaBase(new Date())}
                className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-all"
              >
                Hoje
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSemanaBase(prev => addWeeks(prev, 1))}
                className="h-8 w-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Grid de 7 dias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {diasSemana.map((dia) => {
              const isHoje = isSameDay(dia, hoje);
              const diaStr = format(dia, 'yyyy-MM-dd');
              const dadosDia = calendarioData?.tarefasPorDia[diaStr];
              const tarefasDia = dadosDia?.tarefas || [];
               const diaPassado = dia < startOfDay(hoje);
              const atrasadasNaoConcluidas = tarefasDia.filter(t => t.status !== 'concluida' && diaPassado).length;
              const concluidasAtrasadas = tarefasDia.filter(t => t.status === 'concluida' && diaPassado).length;
              const concluidasNoPrazo = tarefasDia.filter(t => t.status === 'concluida' && !diaPassado).length;
              const pendentesNoPrazo = tarefasDia.filter(t => t.status !== 'concluida' && !diaPassado).length;

              return (
                <div
                  key={diaStr}
                  className={cn(
                    "min-h-[220px] flex flex-col rounded-xl p-1.5",
                    isHoje
                      ? "bg-blue-500/10 border border-blue-500/30"
                      : "bg-white/5 border border-white/10"
                  )}
                >
                  {/* Day header */}
                  <div className={cn(
                    "text-center py-2 rounded-lg mb-2",
                    isHoje ? "bg-blue-500/20" : "bg-white/5"
                  )}>
                    <p className={cn(
                      "text-xs uppercase font-medium",
                      isHoje ? "text-blue-400" : "text-white/50"
                    )}>
                      {format(dia, "EEE", { locale: ptBR })}
                    </p>
                    <p className={cn(
                      "text-lg font-bold",
                      isHoje ? "text-blue-400" : "text-white/70"
                    )}>
                      {format(dia, "dd")}
                    </p>
                    {tarefasDia.length > 0 && (
                      <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                        {atrasadasNaoConcluidas > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            {atrasadasNaoConcluidas} atras.
                          </span>
                        )}
                        {concluidasAtrasadas > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                            {concluidasAtrasadas} ✓
                          </span>
                        )}
                        {concluidasNoPrazo > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            {concluidasNoPrazo} ✓
                          </span>
                        )}
                        {pendentesNoPrazo > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">
                            {pendentesNoPrazo} pend.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tasks list */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 px-1">
                    {loadingCalendario ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      </div>
                    ) : tarefasDia.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-white/20 text-center py-4">Sem tarefas</p>
                      </div>
                    ) : (
                      tarefasDia.map((tarefa) => {
                        const isConcluida = tarefa.status === 'concluida';
                        const isAtrasada = diaPassado;
                        const isConcluidaAtrasada = isConcluida && isAtrasada;
                        const isNaoConcluidaAtrasada = !isConcluida && isAtrasada;
                        const isConcluidaNoPrazo = isConcluida && !isAtrasada;

                        return (
                          <div
                            key={tarefa.id}
                            className={cn(
                              "p-2 rounded-lg border transition-all duration-200",
                              isNaoConcluidaAtrasada
                                ? "bg-red-500/10 border-red-500/20"
                                : isConcluidaAtrasada
                                  ? "bg-amber-500/10 border-amber-500/20"
                                  : isConcluidaNoPrazo
                                    ? "bg-emerald-500/10 border-emerald-500/20"
                                    : "bg-white/5 border-white/10"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <Avatar className="h-5 w-5 flex-shrink-0 mt-0.5">
                                <AvatarImage src={tarefa.responsavel_foto || undefined} />
                                <AvatarFallback className="text-[8px] bg-blue-500/20 text-blue-400">
                                  {tarefa.responsavel_nome.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-xs font-medium leading-tight line-clamp-2",
                                  isNaoConcluidaAtrasada ? "text-red-400" :
                                  isConcluidaAtrasada ? "text-amber-400/70 line-through" :
                                  isConcluidaNoPrazo ? "text-emerald-400/70 line-through" :
                                  "text-white/80"
                                )}>
                                  {tarefa.descricao}
                                </p>
                                <p className="text-[10px] text-white/30 mt-0.5">
                                  {tarefa.responsavel_nome.split(' ')[0]}
                                </p>
                              </div>
                              {isNaoConcluidaAtrasada && (
                                <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                              )}
                              {isConcluidaAtrasada && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                              )}
                              {isConcluidaNoPrazo && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                              )}
                              {tarefa.recorrente && (
                                <Clock className="h-3 w-3 text-white/30 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Seção Missões */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Missões</h2>
              <p className="text-sm text-white/40">
                {missoes.length} missão(ões) ativa(s)
              </p>
            </div>
          </div>

          {missoes.length === 0 ? (
            <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center">
              <Target className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Nenhuma missão cadastrada</p>
              <button
                onClick={() => setModalMissaoAberto(true)}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Criar primeira missão
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {missoes.map((missao) => {
                const total = missao.missao_checkboxes.length;
                const concluidas = missao.missao_checkboxes.filter(c => c.concluida).length;
                const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;
                const prazosNaoConcluidos = missao.missao_checkboxes
                  .filter(c => !c.concluida && c.prazo)
                  .map(c => new Date(c.prazo + "T12:00:00"));
                const maiorPrazo = prazosNaoConcluidos.length > 0
                  ? new Date(Math.max(...prazosNaoConcluidos.map(d => d.getTime())))
                  : null;
                const vencida = maiorPrazo ? isPast(startOfDay(maiorPrazo)) && progresso < 100 : false;
                const primeiros5 = missao.missao_checkboxes.slice(0, 5);

                return (
                  <div
                    key={missao.id}
                    onClick={() => setMissaoSelecionada(missao)}
                    className={cn(
                      "rounded-xl p-3 border transition-all duration-200 cursor-pointer hover:border-amber-500/40",
                      vencida
                        ? "bg-red-500/5 border-red-500/20"
                        : progresso === 100
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-white/5 border-white/10"
                    )}
                  >
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight">{missao.titulo}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        {missao.responsavel ? (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={missao.responsavel.foto_perfil_url || undefined} />
                              <AvatarFallback className="text-[8px] bg-blue-500/20 text-blue-400">
                                {missao.responsavel.nome.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-white/50 truncate max-w-[80px]">
                              {missao.responsavel.nome.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/30">Sem responsável</span>
                        )}
                        <span className="text-[10px] text-white/40">{concluidas}/{total}</span>
                      </div>
                    </div>

                    <div className="h-1 rounded-full bg-white/10 mb-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          progresso === 100
                            ? "bg-emerald-500"
                            : vencida
                              ? "bg-red-500"
                              : "bg-amber-500"
                        )}
                        style={{ width: `${progresso}%` }}
                      />
                    </div>

                    <div className="space-y-1">
                      {primeiros5.map((cb) => (
                        <div key={cb.id} className="flex items-center gap-1.5">
                          <div className={cn(
                            "h-3 w-3 rounded-sm border flex-shrink-0 flex items-center justify-center",
                            cb.concluida
                              ? "bg-emerald-500/20 border-emerald-500/40"
                              : "border-white/20"
                          )}>
                            {cb.concluida && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
                          </div>
                          <span className={cn(
                            "text-[11px] leading-tight line-clamp-1 flex-1",
                            cb.concluida ? "text-white/30 line-through" : "text-white/60"
                          )}>
                            {cb.descricao}
                          </span>
                          {cb.prazo && (
                            <span className={cn(
                              "text-[9px] flex-shrink-0",
                              !cb.concluida && isPast(startOfDay(new Date(cb.prazo + "T12:00:00")))
                                ? "text-red-400"
                                : "text-white/30"
                            )}>
                              {format(new Date(cb.prazo + "T12:00:00"), "dd/MM")}
                            </span>
                          )}
                        </div>
                      ))}
                      {total > 5 && (
                        <p className="text-[10px] text-white/30 pl-5">+{total - 5} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal Nova Recorrente (kept for FAB) */}
      <NovaRecorrenteModal
        open={modalRecorrenteAberto}
        onOpenChange={setModalRecorrenteAberto}
        onSubmit={(template) => criarTemplate.mutate(template)}
        isLoading={criarTemplate.isPending}
      />

      {/* Modal Nova Missão */}
      <NovaMissaoModal
        open={modalMissaoAberto}
        onOpenChange={setModalMissaoAberto}
        onSubmit={(data) => criarMissao.mutate(data)}
        isLoading={criarMissao.isPending}
      />

      {/* Modal Detalhes Missão */}
      <DetalhesMissaoModal
        missao={missaoSelecionada}
        open={!!missaoSelecionada}
        onOpenChange={(open) => !open && setMissaoSelecionada(null)}
        onToggleCheckbox={(params) => toggleCheckbox.mutate(params)}
        onDelete={(id) => deletarMissao.mutate(id)}
        onEditarCheckbox={(params) => editarCheckbox.mutate(params)}
        onReordenarCheckboxes={(items) => reordenarCheckboxes.mutate(items)}
        onDeletarCheckbox={(id) => deletarCheckbox.mutate(id)}
      />
    </MinimalistLayout>
  );
}
