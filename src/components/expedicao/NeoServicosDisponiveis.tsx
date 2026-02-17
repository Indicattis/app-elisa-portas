import { useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Search, Wrench, Hammer, MapPin, Users, Loader2, Pencil, GripVertical } from "lucide-react";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { NeoCorrecao } from "@/types/neoCorrecao";
import { NeoInstalacaoDetails } from "./NeoInstalacaoDetails";
import { NeoCorrecaoDetails } from "./NeoCorrecaoDetails";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NeoServicosDisponiveisProps {
  neoInstalacoes: NeoInstalacao[];
  neoCorrecoes: NeoCorrecao[];
  onAgendarInstalacao: (id: string, data: string) => Promise<void>;
  onAgendarCorrecao: (id: string, data: string) => Promise<void>;
  onEditarInstalacao?: (neo: NeoInstalacao) => void;
  onEditarCorrecao?: (neo: NeoCorrecao) => void;
  isLoadingInstalacoes?: boolean;
  isLoadingCorrecoes?: boolean;
  onReorganizarInstalacoes?: (updates: { id: string; prioridade_gestao: number }[]) => void;
  onReorganizarCorrecoes?: (updates: { id: string; prioridade_gestao: number }[]) => void;
}

type ServicoItem = {
  id: string;
  tipo: 'instalacao' | 'correcao';
  nome_cliente: string;
  cidade: string;
  estado: string;
  equipe_nome: string | null;
  autorizado_nome: string | null;
  tipo_responsavel: 'equipe_interna' | 'autorizado' | null;
  equipe?: { cor: string | null } | null;
  created_at: string;
  prioridade_gestao?: number | null;
  criador?: {
    id: string;
    nome: string;
    foto_perfil_url: string | null;
  } | null;
  originalInstalacao?: NeoInstalacao;
  originalCorrecao?: NeoCorrecao;
};

const getInitials = (nome: string) => {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

// Sortable table row component
function SortableTableRow({ 
  servico, 
  children 
}: { 
  servico: ServicoItem; 
  children: (dragHandleProps: Record<string, any>, isDragging: boolean) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${servico.tipo}-${servico.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners }, isDragging)}
    </tr>
  );
}

