import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DepositoCaixa } from "@/types/caixa";
import { DepositoLinha } from "./DepositoLinha";

interface DiaDepositoCardProps {
  date: Date;
  depositos: DepositoCaixa[];
  onAddDeposito: (date: Date) => void;
  onEditDeposito: (deposito: DepositoCaixa) => void;
}

export function DiaDepositoCard({
  date,
  depositos,
  onAddDeposito,
  onEditDeposito
}: DiaDepositoCardProps) {
  const depositosDoDia = depositos.filter(d => 
    isSameDay(new Date(d.data_deposito), date)
  );

  const totalDia = depositosDoDia.reduce((sum, dep) => sum + Number(dep.valor), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">
              {format(date, "EEE", { locale: ptBR }).toUpperCase()}
            </div>
            <div className="text-xs text-muted-foreground font-normal">
              {format(date, "dd/MM")}
            </div>
          </div>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onAddDeposito(date)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {depositosDoDia.length > 0 ? (
          <>
            <div className="space-y-1">
              {depositosDoDia.map((deposito) => (
                <DepositoLinha
                  key={deposito.id}
                  deposito={deposito}
                  onClick={() => onEditDeposito(deposito)}
                />
              ))}
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Total:</span>
                <span className="text-sm font-bold">{formatCurrency(totalDia)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Sem depósitos
          </div>
        )}
      </CardContent>
    </Card>
  );
}
