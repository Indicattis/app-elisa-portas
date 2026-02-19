import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Package, Check, X, Search, Zap, AlertCircle, ChevronsUpDown, Edit, Copy, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { PortaFolderCard, SemProdutoFolderCard } from "./PortaFolderCard";
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
import { getLabelProdutoExpandido, getLabelTipoProduto } from "@/utils/tipoProdutoLabels";

interface LinhaEditData {
  produto_venda_id?: string | null;
  indice_porta?: number;
  estoque_id?: string;
  nome_produto?: string;
  descricao_produto?: string;
  quantidade?: number;
  tamanho?: string;
  categoria_linha?: CategoriaLinha;
}

interface PedidoLinhasEditorProps {
  linhas: PedidoLinha[];
  isReadOnly: boolean;
  vendaId?: string;
  temPortasEnrolar?: boolean;
  onAdicionarLinha: (linha: PedidoLinhaNova) => Promise<any>;
  onRemoverLinha: (linhaId: string) => Promise<void>;
  onAtualizarLinha?: (linhaId: string, campo: 'quantidade' | 'tamanho', valor: number | string) => void;
  onAtualizarLinhaCompleta?: (linhaId: string, dados: LinhaEditData) => Promise<void>;
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
  vendaId,
  temPortasEnrolar = false,
  onAdicionarLinha,
  onRemoverLinha,
  onAtualizarLinha,
  onAtualizarLinhaCompleta,
}: PedidoLinhasEditorProps) => {
  // Estado local para valores editados (quantidade/tamanho inline)
  const [valoresEditados, setValoresEditados] = useState<Record<string, { quantidade?: number; tamanho?: string }>>({});
  
  // Estado para linha em modo de edição completa
  const [linhaEmEdicao, setLinhaEmEdicao] = useState<string | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState<{
    produto_venda_id: string;
    indice_porta: number;
    estoque_id: string;
  } | null>(null);
  const [buscaEdicao, setBuscaEdicao] = useState("");
  const [popoverEdicaoAberto, setPopoverEdicaoAberto] = useState(false);

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
  
  // Iniciar modo de edição
  const handleIniciarEdicao = (linha: PedidoLinha) => {
    const portaVirtual = portas.find(p => 
      p._originalId === linha.produto_venda_id && 
      p._indicePorta === (linha.indice_porta ?? 0)
    );
    setLinhaEmEdicao(linha.id);
    setDadosEdicao({
      produto_venda_id: portaVirtual?._virtualKey || '_none',
      indice_porta: linha.indice_porta ?? 0,
      estoque_id: linha.estoque_id || '',
    });
    setBuscaEdicao("");
  };
  
  // Cancelar edição
  const handleCancelarEdicao = () => {
    setLinhaEmEdicao(null);
    setDadosEdicao(null);
    setBuscaEdicao("");
    setPopoverEdicaoAberto(false);
  };
  
  // Salvar edição
  const handleSalvarEdicao = async (linhaId: string) => {
    if (!dadosEdicao || !onAtualizarLinhaCompleta) return;
    
    const produtoEstoque = produtos.find(p => p.id === dadosEdicao.estoque_id);
    if (!produtoEstoque) {
      toast.error("Selecione um produto válido");
      return;
    }
    
    // Parse da porta virtual para obter originalId e indice
    const portaSelecionada = portas.find(p => p._virtualKey === dadosEdicao.produto_venda_id);
    const categoria = mapearSetorParaCategoria(produtoEstoque.setor_responsavel_producao);
    
    try {
      await onAtualizarLinhaCompleta(linhaId, {
        produto_venda_id: portaSelecionada?._originalId || null,
        indice_porta: portaSelecionada?._indicePorta ?? 0,
        estoque_id: dadosEdicao.estoque_id,
        nome_produto: produtoEstoque.nome_produto,
        descricao_produto: produtoEstoque.descricao_produto || '',
        categoria_linha: categoria,
      });
      toast.success("Linha atualizada com sucesso");
      handleCancelarEdicao();
    } catch (error) {
      toast.error("Erro ao atualizar linha");
    }
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
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!vendaId,
  });
  
  // Expandir portas por quantidade
  const portasFiltradas = portasRaw.filter(
    (p: any) => p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'porta_social'
  );
  const portas = expandirPortasPorQuantidade(portasFiltradas);

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
    // produto_venda_id é opcional - o usuário pode ou não associar a um item vendido
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
      produto_venda_id: rascunhoLinha.produto_venda_id ? parsePortaVirtualKey(rascunhoLinha.produto_venda_id).originalId : undefined,
      indice_porta: rascunhoLinha.produto_venda_id ? parsePortaVirtualKey(rascunhoLinha.produto_venda_id).indicePorta : 0,
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

  // Estado da pasta aberta
  const [pastaAberta, setPastaAberta] = useState<string | null>(null);

  // Agrupar linhas por porta
  const { gruposOrdenados, semPorta } = useMemo(() => {
    const grupos = new Map<string, { porta: typeof portas[0] | null; portaIndex: number; linhasGrupo: PedidoLinha[] }>();
    const semPortaArr: PedidoLinha[] = [];
    
    // 1. Agrupar linhas existentes por porta
    for (const linha of linhas) {
      if (linha.produto_venda_id) {
        const key = `${linha.produto_venda_id}_${linha.indice_porta ?? 0}`;
        if (!grupos.has(key)) {
          const portaIdx = portas.findIndex(p => 
            p._originalId === linha.produto_venda_id && 
            p._indicePorta === (linha.indice_porta ?? 0)
          );
          const porta = portaIdx >= 0 ? portas[portaIdx] : null;
          grupos.set(key, { porta, portaIndex: portaIdx, linhasGrupo: [] });
        }
        grupos.get(key)!.linhasGrupo.push(linha);
      } else {
        semPortaArr.push(linha);
      }
    }

    // 2. Criar pastas para portas da venda que ainda não têm linhas
    for (let i = 0; i < portas.length; i++) {
      const porta = portas[i];
      const key = `${porta._originalId}_${porta._indicePorta}`;
      if (!grupos.has(key)) {
        grupos.set(key, { porta, portaIndex: i, linhasGrupo: [] });
      }
    }

    return {
      gruposOrdenados: [...grupos.entries()].sort((a, b) => a[1].portaIndex - b[1].portaIndex),
      semPorta: semPortaArr,
    };
  }, [linhas, portas]);

  // Dados da pasta aberta
  const pastaAbertaDados = useMemo(() => {
    if (!pastaAberta) return null;
    if (pastaAberta === '_sem_produto') {
      return { key: '_sem_produto', porta: null, portaIndex: -1, linhasGrupo: semPorta, label: 'Sem produto', dimensoes: '' };
    }
    const grupo = gruposOrdenados.find(([key]) => key === pastaAberta);
    if (!grupo) return null;
    const [key, data] = grupo;
    const p = data.porta;
    const idx = gruposOrdenados.indexOf(grupo);
    const label = p
      ? getLabelProdutoExpandido(data.portaIndex, p.tipo_produto, p.largura, p.altura, p._totalNoGrupo, p._indicePorta)
      : `Item #${idx + 1}`;
    const dimensoes = p?.largura && p?.altura
      ? `${p.largura.toFixed(2)}m × ${p.altura.toFixed(2)}m`
      : '';
    return { key, porta: p, portaIndex: data.portaIndex, linhasGrupo: data.linhasGrupo, label, dimensoes };
  }, [pastaAberta, gruposOrdenados, semPorta]);

  const renderLinha = (linha: PedidoLinha) => {
    const estaEmEdicao = linhaEmEdicao === linha.id;
    return (
      <tr key={linha.id} className={cn(
        "border-b hover:bg-muted/30 transition-colors",
        estaEmEdicao && "bg-primary/5"
      )}>
        <td className="p-2 text-sm font-medium">
          {estaEmEdicao && dadosEdicao ? (
            <div className="space-y-1">
              <Select
                value={dadosEdicao.produto_venda_id}
                onValueChange={(value) => 
                  setDadosEdicao({...dadosEdicao, produto_venda_id: value})
                }
              >
                <SelectTrigger className="h-8 text-xs w-full mb-1">
                  <SelectValue placeholder="Produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhuma</SelectItem>
                  {portas.map((porta, idx) => (
                    <SelectItem key={porta._virtualKey} value={porta._virtualKey}>
                      {getLabelProdutoExpandido(idx, porta.tipo_produto, porta.largura, porta.altura, porta._totalNoGrupo, porta._indicePorta)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover open={popoverEdicaoAberto} onOpenChange={setPopoverEdicaoAberto}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="h-8 w-full justify-between text-xs"
                  >
                    {dadosEdicao.estoque_id
                      ? produtos.find(p => p.id === dadosEdicao.estoque_id)?.nome_produto || "Selecione..."
                      : "Selecione um produto"}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar produto..." 
                      value={buscaEdicao}
                      onValueChange={setBuscaEdicao}
                      className="text-xs"
                    />
                    <CommandList>
                      <CommandEmpty className="text-xs p-2">Nenhum produto encontrado.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-48">
                          {produtos
                            .filter(p => 
                              p.nome_produto.toLowerCase().includes(buscaEdicao.toLowerCase()) ||
                              (p.sku && p.sku.toLowerCase().includes(buscaEdicao.toLowerCase()))
                            )
                            .map((produto) => (
                              <CommandItem
                                key={produto.id}
                                value={produto.id}
                                onSelect={() => {
                                  setDadosEdicao({...dadosEdicao, estoque_id: produto.id});
                                  setPopoverEdicaoAberto(false);
                                  setBuscaEdicao("");
                                }}
                                className="text-xs"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3 w-3",
                                    dadosEdicao.estoque_id === produto.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{produto.nome_produto}</span>
                                  {produto.sku && (
                                    <span className="text-muted-foreground text-[10px]">SKU: {produto.sku}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            linha.descricao_produto || linha.nome_produto
          )}
        </td>
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
        {!isReadOnly && (
          <td className="p-2 text-center">
            <div className="flex gap-1 justify-center">
              {estaEmEdicao ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => handleSalvarEdicao(linha.id)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-500/10" title="Salvar alterações">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancelarEdicao}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted" title="Cancelar edição">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  {onAtualizarLinhaCompleta && (
                    <Button variant="ghost" size="sm" onClick={() => handleIniciarEdicao(linha)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10" title="Editar porta e produto">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm"
                    onClick={async () => {
                      try {
                        await onAdicionarLinha({
                          produto_venda_id: linha.produto_venda_id || undefined,
                          indice_porta: linha.indice_porta ?? 0,
                          estoque_id: linha.estoque_id || undefined,
                          nome_produto: linha.nome_produto,
                          descricao_produto: linha.descricao_produto || '',
                          quantidade: linha.quantidade,
                          tamanho: linha.tamanho || undefined,
                          categoria_linha: linha.categoria_linha,
                        });
                        toast.success("Linha duplicada com sucesso");
                      } catch (error) {
                        toast.error("Erro ao duplicar linha");
                      }
                    }}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10" title="Duplicar linha">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onRemoverLinha(linha.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Remover linha">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </td>
        )}
      </tr>
    );
  };

  const renderNovaLinhaForm = () => {
    if (!novaLinha || isReadOnly) return null;
    return (
      <tr className="border-b bg-muted/20">
        <td className="p-2">
          <div className="space-y-1">
            <Select
              value={rascunhoLinha.produto_venda_id}
              onValueChange={(value) => 
                setRascunhoLinha({...rascunhoLinha, produto_venda_id: value})
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {portas.map((porta, idx) => (
                  <SelectItem key={porta._virtualKey} value={porta._virtualKey}>
                    {getLabelProdutoExpandido(idx, porta.tipo_produto, porta.largura, porta.altura, porta._totalNoGrupo, porta._indicePorta)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
    );
  };

  const renderLinhasTable = (linhasParaMostrar: PedidoLinha[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-xs">
              <th className="text-left p-2 font-medium text-muted-foreground">Produto</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Categoria</th>
              <th className="text-center p-2 font-medium text-muted-foreground w-20">Qtd</th>
              <th className="text-center p-2 font-medium text-muted-foreground w-24">Tamanho</th>
              {!isReadOnly && (
                <th className="text-center p-2 font-medium text-muted-foreground w-20">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {linhasParaMostrar.map(renderLinha)}
            {renderNovaLinhaForm()}
          </tbody>
        </table>
      </div>
    );
  };

  // Itens padrão sugeridos para a pasta aberta
  const renderSugestoesPasta = () => {
    if (isReadOnly || !temPortasEnrolar || !pastaAbertaDados || !pastaAbertaDados.porta || itensPadrao.length === 0) return null;
    
    const porta = pastaAbertaDados.porta;
    const itensPadraoDisponiveis = itensPadrao.filter(
      item => !itemJaAdicionado(porta._originalId, porta._indicePorta, item.id)
    );
    
    if (itensPadraoDisponiveis.length === 0) return null;

    return (
      <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">Itens sugeridos</span>
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
  };

  if (linhas.length === 0 && !novaLinha) {
    return (
      <div className="space-y-3">
        <Card className="p-6 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum produto adicionado ao pedido</p>
          {!isReadOnly && <p className="text-sm mt-1">Clique no botão abaixo para adicionar produtos</p>}
        </Card>
        {!isReadOnly && (
          <Button variant="outline" className="w-full" onClick={() => setNovaLinha(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Grid de pastas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {gruposOrdenados.map(([key, grupo]) => {
          const p = grupo.porta;
          const label = p
            ? getLabelProdutoExpandido(grupo.portaIndex, p.tipo_produto, p.largura, p.altura, p._totalNoGrupo, p._indicePorta)
            : `Item`;
          const dimensoes = p?.largura && p?.altura
            ? `${p.largura.toFixed(2)}m × ${p.altura.toFixed(2)}m`
            : undefined;
          const categorias = grupo.linhasGrupo.map(l => l.categoria_linha);

          return (
            <PortaFolderCard
              key={key}
              label={label}
              dimensoes={dimensoes}
              linhasCount={grupo.linhasGrupo.length}
              categorias={categorias}
              isOpen={pastaAberta === key}
              onClick={() => setPastaAberta(prev => prev === key ? null : key)}
            />
          );
        })}
        {semPorta.length > 0 && (
          <SemProdutoFolderCard
            linhasCount={semPorta.length}
            isOpen={pastaAberta === '_sem_produto'}
            onClick={() => setPastaAberta(prev => prev === '_sem_produto' ? null : '_sem_produto')}
          />
        )}
      </div>

      {/* Pasta expandida */}
      {pastaAbertaDados && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPastaAberta(null)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">{pastaAbertaDados.label}</span>
              {pastaAbertaDados.dimensoes && (
                <span className="text-xs text-muted-foreground">{pastaAbertaDados.dimensoes}</span>
              )}
            </div>
            {!isReadOnly && !novaLinha && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setNovaLinha(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            )}
          </div>
          <div className="p-2 space-y-2">
            {renderSugestoesPasta()}
            {pastaAbertaDados.linhasGrupo.length > 0 || novaLinha ? (
              renderLinhasTable(pastaAbertaDados.linhasGrupo)
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhuma linha nesta pasta
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulário de nova linha quando nenhuma pasta aberta */}
      {!isReadOnly && novaLinha && !pastaAberta && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b">
            <span className="text-sm font-semibold">Novo item</span>
          </div>
          <div className="p-2">
            {renderLinhasTable([])}
          </div>
        </div>
      )}

      {/* Botão global de adicionar (quando nenhuma pasta aberta) */}
      {!isReadOnly && !novaLinha && !pastaAberta && (
        <Button variant="outline" className="w-full" onClick={() => setNovaLinha(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      )}
    </div>
  );
};
