import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { gerarPDFEtiquetaProducao, gerarPDFEtiquetasProducaoMultiplas } from "@/utils/etiquetasPDFGenerator";
import { TagProducao } from "@/types/etiqueta";

interface ImprimirEtiquetasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  numeroPedido: string;
  clienteNome: string;
  tipoOrdem: string;
  responsavelNome?: string;
  ordemId?: string;
}

interface LinhaItem {
  id: string;
  nome_produto: string | null;
  descricao_produto: string | null;
  quantidade: number;
  largura: number | null;
  altura: number | null;
  tamanho: string | null;
}

export function ImprimirEtiquetasModal({
  open,
  onOpenChange,
  pedidoId,
  numeroPedido,
  clienteNome,
  tipoOrdem,
  responsavelNome,
  ordemId
}: ImprimirEtiquetasModalProps) {
  const [imprimindo, setImprimindo] = useState<string | null>(null);

  // Buscar linhas do pedido
  const { data: linhas, isLoading } = useQuery({
    queryKey: ['pedido-linhas-etiquetas', pedidoId, ordemId],
    queryFn: async () => {
      if (ordemId) {
        const { data, error } = await supabase
          .from('linhas_ordens')
          .select('id, item, quantidade, largura, altura, tamanho, estoque:estoque_id(nome_produto)')
          .eq('ordem_id', ordemId)
          .eq('tipo_ordem', tipoOrdem)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map((l: any) => ({
          id: l.id,
          nome_produto: l.estoque?.nome_produto || l.item,
          descricao_produto: l.item,
          quantidade: l.quantidade,
          largura: l.largura,
          altura: l.altura,
          tamanho: l.tamanho,
        })) as LinhaItem[];
      }

      const { data, error } = await supabase
        .from('pedido_linhas')
        .select('id, nome_produto, descricao_produto, quantidade, largura, altura, tamanho')
        .eq('pedido_id', pedidoId)
        .order('ordem');

      if (error) throw error;
      return data as LinhaItem[];
    },
    enabled: open && !!pedidoId
  });

  const criarTagProducao = (linha: LinhaItem, tagNumero: number = 1, totalTags: number = 1): TagProducao => {
    const nomeProduto = linha.nome_produto || linha.descricao_produto || 'Item';
    return {
      tagNumero,
      totalTags,
      nomeProduto,
      numeroPedido,
      quantidade: linha.quantidade,
      largura: linha.largura || undefined,
      altura: linha.altura || undefined,
      clienteNome,
      tamanho: linha.tamanho || undefined,
      origemOrdem: `Ordem de ${tipoOrdem.charAt(0).toUpperCase() + tipoOrdem.slice(1)}`,
      responsavelNome
    };
  };

  const handleImprimirIndividual = async (linha: LinhaItem) => {
    setImprimindo(linha.id);
    try {
      const tag = criarTagProducao(linha);
      const pdf = gerarPDFEtiquetaProducao(tag);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      toast.success('Etiqueta gerada com sucesso');
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      toast.error('Erro ao gerar etiqueta');
    } finally {
      setImprimindo(null);
    }
  };

  const handleImprimirTodas = async () => {
    if (!linhas?.length) return;
    
    setImprimindo('todas');
    try {
      const tags: TagProducao[] = linhas.map((linha, idx) => 
        criarTagProducao(linha, idx + 1, linhas.length)
      );
      
      const pdf = gerarPDFEtiquetasProducaoMultiplas(tags);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      toast.success(`${linhas.length} etiqueta(s) gerada(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error);
      toast.error('Erro ao gerar etiquetas');
    } finally {
      setImprimindo(null);
    }
  };

  const TIPO_LABELS: Record<string, string> = {
    soldagem: 'Soldagem',
    perfiladeira: 'Perfiladeira',
    separacao: 'Separação',
    pintura: 'Pintura',
    qualidade: 'Qualidade',
    instalacao: 'Instalação',
    carregamento: 'Carregamento'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Imprimir Etiquetas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info do pedido */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{numeroPedido}</span>
              <Badge variant="outline" className="text-xs">
                {TIPO_LABELS[tipoOrdem] || tipoOrdem}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{clienteNome}</p>
            {responsavelNome && (
              <p className="text-xs text-muted-foreground">Responsável: {responsavelNome}</p>
            )}
          </div>

          {/* Lista de itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Itens do Pedido</h4>
              {linhas && linhas.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleImprimirTodas}
                  disabled={imprimindo !== null}
                >
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Imprimir Todas ({linhas.length})
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : linhas && linhas.length > 0 ? (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2 pr-2">
                  {linhas.map((linha) => {
                    const nomeProduto = linha.nome_produto || linha.descricao_produto || 'Item';
                    return (
                      <div
                        key={linha.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{nomeProduto}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Qtd: {linha.quantidade}</span>
                            {linha.largura && linha.altura && (
                              <>
                                <span>•</span>
                                <span>{linha.largura}m × {linha.altura}m</span>
                              </>
                            )}
                            {linha.tamanho && !linha.largura && (
                              <>
                                <span>•</span>
                                <span>{linha.tamanho}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleImprimirIndividual(linha)}
                          disabled={imprimindo !== null}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum item encontrado neste pedido</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
