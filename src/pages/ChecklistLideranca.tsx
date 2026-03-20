import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTarefas, TarefaTemplate } from "@/hooks/useTarefas";
import { useSetorInfo } from "@/hooks/useSetorInfo";
import { NovaTarefaModal } from "@/components/todo/NovaTarefaModal";
import { TarefasRecorrentesModal } from "@/components/todo/TarefasRecorrentesModal";
import { NovaRecorrenteModal } from "@/components/todo/NovaRecorrenteModal";
import { CalendarioSemanal } from "@/components/todo/CalendarioSemanal";
import { ChecklistFiltros } from "@/components/todo/ChecklistFiltros";
import { TarefasTabela } from "@/components/todo/TarefasTabela";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Calendar, Trash, List, ArrowLeft, CalendarDays, Clock, Trash2, User } from "lucide-react";
import { isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval, format, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SETOR_LABELS } from "@/utils/setorMapping";
import { UserRole } from "@/types/permissions";
import { cn } from "@/lib/utils";

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

const DIAS_SEMANA = [
  { key: 0, nome: "Dom", nomeCompleto: "Domingo" },
  { key: 1, nome: "Seg", nomeCompleto: "Segunda" },
  { key: 2, nome: "Ter", nomeCompleto: "Terça" },
  { key: 3, nome: "Qua", nomeCompleto: "Quarta" },
  { key: 4, nome: "Qui", nomeCompleto: "Quinta" },
  { key: 5, nome: "Sex", nomeCompleto: "Sexta" },
  { key: 6, nome: "Sab", nomeCompleto: "Sábado" },
];

