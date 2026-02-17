import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronRight, CheckCircle2, ShoppingCart, ShieldCheck, XCircle, User, Percent, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRequisicaoAprovacaoVenda, RequisicaoAprovacaoVenda } from '@/hooks/useRequisicaoAprovacaoVenda';
import { useVendas, ProdutoVenda } from '@/hooks/useVendas';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useAuth } from '@/hooks/useAuth';
import { PagamentoData } from '@/components/vendas/PagamentoSection';

export default function AprovacoesVendas() {
  const navigate = useNavigate();
  const { requisicoes, isLoading, refetch, aprovarRequisicao, recusarRequisicao } = useRequisicaoAprovacaoVenda();
  const { createVenda } = useVendas();
  const { data: usuarios = [] } = useAllUsers();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const getNomeSolicitante = (userId: string) => {
    const u = usuarios.find(u => u.user_id === userId);
    return u?.nome || 'Desconhecido';
  };

  const getClienteNome = (req: RequisicaoAprovacaoVenda) => {
    return req.dados_venda?.cliente_nome || 'Cliente não informado';
  };

  const getValorTotal = (req: RequisicaoAprovacaoVenda) => {
    const produtos = (req.dados_produtos || []) as ProdutoVenda[];
    return produtos.reduce((acc, p) => {
      const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
      const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
      return acc + valorBase - desconto;
    }, 0) + (req.dados_venda?.valor_frete || 0) + (req.dados_credito?.valorCredito || 0);
  };

  const handleAprovar = async (req: RequisicaoAprovacaoVenda) => {
    if (!user) return;
    setProcessing(req.id);
    try {
      const vendaData = req.dados_venda;
      const portas = req.dados_produtos as ProdutoVenda[];
      const pagamentoData = req.dados_pagamento as PagamentoData;
      const creditoVenda = req.dados_credito || { valorCredito: 0, percentualCredito: 0 };

      const venda = await createVenda({
        vendaData,
        portas,
        pagamentoData,
        autorizacaoDesconto: {
          autorizado_por: user.id,
          solicitado_por: req.solicitante_id,
          percentual_desconto: req.percentual_desconto,
          senha_usada: 'aprovacao_direcao',
          tipo_autorizacao: req.tipo_autorizacao as 'responsavel_setor' | 'master',
        },
        creditoVenda,
      });

      await aprovarRequisicao.mutateAsync({ id: req.id, venda_id: (venda as any)?.id || '' });
    } catch (error) {
      console.error('Erro ao aprovar venda:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRecusar = async (req: RequisicaoAprovacaoVenda) => {
    setProcessing(req.id);
    try {
      await recusarRequisicao.mutateAsync({ id: req.id });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/direcao/aprovacoes')}
              className="p-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                Aprovações Vendas
              </h1>
              <p className="text-xs text-muted-foreground">
                {requisicoes.length} requisição{requisicoes.length !== 1 ? 'ões' : ''} aguardando
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div className="p-4 space-y-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : requisicoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500/50 mb-4" />
            <h2 className="text-lg font-medium">Tudo em dia!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Não há requisições de venda pendentes
            </p>
          </div>
        ) : (
          requisicoes.map((req) => (
            <div key={req.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate">{getClienteNome(req)}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {getNomeSolicitante(req.solicitante_id)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" />
                      {Number(req.percentual_desconto).toFixed(1)}%
                    </span>
                    <Badge className="text-[9px] h-4 px-1.5 font-bold rounded-sm bg-amber-500 text-white hover:bg-amber-500">
                      {req.tipo_autorizacao === 'master' ? 'Master' : 'Responsável'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      R$ {getValorTotal(req).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(req.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ml-2 ${
                    expandedId === req.id ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {expandedId === req.id && (
                <div className="px-4 pb-4 space-y-3 border-t pt-4">
                  {/* Produtos */}
                  <div className="space-y-1.5">
                    {(req.dados_produtos as ProdutoVenda[]).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                        <span className="truncate flex-1">
                          {p.quantidade > 1 && <span className="font-medium">{p.quantidade}x </span>}
                          {p.descricao || p.tipo_produto}
                          {p.largura && p.altura ? ` ${Number(p.largura).toFixed(2)}m x ${Number(p.altura).toFixed(2)}m` : ''}
                        </span>
                        <span className="text-muted-foreground ml-2 flex-shrink-0">
                          R$ {((p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Info desconto */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-sm">
                    <p className="text-amber-500 font-medium">
                      Desconto de {Number(req.percentual_desconto).toFixed(1)}% — requer autorização {req.tipo_autorizacao === 'master' ? 'master' : 'do responsável'}
                    </p>
                  </div>

                  {/* Botões */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleAprovar(req)}
                      disabled={processing === req.id}
                      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 
                                 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                    >
                      {processing === req.id ? (
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 mr-2" />
                      )}
                      Aprovar e Criar Venda
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRecusar(req)}
                      disabled={processing === req.id}
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Recusar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
