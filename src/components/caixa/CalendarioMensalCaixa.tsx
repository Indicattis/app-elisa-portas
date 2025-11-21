import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DepositoCaixa, CATEGORIAS_DEPOSITO } from "@/types/caixa";
import { cn } from "@/lib/utils";

interface CalendarioMensalCaixaProps {
  currentMonth: Date;
  depositos: DepositoCaixa[];
  onAddDeposito: (date: Date) => void;
  onEditDeposito: (deposito: DepositoCaixa) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarioMensalCaixa({
  currentMonth,
  depositos,
  onAddDeposito,
  onEditDeposito,
  onPreviousMonth,
  onNextMonth,
  onToday
}: CalendarioMensalCaixaProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getDepositosDoDia = (date: Date) => {
    return depositos.filter(d => isSameDay(new Date(d.data_deposito), date));
  };

  return (
    <div className="space-y-4">
      {/* Navegação */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={onPreviousMonth} className="h-9 w-9">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center flex-1">
          <p className="text-lg font-medium">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <Button variant="link" size="sm" onClick={onToday} className="h-auto p-0 text-xs text-muted-foreground">
            Ir para hoje
          </Button>
        </div>

        <Button variant="outline" size="icon" onClick={onNextMonth} className="h-9 w-9">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendário */}
      <div className="border rounded-lg overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 bg-muted">
          {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((dia) => (
            <div key={dia} className="p-2 text-center text-xs font-medium">
              {dia}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        {rows.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-t">
            {week.map((day, dayIdx) => {
              const depositosDoDia = getDepositosDoDia(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isDayToday = isToday(day);

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "min-h-[100px] p-2 border-l first:border-l-0 cursor-pointer hover:bg-accent/50 transition-colors",
                    !isCurrentMonth && "bg-muted/50 text-muted-foreground"
                  )}
                  onClick={() => onAddDeposito(day)}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isDayToday && "text-primary font-bold"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {depositosDoDia.map((deposito) => {
                      const categoria = CATEGORIAS_DEPOSITO[deposito.categoria];
                      return (
                        <div
                          key={deposito.id}
                          className="text-xs p-1 rounded hover:opacity-80 transition-opacity"
                          style={{ 
                            backgroundColor: `${categoria.color}20`,
                            borderLeft: `3px solid ${categoria.color}`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditDeposito(deposito);
                          }}
                        >
                          <div className="font-medium truncate" style={{ color: categoria.color }}>
                            {formatCurrency(Number(deposito.valor))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
