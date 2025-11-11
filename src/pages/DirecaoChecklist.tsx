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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar, Repeat, Trash2, List, CalendarDays, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

  // Ordenar tarefas: em andamento primeiro, depois concluídas
  const tarefasOrdenadas = [...tarefas].sort((a, b) => {
    if (a.status === 'em_andamento' && b.status === 'concluida') return -1;
    if (a.status === 'concluida' && b.status === 'em_andamento') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalEmAndamento = tarefas.filter(t => t.status === 'em_andamento').length;
  const totalConcluidas = tarefas.filter(t => t.status === 'concluida').length;

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

      {/* Tabela Unificada de Tarefas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Todas as Tarefas</CardTitle>
            <div className="flex gap-2">
              <Badge variant="destructive" className="text-xs">
                {totalEmAndamento} pendente(s)
              </Badge>
              <Badge className="bg-success text-success-foreground text-xs">
                {totalConcluidas} concluída(s)
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {tarefas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma tarefa encontrada
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 h-8"></TableHead>
                    <TableHead className="h-8">Descrição</TableHead>
                    <TableHead className="w-[180px] h-8">Responsável</TableHead>
                    <TableHead className="w-[90px] h-8">Status</TableHead>
                    <TableHead className="w-[100px] h-8">Data</TableHead>
                    <TableHead className="w-[90px] h-8">Tipo</TableHead>
                    {podeGerenciar && <TableHead className="w-10 h-8"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarefasOrdenadas.map((tarefa) => (
                    <TableRow 
                      key={tarefa.id} 
                      className={`h-10 ${tarefa.status === 'concluida' ? 'opacity-60' : 'hover:bg-accent/30'}`}
                    >
                      <TableCell className="py-1">
                        <Checkbox
                          checked={tarefa.status === 'concluida'}
                          onCheckedChange={() => {
                            if (tarefa.status === 'concluida') {
                              reabrirTarefa.mutate(tarefa.id);
                            } else {
                              marcarConcluida.mutate(tarefa.id);
                            }
                          }}
                          disabled={!podeGerenciar}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell className={`py-1 text-sm ${tarefa.status === 'concluida' ? 'line-through' : 'font-medium'}`}>
                        {tarefa.descricao}
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={tarefa.responsavel?.foto_perfil_url} />
                            <AvatarFallback className="text-[10px]">
                              {tarefa.responsavel?.nome?.substring(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate">{tarefa.responsavel?.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <Badge 
                          variant={tarefa.status === 'em_andamento' ? 'destructive' : 'default'}
                          className="text-[10px] h-5 px-1.5"
                        >
                          {tarefa.status === 'em_andamento' ? 'Pendente' : 'Concluída'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 text-xs text-muted-foreground">
                        {format(new Date(tarefa.created_at), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="py-1">
                        {tarefa.recorrente ? (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                            <Repeat className="h-2.5 w-2.5 mr-0.5" />
                            Rec.
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">Única</Badge>
                        )}
                      </TableCell>
                      {podeGerenciar && (
                        <TableCell className="py-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setTarefaParaDeletar(tarefa.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
