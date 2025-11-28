import { format, isSameDay, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { OrdemCarregamentoCard } from "./OrdemCarregamentoCard";
import { useState } from "react";
import { AgendarCarregamentoModal } from "./AgendarCarregamentoModal";

interface DiaCardExpedicaoProps {
  date: Date;
  ordens: OrdemCarregamento[];
  onDayClick: (date: Date) => void;
}

export const DiaCardExpedicao = ({
  date,
  ordens,
  onDayClick,
}: DiaCardExpedicaoProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const hoje = new Date();
  const isToday = isSameDay(date, hoje);
  const isWeekendDay = isWeekend(date);

  const ordensNoDia = ordens.filter((ordem) => {
    if (!ordem.data_carregamento) return false;
    return isSameDay(new Date(ordem.data_carregamento), date);
  });

  return (
    <>
      <Card
        className={`p-3 h-full min-h-[180px] flex flex-col transition-colors ${
          isToday
            ? "border-primary bg-primary/5"
            : isWeekendDay
            ? "bg-muted/30"
            : ""
        }`}
      >
        {/* Cabeçalho do dia */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b">
          <div>
            <p className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
              {format(date, "EEE", { locale: ptBR })}
            </p>
            <p className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
              {format(date, "dd", { locale: ptBR })}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista de ordens */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {ordensNoDia.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Nenhuma ordem
            </div>
          ) : (
            ordensNoDia.map((ordem) => (
              <OrdemCarregamentoCard
                key={ordem.id}
                ordem={ordem}
              />
            ))
          )}
        </div>
      </Card>

      <AgendarCarregamentoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ordem={null}
        onConfirm={async () => {
          setModalOpen(false);
        }}
      />
    </>
  );
};
