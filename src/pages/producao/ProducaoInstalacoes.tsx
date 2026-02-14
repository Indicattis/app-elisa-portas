import { useState, useEffect } from "react";
import { DndContext } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { Calendar, CalendarDays, AlertCircle, Download, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstalacoesMinhaEquipeCalendario } from "@/hooks/useInstalacoesMinhaEquipeCalendario";
import { useNeoInstalacoesMinhaEquipe } from "@/hooks/useNeoInstalacoesMinhaEquipe";
import { useNeoCorrecoesMinhaEquipe } from "@/hooks/useNeoCorrecoesMinhaEquipe";
import { OrdemCarregamentoDetails } from "@/components/expedicao/OrdemCarregamentoDetails";
import { CalendarioSemanalExpedicaoMobile } from "@/components/expedicao/CalendarioSemanalExpedicaoMobile";
import { CalendarioSemanalExpedicaoDesktop } from "@/components/expedicao/CalendarioSemanalExpedicaoDesktop";
import { CalendarioMensalExpedicaoDesktop } from "@/components/expedicao/CalendarioMensalExpedicaoDesktop";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { supabase } from "@/integrations/supabase/client";
import { baixarCronogramaMinimalistaPDF } from "@/utils/cronogramaMinimalistaPDF";
import { useAutorizadosAptos } from "@/hooks/useAutorizadosAptos";

export default function ProducaoInstalacoes() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useProducaoAuth();

  // For producao interface, always show all teams (gerente view)
  const isGerente = true;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [selectedItem, setSelectedItem] = useState<OrdemCarregamento | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [equipeIdFiltro, setEquipeIdFiltro] = useState<string | null>(null);
  const [autorizadoIdFiltro, setAutorizadoIdFiltro] = useState<string | null>(null);

  const { autorizados: autorizadosAptos } = useAutorizadosAptos();

  const { data: equipesAtivas = [] } = useQuery({
    queryKey: ["equipes_instalacao_ativas_filtro"],
    queryFn: async () => {
      const { data } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true)
        .order("nome");
      return data || [];
    },
  });

  const {
    ordens,
    isLoading: isLoadingOrdens,
    equipeNome,
    equipeCor,
    temEquipe,
  } = useInstalacoesMinhaEquipeCalendario(currentDate, viewType, isGerente, equipeIdFiltro, autorizadoIdFiltro);

  const {
    neoInstalacoes,
    isLoading: isLoadingNeo,
  } = useNeoInstalacoesMinhaEquipe(currentDate, viewType, isGerente, equipeIdFiltro, autorizadoIdFiltro);

  const {
    neoCorrecoes,
    isLoading: isLoadingCorrecoes,
  } = useNeoCorrecoesMinhaEquipe(currentDate, viewType, isGerente, equipeIdFiltro, autorizadoIdFiltro);

  const isLoading = isLoadingOrdens || isLoadingNeo || isLoadingCorrecoes;

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const handlePreviousWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
  const handleToday = () => {
    if (viewType === 'month') {
      setCurrentDate(startOfMonth(new Date()));
    } else {
      setCurrentDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    }
  };

  const handleOrdemClick = (ordem: OrdemCarregamento) => {
    setSelectedItem(ordem);
    setDetailsOpen(true);
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleDownloadPDF = () => {
    const periodoInicio = viewType === 'week'
      ? startOfWeek(currentDate, { weekStartsOn: 0 })
      : startOfMonth(currentDate);
    const periodoFim = viewType === 'week'
      ? endOfWeek(currentDate, { weekStartsOn: 0 })
      : endOfMonth(currentDate);

    const equipeFiltrada = equipeIdFiltro
      ? equipesAtivas.find(e => e.id === equipeIdFiltro)?.nome || "Equipe"
      : "Todas as equipes";

    baixarCronogramaMinimalistaPDF({
      ordens,
      neoInstalacoes,
      neoCorrecoes,
      periodoInicio,
      periodoFim,
      equipeNome: equipeFiltrada,
      tipoVisualizacao: viewType,
    });
  };

  const displayEquipeNome = equipeIdFiltro
    ? equipesAtivas.find(e => e.id === equipeIdFiltro)?.nome || equipeNome
    : equipeNome;

  const displayEquipeCor = equipeIdFiltro
    ? equipesAtivas.find(e => e.id === equipeIdFiltro)?.cor || null
    : equipeCor;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Instalações</h1>
          {displayEquipeNome && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: displayEquipeCor ? `${displayEquipeCor}20` : 'rgba(59, 130, 246, 0.2)',
                color: displayEquipeCor || '#3B82F6',
                border: `1px solid ${displayEquipeCor || '#3B82F6'}40`,
              }}
            >
              {displayEquipeNome}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {viewType === 'week'
              ? `${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`
              : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
            }
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={equipeIdFiltro || "todas"}
            onValueChange={(val) => setEquipeIdFiltro(val === "todas" ? null : val)}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as equipes</SelectItem>
              {equipesAtivas.map((equipe) => (
                <SelectItem key={equipe.id} value={equipe.id}>
                  <div className="flex items-center gap-2">
                    {equipe.cor && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: equipe.cor }} />
                    )}
                    {equipe.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={autorizadoIdFiltro || "todos"}
            onValueChange={(val) => setAutorizadoIdFiltro(val === "todos" ? null : val)}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Autorizado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos autorizados</SelectItem>
              {autorizadosAptos.map((aut) => (
                <SelectItem key={aut.id} value={aut.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    {aut.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setViewType(viewType === 'week' ? 'month' : 'week')}>
            {viewType === 'week' ? <CalendarDays className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs">
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} title="Baixar PDF">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DndContext onDragEnd={() => {}}>
          <Card>
            <CardContent className="p-4">
              {isMobile ? (
                <CalendarioSemanalExpedicaoMobile
                  startDate={weekStart}
                  ordens={ordens}
                  neoInstalacoes={neoInstalacoes}
                  neoCorrecoes={neoCorrecoes}
                  onPreviousWeek={handlePreviousWeek}
                  onNextWeek={handleNextWeek}
                  onToday={handleToday}
                  onDayClick={() => {}}
                  onOrdemClick={handleOrdemClick}
                />
              ) : viewType === 'week' ? (
                <CalendarioSemanalExpedicaoDesktop
                  startDate={weekStart}
                  ordens={ordens}
                  neoInstalacoes={neoInstalacoes}
                  neoCorrecoes={neoCorrecoes}
                  onPreviousWeek={handlePreviousWeek}
                  onNextWeek={handleNextWeek}
                  onToday={handleToday}
                  onOrdemClick={handleOrdemClick}
                  readOnly
                />
              ) : (
                <CalendarioMensalExpedicaoDesktop
                  currentMonth={currentDate}
                  ordens={ordens}
                  neoInstalacoes={neoInstalacoes}
                  neoCorrecoes={neoCorrecoes}
                  onMonthChange={handleMonthChange}
                  onOrdemClick={handleOrdemClick}
                  readOnly
                />
              )}
            </CardContent>
          </Card>
        </DndContext>
      )}

      <OrdemCarregamentoDetails
        ordem={selectedItem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
