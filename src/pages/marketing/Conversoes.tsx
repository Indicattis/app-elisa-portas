import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';
import { FloatingProfileMenu } from '@/components/FloatingProfileMenu';
import { DelayedParticles } from '@/components/DelayedParticles';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Conversoes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth());
  const [ano, setAno] = useState(now.getFullYear());
  const [copiedCol, setCopiedCol] = useState<string | null>(null);

  const dataInicio = format(startOfMonth(new Date(ano, mes)), 'yyyy-MM-dd');
  const dataFim = format(endOfMonth(new Date(ano, mes)), 'yyyy-MM-dd');

  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ['conversoes', mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('data_venda, cliente_email, cliente_telefone')
        .eq('is_rascunho', false)
        .gte('data_venda', dataInicio)
        .lte('data_venda', dataFim)
        .order('data_venda', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const formatDate = (dataVenda: string | null) => {
    if (!dataVenda) return '-';
    const d = parseISO(String(dataVenda));
    return isValid(d) ? format(d, 'dd.MM.yyyy') : '-';
  };

  const handleCopyColumn = async (col: 'data' | 'email' | 'telefone') => {
    const values = vendas.map(v => {
      if (col === 'data') return formatDate(v.data_venda);
      if (col === 'email') return v.cliente_email || '';
      return v.cliente_telefone || '';
    });
    await navigator.clipboard.writeText(values.join('\n'));
    setCopiedCol(col);
    const labels = { data: 'Datas', email: 'E-mails', telefone: 'Telefones' };
    toast({ title: 'Copiado!', description: `${values.length} ${labels[col]} copiados.` });
    setTimeout(() => setCopiedCol(null), 2000);
  };

  const anos = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <DelayedParticles />
      <AnimatedBreadcrumb
        items={[
          { label: 'Home', path: '/home' },
          { label: 'Marketing', path: '/marketing' },
          { label: 'Conversões' },
        ]}
        mounted
      />
      <FloatingProfileMenu mounted />

      <button
        onClick={() => navigate('/marketing')}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      <div className="relative z-10 min-h-screen flex flex-col items-center pt-20 px-6 pb-10">
        <h1 className="text-2xl font-bold text-white mb-2">Conversões</h1>
        <p className="text-white/60 text-sm mb-6">Dados de vendas para importação no Google Ads</p>

        {/* Filtros */}
        <div className="flex gap-3 mb-6 items-center">
          <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
            <SelectTrigger className="w-[100px] bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        {/* Contador */}
        <p className="text-white/50 text-xs mb-4">
          {isLoading ? 'Carregando...' : `${vendas.length} conversão(ões) em ${meses[mes]} ${ano}`}
        </p>

        {/* Tabela */}
        <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/70">
                  <button onClick={() => handleCopyColumn('data')} disabled={vendas.length === 0} className="flex items-center gap-1.5 hover:text-white transition-colors disabled:opacity-40">
                    Data {copiedCol === 'data' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead className="text-white/70">
                  <button onClick={() => handleCopyColumn('email')} disabled={vendas.length === 0} className="flex items-center gap-1.5 hover:text-white transition-colors disabled:opacity-40">
                    E-mail {copiedCol === 'email' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead className="text-white/70">
                  <button onClick={() => handleCopyColumn('telefone')} disabled={vendas.length === 0} className="flex items-center gap-1.5 hover:text-white transition-colors disabled:opacity-40">
                    Telefone {copiedCol === 'telefone' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={3} className="text-center text-white/40 py-8">Carregando...</TableCell>
                </TableRow>
              ) : vendas.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={3} className="text-center text-white/40 py-8">Nenhuma conversão neste mês</TableCell>
                </TableRow>
              ) : (
                vendas.map((v, i) => (
                  <TableRow key={i} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white/90">
                      {formatDate(v.data_venda)}
                    </TableCell>
                    <TableCell className="text-white/90">{v.cliente_email || '-'}</TableCell>
                    <TableCell className="text-white/90">{v.cliente_telefone || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
