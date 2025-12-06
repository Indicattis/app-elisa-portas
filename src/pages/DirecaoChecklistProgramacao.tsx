import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas, TarefaTemplate } from "@/hooks/useTarefas";
import { NovaRecorrenteModal } from "@/components/todo/NovaRecorrenteModal";
import { EditarRecorrenteModal } from "@/components/todo/EditarRecorrenteModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, CalendarDays, Clock } from "lucide-react";
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

export default function DirecaoChecklistProgramacao() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
  const { 
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

  // Agrupar templates por dia da semana configurado
  const templatesPorDia = useMemo(() => {
    const resultado: Record<number, TarefaTemplate[]> = {};
    DIAS_SEMANA.forEach(dia => {
      resultado[dia.key] = [];
    });

    templates.forEach(template => {
      if (!template.dias_semana || template.dias_semana.length === 0) return;
      
      template.dias_semana.forEach(diaSemana => {
        if (resultado[diaSemana]) {
          resultado[diaSemana].push(template);
        }
      });
    });

    return resultado;
  }, [templates]);

  const hoje = new Date();
  const diaHoje = hoje.getDay();

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

      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs md:text-sm px-2 md:px-3 py-1">
          {templates.length} template(s) configurado(s)
        </Badge>
      </div>

      {/* Calendário Semanal em Colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {DIAS_SEMANA.map((dia) => {
          const isHoje = dia.key === diaHoje;
          const templatesDoDia = templatesPorDia[dia.key] || [];

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
                    "text-sm font-medium",
                    isHoje ? "text-primary" : "text-muted-foreground"
                  )}>
                    {dia.nomeCompleto}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-2 flex-1 overflow-y-auto space-y-2">
                {templatesDoDia.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sem tarefas
                    </p>
                  </div>
                ) : (
                  templatesDoDia.map((template) => (
                    <div
                      key={template.id}
                      className="p-2 rounded-md border bg-background border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => podeGerenciar && setTemplateParaEditar(template)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <Clock className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-tight">
                            {template.descricao || "Tarefa"}
                          </p>
                          {template.hora_criacao && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {template.hora_criacao.slice(0, 5)}
                            </p>
                          )}
                          {template.responsavel?.nome && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {template.responsavel.nome}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
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
