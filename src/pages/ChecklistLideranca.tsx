import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTarefas, TarefaTemplate } from "@/hooks/useTarefas";
import { useMissoes } from "@/hooks/useMissoes";
import { TarefasRecorrentesModal } from "@/components/todo/TarefasRecorrentesModal";
import { NovaRecorrenteModal } from "@/components/todo/NovaRecorrenteModal";
import { HistoricoRecorrenteModal } from "@/components/todo/HistoricoRecorrenteModal";
import { NovaMissaoModal } from "@/components/todo/NovaMissaoModal";
import { DetalhesMissaoModal } from "@/components/todo/DetalhesMissaoModal";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, List, CalendarDays, Clock, Trash2, User, History, Target, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format, isPast, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const DIAS_SEMANA = [
  { key: 0, nome: "Dom", nomeCompleto: "Domingo" },
  { key: 1, nome: "Seg", nomeCompleto: "Segunda" },
  { key: 2, nome: "Ter", nomeCompleto: "Terça" },
  { key: 3, nome: "Qua", nomeCompleto: "Quarta" },
  { key: 4, nome: "Qui", nomeCompleto: "Quinta" },
  { key: 5, nome: "Sex", nomeCompleto: "Sexta" },
  { key: 6, nome: "Sab", nomeCompleto: "Sábado" },
];

