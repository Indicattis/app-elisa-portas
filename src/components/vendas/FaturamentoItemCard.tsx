import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Save, Loader2, DollarSign } from "lucide-react";

interface FaturamentoItemCardProps {
  item: {
    id: string;
    tipo_produto: string;
    descricao: string;
    quantidade: number;
    valor_total: number;
    lucro_item?: number;
    custo_producao?: number;
  };
  lucroItem: number;
  onLucroChange: (itemId: string, lucro: number) => void;
  onSave: (itemId: string, lucro: number) => Promise<void>;
  isSaving: boolean;
  freteAprovado?: boolean;
}

export function FaturamentoItemCard({ 
  item, 
  lucroItem,
  onLucroChange,
  onSave, 
  isSaving, 
  freteAprovado = true 
}: FaturamentoItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcular custo automaticamente
  const custoCalculado = item.valor_total - lucroItem;
  const margemItem = item.valor_total > 0 ? (lucroItem / item.valor_total) * 100 : 0;

  const handleSave = async () => {
    await onSave(item.id, lucroItem);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{item.descricao}</h3>
              <span className="text-sm text-muted-foreground">
                ({item.quantidade}x)
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-muted-foreground">
                Tipo: {item.tipo_produto}
              </span>
              <span className="text-sm font-medium">
                Valor: R$ {item.valor_total.toFixed(2)}
              </span>
              {item.lucro_item && item.lucro_item > 0 && (
                <span className="text-sm text-green-600">
                  ✓ Faturado
                </span>
              )}
            </div>
          </div>
          
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Faturamento do Item</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`lucro-${item.id}`}>Lucro Real (R$)</Label>
                <Input
                  id={`lucro-${item.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  max={item.valor_total}
                  value={lucroItem}
                  onChange={(e) => onLucroChange(item.id, parseFloat(e.target.value) || 0)}
                  className={lucroItem > item.valor_total ? "border-destructive" : ""}
                />
                {lucroItem > item.valor_total && (
                  <p className="text-sm text-destructive mt-1">
                    Lucro não pode ser maior que o valor total
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-medium">R$ {item.valor_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lucro:</span>
                  <span className="font-medium">R$ {lucroItem.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo Calculado:</span>
                  <span className={`font-medium ${custoCalculado < 0 ? 'text-destructive' : ''}`}>
                    R$ {custoCalculado.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margem:</span>
                  <span className={`font-medium ${margemItem < 0 ? 'text-destructive' : ''}`}>
                    {margemItem.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || lucroItem > item.valor_total || !freteAprovado}
              className="w-full md:w-auto"
              title={!freteAprovado ? "O frete precisa ser aprovado antes de salvar o lucro" : undefined}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Lucro
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
