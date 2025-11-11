import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas } from "@/hooks/useTarefas";
import { useAllUsers } from "@/hooks/useAllUsers";
import { NovaTarefaModal } from "@/components/todo/NovaTarefaModal";
import { TarefasRecorrentesModal } from "@/components/todo/TarefasRecorrentesModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Repeat, Trash2, List, CalendarDays, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

export default function DirecaoChecklist() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>("todos");
  const { data: todosUsuarios, isLoading: loadingUsers } = useAllUsers();
  
  const userId = usuarioSelecionado === "todos" ? undefined : usuarioSelecionado;
  
  const { 
    tarefas, 
    isLoading, 
    templates,
    criarTarefa, 
    criarTemplate,
    marcarConcluida, 
    reabrirTarefa, 
    deletarTarefa,
    toggleTemplate,
    deletarTemplate
  } = useTarefas(userId);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [modalRecorrentes, setModalRecorrentes] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';

  // Agrupar tarefas por usuário
  const tarefasPorUsuario = tarefas.reduce((acc, tarefa) => {
    const userId = tarefa.responsavel_id;
    if (!acc[userId]) {
      acc[userId] = {
        usuario: tarefa.responsavel,
        emAndamento: [],
        concluidas: [],
      };
    }
    
    if (tarefa.status === 'em_andamento') {
      acc[userId].emAndamento.push(tarefa);
    } else if (tarefa.status === 'concluida') {
      acc[userId].concluidas.push(tarefa);
    }
    
    return acc;
  }, {} as Record<string, any>);

  if (isLoading || loadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard/direcao')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Calendário
            </Button>
          </div>
          <h1 className="text-3xl font-bold">
            Checklist de Direção
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie tarefas de toda a equipe
          </p>
        </div>

        {podeGerenciar && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => setModalRecorrentes(true)}>
              <List className="h-4 w-4 mr-2" />
              Recorrentes ({templates.length})
            </Button>
            <Button onClick={() => setModalAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        )}
      </div>

      {/* Filtro de usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrar por responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={usuarioSelecionado} onValueChange={setUsuarioSelecionado}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Selecione um usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os usuários</SelectItem>
              {todosUsuarios?.map((usuario) => (
                <SelectItem key={usuario.user_id} value={usuario.user_id}>
                  {usuario.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tarefas agrupadas por usuário */}
      {Object.entries(tarefasPorUsuario).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhuma tarefa encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(tarefasPorUsuario).map(([userId, grupo]: [string, any]) => (
          <Card key={userId}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={grupo.usuario?.foto_perfil_url || undefined} />
                  <AvatarFallback>
                    {grupo.usuario?.nome?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{grupo.usuario?.nome || 'Desconhecido'}</CardTitle>
                  <CardDescription>{grupo.usuario?.email}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="destructive">
                    {grupo.emAndamento.length} pendente(s)
                  </Badge>
                  <Badge className="bg-success text-success-foreground">
                    {grupo.concluidas.length} concluída(s)
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tarefas em Andamento */}
              {grupo.emAndamento.length > 0 && (
                <>
                  <div className="text-sm font-semibold text-muted-foreground">
                    Em Andamento
                  </div>
                  {grupo.emAndamento.map((tarefa: any) => (
                    <div
                      key={tarefa.id}
                      className="flex items-center gap-3 py-2 px-3 border rounded-md hover:bg-accent/30 transition-colors"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => marcarConcluida.mutate(tarefa.id)}
                        disabled={!podeGerenciar}
                        className="shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tarefa.descricao}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tarefa.created_at), "dd/MM", { locale: ptBR })}
                          </span>

                          {tarefa.recorrente && (
                            <Badge variant="secondary" className="h-5 text-xs flex items-center gap-1 px-1.5">
                              <Repeat className="h-3 w-3" />
                              Recorrente
                            </Badge>
                          )}
                        </div>
                      </div>

                      {podeGerenciar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setTarefaParaDeletar(tarefa.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Separador */}
              {grupo.emAndamento.length > 0 && grupo.concluidas.length > 0 && (
                <Separator className="my-4" />
              )}

              {/* Tarefas Concluídas */}
              {grupo.concluidas.length > 0 && (
                <>
                  <div className="text-sm font-semibold text-muted-foreground">
                    Concluídas
                  </div>
                  {grupo.concluidas.map((tarefa: any) => (
                    <div
                      key={tarefa.id}
                      className="flex items-center gap-3 py-2 px-3 border rounded-md opacity-50"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => reabrirTarefa.mutate(tarefa.id)}
                        disabled={!podeGerenciar}
                        className="shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-through truncate">{tarefa.descricao}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tarefa.created_at), "dd/MM", { locale: ptBR })}
                          </span>

                          {tarefa.recorrente && (
                            <Badge variant="outline" className="h-5 text-xs flex items-center gap-1 px-1.5">
                              <Repeat className="h-3 w-3" />
                              Recorrente
                            </Badge>
                          )}
                        </div>
                      </div>

                      {podeGerenciar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setTarefaParaDeletar(tarefa.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal Nova Tarefa */}
      <NovaTarefaModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        onSubmit={(tarefa) => {
          if (tarefa.recorrente) {
            criarTemplate.mutate(tarefa);
          } else {
            criarTarefa.mutate(tarefa);
          }
        }}
      />

      {/* Modal Tarefas Recorrentes */}
      <TarefasRecorrentesModal
        open={modalRecorrentes}
        onOpenChange={setModalRecorrentes}
        templates={templates}
        onToggle={(id, ativa) => toggleTemplate.mutate({ id, ativa })}
        onDelete={(id) => deletarTemplate.mutate(id)}
        podeGerenciar={podeGerenciar}
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
