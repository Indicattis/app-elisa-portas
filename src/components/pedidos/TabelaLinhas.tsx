import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { PedidoLinha } from "@/hooks/usePedidoLinhas";

interface TabelaLinhasProps {
  linhas: PedidoLinha[];
  isReadOnly: boolean;
  onRemover: (id: string) => void;
}

export function TabelaLinhas({ linhas, isReadOnly, onRemover }: TabelaLinhasProps) {
  if (linhas.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        Nenhum item adicionado nesta categoria
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {linhas.map((linha) => (
        <Card key={linha.id} className="p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{linha.nome_produto}</p>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {linha.quantidade}x
                </Badge>
                {linha.tamanho && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {linha.tamanho}
                  </Badge>
                )}
              </div>
              {linha.descricao_produto && linha.descricao_produto !== linha.nome_produto && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {linha.descricao_produto}
                </p>
              )}
            </div>

            {!isReadOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemover(linha.id)}
                className="h-7 w-7 p-0 shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
