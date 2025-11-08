import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListChecks } from 'lucide-react';
import { LinhaResumo } from '@/types/etiqueta';

interface LinhasListProps {
  linhas: LinhaResumo[];
  loading: boolean;
  selectedLinhaId: string | null;
  onSelectLinha: (linhaId: string) => void;
  filtro: string;
}

export function LinhasList({ linhas, loading, selectedLinhaId, onSelectLinha, filtro }: LinhasListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const linhasFiltradas = linhas.filter((linha) => {
    const termo = filtro.toLowerCase();
    const nomeProduto = linha.nome_produto || linha.descricao_produto || '';
    return nomeProduto.toLowerCase().includes(termo);
  });

  if (linhasFiltradas.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <ListChecks className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Nenhuma linha encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-1">
      <div className="space-y-2">
        {linhasFiltradas.map((linha) => {
        const nomeProduto = linha.nome_produto || linha.descricao_produto || 'Item sem nome';
        const isMeiaCana = nomeProduto.toLowerCase().includes('meia cana');
        const isSelected = linha.id === selectedLinhaId;

        return (
          <Card 
            key={linha.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => onSelectLinha(linha.id)}
          >
            <CardContent className="p-2.5">
              <div className="flex items-start justify-between mb-1">
                <p className="font-semibold text-xs flex-1 truncate pr-2">{nomeProduto}</p>
                {isMeiaCana && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    Meia Cana
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                <div>
                  <span className="font-medium">Qtd:</span> {linha.quantidade}
                </div>
                {linha.largura && (
                  <div>
                    <span className="font-medium">Larg:</span> {linha.largura}m
                  </div>
                )}
                {linha.altura && (
                  <div>
                    <span className="font-medium">Alt:</span> {linha.altura}m
                  </div>
                )}
                {linha.tamanho && (
                  <div className="col-span-2 truncate">
                    <span className="font-medium">Tam:</span> {linha.tamanho}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>
    </ScrollArea>
  );
}
