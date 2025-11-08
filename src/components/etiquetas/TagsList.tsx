import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer } from 'lucide-react';
import { EtiquetaCalculo } from '@/types/etiqueta';
import { gerarPDFEtiquetaIndividual } from '@/utils/etiquetasPDFGenerator';
import { toast } from 'sonner';

interface TagsListProps {
  calculo: EtiquetaCalculo;
  numeroPedido: string;
}

export function TagsList({ calculo, numeroPedido }: TagsListProps) {
  const handlePrintTag = (tagNumero: number) => {
    try {
      const tagData = {
        tagNumero,
        totalTags: calculo.etiquetasNecessarias,
        nomeProduto: calculo.nomeProduto,
        numeroPedido,
        quantidade: calculo.quantidade,
        largura: calculo.largura,
        altura: calculo.altura
      };
      
      const pdf = gerarPDFEtiquetaIndividual(tagData);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast.success(`Etiqueta ${tagNumero} aberta em nova aba`);
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      toast.error('Erro ao gerar etiqueta');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Etiquetas Individuais</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {calculo.etiquetasNecessarias} {calculo.etiquetasNecessarias === 1 ? 'etiqueta necessária' : 'etiquetas necessárias'}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {Array.from({ length: calculo.etiquetasNecessarias }).map((_, idx) => {
            const tagNumero = idx + 1;
            return (
              <Card key={idx} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {tagNumero}/{calculo.etiquetasNecessarias}
                        </Badge>
                      </div>
                      
                      <p className="text-sm font-medium truncate mb-1">
                        {calculo.nomeProduto}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Pedido: {numeroPedido}</span>
                        <span>•</span>
                        <span>Qtd: {calculo.quantidade}</span>
                      </div>
                      
                      {calculo.largura && calculo.altura && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {calculo.largura}m × {calculo.altura}m
                        </p>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrintTag(tagNumero)}
                      className="shrink-0"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
