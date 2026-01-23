import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, Phone, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { format, parseISO, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCobrancasPendentes, CobrancaPendente } from '@/hooks/useCobrancasPendentes';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPhone(phone: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function getWhatsAppLink(phone: string | null): string {
  if (!phone) return '#';
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/55${cleaned}`;
}

function formatPedidoNumero(numero: string): string {
  const now = new Date();
  const year = now.getFullYear();
  return `#PED-${year}-${String(numero).padStart(4, '0')}`;
}

function getVencimentoStatus(dataVencimento: string | null): 'vencido' | 'hoje' | 'proximo' | 'normal' {
  if (!dataVencimento) return 'normal';
  const data = parseISO(dataVencimento);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  if (isBefore(data, hoje)) return 'vencido';
  if (isToday(data)) return 'hoje';
  
  const diff = data.getTime() - hoje.getTime();
  const diasAte = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (diasAte <= 7) return 'proximo';
  
  return 'normal';
}

interface CobrancaCardProps {
  cobranca: CobrancaPendente;
  onClick: () => void;
}

function CobrancaCard({ cobranca, onClick }: CobrancaCardProps) {
  const vencimentoStatus = getVencimentoStatus(cobranca.proximoVencimento);
  
  const statusColors = {
    vencido: 'bg-red-500/20 text-red-400 border-red-500/30',
    hoje: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    proximo: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const statusLabels = {
    vencido: 'Vencido',
    hoje: 'Vence Hoje',
    proximo: 'Próximo',
    normal: 'Em dia',
  };

  return (
    <div 
      onClick={onClick}
      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 
                 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Info Principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-white/50 font-mono">
              {formatPedidoNumero(cobranca.numero_pedido)}
            </span>
            <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[vencimentoStatus]}`}>
              {statusLabels[vencimentoStatus]}
            </Badge>
          </div>
          
          <h3 className="text-white font-medium truncate">
            {cobranca.cliente_nome}
          </h3>
          
          <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
            {cobranca.cidade && (
              <span>{cobranca.cidade}{cobranca.estado ? `, ${cobranca.estado}` : ''}</span>
            )}
          </div>
        </div>

        {/* Telefone */}
        <div className="flex items-center gap-2">
          {cobranca.cliente_telefone && (
            <a
              href={getWhatsAppLink(cobranca.cliente_telefone)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg 
                         bg-green-500/20 text-green-400 hover:bg-green-500/30
                         transition-colors text-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{formatPhone(cobranca.cliente_telefone)}</span>
            </a>
          )}
        </div>

        {/* Info de Cobrança */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Parcelas */}
          <div className="text-center">
            <div className="text-xs text-white/50 mb-0.5">Parcelas</div>
            <div className="text-sm text-white font-medium">
              {cobranca.parcelasPendentes}
            </div>
          </div>

          {/* Próximo Vencimento */}
          {cobranca.proximoVencimento && (
            <div className="text-center">
              <div className="text-xs text-white/50 mb-0.5">Vencimento</div>
              <div className={`text-sm font-medium flex items-center gap-1
                ${vencimentoStatus === 'vencido' ? 'text-red-400' : 
                  vencimentoStatus === 'hoje' ? 'text-amber-400' : 
                  vencimentoStatus === 'proximo' ? 'text-yellow-400' : 'text-white'}`}>
                <Calendar className="w-3 h-3" />
                {format(parseISO(cobranca.proximoVencimento), 'dd/MM', { locale: ptBR })}
              </div>
            </div>
          )}

          {/* Valor Pendente */}
          <div className="text-right min-w-[100px]">
            <div className="text-xs text-white/50 mb-0.5">A Receber</div>
            <div className="text-base font-semibold text-amber-400 flex items-center justify-end gap-1">
              <DollarSign className="w-4 h-4" />
              {formatCurrency(cobranca.valorPendente).replace('R$', '').trim()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CobrancasMinimalista() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: cobrancas, isLoading, refetch, isRefetching } = useCobrancasPendentes();

  const filteredCobrancas = cobrancas?.filter(c => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.cliente_nome?.toLowerCase().includes(search) ||
      String(c.numero_pedido).includes(search) ||
      c.cidade?.toLowerCase().includes(search)
    );
  }) || [];

  const totalPendente = filteredCobrancas.reduce((sum, c) => sum + c.valorPendente, 0);
  const totalParcelas = filteredCobrancas.reduce((sum, c) => sum + c.parcelasPendentes, 0);
  const vencidos = filteredCobrancas.filter(c => getVencimentoStatus(c.proximoVencimento) === 'vencido').length;

  const handleCardClick = (cobranca: CobrancaPendente) => {
    // Navega para contas a receber com filtro
    navigate(`/administrativo/financeiro/caixa/contas-a-receber?venda=${cobranca.venda_id}`);
  };

  return (
    <MinimalistLayout
      title="Cobranças"
      subtitle="Pedidos finalizados pendentes de pagamento"
      backPath="/administrativo/financeiro"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Administrativo', path: '/administrativo' },
        { label: 'Financeiro', path: '/administrativo/financeiro' },
        { label: 'Cobranças' },
      ]}
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Total Pendente</div>
            <div className="text-xl font-bold text-amber-400">{formatCurrency(totalPendente)}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Clientes</div>
            <div className="text-xl font-bold text-white">{filteredCobrancas.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Parcelas</div>
            <div className="text-xl font-bold text-white">{totalParcelas}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Vencidos</div>
            <div className="text-xl font-bold text-red-400">{vencidos}</div>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar por cliente, pedido ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-white/40 animate-spin" />
          </div>
        ) : filteredCobrancas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/50">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma cobrança pendente</p>
            <p className="text-sm">Todos os pedidos finalizados estão quitados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCobrancas.map(cobranca => (
              <CobrancaCard 
                key={cobranca.id} 
                cobranca={cobranca}
                onClick={() => handleCardClick(cobranca)}
              />
            ))}
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}
