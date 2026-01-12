import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Package, Receipt, Truck, FileSignature, Hammer, Cog, Palette, CheckCircle, Layers, Star, FileText } from "lucide-react";

interface ItensVinculados {
  pedido: { numero: string; status: string; id: string } | null;
  contas_receber: number;
  instalacoes: number;
  contratos: number;
  notas_fiscais: number;
  autorizacoes_desconto: number;
  ordens_carregamento: number;
  ordens_soldagem: number;
  ordens_perfiladeira: number;
  ordens_pintura: number;
  ordens_qualidade: number;
  ordens_separacao: number;
  ordens_terceirizacao: number;
  ordens_porta_social: number;
  linhas_ordens: number;
  pontuacoes: number;
}

interface ConfirmarExclusaoVendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendaId: string;
  clienteNome: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function ConfirmarExclusaoVendaModal({
  open,
  onOpenChange,
  vendaId,
  clienteNome,
  onConfirm,
  isDeleting = false
}: ConfirmarExclusaoVendaModalProps) {
  const [itensVinculados, setItensVinculados] = useState<ItensVinculados | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && vendaId) {
      fetchItensVinculados();
    }
  }, [open, vendaId]);

  const fetchItensVinculados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_venda_itens_vinculados', {
        p_venda_id: vendaId
      });

      if (error) throw error;
      setItensVinculados(data as unknown as ItensVinculados);
    } catch (error) {
      console.error('Erro ao buscar itens vinculados:', error);
    } finally {
      setLoading(false);
    }
  };

  const temItensVinculados = itensVinculados && (
    itensVinculados.pedido ||
    itensVinculados.contas_receber > 0 ||
    itensVinculados.instalacoes > 0 ||
    itensVinculados.contratos > 0 ||
    itensVinculados.notas_fiscais > 0 ||
    itensVinculados.ordens_soldagem > 0 ||
    itensVinculados.ordens_perfiladeira > 0 ||
    itensVinculados.ordens_pintura > 0 ||
    itensVinculados.pontuacoes > 0
  );

  const renderItemCount = (
    icon: React.ReactNode,
    label: string,
    count: number,
    variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary'
  ) => {
    if (count === 0) return null;
    return (
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <span>{label}</span>
        <Badge variant={variant} className="ml-auto">{count}</Badge>
      </div>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Venda
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="font-medium">
                Venda de <span className="text-foreground">{clienteNome}</span>
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando itens vinculados...</span>
                </div>
              ) : itensVinculados ? (
                <div className="space-y-3">
                  {temItensVinculados && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-xs text-destructive font-medium mb-2">
                        ⚠️ Os seguintes itens serão excluídos permanentemente:
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {/* Pedido */}
                    {itensVinculados.pedido && (
                      <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-2">
                        <Package className="h-4 w-4 text-primary" />
                        <span>Pedido #{itensVinculados.pedido.numero}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {itensVinculados.pedido.status}
                        </Badge>
                      </div>
                    )}

                    {/* Financeiro */}
                    {renderItemCount(
                      <Receipt className="h-4 w-4 text-orange-500" />,
                      "Parcelas a receber",
                      itensVinculados.contas_receber
                    )}

                    {/* Instalações */}
                    {renderItemCount(
                      <Truck className="h-4 w-4 text-blue-500" />,
                      "Instalações",
                      itensVinculados.instalacoes
                    )}

                    {/* Contratos */}
                    {renderItemCount(
                      <FileSignature className="h-4 w-4 text-violet-500" />,
                      "Contratos",
                      itensVinculados.contratos
                    )}

                    {/* Notas Fiscais */}
                    {renderItemCount(
                      <FileText className="h-4 w-4 text-green-500" />,
                      "Notas fiscais",
                      itensVinculados.notas_fiscais
                    )}

                    {/* Ordens de Carregamento */}
                    {renderItemCount(
                      <Truck className="h-4 w-4 text-cyan-500" />,
                      "Ordens de carregamento",
                      itensVinculados.ordens_carregamento
                    )}

                    {/* Ordens de Soldagem */}
                    {renderItemCount(
                      <Hammer className="h-4 w-4 text-amber-500" />,
                      "Ordens de soldagem",
                      itensVinculados.ordens_soldagem
                    )}

                    {/* Ordens de Perfiladeira */}
                    {renderItemCount(
                      <Cog className="h-4 w-4 text-slate-500" />,
                      "Ordens de perfiladeira",
                      itensVinculados.ordens_perfiladeira
                    )}

                    {/* Ordens de Pintura */}
                    {renderItemCount(
                      <Palette className="h-4 w-4 text-pink-500" />,
                      "Ordens de pintura",
                      itensVinculados.ordens_pintura
                    )}

                    {/* Ordens de Qualidade */}
                    {renderItemCount(
                      <CheckCircle className="h-4 w-4 text-emerald-500" />,
                      "Ordens de qualidade",
                      itensVinculados.ordens_qualidade
                    )}

                    {/* Ordens de Separação */}
                    {renderItemCount(
                      <Layers className="h-4 w-4 text-indigo-500" />,
                      "Ordens de separação",
                      itensVinculados.ordens_separacao
                    )}

                    {/* Pontuações */}
                    {renderItemCount(
                      <Star className="h-4 w-4 text-yellow-500" />,
                      "Pontuações de colaboradores",
                      itensVinculados.pontuacoes,
                      'destructive'
                    )}

                    {/* Linhas de Ordens */}
                    {renderItemCount(
                      <Layers className="h-4 w-4 text-gray-500" />,
                      "Linhas de ordens",
                      itensVinculados.linhas_ordens
                    )}
                  </div>

                  {!temItensVinculados && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nenhum item vinculado encontrado.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-destructive">
                  Erro ao carregar itens vinculados
                </p>
              )}

              <p className="text-xs text-muted-foreground border-t pt-3">
                Esta ação é <span className="font-bold text-destructive">irreversível</span>. 
                Todos os dados listados acima serão permanentemente removidos do sistema.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir Tudo'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
