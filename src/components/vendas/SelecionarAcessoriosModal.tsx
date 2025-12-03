import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
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

  // Buscar produtos do catálogo de vendas
  const { data: produtosEstoque = [], isLoading } = useQuery({
    queryKey: ['vendas-catalogo-modal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas_catalogo')
        .select('*')
        .eq('ativo', true)
        .gt('quantidade', 0)
        .order('destaque', { ascending: false })
        .order('nome_produto');
      
      if (error) throw error;
      return data.map(item => ({
        id: item.id,
        nome: item.nome_produto,
        preco: Number(item.preco_venda),
        tipo: (item.categoria === 'acessório' ? 'acessorio' : 'adicional') as 'acessorio' | 'adicional',
        descricao: item.descricao_produto,
        categoria: item.categoria
      }));
    },
    enabled: open
  });

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
    const itensSelecionadosArray = produtosEstoque.filter(item => itensSelecionados.has(item.id));
    
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

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'acessório': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'adicional': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Catálogo de Produtos</DialogTitle>
          <DialogDescription>
            Selecione os itens que deseja adicionar à venda
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Carregando itens...
            </div>
          ) : produtosEstoque.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto disponível para venda avulsa.
              <br />
              <span className="text-xs">Configure produtos no módulo de Estoque</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="w-24">Categoria</TableHead>
                  <TableHead className="text-right w-24">Preço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosEstoque.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="h-[30px] cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleItem(item.id)}
                  >
                    <TableCell className="py-1 px-3">
                      <Checkbox
                        checked={itensSelecionados.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
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
