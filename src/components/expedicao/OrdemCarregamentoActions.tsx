import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { Pencil, XCircle, UserCog, MapPin, Package } from "lucide-react";

interface OrdemCarregamentoActionsProps {
  ordem: OrdemCarregamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario: (id: string) => void;
  onAlterarResponsavel: (ordem: OrdemCarregamento) => void;
}

export const OrdemCarregamentoActions = ({
  ordem,
  open,
  onOpenChange,
  onEdit,
  onRemoverDoCalendario,
  onAlterarResponsavel,
}: OrdemCarregamentoActionsProps) => {
  if (!ordem) return null;

  const handleEdit = () => {
    onEdit(ordem);
    onOpenChange(false);
  };

  const handleRemover = () => {
    onRemoverDoCalendario(ordem.id);
    onOpenChange(false);
  };

  const handleAlterarResponsavel = () => {
    onAlterarResponsavel(ordem);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Ações da Ordem</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações da Ordem */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{ordem.nome_cliente}</h3>
              <p className="text-sm text-muted-foreground">
                Pedido: {ordem.pedido?.numero_pedido || 'N/A'}
              </p>
            </div>

            <div className="flex gap-2">
              <Badge variant="outline">
                {ordem.tipo_carregamento === 'elisa' ? 'Instalação' : 'Entrega'}
              </Badge>
              <Badge variant={ordem.status === 'concluida' ? 'default' : 'secondary'}>
                {ordem.status || 'Pendente'}
              </Badge>
            </div>

            {ordem.venda && (
              <>
                <Separator />
                <div className="space-y-2">
                  {ordem.venda.cidade && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{ordem.venda.cidade}/{ordem.venda.estado}</span>
                    </div>
                  )}

                  {ordem.venda.data_prevista_entrega && (
                    <div className="text-sm text-muted-foreground">
                      Entrega prevista: {new Date(ordem.venda.data_prevista_entrega).toLocaleDateString('pt-BR')}
                    </div>
                  )}

                  {ordem.venda.produtos && ordem.venda.produtos.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Produtos
                        </p>
                        <div className="space-y-2">
                          {ordem.venda.produtos.map((produto, idx) => (
                            produto.cor && (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <div 
                                  className="h-4 w-4 rounded-full border border-border" 
                                  style={{ backgroundColor: produto.cor.codigo_hex }}
                                />
                                <span>{produto.cor.nome}</span>
                                <span className="text-muted-foreground">
                                  ({produto.quantidade}x)
                                </span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Botões de Ação */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Ações</h4>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleAlterarResponsavel}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Alterar Responsável
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleRemover}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Remover do Calendário
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
