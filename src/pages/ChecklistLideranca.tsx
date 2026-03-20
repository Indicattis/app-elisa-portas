import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTarefas } from "@/hooks/useTarefas";
import { useSetorInfo } from "@/hooks/useSetorInfo";
import { NovaTarefaModal } from "@/components/todo/NovaTarefaModal";
import { TarefasRecorrentesModal } from "@/components/todo/TarefasRecorrentesModal";
import { CalendarioSemanal } from "@/components/todo/CalendarioSemanal";
import { ChecklistFiltros } from "@/components/todo/ChecklistFiltros";
import { TarefasTabela } from "@/components/todo/TarefasTabela";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Calendar, Trash, List, ArrowLeft, CalendarDays } from "lucide-react";
import { isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval, format, addWeeks, subWeeks } from "date-fns";
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
  const { user, userRole } = useAuth();
  
  // Setor
  const [setor, setSetor] = useState<string>('vendas');
  
  // Filtros
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>("todos");
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("todos");
  const [statusSelecionado, setStatusSelecionado] = useState<string>("todos");
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const [mostrarLixeira, setMostrarLixeira] = useState(false);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [diaCalendario, setDiaCalendario] = useState<Date>(new Date());

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
  } = useTarefas(usuarioSelecionado === "todos" ? undefined : usuarioSelecionado, setor);
  const { data: responsavelSetor } = useSetorInfo(setor);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [modalRecorrentes, setModalRecorrentes] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';
  const isResponsavelSetor = responsavelSetor?.user_id === user?.id;
  const podeMarcarConcluida = podeGerenciar || isResponsavelSetor;

  // Calcular intervalo da semana selecionada
  const semanaAtual = useMemo(() => {
    const hoje = new Date();
    const semanaBase = semanaOffset === 0 ? hoje : 
      semanaOffset > 0 ? addWeeks(hoje, semanaOffset) : subWeeks(hoje, Math.abs(semanaOffset));
    const inicio = startOfWeek(semanaBase, { weekStartsOn: 0 });
    const fim = endOfWeek(semanaBase, { weekStartsOn: 0 });
    return { inicio, fim };
  }, [semanaOffset]);

  // Filtrar tarefas da semana
  const tarefasDaSemana = useMemo(() => {
    return tarefas.filter(tarefa => {
      const dataStr = tarefa.data_referencia || tarefa.created_at;
      if (!dataStr) return false;
      const dataTarefa = parseISO(dataStr.split('T')[0]);
      return isWithinInterval(dataTarefa, { start: semanaAtual.inicio, end: semanaAtual.fim });
    });
  }, [tarefas, semanaAtual]);

  const tarefasFiltradas = useMemo(() => {
    return tarefasDaSemana.filter(tarefa => {
      if (tipoSelecionado === "unica" && tarefa.recorrente) return false;
      if (tipoSelecionado === "recorrente" && !tarefa.recorrente) return false;
      if (statusSelecionado === "em_andamento" && tarefa.status !== "em_andamento") return false;
      if (statusSelecionado === "concluida" && tarefa.status !== "concluida") return false;
      if (dataSelecionada) {
        const dataStr = tarefa.data_referencia || tarefa.created_at;
        const dataTarefa = parseISO(dataStr.split('T')[0]);
        if (!isSameDay(dataTarefa, dataSelecionada)) return false;
      }
      if (!mostrarLixeira && tarefa.status === 'concluida') return false;
      if (mostrarLixeira && tarefa.status !== 'concluida') return false;
      return true;
    });
  }, [tarefasDaSemana, tipoSelecionado, statusSelecionado, dataSelecionada, mostrarLixeira]);

  const tarefasAtivas = tarefasFiltradas.filter(t => t.status === 'em_andamento');
  const tarefasConcluidas = tarefasFiltradas.filter(t => t.status === 'concluida');
  const totalEmAndamento = tarefasDaSemana.filter(t => t.status === 'em_andamento').length;
  const totalConcluidas = tarefasDaSemana.filter(t => t.status === 'concluida').length;

  const labelSemana = useMemo(() => {
    return `${format(semanaAtual.inicio, "dd MMM", { locale: ptBR })} - ${format(semanaAtual.fim, "dd MMM", { locale: ptBR })}`;
  }, [semanaAtual]);

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
          onClick={() => navigate('/direcao')}
          className="w-fit -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate">
              Checklist Liderança
            </h1>
            <p className="text-sm text-muted-foreground mt-1 hidden md:block">
              Gerencie tarefas por setor
            </p>
            <div className="mt-3 w-64">
              <Select value={setor} onValueChange={setSetor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SETOR_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Card do Responsável */}
          {responsavelSetor && (
            <Card className="w-80 shrink-0 hidden md:block">
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

          {/* Desktop buttons */}
          {podeGerenciar && (
            <div className="hidden md:flex gap-2 shrink-0">
              <Button variant="outline" onClick={() => navigate('/dashboard/direcao/checklist/programacao')}>
                <CalendarDays className="h-4 w-4 mr-2" />
                Programação
              </Button>
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
      </div>

      {/* Badges de resumo */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <Badge variant="destructive" className="text-xs md:text-sm px-2 md:px-3 py-1 whitespace-nowrap">
          {totalEmAndamento} pendente(s)
        </Badge>
        <Badge className="bg-success text-success-foreground text-xs md:text-sm px-2 md:px-3 py-1 whitespace-nowrap">
          {totalConcluidas} concluída(s)
        </Badge>
      </div>

      {/* Calendário Semanal */}
      <CalendarioSemanal 
        tarefas={tarefas} 
        diaSelecionado={diaCalendario}
        onDiaChange={setDiaCalendario}
      />

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

      {/* Tabela de Tarefas da Semana */}
      <Card>
        <CardHeader className="pb-3 px-4 md:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {mostrarLixeira ? "Lixeira da Semana" : "Tarefas da Semana"}
              </CardTitle>
              <Button
                variant={mostrarLixeira ? "default" : "outline"}
                size="sm"
                onClick={() => setMostrarLixeira(!mostrarLixeira)}
              >
                <Trash className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">
                  {mostrarLixeira ? "Voltar" : `Lixeira (${totalConcluidas})`}
                </span>
                <span className="md:hidden ml-1">{totalConcluidas}</span>
              </Button>
            </div>
            
            {/* Navegação de semana */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSemanaOffset(prev => prev - 1)}
              >
                ← Anterior
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{labelSemana}</span>
                {semanaOffset !== 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSemanaOffset(0)}
                    className="text-xs h-6 px-2"
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
                Próxima →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 md:px-6">
          <TarefasTabela
            tarefas={mostrarLixeira ? tarefasConcluidas : tarefasAtivas}
            podeGerenciar={podeMarcarConcluida}
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
