import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Package, Paintbrush, ArrowLeft } from 'lucide-react';
import { useCatalogoCores } from '@/hooks/useCatalogoCores';
import type { ProdutoVenda } from '@/hooks/useVendas';

interface SelecionarAcessoriosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (produtos: ProdutoVenda[]) => void;
}

interface ItemSelecionavel {
  id: string;
  nome: string;
  preco: number;
  tipo: 'acessorio' | 'adicional';
  descricao?: string;
  categoria: string;
  imagem_url?: string;
  unidade?: string;
}

interface PinturaConfig {
  temPintura: boolean;
  cor_id: string;
  valor_pintura: number;
}

type Etapa = 'selecao' | 'pintura';

export function SelecionarAcessoriosModal({
  open,
  onOpenChange,
  onConfirm
}: SelecionarAcessoriosModalProps) {
  const [itensSelecionados, setItensSelecionados] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [etapa, setEtapa] = useState<Etapa>('selecao');
  const [pinturaConfigs, setPinturaConfigs] = useState<Record<string, PinturaConfig>>({});

  const { coresAtivas, isLoading: isLoadingCores } = useCatalogoCores();

  const { data: produtosEstoque = [], isLoading } = useQuery({
    queryKey: ['vendas-catalogo-modal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas_catalogo')
        .select('*')
        .eq('ativo', true)
        .order('destaque', { ascending: false })
        .order('nome_produto');
      
      if (error) throw error;
      return data.map(item => ({
        id: item.id,
        nome: item.nome_produto,
        preco: Number(item.preco_venda),
        tipo: (item.categoria === 'acessório' ? 'acessorio' : 'adicional') as 'acessorio' | 'adicional',
        descricao: item.descricao_produto,
        categoria: item.categoria,
        imagem_url: item.imagem_url,
        unidade: item.unidade || 'Unitário'
      }));
    },
    enabled: open
  });

  const produtosFiltrados = useMemo(() => {
    if (!busca.trim()) return produtosEstoque;
    const termoBusca = busca.toLowerCase().trim();
    return produtosEstoque.filter(item => 
      item.nome.toLowerCase().includes(termoBusca) ||
      item.categoria.toLowerCase().includes(termoBusca)
    );
  }, [produtosEstoque, busca]);

  const itensSelecionadosArray = useMemo(() => 
    produtosEstoque.filter(item => itensSelecionados.has(item.id)),
    [produtosEstoque, itensSelecionados]
  );

  const toggleItem = (itemId: string) => {
    setItensSelecionados(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleAvancar = () => {
    // Initialize pintura configs for selected items
    const configs: Record<string, PinturaConfig> = {};
    itensSelecionadosArray.forEach(item => {
      configs[item.id] = pinturaConfigs[item.id] || {
        temPintura: false,
        cor_id: '',
        valor_pintura: 0
      };
    });
    setPinturaConfigs(configs);
    setEtapa('pintura');
  };

  const handleVoltar = () => {
    setEtapa('selecao');
  };

  const updatePinturaConfig = (itemId: string, updates: Partial<PinturaConfig>) => {
    setPinturaConfigs(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...updates }
    }));
  };

  const handleConfirmar = () => {
    const produtos: ProdutoVenda[] = itensSelecionadosArray.map(item => {
      const pintura = pinturaConfigs[item.id];
      return {
        tipo_produto: item.tipo === 'acessorio' ? 'acessorio' : 'adicional',
        largura: 0,
        altura: 0,
        valor_produto: item.preco,
        valor_pintura: pintura?.temPintura ? pintura.valor_pintura : 0,
        cor_id: pintura?.temPintura && pintura.cor_id ? pintura.cor_id : undefined,
        valor_instalacao: 0,
        valor_frete: 0,
        quantidade: 1,
        descricao: item.nome,
        desconto_valor: 0,
        desconto_percentual: 0,
        tipo_desconto: 'valor' as const,
        vendas_catalogo_id: item.id,
        unidade: item.unidade
      };
    });

    onConfirm(produtos);
    resetState();
  };

  const resetState = () => {
    setItensSelecionados(new Set());
    setBusca('');
    setEtapa('selecao');
    setPinturaConfigs({});
    onOpenChange(false);
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'acessório': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'adicional': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); else onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        {etapa === 'selecao' ? (
          <>
            <DialogHeader>
              <DialogTitle>Catálogo de Produtos</DialogTitle>
              <DialogDescription>
                Selecione os itens que deseja adicionar à venda
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <ScrollArea className="h-[350px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Carregando itens...
                </div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {busca ? (
                    <>
                      Nenhum produto encontrado para "{busca}".
                      <br />
                      <span className="text-xs">Tente outro termo de busca</span>
                    </>
                  ) : (
                    <>
                      Nenhum produto disponível para venda avulsa.
                      <br />
                      <span className="text-xs">Configure produtos no módulo de Estoque</span>
                    </>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-14">Img</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-24">Categoria</TableHead>
                      <TableHead className="text-right w-24">Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosFiltrados.map((item) => (
                      <TableRow 
                        key={item.id} 
                        className="h-[52px] cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => toggleItem(item.id)}
                      >
                        <TableCell className="py-1 px-3">
                          <Checkbox
                            checked={itensSelecionados.has(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          {item.imagem_url ? (
                            <img 
                              src={item.imagem_url} 
                              alt={item.nome}
                              className="w-10 h-10 object-cover rounded-md border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-1 font-medium text-sm">
                          {item.nome}
                        </TableCell>
                        <TableCell className="py-1">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 h-5 ${getCategoriaColor(item.categoria)}`}
                          >
                            {item.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1 text-right font-semibold text-primary text-sm">
                          R$ {item.preco.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={resetState}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAvancar}
                disabled={itensSelecionados.size === 0}
              >
                Avançar {itensSelecionados.size > 0 && `(${itensSelecionados.size})`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5 text-primary" />
                Configurar Pintura
              </DialogTitle>
              <DialogDescription>
                Marque os itens que precisam de pintura e configure cor e valor
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[380px]">
              <div className="space-y-3 pr-3">
                {itensSelecionadosArray.map((item) => {
                  const config = pinturaConfigs[item.id];
                  if (!config) return null;

                  return (
                    <div 
                      key={item.id} 
                      className={`rounded-lg border p-3 transition-colors ${
                        config.temPintura ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`pintura-${item.id}`}
                          checked={config.temPintura}
                          onCheckedChange={(checked) => 
                            updatePinturaConfig(item.id, { 
                              temPintura: !!checked,
                              ...(checked ? {} : { cor_id: '', valor_pintura: 0 })
                            })
                          }
                        />
                        <label 
                          htmlFor={`pintura-${item.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium text-sm">{item.nome}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            R$ {item.preco.toFixed(2)}
                          </span>
                        </label>
                        {config.temPintura && (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                            Pintado
                          </Badge>
                        )}
                      </div>

                      {config.temPintura && (
                        <div className="mt-3 grid grid-cols-2 gap-3 pl-7">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Cor</label>
                            <Select
                              value={config.cor_id}
                              onValueChange={(v) => updatePinturaConfig(item.id, { cor_id: v })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Selecione a cor" />
                              </SelectTrigger>
                              <SelectContent>
                                {coresAtivas.map(cor => (
                                  <SelectItem key={cor.id} value={cor.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full border border-border" 
                                        style={{ backgroundColor: cor.codigo_hex }}
                                      />
                                      {cor.nome}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Valor Pintura (R$)</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00"
                              value={config.valor_pintura || ''}
                              onChange={(e) => updatePinturaConfig(item.id, { valor_pintura: Number(e.target.value) })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button variant="ghost" size="sm" onClick={handleVoltar} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmar}>
                  Confirmar
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
