import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEstoque, ProdutoEstoque } from "@/hooks/useEstoque";
import { Search, Package, Calculator, Zap } from "lucide-react";
import type { CategoriaLinha, PedidoLinhaNova } from "@/hooks/usePedidoLinhas";

interface AdicionarLinhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: CategoriaLinha;
  portaId: string;
  onAdicionar: (linha: PedidoLinhaNova) => Promise<any>;
  portaLargura?: number;
  portaAltura?: number;
}

// Mapeamento de categoria para setor de produção
const CATEGORIA_TO_SETOR: Record<CategoriaLinha, 'perfiladeira' | 'soldagem' | 'separacao' | 'pintura'> = {
  separacao: 'separacao',
  solda: 'soldagem',
  perfiladeira: 'perfiladeira',
};

const CATEGORIA_LABELS = {
  separacao: "Separação",
  solda: "Solda",
  perfiladeira: "Perfiladeira",
};

// Função para calcular o tamanho automático
function calcularTamanhoAutomatico(
  produto: ProdutoEstoque,
  portaLargura?: number,
  portaAltura?: number
): string | null {
  if (!produto.modulo_calculo || !produto.valor_calculo || !produto.eixo_calculo) {
    return null;
  }

  const eixoValor = produto.eixo_calculo === 'largura' ? portaLargura : portaAltura;
  
  if (!eixoValor) return null;

  let tamanhoCalculado: number;
  if (produto.modulo_calculo === 'acrescimo') {
    tamanhoCalculado = eixoValor + produto.valor_calculo;
  } else {
    tamanhoCalculado = eixoValor - produto.valor_calculo;
  }

  return tamanhoCalculado.toFixed(2);
}

// Função para calcular a quantidade automática
function calcularQuantidadeAutomatica(
  produto: ProdutoEstoque,
  portaLargura?: number,
  portaAltura?: number
): number | null {
  if (!produto.qtd_eixo_calculo || !produto.qtd_operador || !produto.qtd_valor_calculo) {
    return null;
  }

  const eixoValor = produto.qtd_eixo_calculo === 'largura' ? portaLargura : portaAltura;
  if (!eixoValor) return null;

  let resultado: number;
  switch (produto.qtd_operador) {
    case 'multiplicar': resultado = eixoValor * produto.qtd_valor_calculo; break;
    case 'dividir': resultado = eixoValor / produto.qtd_valor_calculo; break;
    case 'somar': resultado = eixoValor + produto.qtd_valor_calculo; break;
    case 'subtrair': resultado = eixoValor - produto.qtd_valor_calculo; break;
    default: return null;
  }

  return Math.ceil(resultado);
}

