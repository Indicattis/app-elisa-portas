import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MinimalistLayout } from '@/components/MinimalistLayout';

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

        // Calcular faturamento e lucro por tipo
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

        // Buscar valor_credito das vendas do mês
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

        fat.total = fat.portas + fat.pintura + fat.instalacoes + fat.acessorios + fat.adicionais + totalCredito;
        luc.total = luc.portas + luc.pintura + luc.instalacoes + luc.acessorios + luc.adicionais;

        setFaturamento(fat);
        setLucro(luc);

        // Buscar despesas
        const { data: despesas, error: despError } = await supabase
          .from('despesas_mensais')
          .select('id, nome, valor_real, modalidade')
          .eq('mes', mes + '-01')
          .order('nome');

        if (despError) throw despError;

        setDespesasFixas((despesas || []).filter(d => d.modalidade === 'fixa'));
        setDespesasVariaveis((despesas || []).filter(d => d.modalidade === 'variavel'));
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
                  {/* Faturamento */}
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
                  {/* Lucro */}
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
            {/* Fixas */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase mb-3">Despesas Fixas</h3>
              {despesasFixas.length === 0 ? (
                <p className="text-white/30 text-sm">Nenhuma despesa fixa registrada</p>
              ) : (
                <div className="space-y-2">
                  {despesasFixas.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-sm text-white/60">{d.nome}</span>
                      <span className="text-sm font-medium text-white">{formatCurrency(d.valor_real)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm font-semibold text-white/80">Total</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(totalDespFixas)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Variáveis */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase mb-3">Despesas Variáveis</h3>
              {despesasVariaveis.length === 0 ? (
                <p className="text-white/30 text-sm">Nenhuma despesa variável registrada</p>
              ) : (
                <div className="space-y-2">
                  {despesasVariaveis.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-sm text-white/60">{d.nome}</span>
                      <span className="text-sm font-medium text-white">{formatCurrency(d.valor_real)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm font-semibold text-white/80">Total</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(totalDespVariaveis)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MinimalistLayout>
  );
}
