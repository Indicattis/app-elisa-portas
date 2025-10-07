import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Save, AlertCircle } from "lucide-react";

interface FaturamentoItemCardProps {
  item: {
    id: string;
    tipo_produto: string;
    descricao: string;
    valor_produto: number;
    valor_pintura: number;
    quantidade: number;
    lucro_produto?: number;
    lucro_pintura?: number;
    custo_produto?: number;
    custo_pintura?: number;
    margem_produto?: number;
    margem_pintura?: number;
  };
  onSave: (itemId: string, lucros: { lucro_produto: number; lucro_pintura: number }) => Promise<void>;
  isSaving: boolean;
}

export function FaturamentoItemCard({ item, onSave, isSaving }: FaturamentoItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lucroProduto, setLucroProduto] = useState(item.lucro_produto || 0);
  const [lucroPintura, setLucroPintura] = useState(item.lucro_pintura || 0);

  // Cálculos em tempo real
  const custoProdutoCalc = item.valor_produto - lucroProduto;
  const custoPinturaCalc = item.valor_pintura - lucroPintura;
  const margemProdutoCalc = item.valor_produto > 0 ? (lucroProduto / item.valor_produto) * 100 : 0;
  const margemPinturaCalc = item.valor_pintura > 0 ? (lucroPintura / item.valor_pintura) * 100 : 0;
  const margemMediaCalc = ((margemProdutoCalc + margemPinturaCalc) / 2);

  // Status de faturamento
  const isFaturado = (item.lucro_produto || 0) > 0 || (item.lucro_pintura || 0) > 0;

  // Cores baseadas na margem
  const getMargemColor = (margem: number) => {
    if (margem >= 30) return "text-green-600";
    if (margem >= 15) return "text-yellow-600";
    return "text-red-600";
  };

  const getMargemBadgeVariant = (margem: number) => {
    if (margem >= 30) return "default";
    if (margem >= 15) return "secondary";
    return "destructive";
  };

  const handleSave = async () => {
    await onSave(item.id, {
      lucro_produto: lucroProduto,
      lucro_pintura: lucroPintura,
    });
  };

  // Validações
  const hasError = lucroProduto > item.valor_produto || lucroPintura > item.valor_pintura;
  const hasNegativeCost = custoProdutoCalc < 0 || custoPinturaCalc < 0;

  return (
    <Card className="relative">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium">
                {item.tipo_produto} - {item.descricao}
              </CardTitle>
              {!isFaturado && (
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pendente
                </Badge>
              )}
              {isFaturado && (
                <Badge variant="default" className="text-xs bg-green-600">
                  Faturado
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Qtd: {item.quantidade}</span>
              <span>Valor Produto: R$ {item.valor_produto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <span>Valor Pintura: R$ {item.valor_pintura.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              {isFaturado && (
                <Badge variant={getMargemBadgeVariant(margemMediaCalc)}>
                  Margem: {margemMediaCalc.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Produto */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Produto
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor={`lucro_produto_${item.id}`}>Lucro Produto (R$) *</Label>
                <Input
                  id={`lucro_produto_${item.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  max={item.valor_produto}
                  value={lucroProduto}
                  onChange={(e) => setLucroProduto(parseFloat(e.target.value) || 0)}
                  className={hasError || lucroProduto > item.valor_produto ? "border-red-500" : ""}
                />
                {lucroProduto > item.valor_produto && (
                  <p className="text-xs text-red-600">Lucro não pode ser maior que o valor de venda</p>
                )}
              </div>

              <div className="space-y-2 bg-muted/30 p-3 rounded">
                <Label className="text-xs text-muted-foreground">Custo Calculado</Label>
                <p className={`text-lg font-semibold ${custoProdutoCalc < 0 ? 'text-red-600' : ''}`}>
                  R$ {custoProdutoCalc.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-2 bg-muted/30 p-3 rounded">
                <Label className="text-xs text-muted-foreground">Margem Calculada</Label>
                <p className={`text-lg font-semibold ${getMargemColor(margemProdutoCalc)}`}>
                  {margemProdutoCalc.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Pintura */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Pintura
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor={`lucro_pintura_${item.id}`}>Lucro Pintura (R$) *</Label>
                <Input
                  id={`lucro_pintura_${item.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  max={item.valor_pintura}
                  value={lucroPintura}
                  onChange={(e) => setLucroPintura(parseFloat(e.target.value) || 0)}
                  className={hasError || lucroPintura > item.valor_pintura ? "border-red-500" : ""}
                />
                {lucroPintura > item.valor_pintura && (
                  <p className="text-xs text-red-600">Lucro não pode ser maior que o valor de venda</p>
                )}
              </div>

              <div className="space-y-2 bg-muted/30 p-3 rounded">
                <Label className="text-xs text-muted-foreground">Custo Calculado</Label>
                <p className={`text-lg font-semibold ${custoPinturaCalc < 0 ? 'text-red-600' : ''}`}>
                  R$ {custoPinturaCalc.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-2 bg-muted/30 p-3 rounded">
                <Label className="text-xs text-muted-foreground">Margem Calculada</Label>
                <p className={`text-lg font-semibold ${getMargemColor(margemPinturaCalc)}`}>
                  {margemPinturaCalc.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {hasNegativeCost && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Atenção: Custo negativo detectado. Verifique os valores de lucro informados.
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || hasError || hasNegativeCost}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Salvando..." : "Salvar Lucros"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
