import { useState, useEffect } from "react";
import { DndContext } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { Calendar, CalendarDays, ArrowLeft, LogOut, AlertCircle, Download, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { baixarCronogramaMinimalistaPDF } from "@/utils/cronogramaMinimalistaPDF";
import { useAutorizadosAptos } from "@/hooks/useAutorizadosAptos";
import { InstalacoesHeaderActions } from "@/components/instalacoes/InstalacoesHeaderActions";


export default function CronogramaMinimalista() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut, isAdmin, userRole, hasBypassPermissions } = useAuth();

  const ROLES_GERENTE = ['administrador', 'gerente_fabril', 'gerente_instalacoes', 'diretor'];
  const isGerente = isAdmin || hasBypassPermissions || (userRole?.role ? ROLES_GERENTE.includes(userRole.role) : false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [selectedItem, setSelectedItem] = useState<OrdemCarregamento | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [equipeIdFiltro, setEquipeIdFiltro] = useState<string | null>(null);
  const [autorizadoIdFiltro, setAutorizadoIdFiltro] = useState<string | null>(null);

  const { autorizados: autorizadosAptos } = useAutorizadosAptos();

  // Buscar equipes ativas (para filtro de gerentes)
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
    enabled: isGerente,
  });

  // Hook para ordens de carregamento da equipe (apenas instalações)
  const { 
    ordens,
    isLoading: isLoadingOrdens, 
    equipeNome,
    equipeCor,
    temEquipe 
  } = useInstalacoesMinhaEquipeCalendario(currentDate, viewType, isGerente, equipeIdFiltro, autorizadoIdFiltro);

  // Hook para neo instalações da equipe
  const { 
    neoInstalacoes,
    isLoading: isLoadingNeo 
  } = useNeoInstalacoesMinhaEquipe(currentDate, viewType, isGerente, equipeIdFiltro, autorizadoIdFiltro);

  // Hook para neo correções da equipe
  const { 
    neoCorrecoes,
    isLoading: isLoadingCorrecoes 
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
      : (isGerente ? "Todas as equipes" : (equipeNome || "Minha equipe"));

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

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Se não tem equipe, mostrar mensagem
  if (!isLoading && !temEquipe && !isGerente) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        <AnimatedBreadcrumb 
          items={[
            { label: "Home", path: "/home" },
            { label: "Logística", path: "/logistica" },
            { label: "Cronograma" }
          ]} 
          mounted={mounted} 
        />
        
        <div className="relative z-10 min-h-screen flex flex-col pt-14">
          <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/logistica')}
                  className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white/80" />
                </button>
                <h1 className="text-lg font-semibold text-white">Cronograma</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-white/80 hover:text-white hover:bg-primary/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 flex items-center justify-center">
            <Card className="bg-primary/5 border-primary/10 p-8 text-center max-w-md">
              <CardContent className="pt-6">
                <AlertCircle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  Sem equipe vinculada
                </h2>
                <p className="text-white/60 mb-6">
                  Você não está vinculado a nenhuma equipe de instalação.
                  Entre em contato com o administrador para ser adicionado a uma equipe.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/logistica')}
                  className="bg-primary/10 border-primary/20 text-white hover:bg-primary/20"
                >
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const displayEquipeNome = equipeIdFiltro
    ? equipesAtivas.find(e => e.id === equipeIdFiltro)?.nome || equipeNome
    : equipeNome;

  const displayEquipeCor = equipeIdFiltro
    ? equipesAtivas.find(e => e.id === equipeIdFiltro)?.cor || null
    : equipeCor;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Cronograma" }
        ]} 
        mounted={mounted} 
      />
      
      
      <div className="relative z-10 min-h-screen flex flex-col pt-14">
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
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-white">Cronograma</h1>
                  {displayEquipeNome && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: displayEquipeCor ? `${displayEquipeCor}20` : 'rgba(59, 130, 246, 0.2)',
                        color: displayEquipeCor || '#3B82F6',
                        border: `1px solid ${displayEquipeCor || '#3B82F6'}40`
                      }}
                    >
                      {displayEquipeNome}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60">
                  {viewType === 'week' 
                    ? `${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`
                    : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro de equipes (só para gerentes) */}
              {isGerente && (
                <Select
                  value={equipeIdFiltro || "todas"}
                  onValueChange={(val) => setEquipeIdFiltro(val === "todas" ? null : val)}
                >
                  <SelectTrigger className="w-[160px] h-8 text-xs bg-primary/10 border-primary/20 text-white">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as equipes</SelectItem>
                    {equipesAtivas.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        <div className="flex items-center gap-2">
                          {equipe.cor && (
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: equipe.cor }} 
                            />
                          )}
                          {equipe.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Filtro de autorizados (só para gerentes) */}
              {isGerente && (
                <Select
                  value={autorizadoIdFiltro || "todos"}
                  onValueChange={(val) => setAutorizadoIdFiltro(val === "todos" ? null : val)}
                >
                  <SelectTrigger className="w-[160px] h-8 text-xs bg-amber-500/10 border-amber-500/20 text-white">
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
              )}

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
                onClick={handleDownloadPDF}
                className="text-white/80 hover:text-white hover:bg-primary/10"
                title="Baixar PDF"
              >
                <Download className="h-4 w-4" />
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
          <div className="max-w-7xl mx-auto mt-3">
            <InstalacoesHeaderActions />
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Calendário - Modo Somente Visualização */}
              <DndContext onDragEnd={() => {}}>
              <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
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
            </div>
          )}
        </main>
      </div>

      {/* Detalhes da Ordem (somente visualização) */}
      <OrdemCarregamentoDetails
        ordem={selectedItem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
