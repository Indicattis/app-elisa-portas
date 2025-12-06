import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas } from "@/hooks/useTarefas";
import { NovaTarefaModal } from "@/components/todo/NovaTarefaModal";
import { NovaRecorrenteModal } from "@/components/todo/NovaRecorrenteModal";
import { EditarRecorrenteModal } from "@/components/todo/EditarRecorrenteModal";
import { ChecklistFiltros } from "@/components/todo/ChecklistFiltros";
import { CalendarioSemanal } from "@/components/todo/CalendarioSemanal";
import { TarefasTabela } from "@/components/todo/TarefasTabela";
import { TemplatesTabela } from "@/components/todo/TemplatesTabela";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, ArrowLeft, Trash, MoreVertical } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DirecaoChecklist() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
  // Filtros
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>("todos");
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("todos");
  const [statusSelecionado, setStatusSelecionado] = useState<string>("todos");
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const [mostrarLixeira, setMostrarLixeira] = useState(false);
  
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
    deletarTemplate,
    atualizarTemplate
  } = useTarefas(userId);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [modalRecorrenteAberto, setModalRecorrenteAberto] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);
  const [templateParaEditar, setTemplateParaEditar] = useState<any>(null);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';

  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter(tarefa => {
      if (tipoSelecionado === "unica" && tarefa.recorrente) return false;
      if (tipoSelecionado === "recorrente" && !tarefa.recorrente) return false;

      if (statusSelecionado === "em_andamento" && tarefa.status !== "em_andamento") return false;
      if (statusSelecionado === "concluida" && tarefa.status !== "concluida") return false;

      if (dataSelecionada) {
        const dataTarefa = parseISO(tarefa.created_at);
        if (!isSameDay(dataTarefa, dataSelecionada)) return false;
      }

      if (!mostrarLixeira && tarefa.status === 'concluida') return false;
      if (mostrarLixeira && tarefa.status !== 'concluida') return false;

      return true;
    });
  }, [tarefas, tipoSelecionado, statusSelecionado, dataSelecionada, mostrarLixeira]);

  const tarefasAtivas = tarefasFiltradas.filter(t => t.status === 'em_andamento');
  const tarefasConcluidas = tarefasFiltradas.filter(t => t.status === 'concluida');

  const totalEmAndamento = tarefas.filter(t => t.status === 'em_andamento').length;
  const totalConcluidas = tarefas.filter(t => t.status === 'concluida').length;
  const totalTemplates = templates.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* Header - Mobile First */}
      <div className="flex flex-col gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/dashboard/direcao')}
          className="w-fit -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate">
              Checklist de Direção
            </h1>
            <p className="text-sm text-muted-foreground mt-1 hidden md:block">
              Gerencie tarefas de toda a equipe
            </p>
          </div>

          {/* Desktop buttons */}
          {podeGerenciar && (
            <div className="hidden md:flex gap-2 shrink-0">
              <Button variant="outline" onClick={() => setModalRecorrenteAberto(true)}>
                <CalendarDays className="h-4 w-4 mr-2" />
                Nova Recorrente
              </Button>
              <Button onClick={() => setModalAberto(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          )}

          {/* Mobile dropdown menu */}
          {podeGerenciar && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => setModalRecorrenteAberto(true)}>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Nova Recorrente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Badges de resumo - scrollable no mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <Badge variant="secondary" className="text-xs md:text-sm px-2 md:px-3 py-1 whitespace-nowrap">
          {totalTemplates} template(s)
        </Badge>
        <Badge variant="destructive" className="text-xs md:text-sm px-2 md:px-3 py-1 whitespace-nowrap">
          {totalEmAndamento} pendente(s)
        </Badge>
        <Badge className="bg-success text-success-foreground text-xs md:text-sm px-2 md:px-3 py-1 whitespace-nowrap">
          {totalConcluidas} concluída(s)
        </Badge>
      </div>

      {/* Calendário Semanal */}
      <CalendarioSemanal tarefas={tarefas} />

      {/* Filtros */}
      <ChecklistFiltros
        usuarioSelecionado={usuarioSelecionado}
        setUsuarioSelecionado={setUsuarioSelecionado}
        tipoSelecionado={tipoSelecionado}
        setTipoSelecionado={setTipoSelecionado}
        statusSelecionado={statusSelecionado}
        setStatusSelecionado={setStatusSelecionado}
        dataSelecionada={dataSelecionada}
        setDataSelecionada={setDataSelecionada}
      />

      {/* Tabela de Templates Recorrentes */}
      <Card>
        <CardHeader className="pb-3 px-4 md:px-6">
          <CardTitle className="text-base md:text-lg">Templates Recorrentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 md:px-6">
          <TemplatesTabela
            templates={templates}
            podeGerenciar={podeGerenciar}
            onEditar={setTemplateParaEditar}
            onDeletar={(id) => deletarTemplate.mutate(id)}
          />
        </CardContent>
      </Card>

      {/* Tabela de Tarefas Normais */}
      <Card>
        <CardHeader className="pb-3 px-4 md:px-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base md:text-lg">
              {mostrarLixeira ? "Lixeira" : "Tarefas Ativas"}
            </CardTitle>
            <Button
              variant={mostrarLixeira ? "default" : "outline"}
              size="sm"
              onClick={() => setMostrarLixeira(!mostrarLixeira)}
            >
              <Trash className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">
                {mostrarLixeira ? "Voltar para Ativas" : `Lixeira (${totalConcluidas})`}
              </span>
              <span className="md:hidden ml-1">{totalConcluidas}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 md:px-6">
          <TarefasTabela
            tarefas={mostrarLixeira ? tarefasConcluidas : tarefasAtivas}
            podeGerenciar={podeGerenciar}
            onMarcarConcluida={(id) => marcarConcluida.mutate(id)}
            onReabrir={(id) => reabrirTarefa.mutate(id)}
            onDeletar={(id) => setTarefaParaDeletar(id)}
          />
        </CardContent>
      </Card>

      {/* FAB Mobile - Nova Tarefa */}
      {podeGerenciar && (
        <Button
          onClick={() => setModalAberto(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Modal Nova Tarefa */}
      <NovaTarefaModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        onSubmit={(tarefa) => {
          criarTarefa.mutate(tarefa);
        }}
      />

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
      <AlertDialog open={!!tarefaParaDeletar} onOpenChange={() => setTarefaParaDeletar(null)}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
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