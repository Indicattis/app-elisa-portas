import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, X } from 'lucide-react';
import { ProdutoVenda } from '@/hooks/useVendas';
import { useCatalogoCores } from '@/hooks/useCatalogoCores';

interface ProdutosVendaTableProps {
  produtos: ProdutoVenda[];
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
    case 'instalacao': return 'Instalação';
    // Retrocompatibilidade
    case 'porta': return 'Porta de Enrolar';
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
    case 'instalacao': return 'secondary';
    // Retrocompatibilidade
    case 'porta': return 'default';
    default: return 'default';
  }
};

export function ProdutosVendaTable({ produtos, onRemoveProduto, onEditProduto, onUpdateQuantidade, onRemoverDesconto }: ProdutosVendaTableProps) {
  const { cores } = useCatalogoCores();

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
          <TableHead>Cor</TableHead>
          <TableHead>Qtd</TableHead>
          <TableHead>Valor Unit.</TableHead>
          <TableHead>Desconto</TableHead>
          <TableHead>Total</TableHead>
          <TableHead className="w-[120px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {produtos.map((produto, index) => {
          const valorBase = (produto.valor_produto + produto.valor_pintura + produto.valor_instalacao) * produto.quantidade;
          const descontoAplicado = produto.tipo_desconto === 'valor' 
            ? produto.desconto_valor 
            : valorBase * (produto.desconto_percentual / 100);
          const valorTotal = valorBase - descontoAplicado;
          
          // Priorizar largura x altura sobre tamanho (para novos registros)
          const detalhes = (produto.tipo_produto === 'porta_enrolar' || produto.tipo_produto === 'porta_social' || produto.tipo_produto === 'porta')
            ? (produto.largura && produto.altura ? `${Number(produto.largura).toFixed(2)}m x ${Number(produto.altura).toFixed(2)}m` : produto.tamanho)
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
                {(() => {
                  const cor = produto.cor_id ? cores.find(c => c.id === produto.cor_id) : null;
                  if (!cor) return <span className="text-muted-foreground">-</span>;
                  return (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border border-border"
                        style={{ backgroundColor: cor.codigo_hex }}
                      />
                      <span className="text-sm">{cor.nome}</span>
                    </div>
                  );
                })()}
              </TableCell>
              <TableCell>
                {onUpdateQuantidade ? (
                  (() => {
                    const permiteDecimal = produto.unidade?.toLowerCase() === 'metro' || 
                                          produto.unidade?.toLowerCase() === 'kg' || 
                                          produto.unidade?.toLowerCase() === 'litro';
                    return (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={permiteDecimal ? "0.01" : "1"}
                          step={permiteDecimal ? "0.01" : "1"}
                          value={produto.quantidade}
                          onChange={(e) => {
                            const novaQtd = parseFloat(e.target.value);
                            if (novaQtd >= 0.01) {
                              onUpdateQuantidade(index, novaQtd);
                            }
                          }}
                          className="w-20"
                        />
                        {produto.unidade && produto.unidade !== 'Unitário' && (
                          <span className="text-xs text-muted-foreground">
                            {produto.unidade === 'Metro' ? 'm' : produto.unidade.toLowerCase()}
                          </span>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <span>
                    {produto.quantidade}
                    {produto.unidade && produto.unidade !== 'Unitário' && (
                      <span className="text-xs text-muted-foreground ml-1">
                        {produto.unidade === 'Metro' ? 'm' : produto.unidade.toLowerCase()}
                      </span>
                    )}
                  </span>
                )}
              </TableCell>
              <TableCell>R$ {((produto.valor_produto + produto.valor_pintura + produto.valor_instalacao)).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <span>
                    {produto.tipo_desconto === 'valor' 
                      ? `R$ ${produto.desconto_valor.toFixed(2)}`
                      : `${produto.desconto_percentual}%`
                    }
                  </span>
                  {onRemoverDesconto && (produto.desconto_valor > 0 || produto.desconto_percentual > 0) && (
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
