import { useState } from 'react';
import { Search, Plus, AlertCircle, RefreshCw, CheckCircle, Trash2, Calendar, DollarSign } from 'lucide-react';
import { format, parseISO, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { useMultas, Multa } from '@/hooks/useMultas';
import { useAllUsers } from '@/hooks/useAllUsers';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getMultaStatus(multa: Multa): 'paga' | 'vencida' | 'hoje' | 'pendente' {
  if (multa.status === 'paga') return 'paga';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = parseISO(multa.data_vencimento + 'T12:00:00');
  if (isBefore(venc, hoje)) return 'vencida';
  if (isToday(venc)) return 'hoje';
  return 'pendente';
}

const statusConfig = {
  vencida: { label: 'Vencida', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
  hoje: { label: 'Vence Hoje', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  pendente: { label: 'Pendente', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  paga: { label: 'Paga', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

function MultaCard({ multa, onPagar, onExcluir }: { multa: Multa; onPagar: () => void; onExcluir: () => void }) {
  const status = getMultaStatus(multa);
  const cfg = statusConfig[status];

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`text-[10px] px-1.5 py-0 ${cfg.class}`}>{cfg.label}</Badge>
          </div>
          <h3 className="text-white font-medium truncate">{multa.usuario_nome}</h3>
          {multa.descricao && (
            <p className="text-sm text-white/50 mt-1 truncate">{multa.descricao}</p>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-center">
            <div className="text-xs text-white/50 mb-0.5">Vencimento</div>
            <div className={`text-sm font-medium flex items-center gap-1 ${
              status === 'vencida' ? 'text-red-400' : status === 'hoje' ? 'text-amber-400' : 'text-white'
            }`}>
              <Calendar className="w-3 h-3" />
              {format(parseISO(multa.data_vencimento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          </div>

          <div className="text-right min-w-[100px]">
            <div className="text-xs text-white/50 mb-0.5">Valor</div>
            <div className="text-base font-semibold text-amber-400 flex items-center justify-end gap-1">
              <DollarSign className="w-4 h-4" />
              {formatCurrency(multa.valor).replace('R$', '').trim()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status !== 'paga' && (
              <Button size="icon" variant="ghost" onClick={onPagar} className="text-green-400 hover:text-green-300 hover:bg-green-500/20" title="Marcar como paga">
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onExcluir} className="text-red-400 hover:text-red-300 hover:bg-red-500/20" title="Excluir">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MultasMinimalista() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usuarioId, setUsuarioId] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState<Date>();

  const { data: multas, isLoading, refetch, isRefetching, createMulta, updateStatus, deleteMulta } = useMultas();
  const { data: users } = useAllUsers();

  const filtered = multas?.filter(m => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return m.usuario_nome?.toLowerCase().includes(s) || m.descricao?.toLowerCase().includes(s);
  }) || [];

  const totalPendente = filtered.filter(m => getMultaStatus(m) !== 'paga').reduce((sum, m) => sum + Number(m.valor), 0);
  const vencidas = filtered.filter(m => getMultaStatus(m) === 'vencida').length;

  const handleSubmit = () => {
    if (!usuarioId || !valor || !dataVencimento) return;
    const dataStr = format(dataVencimento, 'yyyy-MM-dd');
    createMulta.mutate(
      { usuario_id: usuarioId, valor: Number(valor), data_vencimento: dataStr, descricao: descricao || undefined },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setUsuarioId('');
          setValor('');
          setDescricao('');
          setDataVencimento(undefined);
        },
      }
    );
  };

  return (
    <MinimalistLayout
      title="Multas"
      subtitle="Cadastro e controle de multas por colaborador"
      backPath="/administrativo"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Administrativo', path: '/administrativo' },
        { label: 'Multas' },
      ]}
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Multa
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Cadastrar Multa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Colaborador</label>
                  <select
                    value={usuarioId}
                    onChange={e => setUsuarioId(e.target.value)}
                    className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-white text-sm"
                  >
                    <option value="" className="bg-zinc-900">Selecione...</option>
                    {users?.map(u => (
                      <option key={u.id} value={u.id} className="bg-zinc-900">{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Valor (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    placeholder="0,00"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Data de Vencimento</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10", !dataVencimento && "text-white/40")}>
                        <Calendar className="w-4 h-4 mr-2" />
                        {dataVencimento ? format(dataVencimento, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dataVencimento}
                        onSelect={setDataVencimento}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Descrição (opcional)</label>
                  <Input
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    placeholder="Motivo da multa..."
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <Button onClick={handleSubmit} disabled={!usuarioId || !valor || !dataVencimento || createMulta.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {createMulta.isPending ? 'Salvando...' : 'Cadastrar Multa'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Total Pendente</div>
            <div className="text-xl font-bold text-amber-400">{formatCurrency(totalPendente)}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Total de Multas</div>
            <div className="text-xl font-bold text-white">{filtered.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Vencidas</div>
            <div className="text-xl font-bold text-red-400">{vencidas}</div>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar por colaborador ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-white/40 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/50">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma multa encontrada</p>
            <p className="text-sm">Clique em "Nova Multa" para cadastrar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(multa => (
              <MultaCard
                key={multa.id}
                multa={multa}
                onPagar={() => updateStatus.mutate({ id: multa.id, status: 'paga' })}
                onExcluir={() => deleteMulta.mutate(multa.id)}
              />
            ))}
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}
