import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas } from "@/hooks/useTarefas";
import { NovaTarefaModal } from "@/components/todo/NovaTarefaModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, Repeat, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Todo() {
  const { user, userRole } = useAuth();
  const { tarefas, isLoading, criarTarefa, marcarConcluida, reabrirTarefa, deletarTarefa } = useTarefas(user?.id);
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';

  const tarefasEmAndamento = tarefas.filter(t => t.status === 'em_andamento');
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluida');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Checklist Liderança</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas tarefas e responsabilidades
          </p>
        </div>

        {podeGerenciar && (
          <Button onClick={() => setModalAberto(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Tarefas em Andamento */}
      <Card>
        <CardHeader>
          <CardTitle>Em Andamento ({tarefasEmAndamento.length})</CardTitle>
          <CardDescription>Tarefas que precisam da sua atenção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tarefasEmAndamento.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma tarefa em andamento
            </p>
          ) : (
            tarefasEmAndamento.map((tarefa) => (
              <div
                key={tarefa.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={() => marcarConcluida.mutate(tarefa.id)}
                />

                <div className="flex-1 space-y-2">
                  <p className="font-medium">{tarefa.descricao}</p>

                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(tarefa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>

                    {tarefa.recorrente && tarefa.dia_recorrencia && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        Todo dia {tarefa.dia_recorrencia}
                      </Badge>
                    )}

                    {tarefa.criador && (
                      <span className="text-xs">
                        Criada por: {tarefa.criador.nome}
                      </span>
                    )}
                  </div>
                </div>

                {podeGerenciar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTarefaParaDeletar(tarefa.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tarefas Concluídas */}
      <Card>
        <CardHeader>
          <CardTitle>Concluídas ({tarefasConcluidas.length})</CardTitle>
          <CardDescription>Tarefas finalizadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tarefasConcluidas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma tarefa concluída
            </p>
          ) : (
            tarefasConcluidas.map((tarefa) => (
              <div
                key={tarefa.id}
                className="flex items-start gap-4 p-4 border rounded-lg opacity-60"
              >
                <Checkbox
                  checked={true}
                  onCheckedChange={() => reabrirTarefa.mutate(tarefa.id)}
                />

                <div className="flex-1 space-y-2">
                  <p className="font-medium line-through">{tarefa.descricao}</p>

                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(tarefa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>

                {podeGerenciar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTarefaParaDeletar(tarefa.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Tarefa */}
      <NovaTarefaModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        onSubmit={(tarefa) => criarTarefa.mutate(tarefa)}
      />

      {/* Confirmação de Deleção */}
      <AlertDialog open={!!tarefaParaDeletar} onOpenChange={() => setTarefaParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (tarefaParaDeletar) {
                  deletarTarefa.mutate(tarefaParaDeletar);
                  setTarefaParaDeletar(null);
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
