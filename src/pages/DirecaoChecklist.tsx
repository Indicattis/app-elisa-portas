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

  // Separar tarefas por status
  const tarefasEmAndamento = tarefas.filter(t => t.status === 'em_andamento');
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluida');

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

      {/* Tabela de Tarefas em Andamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Tarefas em Andamento ({tarefasEmAndamento.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tarefasEmAndamento.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma tarefa em andamento
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[200px]">Responsável</TableHead>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    {podeGerenciar && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarefasEmAndamento.map((tarefa) => (
                    <TableRow key={tarefa.id} className="hover:bg-accent/30">
                      <TableCell>
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => marcarConcluida.mutate(tarefa.id)}
                          disabled={!podeGerenciar}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{tarefa.descricao}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={tarefa.responsavel?.foto_perfil_url} />
                            <AvatarFallback className="text-xs">
                              {tarefa.responsavel?.nome?.substring(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{tarefa.responsavel?.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(tarefa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {tarefa.recorrente ? (
                          <Badge variant="secondary" className="text-xs">
                            <Repeat className="h-3 w-3 mr-1" />
                            Recorrente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Única</Badge>
                        )}
                      </TableCell>
                      {podeGerenciar && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setTarefaParaDeletar(tarefa.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Tabela de Tarefas Concluídas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Tarefas Concluídas ({tarefasConcluidas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tarefasConcluidas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma tarefa concluída
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[200px]">Responsável</TableHead>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    {podeGerenciar && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarefasConcluidas.map((tarefa) => (
                    <TableRow key={tarefa.id} className="opacity-50">
                      <TableCell>
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => reabrirTarefa.mutate(tarefa.id)}
                          disabled={!podeGerenciar}
                        />
                      </TableCell>
                      <TableCell className="font-medium line-through">{tarefa.descricao}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={tarefa.responsavel?.foto_perfil_url} />
                            <AvatarFallback className="text-xs">
                              {tarefa.responsavel?.nome?.substring(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{tarefa.responsavel?.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(tarefa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {tarefa.recorrente ? (
                          <Badge variant="outline" className="text-xs">
                            <Repeat className="h-3 w-3 mr-1" />
                            Recorrente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Única</Badge>
                        )}
                      </TableCell>
                      {podeGerenciar && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setTarefaParaDeletar(tarefa.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
