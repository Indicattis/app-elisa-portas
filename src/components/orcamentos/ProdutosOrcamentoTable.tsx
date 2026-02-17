import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, X } from 'lucide-react';
import { OrcamentoProduto } from '@/types/produto';

interface ProdutosOrcamentoTableProps {
  produtos: OrcamentoProduto[];
  onRemoveProduto: (index: number) => void;
  onEditProduto?: (index: number) => void;
  onUpdateQuantidade?: (index: number, quantidade: number) => void;
  onRemoverDesconto?: (index: number) => void;
}

const getTipoProdutoLabel = (tipo: string) => {
  switch (tipo) {
    case 'porta_enrolar': return 'Porta de Enrolar';
    case 'porta_social': return 'Porta Social';
    case 'pintura_epoxi': return 'Pintura Eletrostática';
    case 'acessorio': return 'Acessório';
    case 'adicional': return 'Adicional';
    case 'manutencao': return 'Manutenção';
    default: return tipo;
  }
};

const getTipoProdutoVariant = (tipo: string): "default" | "secondary" | "outline" | "destructive" => {
  switch (tipo) {
    case 'porta_enrolar': return 'default';
    case 'porta_social': return 'default';
    case 'pintura_epoxi': return 'destructive';
    case 'acessorio': return 'secondary';
    case 'adicional': return 'outline';
    case 'manutencao': return 'secondary';
    default: return 'default';
  }
};

export function ProdutosOrcamentoTable({ 
  produtos, 
  onRemoveProduto, 
  onEditProduto, 
  onUpdateQuantidade, 
  onRemoverDesconto 
}: ProdutosOrcamentoTableProps) {
  if (produtos.length === 0) {
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
          <TableHead className="w-[120px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {produtos.map((produto, index) => {
          const valorBase = (produto.valor + (produto.preco_instalacao || 0)) * (produto.quantidade || 1);
          const descontoAplicado = produto.tipo_desconto === 'valor' 
            ? (produto.desconto_valor || 0)
            : valorBase * ((produto.desconto_percentual || 0) / 100);
          const valorTotal = valorBase - descontoAplicado;
          
          // Priorizar largura x altura sobre medidas (para novos registros)
          const detalhes = (produto.tipo_produto === 'porta_enrolar' || produto.tipo_produto === 'porta_social')
            ? (produto.largura && produto.altura ? `${Number(produto.largura).toFixed(2)}m x ${Number(produto.altura).toFixed(2)}m` : produto.medidas)
            : produto.descricao || '-';
          
          return (
            <TableRow key={index}>
              <TableCell>
                <Badge variant={getTipoProdutoVariant(produto.tipo_produto)}>
                  {getTipoProdutoLabel(produto.tipo_produto)}
                </Badge>
              </TableCell>
              <TableCell>{detalhes}</TableCell>
              <TableCell>
                {onUpdateQuantidade ? (
                  <Input
                    type="number"
                    min="1"
                    value={produto.quantidade || 1}
                    onChange={(e) => {
                      const novaQtd = parseInt(e.target.value);
                      if (novaQtd >= 1) {
                        onUpdateQuantidade(index, novaQtd);
                      }
                    }}
                    className="w-20"
                  />
                ) : (
                  produto.quantidade || 1
                )}
              </TableCell>
              <TableCell>R$ {(produto.valor + (produto.preco_instalacao || 0)).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <span>
                    {produto.tipo_desconto === 'valor' 
                      ? `R$ ${(produto.desconto_valor || 0).toFixed(2)}`
                      : `${produto.desconto_percentual || 0}%`
                    }
                  </span>
                  {onRemoverDesconto && ((produto.desconto_valor || 0) > 0 || (produto.desconto_percentual || 0) > 0) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onRemoverDesconto(index)}
                      title="Remover desconto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-semibold">R$ {valorTotal.toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {onEditProduto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditProduto(index)}
                      title="Editar produto"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveProduto(index)}
                    title="Remover produto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}