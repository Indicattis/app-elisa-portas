import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, Sparkles } from 'lucide-react';
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
}

export function SelecionarAcessoriosModal({
  open,
  onOpenChange,
  onConfirm
}: SelecionarAcessoriosModalProps) {
  const [itensSelecionados, setItensSelecionados] = useState<Set<string>>(new Set());

  // Buscar produtos do estoque marcados como comercializáveis individualmente
  const { data: produtosEstoque = [], isLoading } = useQuery({
    queryKey: ['estoque-comercializaveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .eq('ativo', true)
        .order('nome_produto');
      
      if (error) throw error;
      return data.map(item => ({
        id: item.id,
        nome: item.nome_produto,
        preco: Number(item.preco_unitario),
        tipo: (item.categoria === 'acessório' ? 'acessorio' : 'adicional') as 'acessorio' | 'adicional',
        descricao: item.descricao_produto,
        categoria: item.categoria
      }));
    },
    enabled: open
  });

  // Separar por tipo para exibição (mantém compatibilidade com acessórios/adicionais)
  const acessorios = produtosEstoque.filter(item => item.categoria === 'acessório');
  const adicionais = produtosEstoque.filter(item => item.categoria === 'adicional');
  const outrosProdutos = produtosEstoque.filter(item => item.categoria !== 'acessório' && item.categoria !== 'adicional');

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

  const handleConfirmar = () => {
    const todosItens: ItemSelecionavel[] = [...acessorios, ...adicionais, ...outrosProdutos];
    const itensSelecionadosArray = todosItens.filter(item => itensSelecionados.has(item.id));
    
    const produtos: ProdutoVenda[] = itensSelecionadosArray.map(item => ({
      tipo_produto: item.tipo === 'acessorio' ? 'acessorio' : 'adicional',
      largura: 0,
      altura: 0,
      cor: '',
      tipo_instalacao: 'sem_instalacao',
      valor_produto: item.preco,
      valor_pintura: 0,
      valor_instalacao: 0,
      valor_frete: 0,
      custo_produto: 0,
      custo_pintura: 0,
      quantidade: 1,
      descricao: item.nome,
      desconto_valor: 0,
      desconto_percentual: 0,
      tipo_desconto: 'valor' as 'valor' | 'percentual',
      estoque_id: item.id
    }));

    onConfirm(produtos);
    setItensSelecionados(new Set());
    onOpenChange(false);
  };

  const handleCancelar = () => {
    setItensSelecionados(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Acessórios e Adicionais</DialogTitle>
          <DialogDescription>
            Selecione os itens que deseja adicionar à venda
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Carregando itens...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Acessórios */}
              {acessorios.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">Acessórios</h3>
                  </div>
                  <div className="space-y-2">
                    {acessorios.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          id={item.id}
                          checked={itensSelecionados.has(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={item.id}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {item.nome}
                          </Label>
                          {item.descricao && (
                            <p className="text-xs text-muted-foreground">
                              {item.descricao}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-primary">
                            R$ {item.preco.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {acessorios.length > 0 && adicionais.length > 0 && <Separator />}

              {/* Adicionais */}
              {adicionais.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">Adicionais</h3>
                  </div>
                  <div className="space-y-2">
                    {adicionais.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          id={item.id}
                          checked={itensSelecionados.has(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={item.id}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {item.nome}
                          </Label>
                          {item.descricao && (
                            <p className="text-xs text-muted-foreground">
                              {item.descricao}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-primary">
                            R$ {item.preco.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outros Produtos */}
              {outrosProdutos.length > 0 && (
                <>
                  {(acessorios.length > 0 || adicionais.length > 0) && <Separator />}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">Outros Produtos</h3>
                    </div>
                    <div className="space-y-2">
                      {outrosProdutos.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={item.id}
                            checked={itensSelecionados.has(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={item.id}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {item.nome}
                            </Label>
                            {item.descricao && (
                              <p className="text-xs text-muted-foreground">
                                {item.descricao}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-primary">
                              R$ {item.preco.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {acessorios.length === 0 && adicionais.length === 0 && outrosProdutos.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto disponível para venda avulsa.
                  <br />
                  <span className="text-xs">Configure produtos no módulo de Estoque</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancelar}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar}
            disabled={itensSelecionados.size === 0}
          >
            Adicionar {itensSelecionados.size > 0 && `(${itensSelecionados.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
