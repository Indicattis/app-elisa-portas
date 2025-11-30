import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Package, Check, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PedidoLinha, PedidoLinhaNova, CategoriaLinha } from "@/hooks/usePedidoLinhas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEstoque } from "@/hooks/useEstoque";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PedidoLinhasEditorProps {
  linhas: PedidoLinha[];
  isReadOnly: boolean;
  todasOrdensConcluidas?: boolean;
  vendaId?: string;
  temPortasEnrolar?: boolean;
  onAdicionarLinha: (linha: PedidoLinhaNova) => Promise<any>;
  onRemoverLinha: (linhaId: string) => Promise<void>;
  onAtualizarCheckbox?: (linhaId: string, campo: string, valor: boolean) => Promise<void>;
  onAtualizarLinha?: (linhaId: string, campo: 'quantidade' | 'tamanho', valor: number | string) => void;
}

// Mapeamento de setor para categoria
const mapearSetorParaCategoria = (setor: string | null): CategoriaLinha => {
  if (!setor) return 'separacao';
  
  const mapeamento: Record<string, CategoriaLinha> = {
    'perfiladeira': 'perfiladeira',
    'soldagem': 'solda',
    'separacao': 'separacao',
    'pintura': 'separacao',
  };
  
  return mapeamento[setor] || 'separacao';
};

// Função para obter classes de cor baseadas na categoria
const getCategoriaBadgeClasses = (categoria: string | null): string => {
  if (!categoria) return '';
  
  const cores: Record<string, string> = {
    'separacao': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    'perfiladeira': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    'solda': 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  };
  
  return cores[categoria] || '';
};

