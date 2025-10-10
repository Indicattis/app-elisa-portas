import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { InstalacaoCadastrada } from '@/hooks/useInstalacoesCadastradas';
import { AlertCircle } from 'lucide-react';

interface DetalhesInstalacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instalacao: InstalacaoCadastrada | null;
}

export function DetalhesInstalacaoDialog({
  open,
  onOpenChange,
  instalacao,
}: DetalhesInstalacaoDialogProps) {
  if (!instalacao) return null;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente_producao': return 'Pendente Produção';
      case 'pronta_fabrica': return 'Pronta Fábrica';
      case 'finalizada': return 'Finalizada';
      default: return status;
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'instalacao': return 'Instalação';
      case 'entrega': return 'Entrega';
      case 'correcao': return 'Correção';
      default: return categoria;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pendente_producao': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'pronta_fabrica': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'finalizada': return 'bg-green-500/10 text-green-700 border-green-500/20';
      default: return '';
    }
  };

  const getCategoriaVariant = (categoria: string) => {
    switch (categoria) {
      case 'instalacao': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'entrega': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'correcao': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Detalhes da Instalação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabeçalho com informações principais */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cliente</p>
              <p className="font-semibold">{instalacao.nome_cliente}</p>
              <p className="text-xs text-muted-foreground">{instalacao.telefone_cliente || 'Sem telefone'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Localização</p>
              <p className="font-medium">{instalacao.cidade}, {instalacao.estado}</p>
            </div>
            <div className="flex gap-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className={getStatusVariant(instalacao.status)}>
                  {getStatusLabel(instalacao.status)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Categoria</p>
                <Badge variant="outline" className={getCategoriaVariant(instalacao.categoria)}>
                  {getCategoriaLabel(instalacao.categoria)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Datas e Responsável */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            {instalacao.data_instalacao && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data Instalação</p>
                <p className="font-medium">{format(new Date(instalacao.data_instalacao), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            )}
            {instalacao.data_producao && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data Produção</p>
                <p className="font-medium">{format(new Date(instalacao.data_producao), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            )}
            {instalacao.responsavel_instalacao_nome && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                <p className="font-medium">{instalacao.responsavel_instalacao_nome}</p>
                <p className="text-xs text-muted-foreground">
                  {instalacao.tipo_instalacao === 'elisa' ? 'Equipe Elisa' : 'Autorizado'}
                </p>
              </div>
            )}
            {instalacao.tamanho && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tamanho</p>
                <p className="font-medium">{instalacao.tamanho}</p>
              </div>
            )}
          </div>

          {/* Produtos */}
          {instalacao.produtos && instalacao.produtos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-2">Produtos</h3>
              <div className="grid gap-2">
                {instalacao.produtos.map((produto) => (
                  <div 
                    key={produto.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-semibold text-muted-foreground min-w-[30px]">
                        {produto.quantidade}x
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{produto.descricao}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {produto.tipo_produto}
                          </Badge>
                          {produto.cor && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{
                                borderColor: produto.cor.codigo_hex,
                                color: produto.cor.codigo_hex
                              }}
                            >
                              {produto.cor.nome}
                            </Badge>
                          )}
                          {produto.tamanho && (
                            <span className="text-xs text-muted-foreground">{produto.tamanho}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(produto.valor_total)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20 mt-2">
                <span className="font-semibold">Valor Total dos Produtos</span>
                <span className="font-semibold text-primary text-lg">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(instalacao.produtos.reduce((sum, p) => sum + p.valor_total, 0))}
                </span>
              </div>
            </div>
          )}

          {/* Informações Financeiras */}
          {instalacao.venda && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Informações Financeiras</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {instalacao.venda.pagamento_na_entrega && (
                  <div className="col-span-2">
                    <Badge className="bg-orange-500 text-white">
                      Pagamento na Entrega
                    </Badge>
                  </div>
                )}
                
                {instalacao.venda.valor_a_receber > 0 && (
                  <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Valor a Receber</p>
                    <p className="text-xl font-bold text-blue-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(instalacao.venda.valor_a_receber)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-medium">{instalacao.venda.forma_pagamento || 'Não informado'}</p>
                </div>

                {instalacao.venda.observacoes_venda && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Observações da Venda</p>
                    <p className="text-sm bg-muted p-2 rounded-md mt-1">
                      {instalacao.venda.observacoes_venda}
                    </p>
                  </div>
                )}
              </div>

            {/* Parcelas de Pagamento */}
            {instalacao.parcelas && instalacao.parcelas.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Parcelas ({instalacao.parcelas.length})
                </p>
                <div className="space-y-2">
                  {instalacao.parcelas.map((parcela) => (
                    <div 
                      key={parcela.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold min-w-[60px]">
                          Parcela {parcela.numero_parcela}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            parcela.status === 'pago' 
                              ? 'bg-green-500/10 text-green-700 border-green-500/20' 
                              : parcela.status === 'pago_parcial'
                              ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                              : 'bg-red-500/10 text-red-700 border-red-500/20'
                          }`}
                        >
                          {parcela.status === 'pago' 
                            ? 'Pago' 
                            : parcela.status === 'pago_parcial'
                            ? 'Pago Parcial'
                            : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(parcela.valor_parcela)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Venc: {format(new Date(parcela.data_vencimento), 'dd/MM/yyyy')}
                        </p>
                        {parcela.data_pagamento && (
                          <p className="text-xs text-green-600">
                            Pago: {format(new Date(parcela.data_pagamento), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}

          {/* Informações de Correção */}
          {instalacao.categoria === 'correcao' && instalacao.justificativa_correcao && (
            <div className="bg-orange-500/5 p-4 rounded-lg border border-orange-500/20">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">
                    Correção Necessária
                  </p>
                  <p className="text-sm">{instalacao.justificativa_correcao}</p>
                  {instalacao.alterado_para_correcao_em && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Alterado em: {format(new Date(instalacao.alterado_para_correcao_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rodapé com info de criação */}
          {instalacao.criador && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
              <span>Cadastrado por {instalacao.criador.nome}</span>
              <span>{format(new Date(instalacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
