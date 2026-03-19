import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';
import { useEstadosCidades } from '@/hooks/useEstadosCidades';
import { SortableEstadoCard } from '@/components/autorizados/EstadoCard';
import { NovoEstadoDialog } from '@/components/autorizados/NovoEstadoDialog';
import { useAcordosAutorizados, type AcordoAutorizado, type NovoAcordo } from '@/hooks/useAcordosAutorizados';
import { NovoAcordoDialog } from '@/components/autorizados/NovoAcordoDialog';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';

interface Props {
  contexto?: 'direcao' | 'logistica';
}

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os Status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
];

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  em_andamento: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  concluido: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};

const PORTA_COLORS: Record<string, string> = {
  P: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  G: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  GG: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
};

export default function AutorizadosPrecosDirecao({ contexto = 'direcao' }: Props) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // Estados
  const { estados, loading: loadingEstados, criarEstado, editarEstado, reordenarEstados } = useEstadosCidades();
  const [novoEstadoOpen, setNovoEstadoOpen] = useState(false);
  const [estadoParaEditar, setEstadoParaEditar] = useState<typeof estados[0] | null>(null);

  // Acordos
  const { acordos, loading: loadingAcordos, createAcordo, updateAcordo, deleteAcordo } = useAcordosAutorizados();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [acordoDialogOpen, setAcordoDialogOpen] = useState(false);
  const [acordoParaEditar, setAcordoParaEditar] = useState<AcordoAutorizado | null>(null);
  const [acordoParaDeletar, setAcordoParaDeletar] = useState<AcordoAutorizado | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const backPath = contexto === 'logistica' ? '/logistica' : '/direcao';
  const breadcrumbLabel = contexto === 'logistica' ? 'Logística' : 'Direção';

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = estados.findIndex(e => e.id === active.id);
      const newIndex = estados.findIndex(e => e.id === over?.id);
      const newOrder = arrayMove(estados, oldIndex, newIndex);
      reordenarEstados(newOrder);
    }
  };

  const handleCloseEstadoDialog = (open: boolean) => {
    setNovoEstadoOpen(open);
    if (!open) setEstadoParaEditar(null);
  };

  // Acordos logic
  const acordosFiltrados = useMemo(() => {
    return acordos.filter((acordo) => {
      const matchSearch =
        acordo.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acordo.autorizado_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acordo.cliente_cidade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'todos' || acordo.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [acordos, searchTerm, filterStatus]);

  const handleNovoAcordo = () => {
    setAcordoParaEditar(null);
    setAcordoDialogOpen(true);
  };

  const handleEditarAcordo = (acordo: AcordoAutorizado) => {
    setAcordoParaEditar(acordo);
    setAcordoDialogOpen(true);
  };

  const handleSalvarAcordo = async (novoAcordo: NovoAcordo) => {
    if (acordoParaEditar) {
      await updateAcordo(acordoParaEditar.id, novoAcordo);
    } else {
      await createAcordo(novoAcordo);
    }
  };

  const handleConfirmarDelete = async () => {
    if (acordoParaDeletar) {
      await deleteAcordo(acordoParaDeletar.id);
      setAcordoParaDeletar(null);
    }
  };

  const getResumoPortasBadges = (acordo: AcordoAutorizado) => {
    const resumo = acordo.portas.reduce((acc, p) => {
      acc[p.tamanho] = (acc[p.tamanho] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(resumo).map(([tam, qtd]) => (
      <Badge
        key={tam}
        variant="outline"
        className={`text-[10px] px-1.5 py-0 ${PORTA_COLORS[tam] || 'bg-white/10 text-white/70 border-white/20'}`}
      >
        {qtd}{tam}
      </Badge>
    ));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb
        items={[
          { label: "Home", path: "/home" },
          { label: breadcrumbLabel, path: backPath },
          { label: "Autorizados" }
        ]}
        mounted={mounted}
      />

      <div className="pt-12">
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(backPath)}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Gestão de Autorizados</h1>
                <p className="text-xs text-white/60">{estados.length} estados cadastrados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(`/${contexto}/autorizados/novo`)}
                className="bg-primary/20 hover:bg-primary/30 border border-primary/30"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Autorizado
              </Button>
              <Button
                onClick={() => setNovoEstadoOpen(true)}
                variant="outline"
                className="border-primary/30 text-white/80"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Estado
              </Button>
              {contexto === 'logistica' && (
                <Button
                  onClick={handleNovoAcordo}
                  className="bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Acordo
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 py-4 max-w-7xl mx-auto space-y-8">
          {/* Seção Estados */}
          {loadingEstados ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-medium text-white/70 mb-3">Estados Cadastrados</h2>
              {estados.length === 0 ? (
                <div className="text-center py-8 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-white/60 mb-4">Nenhum estado cadastrado</p>
                  <Button onClick={() => setNovoEstadoOpen(true)} variant="outline" className="bg-primary/10 border-primary/20">
                    <Plus className="h-4 w-4 mr-1" />
                    Cadastrar Estado
                  </Button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={estados.map(e => e.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {estados.map(estado => (
                        <SortableEstadoCard
                          key={estado.id}
                          estado={estado}
                          onClick={() => navigate(`/${contexto}/autorizados/estado/${estado.id}`)}
                          isSelected={false}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* Separador */}
          <div className="border-t border-primary/10" />
              {/* Separador */}
              <div className="border-t border-primary/10" />

              {/* Seção Acordos */}
              <div>
                <h2 className="text-sm font-medium text-white/70 mb-3">Acordos com Autorizados</h2>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      placeholder="Buscar por cliente, autorizado ou cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingAcordos ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : acordosFiltrados.length === 0 ? (
                  <div className="text-center py-8 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-white/60 mb-4">Nenhum acordo encontrado</p>
                    {contexto === 'logistica' && (
                      <Button onClick={handleNovoAcordo} variant="outline" className="bg-primary/10 border-primary/20">
                        <Plus className="h-4 w-4 mr-1" />
                        Criar Primeiro Acordo
                      </Button>
                    )}
                  </div>
                ) : (
                  <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow className="border-primary/10 hover:bg-primary/5">
                              <TableHead className="text-xs text-white/70">Cliente</TableHead>
                              <TableHead className="text-xs text-white/70">Autorizado</TableHead>
                              <TableHead className="text-xs text-white/70 text-center">Portas</TableHead>
                              <TableHead className="text-xs text-white/70 text-right">Valor</TableHead>
                              <TableHead className="text-xs text-white/70 text-right">Excesso</TableHead>
                              <TableHead className="text-xs text-white/70 text-center">Status</TableHead>
                              <TableHead className="text-xs text-white/70 text-center">Data</TableHead>
                              <TableHead className="text-xs text-white/70 text-center">Criado por</TableHead>
                              {contexto === 'logistica' && (
                                <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {acordosFiltrados.map((acordo) => (
                              <TableRow key={acordo.id} className="border-primary/10 hover:bg-primary/10 text-white/90">
                                <TableCell>
                                  <div>
                                    <span className="font-medium">{acordo.cliente_nome}</span>
                                    <p className="text-white/50 text-xs">{acordo.cliente_cidade} - {acordo.cliente_estado}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-white/70">{acordo.autorizado_nome}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {getResumoPortasBadges(acordo)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium text-green-400">
                                  {formatCurrency(acordo.valor_acordado)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {(() => {
                                    const totalRef = acordo.portas.reduce((sum, p) => sum + (p.valor_unitario || 0), 0);
                                    const excesso = acordo.valor_acordado - totalRef;
                                    return (
                                      <span className={excesso > 0 ? 'text-red-400' : 'text-green-400'}>
                                        {excesso > 0 ? '+' : ''}{formatCurrency(excesso)}
                                      </span>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className={STATUS_COLORS[acordo.status]}>
                                    {STATUS_LABELS[acordo.status]}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center text-white/60">
                                  {format(new Date(acordo.data_acordo), 'dd/MM/yy', { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-center">
                                  {acordo.criador ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex justify-center">
                                            <Avatar className="h-6 w-6">
                                              <AvatarImage src={acordo.criador.foto_perfil_url} />
                                              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                                {getInitials(acordo.criador.nome)}
                                              </AvatarFallback>
                                            </Avatar>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{acordo.criador.nome}</p></TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className="text-white/40">-</span>
                                  )}
                                </TableCell>
                                {contexto === 'logistica' && (
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10">
                                          <MoreHorizontal className="h-4 w-4 text-white/60" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                                        <DropdownMenuItem className="text-white hover:bg-zinc-700 cursor-pointer" onClick={() => handleEditarAcordo(acordo)}>
                                          <Edit2 className="h-4 w-4 mr-2" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-400 hover:bg-red-500/20 cursor-pointer" onClick={() => setAcordoParaDeletar(acordo)}>
                                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
        </div>
      </div>

      {/* Dialogs */}
      <NovoEstadoDialog
        open={novoEstadoOpen}
        onOpenChange={handleCloseEstadoDialog}
        onSave={criarEstado}
        estadoParaEditar={estadoParaEditar}
        onUpdate={editarEstado}
        estadosCadastrados={estados.map(e => e.sigla)}
      />

      {contexto === 'logistica' && (
        <>
          <NovoAcordoDialog
            open={acordoDialogOpen}
            onOpenChange={setAcordoDialogOpen}
            onSave={handleSalvarAcordo}
            acordoParaEditar={acordoParaEditar}
          />

          <AlertDialog open={!!acordoParaDeletar} onOpenChange={() => setAcordoParaDeletar(null)}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  Tem certeza que deseja excluir o acordo com <strong>{acordoParaDeletar?.cliente_nome}</strong>?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmarDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
