import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Package, Check, X, Search, Zap, AlertCircle, ChevronsUpDown, Edit, Copy } from "lucide-react";
import { toast } from "sonner";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEstoque } from "@/hooks/useEstoque";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { expandirPortasPorQuantidade, getLabelPortaExpandida } from "@/utils/expandirPortas";

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

interface ItemPadraoPortaEnrolar {
  id: string;
  nome_produto: string;
  descricao_produto: string | null;
  modulo_calculo: string | null;
  valor_calculo: number | null;
  eixo_calculo: string | null;
  setor_responsavel_producao: string | null;
}

// Função para calcular o tamanho automático
function calcularTamanhoAutomatico(
  item: ItemPadraoPortaEnrolar,
  portaLargura?: number,
  portaAltura?: number
): string | null {
  if (!item.modulo_calculo || !item.valor_calculo || !item.eixo_calculo) {
    return null;
  }

  const eixoValor = item.eixo_calculo === 'largura' ? portaLargura : portaAltura;
  
  if (!eixoValor) return null;

  let tamanhoCalculado: number;
  if (item.modulo_calculo === 'acrescimo') {
    tamanhoCalculado = eixoValor + item.valor_calculo;
  } else {
    tamanhoCalculado = eixoValor - item.valor_calculo;
  }

  return tamanhoCalculado.toFixed(2);
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
  const [produtoSelectOpen, setProdutoSelectOpen] = useState(false);
  const [avisoCalculo, setAvisoCalculo] = useState<string | null>(null);
  const [rascunhoLinha, setRascunhoLinha] = useState({
    produto_venda_id: "",
    estoque_id: "",
    quantidade: 1,
    tamanho: "",
  });

  // Buscar produtos do estoque
  const { produtos } = useEstoque();

  // Buscar portas da venda e expandir por quantidade
  const { data: portasRaw = [] } = useQuery({
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
  
  // Expandir portas por quantidade
  const portas = expandirPortasPorQuantidade(portasRaw);

  // Estado para itens padrão de porta de enrolar
  const [itensPadrao, setItensPadrao] = useState<ItemPadraoPortaEnrolar[]>([]);

  // Buscar itens padrão de porta de enrolar
  useEffect(() => {
    const fetchItensPadrao = async () => {
      if (!temPortasEnrolar || isReadOnly) {
        setItensPadrao([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('estoque')
          .select('id, nome_produto, descricao_produto, modulo_calculo, valor_calculo, eixo_calculo, setor_responsavel_producao')
          .eq('item_padrao_porta_enrolar', true)
          .eq('ativo', true);

        if (error) throw error;
        setItensPadrao(data || []);
      } catch (error) {
        console.error('Erro ao buscar itens padrão:', error);
      }
    };

    fetchItensPadrao();
  }, [temPortasEnrolar, isReadOnly]);

  // Verificar se um item padrão já foi adicionado para uma porta (considerando indice)
  const itemJaAdicionado = (portaOriginalId: string, indicePorta: number, estoqueId: string) => {
    return linhas.some(l => 
      l.produto_venda_id === portaOriginalId && 
      (l.indice_porta ?? 0) === indicePorta &&
      l.estoque_id === estoqueId
    );
  };

  // Função para adicionar item padrão rapidamente
  const handleAdicionarItemPadrao = async (porta: any, item: ItemPadraoPortaEnrolar) => {
    const tamanhoAuto = calcularTamanhoAutomatico(item, porta.largura, porta.altura);
    const categoria = mapearSetorParaCategoria(item.setor_responsavel_producao);
    
    try {
      await onAdicionarLinha({
        produto_venda_id: porta._originalId,
        indice_porta: porta._indicePorta,
        nome_produto: item.nome_produto,
        descricao_produto: item.descricao_produto || "",
        quantidade: 1,
        tamanho: tamanhoAuto || "",
        estoque_id: item.id,
        categoria_linha: categoria,
      });
      toast.success(`${item.nome_produto} adicionado`);
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  // Calcular categoria automaticamente baseada no produto selecionado
  const produtoSelecionado = produtos.find(p => p.id === rascunhoLinha.estoque_id);
  const categoriaAutomatica = produtoSelecionado 
    ? mapearSetorParaCategoria(produtoSelecionado.setor_responsavel_producao)
    : null;

  // Calcular tamanho automaticamente ao selecionar produto e porta
  useEffect(() => {
    setAvisoCalculo(null); // Limpar aviso anterior
    
    if (!rascunhoLinha.estoque_id) return;
    
    const produto = produtos.find(p => p.id === rascunhoLinha.estoque_id);
    if (!produto) return;
    
    // Verificar se o produto tem configuração de cálculo
    if (!produto.modulo_calculo || !produto.valor_calculo || !produto.eixo_calculo) {
      return; // Produto não tem cálculo automático - OK
    }
    
    // Buscar a porta selecionada para obter dimensões
    const porta = portas.find(p => p.id === rascunhoLinha.produto_venda_id);
    if (!porta) {
      setAvisoCalculo(`Selecione uma porta para calcular o tamanho automaticamente.`);
      return;
    }
    
    // Verificar se a porta tem as dimensões necessárias
    const eixoValor = produto.eixo_calculo === 'largura' ? porta.largura : porta.altura;
    
    if (!eixoValor) {
      setAvisoCalculo(`Esta porta não tem ${produto.eixo_calculo} cadastrada. Preencha manualmente.`);
      return;
    }
    
    // Calcular tamanho automaticamente
    const tamanhoAuto = calcularTamanhoAutomatico(
      {
        id: produto.id,
        nome_produto: produto.nome_produto,
        descricao_produto: produto.descricao_produto,
        modulo_calculo: produto.modulo_calculo,
        valor_calculo: produto.valor_calculo,
        eixo_calculo: produto.eixo_calculo,
        setor_responsavel_producao: produto.setor_responsavel_producao,
      },
      porta.largura,
      porta.altura
    );
    
    if (tamanhoAuto) {
      setRascunhoLinha(prev => ({ ...prev, tamanho: tamanhoAuto }));
    }
  }, [rascunhoLinha.estoque_id, rascunhoLinha.produto_venda_id, produtos, portas]);

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
      produto_venda_id: temPortasEnrolar ? parsePortaVirtualKey(rascunhoLinha.produto_venda_id).originalId : undefined,
      indice_porta: temPortasEnrolar ? parsePortaVirtualKey(rascunhoLinha.produto_venda_id).indicePorta : 0,
      estoque_id: rascunhoLinha.estoque_id,
      nome_produto: produtoEstoque.nome_produto,
      descricao_produto: produtoEstoque.descricao_produto,
      quantidade: rascunhoLinha.quantidade,
      tamanho: rascunhoLinha.tamanho || null,
      categoria_linha: categoriaAutomatica,
    };
    
    // Helper para parsear o _virtualKey
    function parsePortaVirtualKey(virtualKey: string): { originalId: string; indicePorta: number } {
      const porta = portas.find(p => p._virtualKey === virtualKey);
      if (porta) {
        return { originalId: porta._originalId, indicePorta: porta._indicePorta };
      }
      return { originalId: virtualKey, indicePorta: 0 };
    }

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
      {/* Sugestões de itens padrão para porta de enrolar */}
      {!isReadOnly && temPortasEnrolar && portas.length > 0 && itensPadrao.length > 0 && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Itens sugeridos (porta de enrolar)</span>
          </div>
          {portas.map((porta, idx) => {
            const itensPadraoDisponiveis = itensPadrao.filter(
              item => !itemJaAdicionado(porta._originalId, porta._indicePorta, item.id)
            );
            
            if (itensPadraoDisponiveis.length === 0) return null;
            
            const portaLabel = getLabelPortaExpandida(idx, porta._totalNoGrupo, porta._indicePorta);
            
            return (
              <div key={porta._virtualKey} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {portaLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {porta.largura}m × {porta.altura}m
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {itensPadraoDisponiveis.map((item) => {
                    const tamanhoPreview = calcularTamanhoAutomatico(item, porta.largura, porta.altura);
                    return (
                      <Button
                        key={item.id}
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() => handleAdicionarItemPadrao(porta, item)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {item.nome_produto}
                        {tamanhoPreview && (
                          <span className="ml-1 text-muted-foreground">({tamanhoPreview}m)</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                const portaReferenciada = portas.find(p => 
                  p._originalId === linha.produto_venda_id && 
                  p._indicePorta === (linha.indice_porta ?? 0)
                );
                const portaIndex = portas.findIndex(p => 
                  p._originalId === linha.produto_venda_id && 
                  p._indicePorta === (linha.indice_porta ?? 0)
                );
                
                return (
                  <tr key={linha.id} className="border-b hover:bg-muted/30 transition-colors">
                    {!isReadOnly && (
                      <td className="p-2 text-xs text-muted-foreground">
                        {portaReferenciada ? (
                          <span className="font-medium">
                            {getLabelPortaExpandida(portaIndex, portaReferenciada._totalNoGrupo, portaReferenciada._indicePorta)}
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
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const produto = produtos.find(p => p.id === linha.estoque_id);
                              const novaLinhaCompleta: PedidoLinhaNova = {
                                produto_venda_id: linha.produto_venda_id || undefined,
                                indice_porta: linha.indice_porta ?? 0,
                                estoque_id: linha.estoque_id || undefined,
                                nome_produto: linha.nome_produto,
                                descricao_produto: linha.descricao_produto || '',
                                quantidade: linha.quantidade,
                                tamanho: linha.tamanho || undefined,
                                categoria_linha: linha.categoria_linha,
                              };
                              try {
                                await onAdicionarLinha(novaLinhaCompleta);
                                toast.success("Linha duplicada com sucesso");
                              } catch (error) {
                                toast.error("Erro ao duplicar linha");
                              }
                            }}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Duplicar linha"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoverLinha(linha.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Remover linha"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                    <Popover open={produtoSelectOpen} onOpenChange={setProdutoSelectOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={produtoSelectOpen}
                          className="h-8 w-full justify-between text-xs"
                        >
                          {rascunhoLinha.estoque_id
                            ? (() => {
                                const produto = produtos.find(p => p.id === rascunhoLinha.estoque_id);
                                return produto ? (
                                  <span className="truncate">
                                    <span className="font-mono text-muted-foreground mr-1">{produto.sku || '-'}</span>
                                    {produto.nome_produto}
                                  </span>
                                ) : "Selecione o produto";
                              })()
                            : "Selecione o produto"}
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar por SKU ou nome..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                            <CommandGroup>
                              {produtos
                                .filter(p => p.ativo)
                                .map((produto) => (
                                  <CommandItem
                                    key={produto.id}
                                    value={`${produto.sku || ''} ${produto.nome_produto}`}
                                    onSelect={() => {
                                      setRascunhoLinha({...rascunhoLinha, estoque_id: produto.id});
                                      setProdutoSelectOpen(false);
                                    }}
                                    className="text-xs justify-start"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-3 w-3",
                                        rascunhoLinha.estoque_id === produto.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono text-[10px]">
                                        {produto.sku || '-'}
                                      </Badge>
                                      <span className="truncate">{produto.nome_produto}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                    <div className="space-y-1">
                      <Input
                        type="text"
                        placeholder="Ex: 100"
                        value={rascunhoLinha.tamanho}
                        onChange={(e) => 
                          setRascunhoLinha({...rascunhoLinha, tamanho: e.target.value})
                        }
                        className="h-8 text-xs"
                      />
                      {avisoCalculo && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{avisoCalculo}</span>
                        </div>
                      )}
                    </div>
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
