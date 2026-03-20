import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTarefas, TarefaTemplate } from "@/hooks/useTarefas";
import { TarefasRecorrentesModal } from "@/components/todo/TarefasRecorrentesModal";
import { NovaRecorrenteModal } from "@/components/todo/NovaRecorrenteModal";
import { HistoricoRecorrenteModal } from "@/components/todo/HistoricoRecorrenteModal";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, List, CalendarDays, Clock, Trash2, User, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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

  const {
    isLoading,
    templates,
    criarTemplate,
    toggleTemplate,
    deletarTemplate,
    atualizarTemplate
  } = useTarefas();

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
              {/* Filtro responsável */}
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
                  {/* Dia header */}
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

                  {/* Templates */}
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
                              <div className="p-2 rounded-lg bg-white/5 border border-white/10 group cursor-pointer hover:border-blue-500/30 transition-all duration-200">
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