export const PedidoLinhasEditor = ({
  linhas,
  isReadOnly,
  todasOrdensConcluidas = false,
  vendaId,
  temPortasEnrolar = false,
  onAdicionarLinha,
  onRemoverLinha,
  onAtualizarCheckbox,
  onAtualizarLinha,
}: PedidoLinhasEditorProps) => {
  // Estado local para valores editados
  const [valoresEditados, setValoresEditados] = useState<Record<string, { quantidade?: number; tamanho?: string }>>({});

  const handleLinhaChange = (linhaId: string, campo: 'quantidade' | 'tamanho', valor: number | string) => {
    setValoresEditados(prev => ({
      ...prev,
      [linhaId]: {
        ...prev[linhaId],
        [campo]: valor,
      }
    }));
    
    if (onAtualizarLinha) {
      onAtualizarLinha(linhaId, campo, valor);
    }
  };

  const getValorEditado = (linha: PedidoLinha, campo: 'quantidade' | 'tamanho') => {
    const editado = valoresEditados[linha.id];
    if (editado && editado[campo] !== undefined) {
      return editado[campo];
    }
    return campo === 'quantidade' ? linha.quantidade : linha.tamanho;
  };
  const [novaLinha, setNovaLinha] = useState(false);
  const [buscaSku, setBuscaSku] = useState("");
  const [popoverAberto, setPopoverAberto] = useState(false);
  const [rascunhoLinha, setRascunhoLinha] = useState({
    produto_venda_id: "",
    estoque_id: "",
    quantidade: 1,
    tamanho: "",
  });

  // Buscar produtos do estoque
  const { produtos } = useEstoque();

  // Buscar portas da venda
  const { data: portas = [] } = useQuery({
    queryKey: ['produtos-venda-portas', vendaId],
    queryFn: async () => {
      if (!vendaId) return [];
      const { data, error } = await supabase
        .from('produtos_vendas')
        .select('*')
        .eq('venda_id', vendaId)
        .ilike('tipo_produto', '%porta%')
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!vendaId && !isReadOnly,
  });

  // Calcular categoria automaticamente baseada no produto selecionado
  const produtoSelecionado = produtos.find(p => p.id === rascunhoLinha.estoque_id);
  const categoriaAutomatica = produtoSelecionado 
    ? mapearSetorParaCategoria(produtoSelecionado.setor_responsavel_producao)
    : null;

  const handleSalvarNovaLinha = async () => {
    // Validações
    // produto_venda_id só é obrigatório se há portas enrolar
    if (temPortasEnrolar && !rascunhoLinha.produto_venda_id) {
      return;
    }
    if (!rascunhoLinha.estoque_id) {
      return;
    }
    if (rascunhoLinha.quantidade <= 0) {
      return;
    }
    if (!categoriaAutomatica) {
      return;
    }

    const produtoEstoque = produtos.find(p => p.id === rascunhoLinha.estoque_id);
    if (!produtoEstoque) return;

    const novaLinhaCompleta: PedidoLinhaNova = {
      produto_venda_id: temPortasEnrolar ? rascunhoLinha.produto_venda_id : undefined,
      estoque_id: rascunhoLinha.estoque_id,
      nome_produto: produtoEstoque.nome_produto,
      descricao_produto: produtoEstoque.descricao_produto,
      quantidade: rascunhoLinha.quantidade,
      tamanho: rascunhoLinha.tamanho || null,
      categoria_linha: categoriaAutomatica,
    };

    await onAdicionarLinha(novaLinhaCompleta);
    
    // Resetar formulário
    setRascunhoLinha({
      produto_venda_id: "",
      estoque_id: "",
      quantidade: 1,
      tamanho: "",
    });
    setBuscaSku("");
    setPopoverAberto(false);
    setNovaLinha(false);
  };

  const handleCancelarNovaLinha = () => {
    setRascunhoLinha({
      produto_venda_id: "",
      estoque_id: "",
      quantidade: 1,
      tamanho: "",
    });
    setBuscaSku("");
    setPopoverAberto(false);
    setNovaLinha(false);
  };

  const handleCheckboxChange = async (linhaId: string, campo: string, checked: boolean) => {
    if (onAtualizarCheckbox) {
      await onAtualizarCheckbox(linhaId, campo, checked);
    }
  };

  return (
    <div className="space-y-3">
      {(linhas.length > 0 || novaLinha) ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs">
                {!isReadOnly && <th className="text-left p-2 font-medium text-muted-foreground w-32">Porta</th>}
                <th className="text-left p-2 font-medium text-muted-foreground">Produto</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Categoria</th>
                <th className="text-center p-2 font-medium text-muted-foreground w-20">Qtd</th>
                <th className="text-center p-2 font-medium text-muted-foreground w-24">Tamanho</th>
                {todasOrdensConcluidas && onAtualizarCheckbox && (
                  <th className="text-center p-2 font-medium text-muted-foreground">Checkboxes</th>
                )}
                {!isReadOnly && (
                  <th className="text-center p-2 font-medium text-muted-foreground w-20">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => {
                const portaReferenciada = portas.find(p => p.id === linha.produto_venda_id);
                const portaIndex = portas.findIndex(p => p.id === linha.produto_venda_id);
                
                return (
                  <tr key={linha.id} className="border-b hover:bg-muted/30 transition-colors">
                    {!isReadOnly && (
                      <td className="p-2 text-xs text-muted-foreground">
                        {portaReferenciada ? (
                          <span className="font-medium">
                            Porta #{portaIndex + 1}
                          </span>
                        ) : '-'}
                      </td>
                    )}
                    <td className="p-2 text-sm font-medium">{linha.descricao_produto || linha.nome_produto}</td>
                    <td className="p-2">
                      <Badge variant="outline" className={`text-xs ${getCategoriaBadgeClasses(linha.categoria_linha)}`}>
                        {linha.categoria_linha || '-'}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      {!isReadOnly ? (
                        <Input
                          type="number"
                          min="1"
                          value={getValorEditado(linha, 'quantidade') as number}
                          onChange={(e) => handleLinhaChange(linha.id, 'quantidade', parseInt(e.target.value) || 1)}
                          className="h-7 w-16 text-xs text-center"
                        />
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {linha.quantidade}x
                        </Badge>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {!isReadOnly ? (
                        <Input
                          type="text"
                          placeholder="Tamanho"
                          value={getValorEditado(linha, 'tamanho') as string || ''}
                          onChange={(e) => handleLinhaChange(linha.id, 'tamanho', e.target.value)}
                          className="h-7 w-20 text-xs text-center"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">{linha.tamanho || '-'}</span>
                      )}
                    </td>
                  {todasOrdensConcluidas && onAtualizarCheckbox && (
                    <td className="p-2">
                      <div className="flex gap-3 items-center justify-center">
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`sep-${linha.id}`}
                            checked={linha.check_separacao}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(linha.id, "check_separacao", checked as boolean)
                            }
                          />
                          <Label htmlFor={`sep-${linha.id}`} className="text-xs cursor-pointer">
                            Sep
                          </Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`qua-${linha.id}`}
                            checked={linha.check_qualidade}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(linha.id, "check_qualidade", checked as boolean)
                            }
                          />
                          <Label htmlFor={`qua-${linha.id}`} className="text-xs cursor-pointer">
                            Qual
                          </Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`col-${linha.id}`}
                            checked={linha.check_coleta}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(linha.id, "check_coleta", checked as boolean)
                            }
                          />
                          <Label htmlFor={`col-${linha.id}`} className="text-xs cursor-pointer">
                            Col
                          </Label>
                        </div>
                      </div>
                    </td>
                  )}
                    {!isReadOnly && (
                      <td className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoverLinha(linha.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
              
              {/* Linha de edição inline para novo produto */}
              {novaLinha && !isReadOnly && (
                <tr className="border-b bg-muted/20">
                  <td className="p-2">
                    <Select
                      value={rascunhoLinha.produto_venda_id}
                      onValueChange={(value) => 
                        setRascunhoLinha({...rascunhoLinha, produto_venda_id: value})
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={temPortasEnrolar ? "Selecione a porta" : "Porta (opcional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {portas.map((porta, idx) => (
                          <SelectItem key={porta.id} value={porta.id}>
                            Porta #{idx + 1} {porta.tamanho && `- ${porta.tamanho}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Select
                        value={rascunhoLinha.estoque_id}
                        onValueChange={(value) => 
                          setRascunhoLinha({...rascunhoLinha, estoque_id: value})
                        }
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos
                            .filter(p => p.ativo)
                            .map((produto) => (
                              <SelectItem key={produto.id} value={produto.id}>
                                <span className="font-mono text-muted-foreground mr-2">{produto.sku || '-'}</span>
                                {produto.nome_produto}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Popover open={popoverAberto} onOpenChange={setPopoverAberto}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                            <Search className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2" align="end">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar por SKU ou nome..."
                                value={buscaSku}
                                onChange={(e) => setBuscaSku(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <ScrollArea className="h-48">
                              <div className="space-y-1">
                                {produtos
                                  .filter(p => p.ativo)
                                  .filter(p => 
                                    !buscaSku || 
                                    p.sku?.toLowerCase().includes(buscaSku.toLowerCase()) ||
                                    p.nome_produto.toLowerCase().includes(buscaSku.toLowerCase())
                                  )
                                  .map((produto) => (
                                    <button
                                      key={produto.id}
                                      type="button"
                                      className="w-full text-left p-2 rounded hover:bg-accent text-xs transition-colors"
                                      onClick={() => {
                                        setRascunhoLinha({...rascunhoLinha, estoque_id: produto.id});
                                        setPopoverAberto(false);
                                        setBuscaSku("");
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                          {produto.sku || '-'}
                                        </Badge>
                                        <span className="truncate">{produto.nome_produto}</span>
                                      </div>
                                      {produto.descricao_produto && (
                                        <p className="text-muted-foreground text-[10px] truncate mt-0.5">
                                          {produto.descricao_produto}
                                        </p>
                                      )}
                                    </button>
                                  ))}
                                {produtos.filter(p => p.ativo).filter(p => 
                                  !buscaSku || 
                                  p.sku?.toLowerCase().includes(buscaSku.toLowerCase()) ||
                                  p.nome_produto.toLowerCase().includes(buscaSku.toLowerCase())
                                ).length === 0 && (
                                  <p className="text-center text-xs text-muted-foreground py-4">
                                    Nenhum produto encontrado
                                  </p>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge variant="outline" className={`text-xs ${getCategoriaBadgeClasses(categoriaAutomatica)}`}>
                      {categoriaAutomatica || '-'}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="1"
                      value={rascunhoLinha.quantidade}
                      onChange={(e) => 
                        setRascunhoLinha({...rascunhoLinha, quantidade: parseInt(e.target.value) || 1})
                      }
                      className="h-8 text-xs text-center"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      placeholder="Ex: 100"
                      value={rascunhoLinha.tamanho}
                      onChange={(e) => 
                        setRascunhoLinha({...rascunhoLinha, tamanho: e.target.value})
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  {todasOrdensConcluidas && onAtualizarCheckbox && (
                    <td className="p-2"></td>
                  )}
                  <td className="p-2">
                    <div className="flex gap-1 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSalvarNovaLinha}
                        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        disabled={(temPortasEnrolar && !rascunhoLinha.produto_venda_id) || !rascunhoLinha.estoque_id}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelarNovaLinha}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="p-6 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum produto adicionado ao pedido</p>
          {!isReadOnly && <p className="text-sm mt-1">Clique no botão abaixo para adicionar produtos</p>}
        </Card>
      )}

      {!isReadOnly && !novaLinha && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setNovaLinha(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      )}
    </div>
  );
};
