import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { toast } from 'sonner';

interface FaturamentoProduto {
  portas: number;
  pintura: number;
  instalacoes: number;
  acessorios: number;
  adicionais: number;
  total: number;
}

interface Despesa {
  id: string;
  nome: string;
  valor_real: number;
  tipo_status: 'decretada' | 'em_teste';
}

interface NewDespesa {
  nome: string;
  valor_real: string;
  tipo_status: 'decretada' | 'em_teste';
}

const emptyNewDespesa: NewDespesa = { nome: '', valor_real: '', tipo_status: 'decretada' };

function DespesaSection({
  title,
  despesas,
  total,
  onAdd,
  onToggleStatus,
  onDelete,
  formatCurrency,
}: {
  title: string;
  despesas: Despesa[];
  total: number;
  onAdd: (data: NewDespesa) => Promise<void>;
  onToggleStatus: (id: string, current: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  formatCurrency: (v: number) => string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewDespesa>(emptyNewDespesa);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nome.trim() || !form.valor_real) return;
    setSaving(true);
    await onAdd(form);
    setForm(emptyNewDespesa);
    setShowForm(false);
    setSaving(false);
  };

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/70 uppercase">{title}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <div className="flex gap-2">
            <input
              placeholder="Nome"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <input
              placeholder="Valor"
              type="number"
              step="0.01"
              value={form.valor_real}
              onChange={e => setForm(f => ({ ...f, valor_real: e.target.value }))}
              className="w-28 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={form.tipo_status}
              onChange={e => setForm(f => ({ ...f, tipo_status: e.target.value as any }))}
              className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="decretada">Decretada</option>
              <option value="em_teste">Em teste</option>
            </select>
            <button
              onClick={handleSave}
              disabled={saving || !form.nome.trim() || !form.valor_real}
              className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm text-white disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {despesas.length === 0 && !showForm ? (
        <p className="text-white/30 text-sm">Nenhuma despesa registrada</p>
      ) : (
        <div className="space-y-2">
          {despesas.map(d => (
            <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 group">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleStatus(d.id, d.tipo_status)}
                  className="flex-shrink-0"
                  title={d.tipo_status === 'decretada' ? 'Decretada' : 'Em teste'}
                >
                  <span
                    className={`block w-2.5 h-2.5 rounded-full transition-colors ${
                      d.tipo_status === 'decretada' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </button>
                <span className="text-sm text-white/60">{d.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{formatCurrency(d.valor_real)}</span>
                <button
                  onClick={() => onDelete(d.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-sm font-semibold text-white/80">Total</span>
            <span className="text-sm font-bold text-white">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DREMesDirecao() {
  const { mes } = useParams<{ mes: string }>();
  const [loading, setLoading] = useState(true);
  const [faturamento, setFaturamento] = useState<FaturamentoProduto>({ portas: 0, pintura: 0, instalacoes: 0, acessorios: 0, adicionais: 0, total: 0 });
  const [lucro, setLucro] = useState<FaturamentoProduto>({ portas: 0, pintura: 0, instalacoes: 0, acessorios: 0, adicionais: 0, total: 0 });
  const [despesasFixas, setDespesasFixas] = useState<Despesa[]>([]);
  const [despesasVariaveis, setDespesasVariaveis] = useState<Despesa[]>([]);

  const mesDate = mes ? new Date(mes + '-15') : new Date();
  const mesNome = format(mesDate, 'MMMM yyyy', { locale: ptBR });

  const fetchDespesas = async () => {
    if (!mes) return;
    const { data, error } = await supabase
      .from('despesas_mensais')
      .select('id, nome, valor_real, modalidade, tipo_status')
      .eq('mes', mes + '-01')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar despesas:', error);
      return;
    }

    setDespesasFixas((data || []).filter((d: any) => d.modalidade === 'fixa').map((d: any) => ({ id: d.id, nome: d.nome, valor_real: d.valor_real, tipo_status: d.tipo_status || 'decretada' })));
    setDespesasVariaveis((data || []).filter((d: any) => d.modalidade === 'variavel').map((d: any) => ({ id: d.id, nome: d.nome, valor_real: d.valor_real, tipo_status: d.tipo_status || 'decretada' })));
  };

  const handleAddDespesa = async (modalidade: 'fixa' | 'variavel', data: NewDespesa) => {
    const userId = (await supabase.auth.getUser()).data.user?.id || '';
    const { error } = await supabase.from('despesas_mensais').insert([{
      mes: mes + '-01',
      nome: data.nome,
      categoria: 'geral',
      modalidade,
      valor_esperado: parseFloat(data.valor_real) || 0,
      valor_real: parseFloat(data.valor_real) || 0,
      tipo_status: data.tipo_status,
      created_by: userId,
    }]);
    if (error) {
      toast.error('Erro ao salvar despesa');
      console.error(error);
    } else {
      toast.success('Despesa adicionada!');
      await fetchDespesas();
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'decretada' ? 'em_teste' : 'decretada';
    const { error } = await supabase.from('despesas_mensais').update({ tipo_status: newStatus }).eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      await fetchDespesas();
    }
  };

  const handleDeleteDespesa = async (id: string) => {
    const { error } = await supabase.from('despesas_mensais').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir despesa');
    } else {
      toast.success('Despesa excluída!');
      await fetchDespesas();
    }
  };

  useEffect(() => {
    if (!mes) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const start = format(startOfMonth(mesDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(mesDate), 'yyyy-MM-dd');

        // Buscar produtos das vendas do mês
        const { data: produtos, error: prodError } = await supabase
          .from('produtos_vendas')
          .select(`
            tipo_produto,
            valor_total_sem_frete,
            lucro_produto,
            lucro_pintura,
            lucro_item,
            vendas!inner(data_venda)
          `)
          .gte('vendas.data_venda', start + ' 00:00:00')
          .lte('vendas.data_venda', end + ' 23:59:59');

        if (prodError) throw prodError;

        const fat: FaturamentoProduto = { portas: 0, pintura: 0, instalacoes: 0, acessorios: 0, adicionais: 0, total: 0 };
        const luc: FaturamentoProduto = { portas: 0, pintura: 0, instalacoes: 0, acessorios: 0, adicionais: 0, total: 0 };

        produtos?.forEach((p: any) => {
          const tipo = p.tipo_produto;
          const valorTotal = p.valor_total_sem_frete || 0;

          if (['porta_enrolar', 'porta_social'].includes(tipo)) {
            fat.portas += valorTotal;
            luc.portas += p.lucro_item || 0;
          } else if (tipo === 'pintura_epoxi') {
            fat.pintura += valorTotal;
            luc.pintura += p.lucro_item || 0;
          } else if (tipo === 'acessorio') {
            fat.acessorios += valorTotal;
            luc.acessorios += p.lucro_item || 0;
          } else if (['adicional', 'manutencao'].includes(tipo)) {
            fat.adicionais += valorTotal;
            luc.adicionais += p.lucro_item || 0;
          }
        });

        const { data: vendas } = await supabase
          .from('vendas')
          .select('valor_credito, valor_instalacao, lucro_instalacao')
          .gte('data_venda', start + ' 00:00:00')
          .lte('data_venda', end + ' 23:59:59');

        const totalCredito = vendas?.reduce((sum, v) => sum + ((v as any).valor_credito || 0), 0) || 0;
        const totalFatInstalacao = vendas?.reduce((sum, v) => sum + ((v as any).valor_instalacao || 0), 0) || 0;
        const totalLucroInstalacao = vendas?.reduce((sum, v) => sum + ((v as any).lucro_instalacao || 0), 0) || 0;

        fat.instalacoes = totalFatInstalacao;
        luc.instalacoes = totalLucroInstalacao;

        fat.total = fat.portas + fat.pintura + fat.acessorios + fat.adicionais + totalCredito;
        luc.total = luc.portas + luc.pintura + luc.instalacoes + luc.acessorios + luc.adicionais;

        setFaturamento(fat);
        setLucro(luc);

        await fetchDespesas();
      } catch (err) {
        console.error('Erro ao buscar dados DRE:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mes]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const columns = [
    { key: 'portas', label: 'Portas' },
    { key: 'pintura', label: 'Pintura' },
    { key: 'instalacoes', label: 'Instalações' },
    { key: 'acessorios', label: 'Acessórios' },
    { key: 'adicionais', label: 'Adicionais' },
    { key: 'total', label: 'Total' },
  ] as const;

  const totalDespFixas = despesasFixas.reduce((acc, d) => acc + (d.valor_real || 0), 0);
  const totalDespVariaveis = despesasVariaveis.reduce((acc, d) => acc + (d.valor_real || 0), 0);

  return (
    <MinimalistLayout
      title="D.R.E"
      subtitle={mesNome}
      backPath="/direcao/dre"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Direção', path: '/direcao' },
        { label: 'DRE', path: '/direcao/dre' },
        { label: mesNome },
      ]}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grid de Faturamento e Lucro */}
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-white/40 font-medium text-xs uppercase"></th>
                    {columns.map(col => (
                      <th
                        key={col.key}
                        className={`text-right p-3 text-white/40 font-medium text-xs uppercase ${col.key === 'total' ? 'bg-white/5' : ''}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="p-3 text-white/60 font-medium text-xs uppercase">Faturamento</td>
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`text-right p-3 font-semibold text-white ${col.key === 'total' ? 'bg-white/5' : ''}`}
                      >
                        {formatCurrency(faturamento[col.key])}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-white/60 font-medium text-xs uppercase">Lucro</td>
                    {columns.map(col => {
                      const val = lucro[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`text-right p-3 font-semibold ${val >= 0 ? 'text-emerald-400' : 'text-red-400'} ${col.key === 'total' ? 'bg-white/5' : ''}`}
                        >
                          {formatCurrency(val)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Despesas lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DespesaSection
              title="Despesas Fixas"
              despesas={despesasFixas}
              total={totalDespFixas}
              onAdd={(data) => handleAddDespesa('fixa', data)}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteDespesa}
              formatCurrency={formatCurrency}
            />
            <DespesaSection
              title="Despesas Variáveis"
              despesas={despesasVariaveis}
              total={totalDespVariaveis}
              onAdd={(data) => handleAddDespesa('variavel', data)}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteDespesa}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>
      )}
    </MinimalistLayout>
  );
}
