import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { useAcordosAutorizados, type AcordoAutorizado, type NovoAcordo } from '@/hooks/useAcordosAutorizados';
import { NovoAcordoDialog } from '@/components/autorizados/NovoAcordoDialog';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function AcordosAutorizados() {
  const { acordos, loading, createAcordo, updateAcordo, deleteAcordo } = useAcordosAutorizados();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acordoParaEditar, setAcordoParaEditar] = useState<AcordoAutorizado | null>(null);
  const [acordoParaDeletar, setAcordoParaDeletar] = useState<AcordoAutorizado | null>(null);
  const [precosMap, setPrecosMap] = useState<Map<string, { P: number; G: number; GG: number }>>(new Map());

  // Buscar preços padrões dos autorizados
  useEffect(() => {
    if (acordos.length === 0) return;
    const autorizadoIds = [...new Set(acordos.map(a => a.autorizado_id))];
    supabase
      .from('autorizado_precos_portas')
      .select('autorizado_id, tamanho, valor')
      .in('autorizado_id', autorizadoIds)
      .then(({ data }) => {
        const map = new Map<string, { P: number; G: number; GG: number }>();
        data?.forEach((row) => {
          const existing = map.get(row.autorizado_id) || { P: 0, G: 0, GG: 0 };
          existing[row.tamanho as 'P' | 'G' | 'GG'] = Number(row.valor);
          map.set(row.autorizado_id, existing);
        });
        setPrecosMap(map);
      });
  }, [acordos]);

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
    setDialogOpen(true);
  };

  const handleEditarAcordo = (acordo: AcordoAutorizado) => {
    setAcordoParaEditar(acordo);
    setDialogOpen(true);
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

  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-40 sm:w-56 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-xs"
        />
      </div>
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-36 h-10 bg-white/5 border-white/10 text-white text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          {STATUS_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleNovoAcordo}
        size="sm"
        className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 border border-blue-400/30 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-300 text-xs gap-1.5"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Novo Acordo</span>
      </Button>
    </div>
  );

  return (
    <MinimalistLayout
      title="Pagamentos Autorizados"
      subtitle="Gerencie acordos de instalação"
      backPath="/logistica"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Logística", path: "/logistica" },
        { label: "Pagamentos Autorizados" }
      ]}
      headerActions={headerActions}
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : acordosFiltrados.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/60">Nenhum acordo encontrado</p>
          <Button
            onClick={handleNovoAcordo}
            variant="outline"
            className="mt-4 border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Acordo
          </Button>
        </div>
      ) : (
        <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="border-blue-500/10 hover:bg-white/5">
                    <TableHead className="text-xs text-white/70 text-center">Portas</TableHead>
                    <TableHead className="text-xs text-white/70 text-center">Tamanho</TableHead>
                    <TableHead className="text-xs text-white/70">Autorizado</TableHead>
                    <TableHead className="text-xs text-white/70">Cliente</TableHead>
                    <TableHead className="text-xs text-white/70">Cidade</TableHead>
                    <TableHead className="text-xs text-white/70 text-center">Data</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">Valor</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">Valor excesso</TableHead>
                    <TableHead className="text-xs text-white/70 text-center">Status</TableHead>
                    <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TooltipProvider>
                  {acordosFiltrados.map((acordo) => {
                    const precos = precosMap.get(acordo.autorizado_id);
                    return (
                    <Tooltip key={acordo.id}>
                      <TooltipTrigger asChild>
                        <TableRow 
                          className="border-blue-500/10 hover:bg-white/5 text-white/90 cursor-default"
                        >
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getResumoPortasBadges(acordo)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-white/70 text-xs">
                            {acordo.portas.map(p => p.tamanho).join(', ') || '-'}
                          </TableCell>
                          <TableCell className="text-white/70">
                            {acordo.autorizado_nome}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{acordo.cliente_nome}</span>
                          </TableCell>
                          <TableCell className="text-white/70">
                            {acordo.cliente_cidade} - {acordo.cliente_estado}
                          </TableCell>
                          <TableCell className="text-center text-white/60">
                            {format(new Date(acordo.data_acordo), 'dd/MM/yy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-400">
                            {formatCurrency(acordo.valor_acordado)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {acordo.portas.length > 0 ? (() => {
                              const totalRef = acordo.portas.reduce((sum, p) => sum + p.valor_unitario, 0);
                              const excesso = acordo.valor_acordado - totalRef;
                              return (
                                <span className={excesso > 0 ? 'text-red-400' : 'text-green-400'}>
                                  {excesso > 0 ? '+' : ''}{formatCurrency(excesso)}
                                </span>
                              );
                            })() : <span className="text-white/40">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={STATUS_COLORS[acordo.status]}
                            >
                              {STATUS_LABELS[acordo.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-white/10"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-white/60" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                                <DropdownMenuItem
                                  className="text-white hover:bg-zinc-700 cursor-pointer"
                                  onClick={() => handleEditarAcordo(acordo)}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-400 hover:bg-red-500/20 cursor-pointer"
                                  onClick={() => setAcordoParaDeletar(acordo)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-zinc-900 border-zinc-700">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-white/80 border-b border-zinc-700 pb-1 mb-1">Preços Padrão</p>
                          {precos ? (
                            <>
                              <div className="flex items-center justify-between gap-6">
                                <span className="text-white/60">Porta P</span>
                                <span className="text-white font-medium">{formatCurrency(precos.P)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-6">
                                <span className="text-white/60">Porta G</span>
                                <span className="text-white font-medium">{formatCurrency(precos.G)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-6">
                                <span className="text-white/60">Porta GG</span>
                                <span className="text-white font-medium">{formatCurrency(precos.GG)}</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-white/40">Sem preços cadastrados</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    );
                  })}
                  </TooltipProvider>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <NovoAcordoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSalvarAcordo}
        acordoParaEditar={acordoParaEditar}
      />

      <AlertDialog open={!!acordoParaDeletar} onOpenChange={() => setAcordoParaDeletar(null)}>
        <AlertDialogContent className="bg-black/90 border-white/10 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem certeza que deseja excluir o acordo com <strong>{acordoParaDeletar?.cliente_nome}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-white/10 text-white hover:bg-white/15">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarDelete}
              className="bg-red-500/80 hover:bg-red-500 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
