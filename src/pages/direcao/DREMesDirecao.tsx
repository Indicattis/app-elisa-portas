import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface FaturamentoProduto {
  portas: number;
  pintura: number;
  instalacoes: number;
  acessorios: number;
  adicionais: number;
  total: number;
}

interface DespesaAgrupada {
  id: string;
  nome: string;
  valor_real: number;
}

interface TipoCustoVariavel {
  id: string;
  nome: string;
  valor_maximo_mensal: number;
}

function DespesaSectionReadOnly({
  title,
  despesas,
  total,
  formatCurrency,
  tiposDisponiveis,
}: {
  title: string;
  despesas: DespesaAgrupada[];
  total: number;
  formatCurrency: (v: number) => string;
  tiposDisponiveis?: TipoCustoVariavel[];
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/70 uppercase">{title}</h3>
      </div>

      {despesas.length === 0 ? (
        <p className="text-white/30 text-sm">Nenhuma despesa registrada</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="h-[24px]">
              <th className="text-left text-[10px] uppercase tracking-wider text-white/40 font-medium">Nome</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-white/40 font-medium w-28">Valor real</th>
              {tiposDisponiveis && tiposDisponiveis.length > 0 && (
                <th className="text-right text-[10px] uppercase tracking-wider text-white/40 font-medium w-28">Projetado</th>
              )}
            </tr>
          </thead>
          <tbody>
            {despesas.map(d => {
              const tipoRef = tiposDisponiveis?.find(t => t.nome === d.nome);
              return (
                <tr key={d.id} className="h-[30px] border-b border-white/5 last:border-0">
                  <td className="align-middle text-xs text-white/60">{d.nome}</td>
                  <td className={`align-middle text-right text-xs font-medium ${tipoRef ? (d.valor_real > tipoRef.valor_maximo_mensal ? 'text-red-400' : d.valor_real < tipoRef.valor_maximo_mensal ? 'text-emerald-400' : 'text-white') : 'text-white'}`}>
                    {formatCurrency(d.valor_real)}
                  </td>
                  {tiposDisponiveis && tiposDisponiveis.length > 0 && (
                    <td className="align-middle text-right text-xs text-white/40">
                      {tipoRef ? formatCurrency(tipoRef.valor_maximo_mensal) : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {despesas.length > 0 && (
            <tfoot>
              <tr className="h-[30px] border-t border-white/10">
                <td className="text-xs font-semibold text-white/80">Total</td>
                <td className="text-right text-xs font-bold text-white">{formatCurrency(total)}</td>
                {tiposDisponiveis && tiposDisponiveis.length > 0 && (
                  <td className="text-right text-xs font-bold text-white/40">
                    {formatCurrency(tiposDisponiveis.reduce((s, t) => s + t.valor_maximo_mensal, 0))}
                  </td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  );
}

export default function DREMesDirecao() {
  const { mes } = useParams<{ mes: string }>();
  const [loading, setLoading] = useState(true);
  const [faturamento, setFaturamento] = useState<FaturamentoProduto>({ portas: 0, pintura: 0, instalacoes: 0, acessorios: 0, adicionais: 0, total: 0 });
  const [lucro, setLucro] = useState<FaturamentoProduto>({ portas: 0, pintura: 0, instalacoes: 0, acessorios: 0, adicionais: 0, total: 0 });
  const [despesasFixas, setDespesasFixas] = useState<DespesaAgrupada[]>([]);
  const [despesasFolha, setDespesasFolha] = useState<DespesaAgrupada[]>([]);
  const [despesasVariaveis, setDespesasVariaveis] = useState<DespesaAgrupada[]>([]);
  const [tiposCustosFixos, setTiposCustosFixos] = useState<TipoCustoVariavel[]>([]);
  const [tiposCustosVariaveis, setTiposCustosVariaveis] = useState<TipoCustoVariavel[]>([]);
  const [topAcessorios, setTopAcessorios] = useState<{nome: string, qtd: number}[]>([]);
  const [topAdicionais, setTopAdicionais] = useState<{nome: string, qtd: number}[]>([]);
  const [estoqueResumo, setEstoqueResumo] = useState({ valorTotal: 0, totalItens: 0 });

  const mesDate = mes ? new Date(mes + '-15') : new Date();
  const mesNome = format(mesDate, 'MMMM yyyy', { locale: ptBR });

  const fetchDespesasFromGastos = async () => {
    if (!mes) return;
    const start = `${mes}-01`;
    const [y, m] = mes.split('-').map(Number);
    const end = new Date(y, m, 0).toISOString().split('T')[0];

    // Fetch gastos do mês
    const { data: gastos, error } = await supabase
      .from('gastos' as any)
      .select('valor, tipo_custo_id')
      .gte('data', start)
      .lte('data', end);

    if (error) {
      console.error('Erro ao buscar gastos:', error);
      return;
    }

    // Fetch tipos_custos que aparecem no DRE
    const { data: tipos, error: tiposError } = await supabase
      .from('tipos_custos' as any)
      .select('id, nome, tipo, aparece_no_dre')
      .eq('aparece_no_dre', true);

    if (tiposError) {
      console.error('Erro ao buscar tipos custos:', tiposError);
      return;
    }

    const tiposMap: Record<string, { nome: string; tipo: string }> = {};
    ((tipos || []) as any[]).forEach((t: any) => {
      tiposMap[t.id] = { nome: t.nome, tipo: t.tipo };
    });

    // Agrupar gastos por tipo_custo_id
    const agrupado: Record<string, { nome: string; tipo: string; valor: number }> = {};
    ((gastos || []) as any[]).forEach((g: any) => {
      const tipo = tiposMap[g.tipo_custo_id];
      if (!tipo) return;
      if (!agrupado[g.tipo_custo_id]) {
        agrupado[g.tipo_custo_id] = { nome: tipo.nome, tipo: tipo.tipo, valor: 0 };
      }
      agrupado[g.tipo_custo_id].valor += g.valor || 0;
    });

    const items = Object.entries(agrupado).map(([id, v]) => ({
      id,
      nome: v.nome,
      valor_real: v.valor,
      tipo: v.tipo,
    }));

    // Separar por tipo — "Salário" ou "Folha" vai para folha salarial
    const isFolha = (nome: string) => /sal[áa]rio|folha/i.test(nome);

    setDespesasFixas(items.filter(i => i.tipo === 'fixa' && !isFolha(i.nome)));
    setDespesasFolha(items.filter(i => isFolha(i.nome)));
    setDespesasVariaveis(items.filter(i => i.tipo === 'variavel' && !isFolha(i.nome)));
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
            valor_produto,
            valor_pintura,
            valor_instalacao,
            quantidade,
            tipo_desconto,
            desconto_percentual,
            desconto_valor,
            lucro_produto,
            lucro_pintura,
            lucro_item,
            descricao,
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
            const qty = p.quantidade || 1;
            const valorProdutoBase = (p.valor_produto || 0) * qty;
            const valorPinturaBase = (p.valor_pintura || 0) * qty;
            const valorInstalacaoBase = (p.valor_instalacao || 0) * qty;
            const valorBrutoTotal = valorProdutoBase + valorPinturaBase + valorInstalacaoBase;

            let descontoTotal = 0;
            if (p.tipo_desconto === 'percentual' && p.desconto_percentual > 0) {
              descontoTotal = valorBrutoTotal * (p.desconto_percentual / 100);
            } else if (p.tipo_desconto === 'valor' && p.desconto_valor > 0) {
              descontoTotal = p.desconto_valor;
            }

            const proporcaoProduto = valorBrutoTotal > 0 ? valorProdutoBase / valorBrutoTotal : 1;
            const proporcaoPintura = valorBrutoTotal > 0 ? valorPinturaBase / valorBrutoTotal : 0;
            const proporcaoInstalacao = valorBrutoTotal > 0 ? valorInstalacaoBase / valorBrutoTotal : 0;

            const valorPortaLiquido = valorProdutoBase - (descontoTotal * proporcaoProduto);
            const valorPinturaLiquido = valorPinturaBase - (descontoTotal * proporcaoPintura);
            const valorInstalacaoLiquido = valorInstalacaoBase - (descontoTotal * proporcaoInstalacao);

            fat.portas += valorPortaLiquido;
            fat.pintura += valorPinturaLiquido;
            fat.instalacoes += valorInstalacaoLiquido;
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
          .select('valor_credito, lucro_instalacao, valor_instalacao')
          .gte('data_venda', start + ' 00:00:00')
          .lte('data_venda', end + ' 23:59:59');

        const totalCredito = vendas?.reduce((sum, v) => sum + ((v as any).valor_credito || 0), 0) || 0;

        // Margem fixa de instalação: 40% (alterada de 30% em 2026)
        luc.instalacoes = fat.instalacoes * 0.40;

        fat.total = fat.portas + fat.pintura + fat.instalacoes + fat.acessorios + fat.adicionais + totalCredito;
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

        await Promise.all([fetchDespesasFromGastos(), fetchTiposCustosAtivos(), fetchEstoque()]);
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
  const totalDespVariaveis = despesasVariaveis.reduce((acc, d) => acc + (d.valor_real || 0), 0);
  const totalProjetadoAnual = tiposCustosVariaveis.reduce((acc, t) => acc + (t.valor_maximo_mensal * 12), 0);

  return (
    <>
    <style>{`
      @media print {
        @page { size: A4; margin: 12mm; }
        body * { visibility: hidden !important; }
        #dre-print-area, #dre-print-area * { visibility: visible !important; }
        #dre-print-area {
          position: absolute !important;
          left: 0; top: 0;
          width: 100%;
          padding: 0 !important;
          background: white !important;
          color: black !important;
        }
        #dre-print-area * {
          color: black !important;
          background: transparent !important;
          border-color: #ccc !important;
          box-shadow: none !important;
          text-shadow: none !important;
        }
        #dre-print-area .text-emerald-400 { color: #047857 !important; }
        #dre-print-area .text-red-400 { color: #b91c1c !important; }
        #dre-print-area .text-yellow-400 { color: #a16207 !important; }
        #dre-print-area table { page-break-inside: auto; }
        #dre-print-area tr { page-break-inside: avoid; page-break-after: auto; }
        #dre-print-area .rounded-xl { page-break-inside: avoid; }
        #dre-print-area .lg\\:sticky { position: static !important; }
      }
    `}</style>
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
      headerActions={
        !loading ? (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm hover:bg-white/20 transition-colors print:hidden"
          >
            <Printer className="w-4 h-4" strokeWidth={1.5} />
            Imprimir PDF
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      ) : (
        <div id="dre-print-area" className="space-y-6">
          {/* Cabeçalho exclusivo da impressão */}
          <div className="hidden print:block mb-4 border-b pb-3">
            <h1 className="text-xl font-bold">Demonstrativo de Resultados</h1>
            <p className="text-sm capitalize">{mesNome}</p>
            <p className="text-xs">Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
          </div>
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
                      const isInstalacoes = col.key === 'instalacoes';
                      return (
                        <td
                          key={col.key}
                          className={`text-right p-3 font-semibold ${isInstalacoes ? 'text-yellow-400' : val >= 0 ? 'text-emerald-400' : 'text-red-400'} ${col.key === 'total' ? 'bg-white/5' : ''}`}
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
                      const isInstalacoes = col.key === 'instalacoes';
                      return (
                        <td key={col.key} className={`text-right p-3 ${col.key === 'total' ? 'bg-white/5' : ''}`}>
                          <span className={`inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold ${isInstalacoes ? 'text-yellow-400' : perc >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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

          {/* Despesas: 3 seções + painel lateral */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-4">
            {/* Coluna esquerda: 3 seções empilhadas */}
            <div className="space-y-4">
              <DespesaSectionReadOnly
                title="Despesas Fixas"
                despesas={despesasFixas}
                total={totalDespFixas}
                formatCurrency={formatCurrency}
                tiposDisponiveis={tiposCustosFixos}
              />
              <DespesaSectionReadOnly
                title="Folha Salarial"
                despesas={despesasFolha}
                total={totalDespFolha}
                formatCurrency={formatCurrency}
              />
              <DespesaSectionReadOnly
                title="Despesas Variáveis"
                despesas={despesasVariaveis}
                total={totalDespVariaveis}
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
                    const despMes = despesasVariaveis.find(d => d.nome === t.nome);
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
                      {formatCurrency(totalDespVariaveis)}
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
            const lucroLiquido = lucro.total - totalDespFixas - totalDespFolha - totalDespVariaveis;
            const percBruto = faturamento.total > 0 ? (lucro.total / faturamento.total) * 100 : 0;
            const percLiquid = faturamento.total > 0 ? (lucroLiquido / faturamento.total) * 100 : 0;
            const colorClass = (v: number) => v >= 0 ? 'text-emerald-400' : 'text-red-400';

            const items = [
              { label: 'Faturamento Bruto', value: formatCurrency(faturamento.total), color: 'text-white' },
              { label: '% Bruto', value: `${percBruto.toFixed(1)}%`, color: colorClass(percBruto) },
              { label: 'Fat. Líquido (Lucro Bruto)', value: formatCurrency(lucro.total), color: colorClass(lucro.total) },
              { label: 'Despesas Fixas', value: formatCurrency(totalDespFixas), color: 'text-red-400' },
              { label: 'Folha Salarial', value: formatCurrency(totalDespFolha), color: 'text-red-400' },
              { label: 'Desp. Variáveis', value: formatCurrency(totalDespVariaveis), color: 'text-red-400' },
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
    </>
  );
}
