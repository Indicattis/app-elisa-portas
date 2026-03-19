import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas } from "@/hooks/useTarefas";
import { useSetorInfo } from "@/hooks/useSetorInfo";
import { NovaTarefaModal } from "@/components/todo/NovaTarefaModal";
import { TarefasRecorrentesModal } from "@/components/todo/TarefasRecorrentesModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Calendar, Repeat, Trash2, List, ArrowLeft } from "lucide-react";
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
  tecnico_qualidade: 'Técnico de Qualidade',
};

export default function ChecklistLideranca() {
  const navigate = useNavigate();
  // Filtrar tarefas do setor "Direção"
  const setor = 'direcao';
  
  const { user, userRole } = useAuth();
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
    deletarTemplate,
    atualizarTemplate
  } = useTarefas(user?.id, setor);
  const { data: responsavelSetor } = useSetorInfo(setor);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalRecorrentes, setModalRecorrentes] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';
  const setorLabel = SETOR_LABELS[setor as keyof typeof SETOR_LABELS] || 'Direção';
  
  // Verificar se o usuário é o responsável pelo setor
  const isResponsavelSetor = responsavelSetor?.user_id === user?.id;
  const podeMarcarConcluida = podeGerenciar || isResponsavelSetor;

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
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => navigate('/direcao')}
        className="w-fit -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            Checklist Liderança - {setorLabel}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie tarefas do setor {setorLabel.toLowerCase()}
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
                className="flex items-center gap-3 py-2 px-3 border-b last:border-b-0 hover:bg-accent/30 transition-colors"
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={() => marcarConcluida.mutate(tarefa.id)}
                  disabled={!podeMarcarConcluida}
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
                        {tarefa.tipo_recorrencia === 'todos_os_dias' && 'Diária'}
                        {tarefa.tipo_recorrencia === 'primeiro_dia_mes' && '1° do mês'}
                        {tarefa.tipo_recorrencia === 'cada_7_dias' && 'Semanal'}
                        {tarefa.tipo_recorrencia === 'cada_15_dias' && 'Quinzenal'}
                        {tarefa.tipo_recorrencia === 'cada_30_dias' && 'Mensal'}
                      </Badge>
                    )}

                    {tarefa.criador && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        por {tarefa.criador.nome}
                      </span>
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
                className="flex items-center gap-3 py-2 px-3 border-b last:border-b-0 opacity-50"
              >
                <Checkbox
                  checked={true}
                  onCheckedChange={() => reabrirTarefa.mutate(tarefa.id)}
                  disabled={!podeMarcarConcluida}
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
                        {tarefa.tipo_recorrencia === 'todos_os_dias' && 'Diária'}
                        {tarefa.tipo_recorrencia === 'primeiro_dia_mes' && '1° do mês'}
                        {tarefa.tipo_recorrencia === 'cada_7_dias' && 'Semanal'}
                        {tarefa.tipo_recorrencia === 'cada_15_dias' && 'Quinzenal'}
                        {tarefa.tipo_recorrencia === 'cada_30_dias' && 'Mensal'}
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
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Tarefa */}
      <NovaTarefaModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        onSubmit={(tarefa) => {
          criarTarefa.mutate(tarefa);
        }}
        setor={setor}
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
