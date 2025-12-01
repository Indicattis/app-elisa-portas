import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DepositoCaixa } from "@/types/caixa";
import { DiaDepositoCard } from "./DiaDepositoCard";

interface CalendarioSemanalCaixaProps {
  currentWeek: Date;
  depositos: DepositoCaixa[];
  onAddDeposito: (date: Date) => void;
  onEditDeposito: (deposito: DepositoCaixa) => void;
  onDeleteDeposito: (id: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function CalendarioSemanalCaixa({
  currentWeek,
  depositos,
  onAddDeposito,
  onEditDeposito,
  onDeleteDeposito,
  onPreviousWeek,
  onNextWeek,
  onToday
}: CalendarioSemanalCaixaProps) {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4">
      {/* Navegação */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={onPreviousWeek} className="h-9 w-9">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center flex-1">
          <p className="text-sm font-medium">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} -{" "}
            {format(addDays(weekStart, 6), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <Button variant="link" size="sm" onClick={onToday} className="h-auto p-0 text-xs text-muted-foreground">
            Ir para hoje
          </Button>
        </div>

        <Button variant="outline" size="icon" onClick={onNextWeek} className="h-9 w-9">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => (
          <DiaDepositoCard
            key={day.toISOString()}
            date={day}
            depositos={depositos}
            onAddDeposito={onAddDeposito}
            onEditDeposito={onEditDeposito}
            onDeleteDeposito={onDeleteDeposito}
          />
        ))}
      </div>
    </div>
  );
}