export function AdicionarLinhaModal({ 
  open, 
  onOpenChange, 
  categoria, 
  portaId, 
  onAdicionar,
  portaLargura,
  portaAltura 
}: AdicionarLinhaModalProps) {
  const [busca, setBusca] = useState("");
  const [modoManual, setModoManual] = useState(false);
  const [tamanhoCalculado, setTamanhoCalculado] = useState<string | null>(null);
  const [quantidadeCalculada, setQuantidadeCalculada] = useState<number | null>(null);
  const [formData, setFormData] = useState<PedidoLinhaNova>({
    produto_venda_id: portaId,
    nome_produto: "",
    descricao_produto: "",
    quantidade: 1,
    tamanho: "",
    categoria_linha: categoria,
  });

  // Filtrar produtos pelo setor responsável pela categoria
  const setorFiltro = CATEGORIA_TO_SETOR[categoria];
  const { produtos, buscarProdutos } = useEstoque(busca, setorFiltro);

  const handleBuscar = (termo: string) => {
    setBusca(termo);
    buscarProdutos(termo);
  };

  const handleSelecionarProduto = (produto: ProdutoEstoque) => {
    // Calcular tamanho automático se o produto tiver configuração
    const tamanhoAuto = calcularTamanhoAutomatico(produto, portaLargura, portaAltura);
    setTamanhoCalculado(tamanhoAuto);
    
    // Calcular quantidade automática
    const qtdAuto = calcularQuantidadeAutomatica(produto, portaLargura, portaAltura);
    setQuantidadeCalculada(qtdAuto);
    
    setFormData({
      produto_venda_id: portaId,
      nome_produto: produto.nome_produto,
      descricao_produto: produto.descricao_produto || "",
      quantidade: qtdAuto ?? produto.quantidade_padrao ?? 1,
      tamanho: tamanhoAuto || "",
      estoque_id: produto.id,
      categoria_linha: categoria,
    });
    setModoManual(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome_produto || formData.quantidade <= 0) {
      return;
    }

    await onAdicionar(formData);
    
    setFormData({
      produto_venda_id: portaId,
      nome_produto: "",
      descricao_produto: "",
      quantidade: 1,
      tamanho: "",
      categoria_linha: categoria,
    });
    setModoManual(false);
    setBusca("");
    setTamanhoCalculado(null);
    setQuantidadeCalculada(null);
    onOpenChange(false);
  };

  // Resetar estado quando fechar o modal
  useEffect(() => {
    if (!open) {
      setModoManual(false);
      setBusca("");
      setTamanhoCalculado(null);
      setQuantidadeCalculada(null);
      setFormData({
        produto_venda_id: portaId,
        nome_produto: "",
        descricao_produto: "",
        quantidade: 1,
        tamanho: "",
        categoria_linha: categoria,
      });
    }
  }, [open, portaId, categoria]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-base">Adicionar Item - {CATEGORIA_LABELS[categoria]}</DialogTitle>
        </DialogHeader>

        {!modoManual ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto no estoque..."
                value={busca}
                onChange={(e) => handleBuscar(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {produtos.map((produto) => {
                  const temCalculoAuto = produto.modulo_calculo && produto.valor_calculo && produto.eixo_calculo;
                  const tamanhoPreview = temCalculoAuto 
                    ? calcularTamanhoAutomatico(produto, portaLargura, portaAltura)
                    : null;
                    
                  return (
                    <Card
                      key={produto.id}
                      className="p-2 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelecionarProduto(produto)}
                    >
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{produto.nome_produto}</p>
                            {temCalculoAuto && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Calculator className="h-3 w-3" />
                                Auto
                              </Badge>
                            )}
                            {produto.item_padrao_porta_enrolar && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                          {produto.descricao_produto && (
                            <p className="text-xs text-muted-foreground truncate">{produto.descricao_produto}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">
                              Disponível: {produto.quantidade} {produto.unidade || 'UN'}
                            </p>
                            {tamanhoPreview && (
                              <p className="text-xs text-primary font-medium">
                                → Tamanho: {tamanhoPreview}m
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => {
                setModoManual(true);
                setFormData(prev => ({ ...prev, nome_produto: busca }));
              }}
            >
              Adicionar Produto Manualmente
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs">Nome do Produto</Label>
              <Input
                id="nome"
                value={formData.nome_produto}
                onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs">Descrição (opcional)</Label>
              <Input
                id="descricao"
                value={formData.descricao_produto}
                onChange={(e) => setFormData({ ...formData, descricao_produto: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                  <Label htmlFor="quantidade" className="text-xs">Quantidade</Label>
                  {quantidadeCalculada && (
                    <Badge variant="secondary" className="text-xs">
                      <Calculator className="h-3 w-3 mr-1" />
                      Calculada
                    </Badge>
                  )}
                </div>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label htmlFor="tamanho" className="text-xs">Tamanho (opcional)</Label>
                  {tamanhoCalculado && (
                    <Badge variant="secondary" className="text-xs">
                      <Calculator className="h-3 w-3 mr-1" />
                      Calculado
                    </Badge>
                  )}
                </div>
                <Input
                  id="tamanho"
                  value={formData.tamanho}
                  onChange={(e) => setFormData({ ...formData, tamanho: e.target.value })}
                  className="h-8 text-sm"
                  placeholder={tamanhoCalculado ? `Sugerido: ${tamanhoCalculado}m` : ""}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {modoManual && (
            <Button variant="ghost" onClick={() => setModoManual(false)} className="h-8 text-xs">
              Voltar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Cancelar
          </Button>
          {modoManual && (
            <Button onClick={handleSubmit} className="h-8 text-xs">
              Adicionar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
