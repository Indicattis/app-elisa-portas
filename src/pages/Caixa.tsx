import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Calendar, CalendarDays } from "lucide-react";
import { addWeeks, addMonths, startOfMonth } from "date-fns";
import { useDepositosCaixa } from "@/hooks/useDepositosCaixa";
import { CaixaIndicadores } from "@/components/caixa/CaixaIndicadores";
import { CalendarioSemanalCaixa } from "@/components/caixa/CalendarioSemanalCaixa";
import { CalendarioMensalCaixa } from "@/components/caixa/CalendarioMensalCaixa";
import { AdicionarDepositoModal } from "@/components/caixa/AdicionarDepositoModal";
import { DepositoCaixa } from "@/types/caixa";

export default function Caixa() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [depositoModal, setDepositoModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDeposito, setSelectedDeposito] = useState<DepositoCaixa | null>(null);

  const { 
    depositos, 
    loading, 
    createDeposito, 
    updateDeposito, 
    deleteDeposito 
  } = useDepositosCaixa(
    viewMode === 'month' ? startOfMonth(currentDate) : currentDate,
    viewMode
  );

  const handleAddDeposito = (date: Date) => {
    setSelectedDate(date);
    setSelectedDeposito(null);
    setDepositoModal(true);
  };

  const handleEditDeposito = (deposito: DepositoCaixa) => {
    setSelectedDeposito(deposito);
    setSelectedDate(null);
    setDepositoModal(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão de Caixa</h1>
            <p className="text-muted-foreground">
              Controle de depósitos e movimentações
            </p>
          </div>
        </div>

        {/* Botões de visualização */}
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => setViewMode('week')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Semana
          </Button>
          <Button 
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => setViewMode('month')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Mês
          </Button>
        </div>
      </div>

      {/* Indicadores */}
      {!loading && <CaixaIndicadores depositos={depositos} />}

      {/* Calendário */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'week' ? 'Visualização Semanal' : 'Visualização Mensal'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : viewMode === 'week' ? (
            <CalendarioSemanalCaixa
              currentWeek={currentDate}
              depositos={depositos}
              onAddDeposito={handleAddDeposito}
              onEditDeposito={handleEditDeposito}
              onPreviousWeek={() => setCurrentDate(addWeeks(currentDate, -1))}
              onNextWeek={() => setCurrentDate(addWeeks(currentDate, 1))}
              onToday={() => setCurrentDate(new Date())}
            />
          ) : (
            <CalendarioMensalCaixa
              currentMonth={currentDate}
              depositos={depositos}
              onAddDeposito={handleAddDeposito}
              onEditDeposito={handleEditDeposito}
              onPreviousMonth={() => setCurrentDate(addMonths(currentDate, -1))}
              onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
              onToday={() => setCurrentDate(new Date())}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de adicionar/editar depósito */}
      <AdicionarDepositoModal
        open={depositoModal}
        onOpenChange={setDepositoModal}
        selectedDate={selectedDate}
        deposito={selectedDeposito}
        onSave={createDeposito}
        onUpdate={updateDeposito}
        onDelete={deleteDeposito}
      />
    </div>
  );
}
