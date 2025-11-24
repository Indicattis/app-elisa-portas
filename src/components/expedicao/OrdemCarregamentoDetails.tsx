import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, MapPin, Calendar, Clock, User, Phone, Mail, Truck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemCarregamentoDetailsProps {
  ordem: OrdemCarregamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrdemCarregamentoDetails = ({
  ordem,
  open,
  onOpenChange,
}: OrdemCarregamentoDetailsProps) => {
  if (!ordem) return null;

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      agendada: { label: "Agendada", variant: "default" },
      em_carregamento: { label: "Em Carregamento", variant: "secondary" },
      concluida: { label: "Concluída", variant: "secondary" },
    };
    
    const config = status ? variants[status] : variants.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Detalhes da Ordem</span>
            {getStatusBadge(ordem.status)}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações do Cliente */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{ordem.nome_cliente}</p>
              {ordem.venda?.cliente_telefone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {ordem.venda.cliente_telefone}
                </div>
              )}
              {ordem.venda?.cliente_email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {ordem.venda.cliente_email}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações do Pedido */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pedido
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Número:</span>
                <span className="font-medium">{ordem.pedido?.numero_pedido || 'N/A'}</span>
              </div>
              {ordem.pedido?.etapa_atual && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Etapa:</span>
                  <Badge variant="outline" className="text-xs">
                    {ordem.pedido.etapa_atual.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )}
              {ordem.pedido?.data_producao && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data Produção:</span>
                  <span>{format(new Date(ordem.pedido.data_producao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Endereço de Entrega */}
          {ordem.venda && (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço de Entrega
                </h3>
                <div className="space-y-2 text-sm">
                  {ordem.venda.cidade && ordem.venda.estado && (
                    <p className="text-muted-foreground">
                      {ordem.venda.cidade}, {ordem.venda.estado}
                    </p>
                  )}
                  {ordem.venda.bairro && (
                    <p className="text-muted-foreground">Bairro: {ordem.venda.bairro}</p>
                  )}
                  {ordem.venda.cep && (
                    <p className="text-muted-foreground">CEP: {ordem.venda.cep}</p>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Informações do Carregamento */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Carregamento
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="outline">
                  {ordem.tipo_carregamento === 'elisa' ? 'Instalação' : 'Entrega'}
                </Badge>
              </div>
              {ordem.data_carregamento && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(ordem.data_carregamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              )}
              {ordem.hora && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {ordem.hora}
                </div>
              )}
              {ordem.responsavel_carregamento_nome && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Responsável:</span>
                  <span className="font-medium">{ordem.responsavel_carregamento_nome}</span>
                </div>
              )}
              {ordem.carregamento_concluido && ordem.carregamento_concluido_em && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Concluído em:</span>
                  <span>{format(new Date(ordem.carregamento_concluido_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Produtos */}
          {ordem.venda?.produtos && ordem.venda.produtos.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Produtos</h3>
                <div className="space-y-2">
                  {ordem.venda.produtos.map((produto, idx) => (
                    produto.cor && (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                      >
                        <div
                          className="h-6 w-6 rounded-md border border-border shrink-0"
                          style={{ backgroundColor: produto.cor.codigo_hex }}
                        />
                        <span className="text-sm">{produto.cor.nome}</span>
                      </div>
                    )
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
                <h3 className="text-sm font-semibold mb-2">Observações</h3>
                <p className="text-sm text-muted-foreground">{ordem.observacoes}</p>
              </div>
            </>
          )}

          {/* Data Prevista de Entrega */}
          {ordem.venda?.data_prevista_entrega && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Entrega prevista:</span>
                <span className="font-medium">
                  {format(new Date(ordem.venda.data_prevista_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
