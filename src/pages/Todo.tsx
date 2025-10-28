import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas } from "@/hooks/useTarefas";
import { useSetorInfo } from "@/hooks/useSetorInfo";
import { NovaTarefaModal } from "@/components/todo/NovaTarefaModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Calendar, Repeat, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SETOR_LABELS } from "@/utils/setorMapping";
import { UserRole } from "@/types/permissions";

const ROLE_LABELS: Record<UserRole, string> = {
  diretor: 'Diretor',
  administrador: 'Administrador',
  gerente_comercial: 'Gerente Comercial',
  coordenador_vendas: 'Coordenador de Vendas',
  vendedor: 'Vendedor',
  gerente_marketing: 'Gerente de Marketing',
  analista_marketing: 'Analista de Marketing',
  assistente_marketing: 'Assistente de Marketing',
  gerente_instalacoes: 'Gerente de Instalações',
  instalador: 'Instalador',
  aux_instalador: 'Auxiliar de Instalação',
  gerente_fabril: 'Gerente Fabril',
  gerente_producao: 'Gerente de Produção',
  soldador: 'Soldador',
  pintor: 'Pintor',
  aux_pintura: 'Auxiliar de Pintura',
  aux_geral: 'Auxiliar Geral',
  gerente_financeiro: 'Gerente Financeiro',
  assistente_administrativo: 'Assistente Administrativo',
  atendente: 'Atendente',
};

export default function Todo() {
  const [searchParams] = useSearchParams();
  const setor = searchParams.get('setor') || undefined;
  
  const { user, userRole } = useAuth();
  const { tarefas, isLoading, criarTarefa, marcarConcluida, reabrirTarefa, deletarTarefa } = useTarefas(user?.id, setor);
  const { data: responsavelSetor } = useSetorInfo(setor);
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';
  const setorLabel = setor ? SETOR_LABELS[setor as keyof typeof SETOR_LABELS] : 'Geral';

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
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            Checklist Liderança - {setorLabel}
          </h1>
          <p className="text-muted-foreground mt-1">
            {setor ? `Gerencie tarefas do setor ${setorLabel.toLowerCase()}` : 'Gerencie suas tarefas e responsabilidades'}
          </p>
        </div>

        {/* Card do Responsável */}
        {responsavelSetor && (
          <Card className="w-80 shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Responsável pelo Setor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={responsavelSetor.foto_perfil_url || undefined} />
                  <AvatarFallback>
                    {responsavelSetor.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{responsavelSetor.nome}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {responsavelSetor.email}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {ROLE_LABELS[responsavelSetor.role as UserRole]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {podeGerenciar && (
          <Button onClick={() => setModalAberto(true)} className="shrink-0">
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
        onSubmit={(tarefa) => criarTarefa.mutate({ ...tarefa, setor: setor || '' })}
        setor={setor}
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
