import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Calendar, CalendarDays, Settings } from "lucide-react";
import { addWeeks, addMonths } from "date-fns";
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
  
  // Estados para Giro de Caixa
  const [giroCaixaTotal, setGiroCaixaTotal] = useState<number>(500000);
  const [capitalTomado, setCapitalTomado] = useState<number>(200000);

  const { 
    depositos, 
    totaisAcumulados,
    loading, 
    createDeposito, 
    updateDeposito, 
    deleteDeposito 
  } = useDepositosCaixa(currentDate, viewMode);

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

      {/* Configuração de Giro de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração de Giro de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="giro-total">Giro de Caixa (Total)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="giro-total"
                  type="number"
                  className="pl-10"
                  value={giroCaixaTotal}
                  onChange={(e) => setGiroCaixaTotal(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capital-tomado">Capital Tomado</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="capital-tomado"
                  type="number"
                  className="pl-10"
                  value={capitalTomado}
                  onChange={(e) => setCapitalTomado(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores */}
      {!loading && (
        <CaixaIndicadores 
          depositos={depositos} 
          giroCaixaTotal={giroCaixaTotal}
          capitalTomado={capitalTomado}
          totalTravesseiro={totaisAcumulados.totalTravesseiro}
          totalPrecaucoes={totaisAcumulados.totalPrecaucoes}
        />
      )}

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
              onDeleteDeposito={deleteDeposito}
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
              onDeleteDeposito={deleteDeposito}
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
