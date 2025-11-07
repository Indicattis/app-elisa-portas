import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Ruler } from 'lucide-react';
import { LinhaResumo } from '@/types/etiqueta';

interface LinhasListProps {
  linhas: LinhaResumo[];
  loading: boolean;
  selectedLinhaId: string | null;
  onSelectLinha: (linhaId: string) => void;
}

export function LinhasList({ linhas, loading, selectedLinhaId, onSelectLinha }: LinhasListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (linhas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma linha encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {linhas.map((linha) => {
        const isSelected = linha.id === selectedLinhaId;
        const nomeProduto = linha.nome_produto || linha.descricao_produto || 'Item';
        const isMeiaCana = nomeProduto.toLowerCase().includes('meia cana');
        
        return (
          <Card 
            key={linha.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => onSelectLinha(linha.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{nomeProduto}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Qtd: {linha.quantidade}
                </Badge>
              </div>
              
              {linha.descricao_produto && linha.nome_produto !== linha.descricao_produto && (
                <p className="text-xs text-muted-foreground mb-2">{linha.descricao_produto}</p>
              )}
              
              {(linha.largura || linha.altura || linha.tamanho) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Ruler className="h-3 w-3" />
                  {linha.largura && linha.altura ? (
                    <span>{linha.largura}m × {linha.altura}m</span>
                  ) : (
                    <span>{linha.tamanho || 'N/A'}</span>
                  )}
                </div>
              )}
              
              {isMeiaCana && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Meia Cana
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
