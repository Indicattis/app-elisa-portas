import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConferenciaItemRowProps {
  produto: {
    id: string;
    sku: string | null;
    nome_produto: string;
    categoria: string | null;
    quantidade: number;
    unidade: string | null;
  };
  quantidadeConferida: number | null;
  onQuantidadeChange: (produtoId: string, quantidade: number | null) => void;
}

export function ConferenciaItemRow({
  produto,
  quantidadeConferida,
  onQuantidadeChange,
}: ConferenciaItemRowProps) {
  const diferenca =
    quantidadeConferida !== null ? quantidadeConferida - produto.quantidade : null;

  const handleChange = (value: string) => {
    if (value === "") {
      onQuantidadeChange(produto.id, null);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        onQuantidadeChange(produto.id, num);
      }
    }
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {produto.sku || "-"}
      </TableCell>
      <TableCell className="font-medium">{produto.nome_produto}</TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {produto.categoria || "Sem categoria"}
        </Badge>
      </TableCell>
      <TableCell className="text-center font-medium">
        {produto.quantidade} {produto.unidade}
      </TableCell>
      <TableCell className="w-32">
        <Input
          type="number"
          min="0"
          placeholder="Qtd"
          value={quantidadeConferida ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          className="h-8 text-center"
        />
      </TableCell>
      <TableCell className="text-center">
        {diferenca !== null ? (
          <span
            className={cn(
              "font-medium",
              diferenca > 0 && "text-green-600",
              diferenca < 0 && "text-red-600",
              diferenca === 0 && "text-muted-foreground"
            )}
          >
            {diferenca > 0 ? `+${diferenca}` : diferenca}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}
