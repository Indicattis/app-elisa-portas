import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InstalacaoCadastrada } from '@/hooks/useInstalacoesCadastradas';
import { MapPin, Calendar, User, AlertCircle, DollarSign, Package } from 'lucide-react';

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes da Instalação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cliente */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="font-medium">{instalacao.nome_cliente}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{instalacao.telefone_cliente || 'Não informado'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Localização */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localização
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cidade</p>
                <p className="font-medium">{instalacao.cidade}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <p className="font-medium">{instalacao.estado}</p>
              </div>
              {instalacao.latitude && instalacao.longitude && (
                <>
                  <div>
                    <p className="text-muted-foreground">Coordenadas</p>
                    <p className="font-medium text-xs">
                      {instalacao.latitude.toFixed(6)}, {instalacao.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Precisão Geocoding</p>
                    <p className="font-medium">{instalacao.geocode_precision || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Status e Categoria */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Status e Categoria</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-2">Status</p>
                <Badge variant="outline" className={getStatusVariant(instalacao.status)}>
                  {getStatusLabel(instalacao.status)}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Categoria</p>
                <Badge variant="outline" className={getCategoriaVariant(instalacao.categoria)}>
                  {getCategoriaLabel(instalacao.categoria)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Datas */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Datas
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {instalacao.data_instalacao && (
                <div>
                  <p className="text-muted-foreground">Data Instalação</p>
                  <p className="font-medium">
                    {format(new Date(instalacao.data_instalacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              {instalacao.data_producao && (
                <div>
                  <p className="text-muted-foreground">Data Produção</p>
                  <p className="font-medium">
                    {format(new Date(instalacao.data_producao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Data Cadastro</p>
                <p className="font-medium">
                  {format(new Date(instalacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Última Atualização</p>
                <p className="font-medium">
                  {format(new Date(instalacao.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações de Instalação */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Informações da Instalação</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {instalacao.tamanho && (
                <div>
                  <p className="text-muted-foreground">Tamanho</p>
                  <p className="font-medium">{instalacao.tamanho}</p>
                </div>
              )}
              {instalacao.tipo_instalacao && (
                <div>
                  <p className="text-muted-foreground">Tipo de Instalação</p>
                  <p className="font-medium">
                    {instalacao.tipo_instalacao === 'elisa' ? 'Instalação Elisa' : 'Autorizados'}
                  </p>
                </div>
              )}
              {instalacao.responsavel_instalacao_nome && (
                <div>
                  <p className="text-muted-foreground">Responsável</p>
                  <p className="font-medium">{instalacao.responsavel_instalacao_nome}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Produtos */}
          {instalacao.produtos && instalacao.produtos.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produtos da Instalação
                </h3>
                <div className="space-y-3">
                  {instalacao.produtos.map((produto, index) => (
                    <div 
                      key={produto.id} 
                      className="border rounded-lg p-3 bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
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
                          </div>
                          <p className="text-sm font-medium">{produto.descricao}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Quantidade</p>
                          <p className="text-sm font-semibold">{produto.quantidade}x</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs mt-2 pt-2 border-t">
                        {produto.medidas && (
                          <div>
                            <p className="text-muted-foreground">Medidas</p>
                            <p className="font-medium">{produto.medidas}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Valor Total</p>
                          <p className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(produto.valor_total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Total de Produtos</span>
                      <span className="text-sm font-semibold">
                        {instalacao.produtos.reduce((sum, p) => sum + p.quantidade, 0)} unidades
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-semibold">Valor Total</span>
                      <span className="text-sm font-semibold text-primary">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(instalacao.produtos.reduce((sum, p) => sum + p.valor_total, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Valores */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {instalacao.valor_a_receber !== null && (
                <div>
                  <p className="text-muted-foreground">Valor a Receber</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(instalacao.valor_a_receber)}
                  </p>
                </div>
              )}
              {instalacao.saldo !== null && (
                <div>
                  <p className="text-muted-foreground">Saldo Pendente</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(instalacao.saldo)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Informações de Correção */}
          {instalacao.categoria === 'correcao' && instalacao.justificativa_correcao && (
            <>
              <Separator />
              <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <AlertCircle className="h-4 w-4" />
                  Informações da Correção
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Justificativa</p>
                    <p className="font-medium text-foreground">{instalacao.justificativa_correcao}</p>
                  </div>
                  {instalacao.alterado_para_correcao_em && (
                    <div>
                      <p className="text-muted-foreground">Data da Alteração</p>
                      <p className="font-medium">
                        {format(
                          new Date(instalacao.alterado_para_correcao_em),
                          "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Criado por */}
          {instalacao.criador && (
            <>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground">Cadastrado por</p>
                <p className="font-medium">{instalacao.criador.nome}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