export default function ChecklistLideranca() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  // Tab state
  const [abaPrincipal, setAbaPrincipal] = useState<string>("tarefas");

  // Setor
  const [setor, setSetor] = useState<string>('vendas');
  
  // Filtros (Tarefas)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>("todos");
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("todos");
  const [statusSelecionado, setStatusSelecionado] = useState<string>("todos");
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const [mostrarLixeira, setMostrarLixeira] = useState(false);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [diaCalendario, setDiaCalendario] = useState<Date>(new Date());

  // Programação states
  const [modalRecorrenteAberto, setModalRecorrenteAberto] = useState(false);
  const [templateParaDeletar, setTemplateParaDeletar] = useState<TarefaTemplate | null>(null);
  const [filtroResponsavel, setFiltroResponsavel] = useState<string | null>(null);

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

  // === Tarefas logic ===
  const semanaAtual = useMemo(() => {
    const hoje = new Date();
    const semanaBase = semanaOffset === 0 ? hoje : 
      semanaOffset > 0 ? addWeeks(hoje, semanaOffset) : subWeeks(hoje, Math.abs(semanaOffset));
    const inicio = startOfWeek(semanaBase, { weekStartsOn: 0 });
    const fim = endOfWeek(semanaBase, { weekStartsOn: 0 });
    return { inicio, fim };
  }, [semanaOffset]);

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

  // === Programação logic ===
  const responsaveis = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; foto_perfil_url?: string }>();
    templates.forEach(template => {
      if (template.responsavel_id && template.responsavel?.nome) {
        map.set(template.responsavel_id, {
          id: template.responsavel_id,
          nome: template.responsavel.nome,
          foto_perfil_url: template.responsavel.foto_perfil_url
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [templates]);

  const templatesFiltrados = useMemo(() => {
    if (!filtroResponsavel) return templates;
    return templates.filter(t => t.responsavel_id === filtroResponsavel);
  }, [templates, filtroResponsavel]);

  const templatesPorDia = useMemo(() => {
    const resultado: Record<number, TarefaTemplate[]> = {};
    DIAS_SEMANA.forEach(dia => {
      resultado[dia.key] = [];
    });
    templatesFiltrados.forEach(template => {
      if (!template.dias_semana || template.dias_semana.length === 0) return;
      template.dias_semana.forEach(diaSemana => {
        if (resultado[diaSemana]) {
          resultado[diaSemana].push(template);
        }
      });
    });
    return resultado;
  }, [templatesFiltrados]);

  const diaHoje = new Date().getDay();

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
              <Button variant="outline" onClick={() => setModalRecorrentes(true)}>
                <List className="h-4 w-4 mr-2" />
                Recorrentes ({templates.length})
              </Button>
              <Button onClick={() => abaPrincipal === 'programacao' ? setModalRecorrenteAberto(true) : setModalAberto(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {abaPrincipal === 'programacao' ? 'Nova Recorrente' : 'Nova Tarefa'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={abaPrincipal} onValueChange={setAbaPrincipal}>
        <TabsList>
          <TabsTrigger value="tarefas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="programacao" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Programação
          </TabsTrigger>
        </TabsList>

        {/* Tab: Tarefas */}
        <TabsContent value="tarefas" className="space-y-4 mt-4">
          {/* Badges de resumo */}
          <div className="flex gap-2 overflow-x-auto pb-1">
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
        </TabsContent>

        {/* Tab: Programação */}
        <TabsContent value="programacao" className="space-y-4 mt-4">
          {/* Filtro de responsável + badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={filtroResponsavel || "todos"}
              onValueChange={(value) => setFiltroResponsavel(value === "todos" ? null : value)}
            >
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Filtrar responsável">
                  {filtroResponsavel ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={responsaveis.find(r => r.id === filtroResponsavel)?.foto_perfil_url || undefined} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {responsaveis.find(r => r.id === filtroResponsavel)?.nome?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{responsaveis.find(r => r.id === filtroResponsavel)?.nome?.split(' ')[0]}</span>
                    </div>
                  ) : (
                    "Todos os responsáveis"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="todos">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Todos os responsáveis</span>
                  </div>
                </SelectItem>
                {responsaveis.map((resp) => (
                  <SelectItem key={resp.id} value={resp.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={resp.foto_perfil_url || undefined} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {resp.nome.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{resp.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="secondary" className="text-xs md:text-sm px-2 md:px-3 py-1">
              {templatesFiltrados.length} template(s) {filtroResponsavel ? "filtrado(s)" : "configurado(s)"}
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
                        <TooltipProvider key={template.id}>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div className="p-2 rounded-md border bg-background border-border group cursor-pointer hover:border-primary/50 transition-colors">
                                <div className="flex items-start gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={template.responsavel?.foto_perfil_url || undefined} />
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                      {template.responsavel?.nome?.charAt(0)?.toUpperCase() || <User className="h-3 w-3" />}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium leading-tight line-clamp-2">
                                      {template.descricao || "Tarefa"}
                                    </p>
                                    {template.hora_criacao && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {template.hora_criacao.slice(0, 5)}
                                      </p>
                                    )}
                                  </div>
                                  {podeGerenciar && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTemplateParaDeletar(template);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={template.responsavel?.foto_perfil_url || undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {template.responsavel?.nome?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{template.responsavel?.nome || "Sem responsável"}</p>
                                  <p className="text-xs text-muted-foreground">{template.responsavel?.email}</p>
                                </div>
                              </div>
                              <div className="border-t pt-2 space-y-1">
                                <p className="text-sm font-medium">{template.descricao}</p>
                                {template.hora_criacao && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Horário: {template.hora_criacao.slice(0, 5)}
                                  </p>
                                )}
                                {template.setor && (
                                  <p className="text-xs text-muted-foreground">
                                    Setor: {template.setor}
                                  </p>
                                )}
                                {template.dias_semana && template.dias_semana.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    Dias: {template.dias_semana.map(d => DIAS_SEMANA.find(dia => dia.key === d)?.nome).filter(Boolean).join(", ")}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAB Mobile */}
      {podeGerenciar && (
        <Button
          onClick={() => abaPrincipal === 'programacao' ? setModalRecorrenteAberto(true) : setModalAberto(true)}
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

      {/* Modal Nova Recorrente */}
      <NovaRecorrenteModal
        open={modalRecorrenteAberto}
        onOpenChange={setModalRecorrenteAberto}
        onSubmit={(template) => {
          criarTemplate.mutate(template);
        }}
        isLoading={criarTemplate.isPending}
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

      {/* Confirmação de Deleção de Tarefa */}
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

      {/* Confirmação de Deleção de Template */}
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
                  deletarTemplate.mutate(templateParaDeletar.id);
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
