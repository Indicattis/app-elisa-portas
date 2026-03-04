import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

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
  tiposDisponiveis,
  hideAddButton,
}: {
  title: string;
  despesas: Despesa[];
  total: number;
  onAdd: (data: NewDespesa) => Promise<void>;
  onToggleStatus: (id: string, current: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  formatCurrency: (v: number) => string;
  tiposDisponiveis?: TipoCustoVariavel[];
  hideAddButton?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewDespesa>(emptyNewDespesa);
  const [saving, setSaving] = useState(false);
  const [selectedRef, setSelectedRef] = useState<number | null>(null);

  const handleSelectTipo = (nome: string) => {
    const tipo = tiposDisponiveis?.find(t => t.nome === nome);
    setForm(f => ({ ...f, nome }));
    setSelectedRef(tipo?.valor_maximo_mensal ?? null);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.valor_real) return;
    setSaving(true);
    await onAdd(form);
    setForm(emptyNewDespesa);
    setSelectedRef(null);
    setShowForm(false);
    setSaving(false);
  };

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/70 uppercase">{title}</h3>
        {!hideAddButton && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <div className="flex gap-2">
            {tiposDisponiveis ? (
              <select
                value={form.nome}
                onChange={e => handleSelectTipo(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="" className="bg-zinc-900">Selecione...</option>
                {tiposDisponiveis.map(t => (
                  <option key={t.id} value={t.nome} className="bg-zinc-900">
                    {t.nome}
                  </option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Nome"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            )}
            <input
              placeholder="Valor"
              type="number"
              step="0.01"
              value={form.valor_real}
              onChange={e => setForm(f => ({ ...f, valor_real: e.target.value }))}
              className="w-28 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          {selectedRef !== null && (
            <p className="text-xs text-white/40">
              Despesa projetada: {formatCurrency(selectedRef)}/mês
            </p>
          )}
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
                <div>
                  <span className="text-sm text-white/60">{d.nome}</span>
                  {(() => {
                    const tipoRef = tiposDisponiveis?.find(t => t.nome === d.nome);
                    return tipoRef ? (
                      <p className="text-xs text-white/30">Projetado: {formatCurrency(tipoRef.valor_maximo_mensal)}/mês</p>
                    ) : null;
                  })()}
                </div>
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

interface TipoCustoVariavel {
  id: string;
  nome: string;
  valor_maximo_mensal: number;
}

export default function DREMesDirecao() {
  const { mes } = useParams<{ mes: string }>();
  const [loading, setLoading] = useState(true);
  const [faturamento, setFaturamento] = useState<FaturamentoProduto>({ portas: 0, pintura: 0, instalacoes: 0, acessorios: 0, adicionais: 0, total: 0 });
  const [lucro, setLucro] = useState<FaturamentoProduto>({ portas: 0, pintura: 0, instalacoes: 0, acessorios: 0, adicionais: 0, total: 0 });
  const [despesasFixas, setDespesasFixas] = useState<Despesa[]>([]);
  const [despesasFolha, setDespesasFolha] = useState<Despesa[]>([]);
  const [despesasProjetadas, setDespesasProjetadas] = useState<Despesa[]>([]);
  const [despesasNaoEsperadas, setDespesasNaoEsperadas] = useState<Despesa[]>([]);
  const [tiposCustosFixos, setTiposCustosFixos] = useState<TipoCustoVariavel[]>([]);
  const [tiposCustosVariaveis, setTiposCustosVariaveis] = useState<TipoCustoVariavel[]>([]);
  const [topAcessorios, setTopAcessorios] = useState<{nome: string, qtd: number}[]>([]);
  const [topAdicionais, setTopAdicionais] = useState<{nome: string, qtd: number}[]>([]);
  const [estoqueResumo, setEstoqueResumo] = useState({ valorTotal: 0, totalItens: 0 });

  const mesDate = mes ? new Date(mes + '-15') : new Date();
  const mesNome = format(mesDate, 'MMMM yyyy', { locale: ptBR });

  const mapDespesa = (d: any): Despesa => ({
    id: d.id,
    nome: d.nome,
    valor_real: d.valor_real,
    tipo_status: d.tipo_status || 'decretada',
  });

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

    const all = data || [];
    setDespesasFixas(all.filter((d: any) => d.modalidade === 'fixa').map(mapDespesa));
    setDespesasFolha(all.filter((d: any) => d.modalidade === 'folha_salarial').map(mapDespesa));
    setDespesasProjetadas(all.filter((d: any) => d.modalidade === 'projetada').map(mapDespesa));
    setDespesasNaoEsperadas(all.filter((d: any) => d.modalidade === 'variavel_nao_esperada').map(mapDespesa));
  };

  const fetchTiposCustosAtivos = async () => {
    const { data, error } = await supabase
      .from('tipos_custos' as any)
      .select('id, nome, valor_maximo_mensal, tipo')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar tipos custos:', error);
      return;
    }
    const all = (data || []) as unknown as (TipoCustoVariavel & { tipo: string })[];
    setTiposCustosFixos(all.filter(t => t.tipo === 'fixa'));
    setTiposCustosVariaveis(all.filter(t => t.tipo === 'variavel'));
  };

  const handleAddDespesa = async (modalidade: string, data: NewDespesa) => {
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

        const { data: produtos, error: prodError } = await supabase
          .from('produtos_vendas')
          .select(`
            tipo_produto,
            valor_total_sem_frete,
            lucro_produto,
            lucro_pintura,
            lucro_item,
            descricao,
            quantidade,
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
        const totalLucroInstalacao = vendas?.reduce((sum, v) => {
          const valorInst = (v as any).valor_instalacao || 0;
          const lucroInst = (v as any).lucro_instalacao;
          return sum + (lucroInst != null && lucroInst > 0 ? lucroInst : valorInst * 0.30);
        }, 0) || 0;

        fat.instalacoes = totalFatInstalacao;
        luc.instalacoes = totalLucroInstalacao;

        fat.total = fat.portas + fat.pintura + fat.acessorios + fat.adicionais + totalCredito;
        luc.total = luc.portas + luc.pintura + luc.instalacoes + luc.acessorios + luc.adicionais;

        setFaturamento(fat);
        setLucro(luc);

        // Top 5 acessórios e adicionais
        const acessoriosMap: Record<string, number> = {};
        const adicionaisMap: Record<string, number> = {};
        produtos?.forEach((p: any) => {
          const nome = p.descricao || 'Sem descrição';
          const qtd = p.quantidade || 1;
          if (p.tipo_produto === 'acessorio') {
            acessoriosMap[nome] = (acessoriosMap[nome] || 0) + qtd;
          } else if (['adicional', 'manutencao'].includes(p.tipo_produto)) {
            adicionaisMap[nome] = (adicionaisMap[nome] || 0) + qtd;
          }
        });
        setTopAcessorios(
          Object.entries(acessoriosMap)
            .map(([nome, qtd]) => ({ nome, qtd }))
            .sort((a, b) => b.qtd - a.qtd)
            .slice(0, 5)
        );
        setTopAdicionais(
          Object.entries(adicionaisMap)
            .map(([nome, qtd]) => ({ nome, qtd }))
            .sort((a, b) => b.qtd - a.qtd)
            .slice(0, 5)
        );

        // Buscar resumo do estoque
        const fetchEstoque = async () => {
          const { data: estoqueData } = await supabase
            .from('estoque')
            .select('quantidade, custo_unitario')
            .eq('ativo', true);
          const resumo = (estoqueData || []).reduce((acc, item) => ({
            valorTotal: acc.valorTotal + ((item.quantidade || 0) * (item.custo_unitario || 0)),
            totalItens: acc.totalItens + (item.quantidade || 0),
          }), { valorTotal: 0, totalItens: 0 });
          setEstoqueResumo(resumo);
        };

        await Promise.all([fetchDespesas(), fetchTiposCustosAtivos(), fetchEstoque()]);
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
    { key: 'adicionais', label: 'Itens Avulso' },
    { key: 'total', label: 'Total' },
  ] as const;

  const totalDespFixas = despesasFixas.reduce((acc, d) => acc + (d.valor_real || 0), 0);
  const totalDespFolha = despesasFolha.reduce((acc, d) => acc + (d.valor_real || 0), 0);
  const totalDespProjetadas = despesasProjetadas.reduce((acc, d) => acc + (d.valor_real || 0), 0);
  const totalDespNaoEsperadas = despesasNaoEsperadas.reduce((acc, d) => acc + (d.valor_real || 0), 0);
  const totalProjetadoAnual = tiposCustosVariaveis.reduce((acc, t) => acc + (t.valor_maximo_mensal * 12), 0);

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
                    {columns.map(col => {
                      const topList = col.key === 'acessorios' ? topAcessorios : col.key === 'adicionais' ? topAdicionais : null;
                      return (
                        <th
                          key={col.key}
                          className={`text-right p-3 text-white/40 font-medium text-xs uppercase ${col.key === 'total' ? 'bg-white/5' : ''}`}
                        >
                          {topList && topList.length > 0 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-default underline decoration-dotted underline-offset-4 uppercase">
                                  {col.label}
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[220px]">
                                  <p className="font-semibold mb-1 text-xs">Top 5 mais vendidos</p>
                                  {topList.map((item, i) => (
                                    <p key={i} className="text-xs text-muted-foreground">
                                      {i + 1}. {item.nome} ({item.qtd})
                                    </p>
                                  ))}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            col.label
                          )}
                        </th>
                      );
                    })}
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
                  <tr className="border-t border-white/5">
                    <td className="p-3 text-white/60 font-medium text-xs uppercase">Margem %</td>
                    {columns.map(col => {
                      const perc = faturamento[col.key] > 0
                        ? (lucro[col.key] / faturamento[col.key]) * 100
                        : 0;
                      return (
                        <td key={col.key} className={`text-right p-3 ${col.key === 'total' ? 'bg-white/5' : ''}`}>
                          <span className={`inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold ${perc >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {perc.toFixed(1)}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Despesas: 4 seções + painel lateral */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-4">
            {/* Coluna esquerda: 4 seções empilhadas */}
            <div className="space-y-4">
              <DespesaSection
                title="Despesas Fixas"
                despesas={despesasFixas}
                total={totalDespFixas}
                onAdd={(data) => handleAddDespesa('fixa', data)}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteDespesa}
                formatCurrency={formatCurrency}
                tiposDisponiveis={tiposCustosFixos}
              />
              <DespesaSection
                title="Folha Salarial"
                despesas={despesasFolha}
                total={totalDespFolha}
                onAdd={(data) => handleAddDespesa('folha_salarial', data)}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteDespesa}
                formatCurrency={formatCurrency}
                hideAddButton={true}
              />
              <DespesaSection
                title="Despesas Variáveis"
                despesas={[...despesasProjetadas, ...despesasNaoEsperadas]}
                total={totalDespProjetadas + totalDespNaoEsperadas}
                onAdd={(data) => handleAddDespesa('variavel_nao_esperada', data)}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteDespesa}
                formatCurrency={formatCurrency}
                tiposDisponiveis={tiposCustosVariaveis}
              />
            </div>

            {/* Coluna direita: painel lateral */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 h-fit lg:sticky lg:top-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase mb-3">
                Despesas Projetadas do Ano
              </h3>
              {tiposCustosVariaveis.length === 0 ? (
                <p className="text-white/30 text-sm">Nenhum tipo de custo variável cadastrado</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="text-xs text-white/40 uppercase flex-1">Nome</span>
                    <span className="text-xs text-white/40 uppercase w-24 text-right">Mês</span>
                    <span className="text-xs text-white/40 uppercase w-24 text-right">Anual</span>
                  </div>
                  {tiposCustosVariaveis.map(t => {
                    const despMes = despesasProjetadas.find(d => d.nome === t.nome);
                    const valorMes = despMes?.valor_real || 0;
                    return (
                      <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-sm text-white/60 flex-1">{t.nome}</span>
                        <span className="text-sm font-medium text-white/70 w-24 text-right">
                          {formatCurrency(valorMes)}
                        </span>
                        <span className="text-sm font-medium text-white w-24 text-right">
                          {formatCurrency(t.valor_maximo_mensal * 12)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm font-semibold text-white/80 flex-1">Total</span>
                    <span className="text-sm font-bold text-white/70 w-24 text-right">
                      {formatCurrency(totalDespProjetadas)}
                    </span>
                    <span className="text-sm font-bold text-white w-24 text-right">
                      {formatCurrency(totalProjetadoAnual)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Valor de Estoque */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Estoque</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-sm text-white/60">Total de Itens</span>
                  <span className="text-sm font-medium text-white">{estoqueResumo.totalItens.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-white/60">Valor Total</span>
                  <span className="text-sm font-bold text-white">{formatCurrency(estoqueResumo.valorTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Final */}
          {(() => {
            const lucroLiquido = lucro.total - totalDespFixas - totalDespFolha - totalDespProjetadas - totalDespNaoEsperadas;
            const percBruto = faturamento.total > 0 ? (lucro.total / faturamento.total) * 100 : 0;
            const percLiquid = faturamento.total > 0 ? (lucroLiquido / faturamento.total) * 100 : 0;
            const colorClass = (v: number) => v >= 0 ? 'text-emerald-400' : 'text-red-400';

            const items = [
              { label: 'Faturamento Bruto', value: formatCurrency(faturamento.total), color: 'text-white' },
              { label: '% Bruto', value: `${percBruto.toFixed(1)}%`, color: colorClass(percBruto) },
              { label: 'Fat. Líquido (Lucro Bruto)', value: formatCurrency(lucro.total), color: colorClass(lucro.total) },
              { label: 'Despesas Fixas', value: formatCurrency(totalDespFixas), color: 'text-red-400' },
              { label: 'Folha Salarial', value: formatCurrency(totalDespFolha), color: 'text-red-400' },
              { label: 'Desp. Variáveis', value: formatCurrency(totalDespProjetadas + totalDespNaoEsperadas), color: 'text-red-400' },
              { label: 'Lucro Líquido', value: formatCurrency(lucroLiquido), color: colorClass(lucroLiquido) },
              { label: '% Lucro Líquido', value: `${percLiquid.toFixed(1)}%`, color: colorClass(percLiquid) },
            ];

            return (
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {items.map((item, i) => (
                          <th key={i} className="text-center p-3 text-white/40 font-medium text-xs uppercase whitespace-nowrap">
                            {item.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {items.map((item, i) => (
                          <td key={i} className={`text-center p-3 font-semibold whitespace-nowrap ${item.color}`}>
                            {item.value}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </MinimalistLayout>
  );
}
