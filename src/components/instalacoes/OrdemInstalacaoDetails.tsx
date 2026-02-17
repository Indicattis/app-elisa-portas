import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Calendar, Clock, User, Phone, Mail, Truck, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemInstalacaoDetailsProps {
  ordem: OrdemCarregamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConcluirInstalacao: (pedidoId: string) => Promise<void>;
  isConcluindo: boolean;
}

export const OrdemInstalacaoDetails = ({
  ordem,
  open,
  onOpenChange,
  onConcluirInstalacao,
  isConcluindo,
}: OrdemInstalacaoDetailsProps) => {
  if (!ordem) return null;

  const instalacao = ordem.pedido?.instalacao?.[0];
  const podeConluir = ordem.carregamento_concluido && !instalacao?.instalacao_concluida;

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      agendada: { label: "Agendada", variant: "default" },
      em_carregamento: { label: "Em Carregamento", variant: "secondary" },
      concluida: { label: "Concluída", variant: "secondary" },
    };
    
    const config = status ? variants[status] : variants.pendente;
    return <Badge variant={config.variant} className="text-[10px] h-5">{config.label}</Badge>;
  };

  const formatTipoProduto = (tipo: string | null | undefined) => {
    if (!tipo) return '';
    return tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTamanho = (produto: any) => {
    if (produto.tamanho) return produto.tamanho;
    if (produto.largura && produto.altura) return `${Number(produto.largura).toFixed(2)}m × ${Number(produto.altura).toFixed(2)}m`;
    return '';
  };

  const handleConcluir = async () => {
    if (!ordem.pedido?.id) return;
    await onConcluirInstalacao(ordem.pedido.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-base flex items-center justify-between">
            <span>Detalhes da Instalação</span>
            {getStatusBadge(ordem.status)}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Botão de Concluir Instalação */}
          {podeConluir && (
            <Button 
              onClick={handleConcluir}
              disabled={isConcluindo}
              className="w-full"
              size="lg"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isConcluindo ? "Concluindo..." : "Concluir Instalação"}
            </Button>
          )}

          {/* Status da Instalação */}
          {instalacao && (
            <>
              <div className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground">Status da Instalação</h3>
                <div className="space-y-1 text-xs pl-2">
                  {instalacao.tipo_instalacao && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        {instalacao.tipo_instalacao === 'elisa' ? 'Elisa' : 'Autorizados'}
                      </Badge>
                    </div>
                  )}
                  {instalacao.responsavel_instalacao_nome && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Responsável:</span>
                      <span className="font-medium text-[11px]">{instalacao.responsavel_instalacao_nome}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Informações do Cliente */}
          <div>
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3 w-3" />
              Cliente
            </h3>
            <div className="space-y-1.5 text-xs pl-4">
              <p className="font-medium text-sm">{ordem.nome_cliente}</p>
              {ordem.venda?.cliente_telefone && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {ordem.venda.cliente_telefone}
                </div>
              )}
              {ordem.venda?.cliente_email && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{ordem.venda.cliente_email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações do Pedido */}
          <div>
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
              <Package className="h-3 w-3" />
              Pedido
            </h3>
            <div className="space-y-1.5 text-xs pl-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Número:</span>
                <span className="font-medium">{ordem.pedido?.numero_pedido || 'N/A'}</span>
              </div>
              {ordem.pedido?.etapa_atual && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Etapa:</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                    {ordem.pedido.etapa_atual.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )}
              {ordem.pedido?.data_producao && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data Produção:</span>
                  <span className="text-[11px]">{format(new Date(ordem.pedido.data_producao), 'dd/MM/yy')}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Endereço de Entrega */}
          {ordem.venda && (
            <>
              <div>
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Endereço
                </h3>
                <div className="space-y-1 text-xs pl-4">
                  {ordem.venda.cidade && ordem.venda.estado && (
                    <p className="text-muted-foreground">
                      {ordem.venda.cidade}, {ordem.venda.estado}
                    </p>
                  )}
                  {ordem.venda.bairro && (
                    <p className="text-muted-foreground text-[11px]">{ordem.venda.bairro}</p>
                  )}
                  {ordem.venda.cep && (
                    <p className="text-muted-foreground text-[11px]">CEP: {ordem.venda.cep}</p>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Informações do Carregamento */}
          <div>
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
              <Truck className="h-3 w-3" />
              Carregamento
            </h3>
            <div className="space-y-1.5 text-xs pl-4">
              {ordem.data_carregamento && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span className="text-[11px]">{format(new Date(ordem.data_carregamento), "dd/MM/yy")}</span>
                </div>
              )}
              {ordem.hora && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-[11px]">{ordem.hora}</span>
                </div>
              )}
              {ordem.responsavel_carregamento_nome && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Responsável:</span>
                  <span className="font-medium text-[11px]">{ordem.responsavel_carregamento_nome}</span>
                </div>
              )}
              {ordem.carregamento_concluido && ordem.carregamento_concluido_em && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Concluído:</span>
                  <span className="text-[11px]">{format(new Date(ordem.carregamento_concluido_em), 'dd/MM/yy HH:mm')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Produtos */}
          {ordem.venda?.produtos && ordem.venda.produtos.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold mb-2 text-muted-foreground">Produtos ({ordem.venda.produtos.length})</h3>
                <div className="space-y-1.5 pl-4">
                  {ordem.venda.produtos.map((produto, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-1.5 rounded-md bg-muted/30"
                    >
                      {produto.cor && (
                        <div
                          className="h-4 w-4 rounded border border-border shrink-0 mt-0.5"
                          style={{ backgroundColor: produto.cor.codigo_hex }}
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {produto.tipo_produto && (
                            <span className="text-[11px] font-medium">{formatTipoProduto(produto.tipo_produto)}</span>
                          )}
                          {formatTamanho(produto) && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1">
                              {formatTamanho(produto)}
                            </Badge>
                          )}
                        </div>
                        {produto.cor && (
                          <p className="text-[10px] text-muted-foreground truncate">{produto.cor.nome}</p>
                        )}
                        {produto.quantidade && produto.quantidade > 1 && (
                          <p className="text-[10px] text-muted-foreground">Qtd: {produto.quantidade}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Observações */}
          {ordem.observacoes && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold mb-1.5 text-muted-foreground">Observações</h3>
                <p className="text-xs text-muted-foreground pl-4 leading-relaxed">{ordem.observacoes}</p>
              </div>
            </>
          )}

          {/* Data Prevista de Entrega */}
          {ordem.venda?.data_prevista_entrega && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-xs pl-4">
                <span className="text-muted-foreground">Entrega prevista:</span>
                <span className="font-medium text-[11px]">
                  {format(new Date(ordem.venda.data_prevista_entrega), 'dd/MM/yyyy')}
                </span>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
