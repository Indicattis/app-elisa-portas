import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useProdutosVendidosMes, getTipoProdutoLabel } from "@/hooks/useProdutosVendidosMes";
import { Trophy, Medal, Award, Package } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function RankingIcon({ position }: { position: number }) {
  if (position === 1) {
    return <Trophy className="h-4 w-4 text-yellow-500" />;
  }
  if (position === 2) {
    return <Medal className="h-4 w-4 text-gray-400" />;
  }
  if (position === 3) {
    return <Award className="h-4 w-4 text-amber-600" />;
  }
  return <span className="text-muted-foreground text-sm">{position}</span>;
}

export function TabelaProdutosVendidos() {
  const { data: produtos, isLoading } = useProdutosVendidosMes();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!produtos || produtos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mb-2 opacity-50" />
        <p>Nenhuma venda registrada este mês</p>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto, index) => (
            <TableRow key={`${produto.nome_produto}-${produto.tipo_produto}`}>
              <TableCell className="font-medium">
                <div className="flex items-center justify-center w-6">
                  <RankingIcon position={index + 1} />
                </div>
              </TableCell>
              <TableCell className="font-medium">{produto.nome_produto}</TableCell>
              <TableCell className="text-muted-foreground">
                {getTipoProdutoLabel(produto.tipo_produto)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {produto.quantidade_total}
              </TableCell>
              <TableCell className="text-right font-semibold text-primary">
                {formatCurrency(produto.valor_total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
