import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Calendar, Settings } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas } from "@/hooks/useTarefas";
import { NovaTarefaModal } from "./NovaTarefaModal";
import { TarefasRecorrentesModal } from "./TarefasRecorrentesModal";
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface MinhasTarefasSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinhasTarefasSheet({ open, onOpenChange }: MinhasTarefasSheetProps) {
  const { user, userRole, isAdmin } = useAuth();
  const [novaTarefaOpen, setNovaTarefaOpen] = useState(false);
  const [recorrentesOpen, setRecorrentesOpen] = useState(false);
  const [tarefaToDelete, setTarefaToDelete] = useState<string | null>(null);

  const isDiretor = userRole?.role === 'diretor';
  const podeGerenciar = isAdmin || isDiretor;

  const {
    tarefas = [],
    templates = [],
    isLoading,
    criarTarefa,
    marcarConcluida,
    reabrirTarefa,
    deletarTarefa,
    toggleTemplate,
    deletarTemplate,
    atualizarTemplate,
  } = useTarefas(user?.id);

  // Filtrar apenas tarefas da semana atual
  const tarefasDaSemana = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 });
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 0 });

    return tarefas.filter((tarefa) => {
      // Para tarefas recorrentes, usar data_referencia
      // Para tarefas não recorrentes, usar created_at
      const dataStr = (tarefa as any).data_referencia || tarefa.created_at;
      if (!dataStr) return false;
      
      const dataTarefa = parseISO(dataStr.split('T')[0]);
      return isWithinInterval(dataTarefa, { start: inicioSemana, end: fimSemana });
    });
  }, [tarefas]);

  const tarefasEmAndamento = tarefasDaSemana.filter((t) => t.status === "em_andamento");
  const tarefasConcluidas = tarefasDaSemana.filter((t) => t.status === "concluida");

  const handleCheckboxChange = (tarefaId: string, isCompleted: boolean) => {
    if (isCompleted) {
      reabrirTarefa.mutate(tarefaId);
    } else {
      marcarConcluida.mutate(tarefaId);
    }
  };

  const handleDelete = (tarefaId: string) => {
    setTarefaToDelete(tarefaId);
  };

  const confirmDelete = () => {
    if (tarefaToDelete) {
      deletarTarefa.mutate(tarefaToDelete);
      setTarefaToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-[400px]">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-[400px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                Tarefas da Semana
                {tarefasEmAndamento.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {tarefasEmAndamento.length}
                  </Badge>
                )}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="px-6 py-3 border-b flex gap-2">
            {podeGerenciar && (
              <>
                <Button
                  onClick={() => setNovaTarefaOpen(true)}
                  size="sm"
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Tarefa
                </Button>
                <Button
                  onClick={() => setRecorrentesOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4">
              {/* Em Andamento */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Em Andamento ({tarefasEmAndamento.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {tarefasEmAndamento.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Nenhuma tarefa pendente
                    </p>
                  ) : (
                    tarefasEmAndamento.map((tarefa) => (
                      <div
                        key={tarefa.id}
                        className={cn(
                          "flex items-center gap-2 h-[30px] px-2 hover:bg-accent/50 rounded-md transition-colors",
                          "border-b border-border/30 last:border-0"
                        )}
                      >
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleCheckboxChange(tarefa.id, false)}
                          className="h-4 w-4"
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={undefined} />
                          <AvatarFallback className="text-[10px]">
                            {tarefa.responsavel?.nome?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm truncate">{tarefa.descricao}</span>
                        {tarefa.recorrente && (
                          <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
                            <Calendar className="h-2.5 w-2.5 mr-0.5" />
                            Recorrente
                          </Badge>
                        )}
                        {podeGerenciar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDelete(tarefa.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Concluídas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Concluídas ({tarefasConcluidas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {tarefasConcluidas.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Nenhuma tarefa concluída
                    </p>
                  ) : (
                    tarefasConcluidas.map((tarefa) => (
                      <div
                        key={tarefa.id}
                        className={cn(
                          "flex items-center gap-2 h-[30px] px-2 hover:bg-accent/50 rounded-md transition-colors",
                          "border-b border-border/30 last:border-0 opacity-60"
                        )}
                      >
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => handleCheckboxChange(tarefa.id, true)}
                          className="h-4 w-4"
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={undefined} />
                          <AvatarFallback className="text-[10px]">
                            {tarefa.responsavel?.nome?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm truncate line-through">
                          {tarefa.descricao}
                        </span>
                        {tarefa.recorrente && (
                          <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
                            <Calendar className="h-2.5 w-2.5 mr-0.5" />
                            Recorrente
                          </Badge>
                        )}
                        {podeGerenciar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDelete(tarefa.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <NovaTarefaModal
        open={novaTarefaOpen}
        onOpenChange={setNovaTarefaOpen}
        onSubmit={(tarefa) => criarTarefa.mutate(tarefa)}
      />

      {podeGerenciar && (
        <TarefasRecorrentesModal
          open={recorrentesOpen}
          onOpenChange={setRecorrentesOpen}
          templates={templates}
          onToggle={(id, ativa) => toggleTemplate.mutate({ id, ativa })}
          onDelete={(id) => deletarTemplate.mutate(id)}
          onEdit={(id, updates) => atualizarTemplate.mutate({ id, ...updates })}
          podeGerenciar={podeGerenciar}
        />
      )}

      <AlertDialog open={!!tarefaToDelete} onOpenChange={() => setTarefaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
