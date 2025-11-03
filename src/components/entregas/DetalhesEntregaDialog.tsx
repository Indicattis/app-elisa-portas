import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Entrega } from "@/hooks/useEntregas";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Package, Calendar, User, Phone, MapPinned, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DetalhesEntregaDialogProps {
  entrega: Entrega | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pendente_producao: 'bg-yellow-500',
  em_producao: 'bg-blue-500',
  em_qualidade: 'bg-purple-500',
  aguardando_pintura: 'bg-orange-500',
  pronta_fabrica: 'bg-cyan-500',
  finalizada: 'bg-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  pendente_producao: 'Pendente Produção',
  em_producao: 'Em Produção',
  em_qualidade: 'Em Qualidade',
  aguardando_pintura: 'Aguardando Pintura',
  pronta_fabrica: 'Pronta Fábrica',
  finalizada: 'Finalizada',
};

export const DetalhesEntregaDialog = ({ entrega, open, onOpenChange }: DetalhesEntregaDialogProps) => {
  if (!entrega) return null;

  const isGeocoded = entrega.latitude && entrega.longitude;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes da Entrega
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre a entrega
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status e Conclusão */}
          <div className="flex items-center gap-3">
            <Badge className={STATUS_COLORS[entrega.status]}>
              {STATUS_LABELS[entrega.status]}
            </Badge>
            {entrega.entrega_concluida && (
              <Badge className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Entrega Concluída
              </Badge>
            )}
          </div>

          {/* Informações do Cliente */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{entrega.nome_cliente}</p>
              </div>
              {entrega.telefone_cliente && (
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Telefone:
                  </span>
                  <p className="font-medium">{entrega.telefone_cliente}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Localização:
                </span>
                <p className="font-medium">{entrega.cidade}/{entrega.estado}</p>
              </div>
              {entrega.tamanho && (
                <div>
                  <span className="text-muted-foreground">Tamanho:</span>
                  <p className="font-medium">{entrega.tamanho}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Datas */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Datas
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {entrega.data_producao && (
                <div>
                  <span className="text-muted-foreground">Data de Produção:</span>
                  <p className="font-medium">{format(new Date(entrega.data_producao), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              )}
              {entrega.data_entrega && (
                <div>
                  <span className="text-muted-foreground">Data de Entrega:</span>
                  <p className="font-medium">{format(new Date(entrega.data_entrega), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Criado em:</span>
                <p className="font-medium">{format(new Date(entrega.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
              {entrega.entrega_concluida_em && (
                <div>
                  <span className="text-muted-foreground">Concluída em:</span>
                  <p className="font-medium">{format(new Date(entrega.entrega_concluida_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Responsáveis */}
          <div className="space-y-2">
            <h3 className="font-semibold">Responsáveis</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {entrega.creator && (
                <div>
                  <span className="text-muted-foreground">Criado por:</span>
                  <p className="font-medium">{entrega.creator.nome}</p>
                </div>
              )}
              {entrega.responsavel_entrega_nome && (
                <div>
                  <span className="text-muted-foreground">Responsável Entrega:</span>
                  <p className="font-medium">{entrega.responsavel_entrega_nome}</p>
                </div>
              )}
              {entrega.concluida_por_user && (
                <div>
                  <span className="text-muted-foreground">Concluída por:</span>
                  <p className="font-medium">{entrega.concluida_por_user.nome}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Vínculos */}
          {(entrega.venda || entrega.pedido) && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">Vínculos</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {entrega.venda?.numero_venda && (
                    <div>
                      <span className="text-muted-foreground">Venda:</span>
                      <p className="font-medium">{entrega.venda.numero_venda}</p>
                    </div>
                  )}
                  {entrega.pedido && (
                    <div>
                      <span className="text-muted-foreground">Pedido:</span>
                      <p className="font-medium">{entrega.pedido.numero_pedido}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Geocodificação */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPinned className="h-4 w-4" />
              Geocodificação
            </h3>
            <div className="text-sm">
              {isGeocoded ? (
                <div className="space-y-1">
                  <Badge variant="outline" className="bg-green-50">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Geocodificado
                  </Badge>
                  <p className="text-muted-foreground">
                    Lat: {entrega.latitude?.toFixed(6)}, Long: {entrega.longitude?.toFixed(6)}
                  </p>
                  {entrega.geocode_precision && (
                    <p className="text-muted-foreground text-xs">
                      Precisão: {entrega.geocode_precision}
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="bg-yellow-50">
                  Não geocodificado
                </Badge>
              )}
            </div>
          </div>

          {/* Produtos */}
          {entrega.produtos && entrega.produtos.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Produtos</h3>
                <div className="space-y-1">
                  {entrega.produtos.map((produto) => (
                    <div key={produto.id} className="flex justify-between text-sm">
                      <span>{produto.descricao} (x{produto.quantidade})</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.valor_total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Observações */}
          {entrega.observacoes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Observações</h3>
                <p className="text-sm text-muted-foreground">{entrega.observacoes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
