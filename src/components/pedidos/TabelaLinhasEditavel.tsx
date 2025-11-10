import { Input } from "@/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, ChevronDown } from "lucide-react";
import type { PedidoLinha, PedidoLinhaUpdate, CategoriaLinha } from "@/hooks/usePedidoLinhas";
import { useEstoque } from "@/hooks/useEstoque";

interface TabelaLinhasEditavelProps {
  linhas: PedidoLinha[];
  isReadOnly: boolean;
  onRemover: (id: string) => void;
  onChange: (linhasEditadas: Map<string, PedidoLinhaUpdate>) => void;
  linhasEditadas: Map<string, PedidoLinhaUpdate>;
}

export function TabelaLinhasEditavel({
  linhas,
  isReadOnly,
  onRemover,
  onChange,
  linhasEditadas,
}: TabelaLinhasEditavelProps) {
  const { produtos: todosProdutosEstoque } = useEstoque();

  if (linhas.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        Nenhum item adicionado nesta categoria
      </div>
    );
  }

  const handleCampoChange = (
    linhaId: string,
    campo: keyof PedidoLinhaUpdate,
    valor: any
  ) => {
    const novoMapa = new Map(linhasEditadas);
    const linhaAtual = novoMapa.get(linhaId) || { id: linhaId };
    
    novoMapa.set(linhaId, {
      ...linhaAtual,
      [campo]: valor,
    });
    
    onChange(novoMapa);
  };

  const handleTrocarProduto = (
    linhaId: string,
    novoProdutoId: string,
    novoProdutoNome: string,
    novoProdutoDescricao: string | null,
    novoSetorProducao: string | null
  ) => {
    const novoMapa = new Map(linhasEditadas);
    const linhaAtual = novoMapa.get(linhaId) || { id: linhaId };
    
    novoMapa.set(linhaId, {
      ...linhaAtual,
      estoque_id: novoProdutoId,
      nome_produto: novoProdutoNome,
      descricao_produto: novoProdutoDescricao,
      tipo_ordem: novoSetorProducao,
    });
    
    onChange(novoMapa);
  };

  const getValorEditado = (linhaId: string, campo: keyof PedidoLinha) => {
    const edicao = linhasEditadas.get(linhaId);
    if (edicao && campo in edicao) {
      return edicao[campo as keyof PedidoLinhaUpdate];
    }
    return linhas.find(l => l.id === linhaId)?.[campo];
  };

  const getProdutosDoSetor = (categoriaLinha: CategoriaLinha) => {
    return todosProdutosEstoque.filter(
      p => p.setor_responsavel_producao === categoriaLinha
    );
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Produto</TableHead>
            <TableHead className="w-[20%] text-center">Tamanho</TableHead>
            <TableHead className="w-[12%] text-center">Qtd</TableHead>
            <TableHead className="w-[18%]">Tipo Ordem</TableHead>
            <TableHead className="w-[20%] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((linha) => {
            const tamanho = getValorEditado(linha.id, 'tamanho') as string | null;
            const quantidade = getValorEditado(linha.id, 'quantidade') as number;
            const nomeProduto = getValorEditado(linha.id, 'nome_produto') as string;
            const descricaoProduto = getValorEditado(linha.id, 'descricao_produto') as string | null;
            const tipoOrdem = getValorEditado(linha.id, 'tipo_ordem') as string | null;

            const produtosSetor = getProdutosDoSetor(linha.categoria_linha);
            const temProdutosAlternativos = produtosSetor.length > 1;

            return (
              <TableRow key={linha.id}>
                {/* Produto com Popover para troca */}
                <TableCell>
                  {isReadOnly ? (
                    <div>
                      <p className="font-medium text-sm">{nomeProduto}</p>
                      {descricaoProduto && (
                        <p className="text-xs text-muted-foreground">
                          {descricaoProduto}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 hover:bg-accent justify-start w-full"
                          disabled={!temProdutosAlternativos}
                        >
                          <div className="flex items-center gap-1 text-left w-full">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{nomeProduto}</p>
                              {descricaoProduto && (
                                <p className="text-xs text-muted-foreground">
                                  {descricaoProduto}
                                </p>
                              )}
                            </div>
                            {temProdutosAlternativos && (
                              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                            )}
                          </div>
                        </Button>
                      </PopoverTrigger>
                      {temProdutosAlternativos && (
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold mb-2">
                              Produtos do setor {linha.categoria_linha}
                            </p>
                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {produtosSetor.map((prod) => (
                                <Button
                                  key={prod.id}
                                  variant={prod.id === linha.estoque_id ? "secondary" : "ghost"}
                                  className="w-full justify-start h-auto py-2 px-2"
                                  onClick={() => {
                                    handleTrocarProduto(
                                      linha.id,
                                      prod.id,
                                      prod.nome_produto,
                                      prod.descricao_produto,
                                      prod.setor_responsavel_producao
                                    );
                                  }}
                                >
                                  <div className="text-left">
                                    <p className="text-sm font-medium">{prod.nome_produto}</p>
                                    {prod.descricao_produto && (
                                      <p className="text-xs text-muted-foreground">
                                        {prod.descricao_produto}
                                      </p>
                                    )}
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      )}
                    </Popover>
                  )}
                </TableCell>

                {/* Tamanho */}
                <TableCell>
                  {isReadOnly ? (
                    <p className="text-center text-sm">
                      {tamanho ? parseFloat(tamanho).toFixed(2) : '—'}
                    </p>
                  ) : (
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={tamanho || ''}
                      onChange={(e) =>
                        handleCampoChange(
                          linha.id,
                          'tamanho',
                          e.target.value || null
                        )
                      }
                      className="h-8 text-center"
                      placeholder="0.00"
                    />
                  )}
                </TableCell>

                {/* Quantidade */}
                <TableCell>
                  {isReadOnly ? (
                    <Badge variant="secondary" className="mx-auto block w-fit">
                      {quantidade}x
                    </Badge>
                  ) : (
                    <Input
                      type="number"
                      min="1"
                      value={quantidade}
                      onChange={(e) =>
                        handleCampoChange(
                          linha.id,
                          'quantidade',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="h-8 text-center"
                    />
                  )}
                </TableCell>

                {/* Tipo de Ordem */}
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {tipoOrdem || linha.categoria_linha}
                  </Badge>
                </TableCell>

                {/* Ações */}
                <TableCell className="text-right">
                  {!isReadOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemover(linha.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