export default function ChecklistLideranca() {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  // Programação states
  const [modalRecorrenteAberto, setModalRecorrenteAberto] = useState(false);
  const [templateParaDeletar, setTemplateParaDeletar] = useState<TarefaTemplate | null>(null);
  const [filtroResponsavel, setFiltroResponsavel] = useState<string | null>(null);
  const [modalRecorrentes, setModalRecorrentes] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState<TarefaTemplate | null>(null);

  // Missões states
  const [modalMissaoAberto, setModalMissaoAberto] = useState(false);

  const {
    isLoading,
    templates,
    criarTemplate,
    toggleTemplate,
    deletarTemplate,
    atualizarTemplate
  } = useTarefas();

  const { missoes, isLoading: loadingMissoes, criarMissao, deletarMissao, toggleCheckbox } = useMissoes();
  const [missaoSelecionada, setMissaoSelecionada] = useState<import("@/hooks/useMissoes").Missao | null>(null);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';

  // === Programação logic ===
  const responsaveis = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; foto_perfil_url?: string }>();
    templates.forEach(template => {
      if (template.responsavel_id && template.responsavel?.nome) {
        map.set(template.responsavel_id, {
          id: template.responsavel_id,
          nome: template.responsavel.nome,
          foto_perfil_url: template.responsavel.foto_perfil_url
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [templates]);

  const templatesFiltrados = useMemo(() => {
    if (!filtroResponsavel) return templates;
    return templates.filter(t => t.responsavel_id === filtroResponsavel);
  }, [templates, filtroResponsavel]);

  const templatesPorDia = useMemo(() => {
    const resultado: Record<number, TarefaTemplate[]> = {};
    DIAS_SEMANA.forEach(dia => { resultado[dia.key] = []; });
    templatesFiltrados.forEach(template => {
      if (!template.dias_semana || template.dias_semana.length === 0) return;
      template.dias_semana.forEach(diaSemana => {
        if (resultado[diaSemana]) resultado[diaSemana].push(template);
      });
    });
    return resultado;
  }, [templatesFiltrados]);

  const diaHoje = new Date().getDay();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

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
        onClick={() => setModalRecorrentes(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10
                   hover:bg-white/10 text-white/70 hover:text-white text-sm transition-all duration-200"
      >
        <List className="h-4 w-4" />
        <span className="hidden md:inline">Recorrentes ({templates.length})</span>
      </button>
      <button
        onClick={() => setModalMissaoAberto(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10
                   hover:bg-white/10 text-white/70 hover:text-white text-sm transition-all duration-200"
      >
        <Target className="h-4 w-4" />
        <span className="hidden md:inline">Nova Missão</span>
      </button>
      <button
        onClick={() => setModalRecorrenteAberto(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700
                   text-white text-sm font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden md:inline">Nova Tarefa</span>
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
        {/* Programação Semanal */}
        <section className="space-y-4">
          {/* Section header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Programação Semanal</h2>
                <p className="text-sm text-white/40">
                  {templatesFiltrados.length} template(s) {filtroResponsavel ? "filtrado(s)" : "configurado(s)"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={filtroResponsavel || "todos"}
                onValueChange={(value) => setFiltroResponsavel(value === "todos" ? null : value)}
              >
                <SelectTrigger className="w-[200px] h-9 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filtrar responsável">
                    {filtroResponsavel ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={responsaveis.find(r => r.id === filtroResponsavel)?.foto_perfil_url || undefined} />
                          <AvatarFallback className="text-[9px] bg-blue-500/20 text-blue-400">
                            {responsaveis.find(r => r.id === filtroResponsavel)?.nome?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{responsaveis.find(r => r.id === filtroResponsavel)?.nome?.split(' ')[0]}</span>
                      </div>
                    ) : (
                      "Todos os responsáveis"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="todos">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Todos os responsáveis</span>
                    </div>
                  </SelectItem>
                  {responsaveis.map((resp) => (
                    <SelectItem key={resp.id} value={resp.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={resp.foto_perfil_url || undefined} />
                          <AvatarFallback className="text-[9px] bg-blue-500/20 text-blue-400">
                            {resp.nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{resp.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid de 7 colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {DIAS_SEMANA.map((dia) => {
              const isHoje = dia.key === diaHoje;
              const templatesDoDia = templatesPorDia[dia.key] || [];

              return (
                <div
                  key={dia.key}
                  className={cn(
                    "min-h-[220px] flex flex-col rounded-xl p-1.5",
                    isHoje
                      ? "bg-blue-500/10 border border-blue-500/30"
                      : "bg-white/5 border border-blue-500/10"
                  )}
                >
                  <div className={cn(
                    "text-center py-2 rounded-lg mb-2",
                    isHoje ? "bg-blue-500/20" : "bg-white/5"
                  )}>
                    <p className={cn(
                      "text-sm font-medium",
                      isHoje ? "text-blue-400" : "text-white/50"
                    )}>
                      {dia.nomeCompleto}
                    </p>
                    {templatesDoDia.length > 0 && (
                      <span className={cn(
                        "text-[10px]",
                        isHoje ? "text-blue-400/70" : "text-white/30"
                      )}>
                        {templatesDoDia.length} tarefa(s)
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 px-1">
                    {templatesDoDia.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-white/20 text-center py-4">
                          Sem tarefas
                        </p>
                      </div>
                    ) : (
                      templatesDoDia.map((template) => (
                        <TooltipProvider key={template.id}>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div
                                className="p-2 rounded-lg bg-white/5 border border-white/10 group cursor-pointer hover:border-blue-500/30 transition-all duration-200"
                                onClick={() => setTemplateSelecionado(template)}
                              >
                                <div className="flex items-start gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={template.responsavel?.foto_perfil_url || undefined} />
                                    <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-400">
                                      {template.responsavel?.nome?.charAt(0)?.toUpperCase() || <User className="h-3 w-3" />}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium leading-tight line-clamp-2 text-white/80">
                                      {template.descricao || "Tarefa"}
                                    </p>
                                    {template.hora_criacao && (
                                      <p className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {template.hora_criacao.slice(0, 5)}
                                      </p>
                                    )}
                                  </div>
                                  {podeGerenciar && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTemplateParaDeletar(template);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={template.responsavel?.foto_perfil_url || undefined} />
                                  <AvatarFallback className="text-xs bg-blue-500/20 text-blue-400">
                                    {template.responsavel?.nome?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{template.responsavel?.nome || "Sem responsável"}</p>
                                  <p className="text-xs text-muted-foreground">{template.responsavel?.email}</p>
                                </div>
                              </div>
                              <div className="border-t pt-2 space-y-1">
                                <p className="text-sm font-medium">{template.descricao}</p>
                                {template.hora_criacao && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Horário: {template.hora_criacao.slice(0, 5)}
                                  </p>
                                )}
                                {template.dias_semana && template.dias_semana.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    Dias: {template.dias_semana.map(d => DIAS_SEMANA.find(dia => dia.key === d)?.nome).filter(Boolean).join(", ")}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))
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
                // Find latest prazo among incomplete checkboxes
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
                    {/* Header */}
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

                    {/* Progress bar */}
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

                    {/* Primeiros 5 checkboxes */}
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

      {/* FAB Mobile */}
      <Button
        onClick={() => setModalRecorrenteAberto(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-50 bg-gradient-to-r from-blue-500 to-blue-700"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Modal Nova Recorrente */}
      <NovaRecorrenteModal
        open={modalRecorrenteAberto}
        onOpenChange={setModalRecorrenteAberto}
        onSubmit={(template) => criarTemplate.mutate(template)}
        isLoading={criarTemplate.isPending}
      />

      {/* Modal Tarefas Recorrentes */}
      <TarefasRecorrentesModal
        open={modalRecorrentes}
        onOpenChange={setModalRecorrentes}
        templates={templates}
        onToggle={(id, ativa) => toggleTemplate.mutate({ id, ativa })}
        onDelete={(id) => deletarTemplate.mutate(id)}
        onEdit={(id, updates) => atualizarTemplate.mutate({ id, ...updates })}
        podeGerenciar={podeGerenciar}
      />

      {/* Modal Histórico Recorrente */}
      <HistoricoRecorrenteModal
        template={templateSelecionado}
        open={!!templateSelecionado}
        onOpenChange={(open) => !open && setTemplateSelecionado(null)}
        onDelete={(id) => deletarTemplate.mutate(id)}
      />

      {/* Modal Nova Missão */}
      <NovaMissaoModal
        open={modalMissaoAberto}
        onOpenChange={setModalMissaoAberto}
        onSubmit={(data) => criarMissao.mutate(data)}
        isLoading={criarMissao.isPending}
      />

      {/* Confirmação de Deleção de Template */}
      <AlertDialog open={!!templateParaDeletar} onOpenChange={() => setTemplateParaDeletar(null)}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este template? Todas as tarefas futuras associadas também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (templateParaDeletar) {
                  deletarTemplate.mutate(templateParaDeletar.id);
                  setTemplateParaDeletar(null);
                }
              }}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
