import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays, ExternalLink } from "lucide-react";
import { startOfWeek } from "date-fns";
import { useOrdensInstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { CalendarioInstalacoesMensal } from "@/components/instalacoes/CalendarioInstalacoesMensal";
import { CalendarioInstalacoesSemanal } from "@/components/instalacoes/CalendarioInstalacoesSemanal";

interface CalendarioInstalacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalendarioInstalacoesModal = ({ open, onOpenChange }: CalendarioInstalacoesModalProps) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('month');

  const { instalacoes } = useOrdensInstalacaoCalendario(currentDate, viewType);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  const noop = async () => {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Calendário de Instalações</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/logistica/instalacoes');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Ver calendário completo
              </Button>
              <Button
                variant={viewType === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('week')}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Semana
              </Button>
              <Button
                variant={viewType === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('month')}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Mês
              </Button>
            </div>
          </div>
        </DialogHeader>

        {viewType === 'month' ? (
          <CalendarioInstalacoesMensal
            currentMonth={currentDate}
            instalacoes={instalacoes}
            onMonthChange={setCurrentDate}
            onUpdateInstalacao={noop as any}
            onRemoverDoCalendario={noop}
            onInstalacaoClick={() => {}}
          />
        ) : (
          <CalendarioInstalacoesSemanal
            startDate={weekStart}
            instalacoes={instalacoes}
            onPreviousWeek={() => setCurrentDate(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000))}
            onNextWeek={() => setCurrentDate(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000))}
            onToday={() => setCurrentDate(new Date())}
            onRemoverDoCalendario={noop}
            onUpdateInstalacao={noop as any}
            onInstalacaoClick={() => {}}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
