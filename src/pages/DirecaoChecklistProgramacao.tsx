import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas, Tarefa, TarefaTemplate } from "@/hooks/useTarefas";
import { NovaRecorrenteModal } from "@/components/todo/NovaRecorrenteModal";
import { EditarRecorrenteModal } from "@/components/todo/EditarRecorrenteModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Check, Clock, User } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { startOfWeek, endOfWeek, addWeeks, format, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const DIAS_SEMANA_NOMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function DirecaoChecklistProgramacao() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [semanaOffset, setSemanaOffset] = useState(0);
  
  const { 
    tarefas,
    templates,
    isLoading,
    criarTemplate,
    deletarTemplate,
    atualizarTemplate
  } = useTarefas();
  
  const [modalRecorrenteAberto, setModalRecorrenteAberto] = useState(false);
  const [templateParaEditar, setTemplateParaEditar] = useState<TarefaTemplate | null>(null);
  const [templateParaDeletar, setTemplateParaDeletar] = useState<string | null>(null);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';

  // Calcular intervalo da semana selecionada
  const semanaAtual = useMemo(() => {
    const hoje = new Date();
    const semanaBase = addWeeks(hoje, semanaOffset);
    const inicio = startOfWeek(semanaBase, { weekStartsOn: 0 });
    const fim = endOfWeek(semanaBase, { weekStartsOn: 0 });
    return { inicio, fim };
  }, [semanaOffset]);

  const labelSemana = useMemo(() => {
    return `${format(semanaAtual.inicio, "dd MMM", { locale: ptBR })} - ${format(semanaAtual.fim, "dd MMM yyyy", { locale: ptBR })}`;
  }, [semanaAtual]);

  // Filtrar tarefas recorrentes da semana selecionada
  const tarefasRecorrentesDaSemana = useMemo(() => {
    return tarefas.filter(tarefa => {
      if (!tarefa.recorrente || !tarefa.template_id) return false;
      
      const dataStr = (tarefa as any).data_referencia || tarefa.created_at;
      if (!dataStr) return false;
      
      const dataTarefa = parseISO(dataStr.split('T')[0]);
      return isWithinInterval(dataTarefa, { start: semanaAtual.inicio, end: semanaAtual.fim });
    });
  }, [tarefas, semanaAtual]);

  // Agrupar tarefas por template
  const tarefasPorTemplate = useMemo(() => {
    const grupos: Record<string, { template: TarefaTemplate; tarefas: Tarefa[] }> = {};
    
    templates.forEach(template => {
      grupos[template.id] = { template, tarefas: [] };
    });
    
    tarefasRecorrentesDaSemana.forEach(tarefa => {
      if (tarefa.template_id && grupos[tarefa.template_id]) {
        grupos[tarefa.template_id].tarefas.push(tarefa);
      }
    });
    
    return Object.values(grupos);
  }, [templates, tarefasRecorrentesDaSemana]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = tarefasRecorrentesDaSemana.length;
    const concluidas = tarefasRecorrentesDaSemana.filter(t => t.status === 'concluida').length;
    const pendentes = total - concluidas;
    return { total, concluidas, pendentes };
  }, [tarefasRecorrentesDaSemana]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/dashboard/direcao/checklist')}
          className="w-fit -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate flex items-center gap-2">
              <CalendarDays className="h-6 w-6 md:h-8 md:w-8" />
              Programação de Tarefas
            </h1>
            <p className="text-sm text-muted-foreground mt-1 hidden md:block">
              Visualize e gerencie tarefas recorrentes por semana
            </p>
          </div>

          {podeGerenciar && (
            <Button onClick={() => setModalRecorrenteAberto(true)} className="hidden md:flex">
              <Plus className="h-4 w-4 mr-2" />
              Nova Recorrente
            </Button>
          )}
        </div>
      </div>

      {/* Navegação de semana */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSemanaOffset(prev => prev - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm md:text-base font-medium">{labelSemana}</span>
          {semanaOffset !== 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemanaOffset(0)}
              className="text-xs h-7 px-2"
            >
              Hoje
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSemanaOffset(prev => prev + 1)}
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Badges de resumo */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs md:text-sm px-2 md:px-3 py-1">
          {templates.length} template(s)
        </Badge>
        <Badge variant="destructive" className="text-xs md:text-sm px-2 md:px-3 py-1">
          {stats.pendentes} pendente(s)
        </Badge>
        <Badge className="bg-success text-success-foreground text-xs md:text-sm px-2 md:px-3 py-1">
          {stats.concluidas} concluída(s)
        </Badge>
      </div>

      {/* Lista de tarefas por template */}
      <div className="space-y-4">
        {tarefasPorTemplate.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum template de tarefa recorrente configurado.
            </CardContent>
          </Card>
        ) : (
          tarefasPorTemplate.map(({ template, tarefas: tarefasDoTemplate }) => (
            <Card key={template.id}>
              <CardHeader className="pb-3 px-4 md:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg truncate">
                      {template.descricao}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>{template.responsavel?.nome || 'Sem responsável'}</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <div className="text-sm text-muted-foreground">
                        {template.dias_semana?.map(d => DIAS_SEMANA_NOMES[d]).join(', ') || 'Sem dias'}
                      </div>
                      {template.hora_criacao && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <div className="text-sm text-muted-foreground">
                            {template.hora_criacao.slice(0, 5)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {podeGerenciar && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTemplateParaEditar(template)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setTemplateParaDeletar(template.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 px-4 md:px-6">
                {tarefasDoTemplate.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Nenhuma tarefa programada para esta semana.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {tarefasDoTemplate
                      .sort((a, b) => {
                        const dateA = (a as any).data_referencia || a.created_at;
                        const dateB = (b as any).data_referencia || b.created_at;
                        return dateA.localeCompare(dateB);
                      })
                      .map(tarefa => {
                        const dataStr = (tarefa as any).data_referencia || tarefa.created_at;
                        const data = parseISO(dataStr.split('T')[0]);
                        const diaSemana = DIAS_SEMANA_NOMES[data.getDay()];
                        const dataFormatada = format(data, "dd/MM", { locale: ptBR });
                        const isConcluida = tarefa.status === 'concluida';

                        return (
                          <div
                            key={tarefa.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              isConcluida 
                                ? "bg-success/10 border-success/30" 
                                : "bg-muted/30 border-border"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex items-center justify-center h-8 w-8 rounded-full",
                                isConcluida 
                                  ? "bg-success text-success-foreground" 
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {isConcluida ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Clock className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {diaSemana}, {dataFormatada}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {isConcluida ? 'Concluída' : 'Pendente'}
                                </div>
                              </div>
                            </div>
                            
                            {tarefa.responsavel && (
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={tarefa.responsavel.foto_perfil_url} />
                                <AvatarFallback className="text-xs">
                                  {tarefa.responsavel.nome?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* FAB Mobile */}
      {podeGerenciar && (
        <Button
          onClick={() => setModalRecorrenteAberto(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Modal Nova Recorrente */}
      <NovaRecorrenteModal
        open={modalRecorrenteAberto}
        onOpenChange={setModalRecorrenteAberto}
        onSubmit={(template) => {
          criarTemplate.mutate(template);
        }}
        isLoading={criarTemplate.isPending}
      />

      {/* Modal Editar Recorrente */}
      {templateParaEditar && (
        <EditarRecorrenteModal
          open={!!templateParaEditar}
          onOpenChange={(open) => !open && setTemplateParaEditar(null)}
          template={templateParaEditar}
          onSubmit={(id, updates) => {
            atualizarTemplate.mutate({ id, ...updates });
            setTemplateParaEditar(null);
          }}
        />
      )}

      {/* Confirmação de Deleção */}
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
                  deletarTemplate.mutate(templateParaDeletar);
                  setTemplateParaDeletar(null);
                }
              }}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
