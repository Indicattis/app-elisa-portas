import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { ProdutoVenda } from '@/hooks/useVendas';

interface PortasVendaTableProps {
  portas: ProdutoVenda[];
  onRemovePorta: (index: number) => void;
}

const getTipoProdutoLabel = (tipo: string) => {
  switch (tipo) {
    case 'porta': return 'Porta de Enrolar';
    case 'acessorio': return 'Acessório';
    case 'adicional': return 'Adicional';
    default: return tipo;
  }
};

const getTipoProdutoVariant = (tipo: string): "default" | "secondary" | "outline" => {
  switch (tipo) {
    case 'porta': return 'default';
    case 'acessorio': return 'secondary';
    case 'adicional': return 'outline';
    default: return 'default';
  }
};

export function PortasVendaTable({ portas, onRemovePorta }: PortasVendaTableProps) {
  if (portas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/50">
        Nenhum produto adicionado
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Detalhes</TableHead>
          <TableHead>Qtd</TableHead>
          <TableHead>Valor Unit.</TableHead>
          <TableHead>Desconto</TableHead>
          <TableHead>Total</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {portas.map((produto, index) => {
          const valorBase = (produto.valor_produto + produto.valor_pintura + produto.valor_instalacao) * produto.quantidade;
          const descontoAplicado = produto.tipo_desconto === 'valor' 
            ? produto.desconto_valor 
            : valorBase * (produto.desconto_percentual / 100);
          const valorTotal = valorBase - descontoAplicado;
          
          const detalhes = produto.tipo_produto === 'porta' 
            ? produto.tamanho
            : produto.descricao || '-';
          
          return (
            <TableRow key={index}>
              <TableCell>
                <Badge variant={getTipoProdutoVariant(produto.tipo_produto)}>
                  {getTipoProdutoLabel(produto.tipo_produto)}
                </Badge>
              </TableCell>
              <TableCell>{detalhes}</TableCell>
              <TableCell>{produto.quantidade}</TableCell>
              <TableCell>R$ {((produto.valor_produto + produto.valor_pintura + produto.valor_instalacao)).toFixed(2)}</TableCell>
              <TableCell>
                {produto.tipo_desconto === 'valor' 
                  ? `R$ ${produto.desconto_valor.toFixed(2)}`
                  : `${produto.desconto_percentual}%`
                }
              </TableCell>
              <TableCell className="font-semibold">R$ {valorTotal.toFixed(2)}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemovePorta(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
