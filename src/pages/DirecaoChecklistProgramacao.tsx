import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas, Tarefa, TarefaTemplate } from "@/hooks/useTarefas";
import { NovaRecorrenteModal } from "@/components/todo/NovaRecorrenteModal";
import { EditarRecorrenteModal } from "@/components/todo/EditarRecorrenteModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Check, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { startOfWeek, endOfWeek, addWeeks, addDays, format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
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

  const hoje = new Date();
  const inicioSemana = startOfWeek(addWeeks(hoje, semanaOffset), { weekStartsOn: 0 });
  const fimSemana = endOfWeek(addWeeks(hoje, semanaOffset), { weekStartsOn: 0 });

  const labelSemana = useMemo(() => {
    return `${format(inicioSemana, "dd MMM", { locale: ptBR })} - ${format(fimSemana, "dd MMM yyyy", { locale: ptBR })}`;
  }, [inicioSemana, fimSemana]);

  // Filtrar tarefas recorrentes e agrupar por dia da semana
  const tarefasPorDia = useMemo(() => {
    const resultado: Record<number, Array<Tarefa & { template?: TarefaTemplate }>> = {};
    DIAS_SEMANA.forEach(dia => {
      resultado[dia.key] = [];
    });

    tarefas.forEach(tarefa => {
      if (!tarefa.recorrente || !tarefa.template_id) return;
      
      const dataStr = (tarefa as any).data_referencia || tarefa.created_at;
      if (!dataStr) return;
      
      const dataTarefa = parseISO(dataStr.split('T')[0]);
      
      // Verifica se está na semana atual
      if (dataTarefa >= inicioSemana && dataTarefa <= fimSemana) {
        const diaSemana = dataTarefa.getDay();
        const template = templates.find(t => t.id === tarefa.template_id);
        resultado[diaSemana].push({ ...tarefa, template });
      }
    });

    return resultado;
  }, [tarefas, templates, inicioSemana, fimSemana]);

  // Estatísticas
  const stats = useMemo(() => {
    const todasTarefas = Object.values(tarefasPorDia).flat();
    const total = todasTarefas.length;
    const concluidas = todasTarefas.filter(t => t.status === 'concluida').length;
    const pendentes = total - concluidas;
    return { total, concluidas, pendentes };
  }, [tarefasPorDia]);

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
              Programação Semanal
            </h1>
            <p className="text-sm text-muted-foreground mt-1 hidden md:block">
              Visualize tarefas recorrentes em formato de calendário
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

      {/* Calendário Semanal em Colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {DIAS_SEMANA.map((dia) => {
          const dataDia = addDays(inicioSemana, dia.key);
          const isHoje = isSameDay(dataDia, hoje);
          const tarefasDoDia = tarefasPorDia[dia.key] || [];

          return (
            <Card
              key={dia.key}
              className={cn(
                "min-h-[220px] flex flex-col",
                isHoje && "border-primary ring-1 ring-primary/20 bg-primary/5"
              )}
            >
              <CardHeader className="p-3 pb-2 border-b bg-muted/30">
                <div className="text-center">
                  <p className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    isHoje ? "text-primary" : "text-muted-foreground"
                  )}>
                    {dia.nome}
                  </p>
                  <p className={cn(
                    "text-xl font-bold",
                    isHoje ? "text-primary" : "text-foreground"
                  )}>
                    {format(dataDia, "dd")}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-2 flex-1 overflow-y-auto space-y-2">
                {tarefasDoDia.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sem tarefas
                    </p>
                  </div>
                ) : (
                  tarefasDoDia.map((tarefa) => {
                    const isConcluida = tarefa.status === 'concluida';
                    return (
                      <div
                        key={tarefa.id}
                        className={cn(
                          "p-2 rounded-md border transition-colors",
                          isConcluida
                            ? "bg-success/10 border-success/30"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            "flex-shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center",
                            isConcluida 
                              ? "bg-success text-success-foreground" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {isConcluida ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-xs font-medium leading-tight",
                              isConcluida && "line-through text-muted-foreground"
                            )}>
                              {tarefa.template?.descricao || tarefa.descricao || "Tarefa"}
                            </p>
                            {tarefa.template?.hora_criacao && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {tarefa.template.hora_criacao.slice(0, 5)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
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