export function NeoServicosDisponiveis({
  neoInstalacoes,
  neoCorrecoes,
  onAgendarInstalacao,
  onAgendarCorrecao,
  onEditarInstalacao,
  onEditarCorrecao,
  isLoadingInstalacoes,
  isLoadingCorrecoes,
  onReorganizarInstalacoes,
  onReorganizarCorrecoes,
}: NeoServicosDisponiveisProps) {
  const [busca, setBusca] = useState("");
  const [agendandoId, setAgendandoId] = useState<string | null>(null);
  const [agendandoTipo, setAgendandoTipo] = useState<'instalacao' | 'correcao' | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const [isAgendando, setIsAgendando] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [selectedInstalacao, setSelectedInstalacao] = useState<NeoInstalacao | null>(null);
  const [instalacaoDetailsOpen, setInstalacaoDetailsOpen] = useState(false);
  const [selectedCorrecao, setSelectedCorrecao] = useState<NeoCorrecao | null>(null);
  const [correcaoDetailsOpen, setCorrecaoDetailsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Combinar todos os serviços em uma lista ordenada por prioridade
  const todosServicos: ServicoItem[] = [
    ...neoInstalacoes.map(neo => ({
      id: neo.id,
      tipo: 'instalacao' as const,
      nome_cliente: neo.nome_cliente,
      cidade: neo.cidade,
      estado: neo.estado,
      equipe_nome: neo.equipe_nome,
      autorizado_nome: neo.autorizado_nome,
      tipo_responsavel: neo.tipo_responsavel,
      equipe: neo.equipe,
      created_at: neo.created_at,
      prioridade_gestao: neo.prioridade_gestao,
      criador: neo.criador,
      originalInstalacao: neo,
    })),
    ...neoCorrecoes.map(neo => ({
      id: neo.id,
      tipo: 'correcao' as const,
      nome_cliente: neo.nome_cliente,
      cidade: neo.cidade,
      estado: neo.estado,
      equipe_nome: neo.equipe_nome,
      autorizado_nome: neo.autorizado_nome,
      tipo_responsavel: neo.tipo_responsavel,
      equipe: neo.equipe,
      created_at: neo.created_at,
      prioridade_gestao: neo.prioridade_gestao,
      criador: neo.criador,
      originalCorrecao: neo,
    })),
  ];

  // Filtrar por busca
  const servicosFiltrados = busca
    ? todosServicos.filter(servico => {
        const termo = busca.toLowerCase();
        return (
          servico.nome_cliente.toLowerCase().includes(termo) ||
          servico.cidade.toLowerCase().includes(termo) ||
          servico.estado.toLowerCase().includes(termo) ||
          servico.criador?.nome?.toLowerCase().includes(termo)
        );
      })
    : todosServicos;

  const hasDnd = !busca && onReorganizarInstalacoes && onReorganizarCorrecoes;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    if (!onReorganizarInstalacoes || !onReorganizarCorrecoes) return;

    const oldIndex = servicosFiltrados.findIndex(s => `${s.tipo}-${s.id}` === active.id);
    const newIndex = servicosFiltrados.findIndex(s => `${s.tipo}-${s.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...servicosFiltrados];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    // Separate instalacoes and correcoes and assign priorities
    const instalacaoUpdates: { id: string; prioridade_gestao: number }[] = [];
    const correcaoUpdates: { id: string; prioridade_gestao: number }[] = [];

    newOrder.forEach((servico, index) => {
      const prioridade = (newOrder.length - index) * 10;
      if (servico.tipo === 'instalacao') {
        instalacaoUpdates.push({ id: servico.id, prioridade_gestao: prioridade });
      } else {
        correcaoUpdates.push({ id: servico.id, prioridade_gestao: prioridade });
      }
    });

    if (instalacaoUpdates.length > 0) onReorganizarInstalacoes(instalacaoUpdates);
    if (correcaoUpdates.length > 0) onReorganizarCorrecoes(correcaoUpdates);
  };

  const activeServico = activeId ? servicosFiltrados.find(s => `${s.tipo}-${s.id}` === activeId) : null;

  const handleAbrirAgendar = (e: React.MouseEvent, id: string, tipo: 'instalacao' | 'correcao') => {
    e.stopPropagation();
    setAgendandoId(id);
    setAgendandoTipo(tipo);
    setDataSelecionada(undefined);
  };

  const handleRowClick = (servico: ServicoItem) => {
    if (servico.tipo === 'instalacao' && servico.originalInstalacao) {
      setSelectedInstalacao(servico.originalInstalacao);
      setInstalacaoDetailsOpen(true);
    } else if (servico.tipo === 'correcao' && servico.originalCorrecao) {
      setSelectedCorrecao(servico.originalCorrecao);
      setCorrecaoDetailsOpen(true);
    }
  };

  const handleConfirmarAgendamento = async () => {
    if (!dataSelecionada) {
      toast.error("Selecione uma data no calendário");
      return;
    }
    if (!agendandoId || !agendandoTipo) return;

    setIsAgendando(true);
    try {
      const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');
      if (agendandoTipo === 'instalacao') {
        await onAgendarInstalacao(agendandoId, dataFormatada);
      } else {
        await onAgendarCorrecao(agendandoId, dataFormatada);
      }
      toast.success("Serviço agendado com sucesso!");
      setAgendandoId(null);
      setAgendandoTipo(null);
      setDataSelecionada(undefined);
    } catch (error) {
      console.error("Erro ao agendar:", error);
      toast.error("Erro ao agendar serviço");
    } finally {
      setIsAgendando(false);
    }
  };

  const isLoading = isLoadingInstalacoes || isLoadingCorrecoes;
  const totalServicos = todosServicos.length;

  if (totalServicos === 0 && !isLoading) {
    return null;
  }

  const renderRowContent = (servico: ServicoItem, dragHandleProps?: Record<string, any>) => (
    <>
      {hasDnd && (
        <TableCell className="w-[40px] px-2">
          <button
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </TableCell>
      )}
      <TableCell>
        {servico.tipo === 'instalacao' ? (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
            <Wrench className="h-3 w-3 mr-1" />
            Instalação
          </Badge>
        ) : (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
            <Hammer className="h-3 w-3 mr-1" />
            Correção
          </Badge>
        )}
      </TableCell>
      <TableCell className="font-medium">
        {servico.nome_cliente}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {servico.cidade}/{servico.estado}
        </div>
      </TableCell>
      <TableCell>
        {servico.tipo_responsavel === 'equipe_interna' && servico.equipe_nome ? (
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: servico.equipe?.cor || '#6366f1' }}
            />
            <span className="text-sm">{servico.equipe_nome}</span>
          </div>
        ) : servico.autorizado_nome ? (
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-emerald-600" />
            <span className="text-sm">{servico.autorizado_nome}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        {servico.criador ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={servico.criador.foto_perfil_url || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {getInitials(servico.criador.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate max-w-[70px]">
                    {servico.criador.nome.split(' ')[0]}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{servico.criador.nome}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              if (servico.tipo === 'instalacao' && servico.originalInstalacao) {
                onEditarInstalacao?.(servico.originalInstalacao);
              } else if (servico.tipo === 'correcao' && servico.originalCorrecao) {
                onEditarCorrecao?.(servico.originalCorrecao);
              }
            }}
            className="h-7 w-7"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => handleAbrirAgendar(e, servico.id, servico.tipo)}
            className="h-7 text-xs"
          >
            Agendar
          </Button>
        </div>
      </TableCell>
    </>
  );

  const tableContent = (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            {hasDnd && <TableHead className="w-[40px] px-2"></TableHead>}
            <TableHead className="w-[100px]">Tipo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="w-[150px]">Localização</TableHead>
            <TableHead className="w-[150px]">Responsável</TableHead>
            <TableHead className="w-[120px]">Criador</TableHead>
            <TableHead className="w-[100px] text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicosFiltrados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={hasDnd ? 8 : 7} className="text-center text-muted-foreground py-8">
                {busca ? "Nenhum serviço encontrado" : "Nenhum serviço pendente de agendamento"}
              </TableCell>
            </TableRow>
          ) : hasDnd ? (
            <SortableContext items={servicosFiltrados.map(s => `${s.tipo}-${s.id}`)} strategy={verticalListSortingStrategy}>
              {servicosFiltrados.map((servico) => (
                <SortableTableRow key={`${servico.tipo}-${servico.id}`} servico={servico}>
                  {(dragHandleProps) => (
                    <>
                      {renderRowContent(servico, dragHandleProps)}
                    </>
                  )}
                </SortableTableRow>
              ))}
            </SortableContext>
          ) : (
            servicosFiltrados.map((servico) => (
              <TableRow 
                key={`${servico.tipo}-${servico.id}`} 
                className="hover:bg-muted/20 cursor-pointer"
                onClick={() => handleRowClick(servico)}
              >
                {renderRowContent(servico)}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card className="border-dashed border-orange-300/50 bg-orange-50/30 dark:bg-orange-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Hammer className="h-4 w-4 text-orange-600" />
                Serviços Avulsos Pendentes
              </CardTitle>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                {totalServicos}
              </Badge>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente, cidade, criador..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : hasDnd ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {tableContent}
              {createPortal(
                <DragOverlay modifiers={[restrictToWindowEdges]} dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                  {activeServico ? (
                    <table className="w-full">
                      <tbody>
                        <tr className="bg-background shadow-2xl opacity-90">
                          {renderRowContent(activeServico)}
                        </tr>
                      </tbody>
                    </table>
                  ) : null}
                </DragOverlay>,
                document.body
              )}
            </DndContext>
          ) : (
            tableContent
          )}
        </CardContent>
      </Card>

      {/* Modal de Agendamento com Calendário */}
      <Dialog open={!!agendandoId} onOpenChange={(open) => !open && setAgendandoId(null)}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Agendar {agendandoTipo === 'instalacao' ? 'Instalação' : 'Correção'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Selecione a data *</Label>
              <div className="border rounded-lg flex justify-center">
                <Calendar
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={setDataSelecionada}
                  locale={ptBR}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  className={cn("p-3 pointer-events-auto")}
                />
              </div>
              {dataSelecionada && (
                <p className="text-sm text-muted-foreground text-center">
                  Selecionado: {format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgendandoId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarAgendamento} disabled={isAgendando || !dataSelecionada}>
              {isAgendando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downbar Neo Instalação */}
      <NeoInstalacaoDetails
        neoInstalacao={selectedInstalacao}
        open={instalacaoDetailsOpen}
        onOpenChange={setInstalacaoDetailsOpen}
      />

      {/* Downbar Neo Correção */}
      <NeoCorrecaoDetails
        neoCorrecao={selectedCorrecao}
        open={correcaoDetailsOpen}
        onOpenChange={setCorrecaoDetailsOpen}
      />
    </>
  );
}
