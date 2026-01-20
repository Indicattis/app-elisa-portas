import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, CalendarDays, LogOut } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrdensCarregamentoCalendario } from "@/hooks/useOrdensCarregamentoCalendario";
import { OrdensCarregamentoDisponiveis } from "@/components/expedicao/OrdensCarregamentoDisponiveis";
import { OrdemCarregamentoDetails } from "@/components/expedicao/OrdemCarregamentoDetails";
import { EditarOrdemCarregamentoDrawer } from "@/components/expedicao/EditarOrdemCarregamentoDrawer";
import { CalendarioSemanalExpedicaoMobile } from "@/components/expedicao/CalendarioSemanalExpedicaoMobile";
import { CalendarioSemanalExpedicaoDesktop } from "@/components/expedicao/CalendarioSemanalExpedicaoDesktop";
import { CalendarioMensalExpedicaoDesktop } from "@/components/expedicao/CalendarioMensalExpedicaoDesktop";
import { useIsMobile } from "@/hooks/use-mobile";
import { DndContext, MouseSensor, TouchSensor, useSensors, useSensor, DragEndEvent } from "@dnd-kit/core";
import { format, addDays, startOfWeek, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function ExpedicaoMinimalista() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemCarregamento | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingOrdem, setEditingOrdem] = useState<OrdemCarregamento | null>(null);

  const { ordens, isLoading, updateOrdem, deleteOrdem } = useOrdensCarregamentoCalendario(currentDate, viewType);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handlePreviousWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
  const handlePreviousMonth = () => setCurrentDate(prev => addMonths(prev, -1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => {
    if (viewType === 'month') {
      setCurrentDate(startOfMonth(new Date()));
    } else {
      setCurrentDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    }
  };

  const handleUpdateOrdem = (id: string, data: any) => {
    updateOrdem({ id, data });
  };

  const handleEdit = (ordem: OrdemCarregamento) => {
    setEditingOrdem(ordem);
    setEditDrawerOpen(true);
  };

  const handleSaveEdit = async (data: any) => {
    if (editingOrdem) {
      updateOrdem({ id: editingOrdem.id, data });
      setEditDrawerOpen(false);
      setEditingOrdem(null);
    }
  };

  const handleOrdemDropped = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-carregamento-disponiveis'] });
  };

  const handleRemoverDoCalendario = (ordemId: string) => {
    updateOrdem({ 
      id: ordemId, 
      data: { 
        data_carregamento: null, 
        status: 'pendente' 
      } 
    });
    toast.success("Ordem removida do calendário");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-carregamento-calendario'] });
  };

  const handleOrdemClick = (ordem: OrdemCarregamento) => {
    setSelectedOrdem(ordem);
    setDetailsOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const ordemId = active.id as string;
    const novaData = over.id as string;

    if (novaData && ordemId) {
      updateOrdem({ 
        id: ordemId, 
        data: { data_carregamento: novaData } 
      });
    }
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <SpaceParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/logistica')}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Expedição</h1>
                <p className="text-xs text-white/60">
                  {viewType === 'week' 
                    ? `${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`
                    : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewType(viewType === 'week' ? 'month' : 'week')}
                className="text-white/80 hover:text-white hover:bg-primary/10"
              >
                {viewType === 'week' ? <CalendarDays className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="text-white/80 hover:text-white hover:bg-primary/10 text-xs"
              >
                Hoje
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-white/80 hover:text-white hover:bg-primary/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="max-w-7xl mx-auto space-y-4">
                {/* Calendário */}
                <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                  <CardContent className="p-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={viewType === 'week' ? handlePreviousWeek : handlePreviousMonth}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>

                    {isMobile ? (
                      <CalendarioSemanalExpedicaoMobile
                        currentDate={currentDate}
                        ordens={ordens || []}
                        onDayClick={(date) => console.log('Day clicked:', date)}
                        onEditOrdem={handleEdit}
                        onRemoverDoCalendario={handleRemoverDoCalendario}
                        onOrdemDropped={handleOrdemDropped}
                        onUpdateOrdem={handleUpdateOrdem}
                        onOrdemClick={handleOrdemClick}
                      />
                    ) : viewType === 'week' ? (
                      <CalendarioSemanalExpedicaoDesktop
                        currentDate={currentDate}
                        ordens={ordens || []}
                        onDayClick={(date) => console.log('Day clicked:', date)}
                        onEditOrdem={handleEdit}
                        onRemoverDoCalendario={handleRemoverDoCalendario}
                        onOrdemDropped={handleOrdemDropped}
                        onUpdateOrdem={handleUpdateOrdem}
                        onOrdemClick={handleOrdemClick}
                      />
                    ) : (
                      <CalendarioMensalExpedicaoDesktop
                        currentDate={currentDate}
                        ordens={ordens || []}
                        onDayClick={(date) => console.log('Day clicked:', date)}
                        onEditOrdem={handleEdit}
                        onRemoverDoCalendario={handleRemoverDoCalendario}
                        onOrdemDropped={handleOrdemDropped}
                        onUpdateOrdem={handleUpdateOrdem}
                        onOrdemClick={handleOrdemClick}
                      />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={viewType === 'week' ? handleNextWeek : handleNextMonth}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Ordens Disponíveis */}
                {!isMobile && (
                  <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                    <CardContent className="p-4">
                      <OrdensCarregamentoDisponiveis onRefresh={handleRefresh} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </DndContext>
          )}
        </main>
      </div>

      {/* Detalhes da Ordem */}
      <OrdemCarregamentoDetails
        ordem={selectedOrdem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Drawer de Edição */}
      <EditarOrdemCarregamentoDrawer
        ordem={editingOrdem}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
