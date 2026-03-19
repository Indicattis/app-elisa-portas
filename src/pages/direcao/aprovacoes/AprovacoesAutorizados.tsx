import { useState, useMemo, useCallback } from 'react';
import { Search, Check, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { useAcordosAutorizados, type AcordoAutorizado } from '@/hooks/useAcordosAutorizados';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

export default function AprovacoesAutorizados() {
  const { acordos, loading, refetch } = useAcordosAutorizados();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [showAll, setShowAll] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const acordosFiltrados = useMemo(() => {
    return acordos.filter((acordo) => {
      const matchSearch =
        acordo.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acordo.autorizado_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acordo.cliente_cidade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'todos' || acordo.status === filterStatus;
      const matchApproval = showAll || !(acordo as any).aprovado_direcao;
      return matchSearch && matchStatus && matchApproval;
    });
  }, [acordos, searchTerm, filterStatus, showAll]);

  const handleAprovar = useCallback(async (acordoId: string) => {
    try {
      setApprovingId(acordoId);
      const { error } = await supabase
        .from('acordos_instalacao_autorizados')
        .update({
          aprovado_direcao: true,
          aprovado_direcao_por: user?.id,
          aprovado_direcao_em: new Date().toISOString(),
        } as any)
        .eq('id', acordoId);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Acordo aprovado com sucesso' });
      await refetch();
    } catch (error: any) {
      console.error('Erro ao aprovar acordo:', error);
      toast({ title: 'Erro', description: 'Não foi possível aprovar o acordo', variant: 'destructive' });
    } finally {
      setApprovingId(null);
    }
  }, [user?.id, toast, refetch]);

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
      <div className="flex items-center gap-2 ml-2">
        <Switch
          id="show-all"
          checked={showAll}
          onCheckedChange={setShowAll}
          className="data-[state=checked]:bg-orange-500"
        />
        <Label htmlFor="show-all" className="text-xs text-white/60 whitespace-nowrap">Ver todos</Label>
      </div>
    </div>
  );

  return (
    <MinimalistLayout
      title="Aprovações Autorizados"
      subtitle="Aprove acordos de instalação"
      backPath="/direcao/aprovacoes"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Direção", path: "/direcao" },
        { label: "Aprovações", path: "/direcao/aprovacoes" },
        { label: "Autorizados" }
      ]}
      headerActions={headerActions}
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
        </div>
      ) : acordosFiltrados.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/60">
            {showAll ? 'Nenhum acordo encontrado' : 'Nenhum acordo pendente de aprovação'}
          </p>
        </div>
      ) : (
        <Card className="bg-white/5 border-orange-500/10 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="border-orange-500/10 hover:bg-white/5">
                    <TableHead className="text-xs text-white/70">Cliente</TableHead>
                    <TableHead className="text-xs text-white/70">Autorizado</TableHead>
                    <TableHead className="text-xs text-white/70 text-center">Portas</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">Valor</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">Excesso</TableHead>
                    <TableHead className="text-xs text-white/70 text-center">Status</TableHead>
                    <TableHead className="text-xs text-white/70 text-center">Data</TableHead>
                    <TableHead className="text-xs text-white/70 text-center">Criado por</TableHead>
                    <TableHead className="text-xs text-white/70 text-center">Aprovação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acordosFiltrados.map((acordo) => {
                    const isAprovado = (acordo as any).aprovado_direcao;
                    return (
                      <TableRow
                        key={acordo.id}
                        className="border-orange-500/10 hover:bg-white/5 text-white/90"
                      >
                        <TableCell>
                          <div>
                            <span className="font-medium">{acordo.cliente_nome}</span>
                            <p className="text-white/50 text-xs">
                              {acordo.cliente_cidade} - {acordo.cliente_estado}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/70">
                          {acordo.autorizado_nome}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getResumoPortasBadges(acordo)}
                          </div>
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
                                <TooltipContent>
                                  <p>{acordo.criador.nome}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isAprovado ? (
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Aprovado
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              disabled={approvingId === acordo.id}
                              onClick={() => handleAprovar(acordo.id)}
                              className="h-7 px-3 text-xs bg-gradient-to-r from-green-500 to-green-700 border border-green-400/30 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] transition-all duration-300 gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Aprovar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </MinimalistLayout>
  );
}
