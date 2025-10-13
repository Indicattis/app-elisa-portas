import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaturamentoProdutoCardProps {
  produto: {
    id: string;
    descricao: string;
    valor_total: number;
    lucro_item?: number;
    quantidade: number;
  };
  onClick: () => void;
}

export function FaturamentoProdutoCard({
  produto,
  onClick,
}: FaturamentoProdutoCardProps) {
  const isFaturado = (produto.lucro_item || 0) > 0;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-105 rounded-md",
        isFaturado ? "border-green-500" : "border-yellow-500"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate mb-1">
              {produto.descricao}
            </h3>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Valor: R$ {produto.valor_total.toFixed(2)}
              </p>
              {produto.quantidade > 1 && (
                <p className="text-xs text-muted-foreground">
                  Qtd: {produto.quantidade}
                </p>
              )}
              {isFaturado && (
                <p className="text-xs font-medium text-green-600">
                  Lucro: R$ {(produto.lucro_item || 0).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {isFaturado ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Clock className="h-6 w-6 text-yellow-600" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
