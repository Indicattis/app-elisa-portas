import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { NeoCorrecao } from "@/types/neoCorrecao";
import { DiaCardExpedicao } from "./DiaCardExpedicao";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";

interface CalendarioSemanalExpedicaoMobileProps {
  startDate: Date;
  ordens: OrdemCarregamento[];
  neoInstalacoes?: NeoInstalacao[];
  neoCorrecoes?: NeoCorrecao[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onDayClick: (date: Date) => void;
  onEdit?: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario?: (id: string) => void;
  onUpdateOrdem?: (params: { id: string; data: Partial<OrdemCarregamento>; fonte?: 'ordens_carregamento' | 'instalacoes' }) => Promise<void>;
  onOrdemAdded?: () => void;
  onOrdemClick?: (ordem: OrdemCarregamento) => void;
  onOpenNeoInstalacaoDetails?: (neoInstalacao: NeoInstalacao) => void;
  onOpenNeoCorrecaoDetails?: (neoCorrecao: NeoCorrecao) => void;
  onExcluirNeoInstalacao?: (id: string) => void;
  onExcluirNeoCorrecao?: (id: string) => void;
}

export const CalendarioSemanalExpedicaoMobile = ({
  startDate,
  ordens,
  neoInstalacoes = [],
  neoCorrecoes = [],
  onPreviousWeek,
  onNextWeek,
  onToday,
  onDayClick,
  onEdit,
  onRemoverDoCalendario,
  onUpdateOrdem,
  onOrdemAdded,
  onOrdemClick,
  onOpenNeoInstalacaoDetails,
  onOpenNeoCorrecaoDetails,
  onExcluirNeoInstalacao,
  onExcluirNeoCorrecao,
}: CalendarioSemanalExpedicaoMobileProps) => {
  // Configuração dos sensores para DnD
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}>
      <div className="space-y-4 w-full">
        {/* Navegação da semana */}
        <div className="flex items-center justify-between gap-2 px-1">
          <Button variant="outline" size="icon" onClick={onPreviousWeek} className="h-9 w-9 flex-shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center flex-1">
            <p className="text-xs font-medium text-foreground">
              {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} -{" "}
              {format(addDays(weekStart, 6), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <Button variant="link" size="sm" onClick={onToday} className="h-auto p-0 text-xs text-muted-foreground">
              Ir para hoje
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={onNextWeek} className="h-9 w-9 flex-shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid de dias - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((day) => (
            <DiaCardExpedicao
              key={day.toISOString()}
              date={day}
              ordens={ordens}
              neoInstalacoes={neoInstalacoes}
              neoCorrecoes={neoCorrecoes}
              onDayClick={onDayClick}
              onEdit={onEdit}
              onRemoverDoCalendario={onRemoverDoCalendario}
              onUpdateOrdem={onUpdateOrdem}
              onOrdemAdded={onOrdemAdded}
              onOrdemClick={onOrdemClick}
              onOpenNeoInstalacaoDetails={onOpenNeoInstalacaoDetails}
              onOpenNeoCorrecaoDetails={onOpenNeoCorrecaoDetails}
              onExcluirNeoInstalacao={onExcluirNeoInstalacao}
              onExcluirNeoCorrecao={onExcluirNeoCorrecao}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
};
