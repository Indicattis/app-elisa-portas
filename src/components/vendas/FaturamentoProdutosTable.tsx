import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, CheckCircle2 } from "lucide-react";

interface Produto {
  id: string;
  tipo_produto?: string;
  descricao: string;
  medidas?: string;
  desconto_percentual?: number;
  desconto_valor?: number;
  valor_instalacao?: number;
  valor_total: number;
  quantidade: number;
  lucro_item?: number;
  custo_producao?: number;
}

interface FaturamentoProdutosTableProps {
  produtos: Produto[];
  valorFrete: number;
  onEditLucro: (produto: Produto) => void;
}

export function FaturamentoProdutosTable({
  produtos,
  valorFrete,
  onEditLucro,
}: FaturamentoProdutosTableProps) {
  const getTipoProdutoLabel = (tipo?: string) => {
    const tipos: Record<string, string> = {
      'porta_enrolar': 'Porta Enrolar',
      'porta_social': 'Porta Social',
      'acessorio': 'Acessório',
      'manutencao': 'Manutenção',
      'adicional': 'Adicional',
      'pintura_epoxi': 'Pintura Epóxi',
    };
    return tipos[tipo || ''] || tipo || '-';
  };

  return (
    <ScrollArea className="w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead className="text-right">Desconto</TableHead>
            <TableHead className="text-right">Valor Unit.</TableHead>
            <TableHead className="text-center">Qtd</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="text-right">Instalação</TableHead>
            <TableHead className="text-right">Lucro Informado</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos?.map((produto) => {
            const temLucro = produto.lucro_item !== null && produto.lucro_item !== undefined;
            const valorTotalLinha = produto.valor_total * produto.quantidade;
            const desconto = produto.desconto_percentual 
              ? `${produto.desconto_percentual}%` 
              : produto.desconto_valor 
                ? `R$ ${produto.desconto_valor.toFixed(2)}`
                : '-';
            
            return (
              <TableRow key={produto.id}>
                <TableCell className="text-sm">
                  {getTipoProdutoLabel(produto.tipo_produto)}
                </TableCell>
                <TableCell className="font-medium">
                  {produto.descricao}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {produto.medidas || "-"}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  {desconto}
                </TableCell>
                <TableCell className="text-right">
                  R$ {produto.valor_total.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  {produto.quantidade}
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {valorTotalLinha.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {produto.valor_instalacao 
                    ? `R$ ${produto.valor_instalacao.toFixed(2)}` 
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {temLucro ? (
                    <div className="flex items-center justify-end gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">
                        R$ {(produto.lucro_item! * produto.quantidade).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                      Pendente
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditLucro(produto)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {/* Linha do Frete */}
          <TableRow className="bg-muted/50 font-medium">
            <TableCell colSpan={6}>
              <span className="text-sm font-semibold">Frete</span>
            </TableCell>
            <TableCell className="text-right font-semibold">
              R$ {valorFrete.toFixed(2)}
            </TableCell>
            <TableCell colSpan={3} className="text-muted-foreground text-sm">
              Apenas visualização
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
