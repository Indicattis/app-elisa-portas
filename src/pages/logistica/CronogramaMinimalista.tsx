import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, CalendarDays, ArrowLeft, LogOut, AlertCircle } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstalacoesMinhaEquipeCalendario } from "@/hooks/useInstalacoesMinhaEquipeCalendario";
import { useNeoInstalacoesMinhaEquipe } from "@/hooks/useNeoInstalacoesMinhaEquipe";
import { OrdemCarregamentoDetails } from "@/components/expedicao/OrdemCarregamentoDetails";
import { CalendarioSemanalExpedicaoMobile } from "@/components/expedicao/CalendarioSemanalExpedicaoMobile";
import { CalendarioSemanalExpedicaoDesktop } from "@/components/expedicao/CalendarioSemanalExpedicaoDesktop";
import { CalendarioMensalExpedicaoDesktop } from "@/components/expedicao/CalendarioMensalExpedicaoDesktop";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays, startOfWeek, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { useAuth } from "@/hooks/useAuth";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";

export default function CronogramaMinimalista() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [selectedItem, setSelectedItem] = useState<OrdemCarregamento | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Hook para instalações da equipe (da tabela instalacoes)
  const { 
    instalacoes,
    isLoading: isLoadingInstalacoes, 
    equipeNome,
    equipeCor,
    temEquipe 
  } = useInstalacoesMinhaEquipeCalendario(currentDate, viewType);

  // Hook para neo instalações da equipe
  const { 
    neoInstalacoes,
    isLoading: isLoadingNeo 
  } = useNeoInstalacoesMinhaEquipe(currentDate, viewType);

  const isLoading = isLoadingInstalacoes || isLoadingNeo;

  // Converter instalações para formato de OrdemCarregamento para compatibilidade com calendário
  const ordensFromInstalacoes: OrdemCarregamento[] = instalacoes.map(inst => ({
    id: inst.id,
    pedido_id: null,
    venda_id: inst.venda_id || null,
    nome_cliente: inst.nome_cliente || inst.venda?.cliente_nome || 'Cliente',
    data_carregamento: inst.data_instalacao || null,
    hora_carregamento: inst.hora || null,
    hora: inst.hora || null,
    tipo_carregamento: null,
    status: inst.status || 'pendente',
    observacoes: inst.observacoes || null,
    responsavel_carregamento_id: null,
    responsavel_carregamento_nome: null,
    latitude: null,
    longitude: null,
    geocode_precision: null,
    last_geocoded_at: null,
    carregamento_concluido: false,
    carregamento_concluido_em: null,
    carregamento_concluido_por: null,
    created_at: null,
    updated_at: null,
    created_by: null,
    venda: inst.venda ? {
      id: inst.venda.id,
      cliente_nome: inst.venda.cliente_nome,
      cliente_telefone: inst.venda.cliente_telefone || null,
      cliente_email: inst.venda.cliente_email || null,
      estado: inst.venda.estado || null,
      cidade: inst.venda.cidade || null,
      cep: inst.venda.cep || null,
      bairro: inst.venda.bairro || null,
      data_prevista_entrega: null,
      tipo_entrega: null,
    } : undefined,
    _corEquipe: inst._corEquipe,
    _isInstalacao: true
  } as OrdemCarregamento));

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

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Se não tem equipe, mostrar mensagem
  if (!isLoading && !temEquipe) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        <AnimatedBreadcrumb 
          items={[
            { label: "Home", path: "/home" },
            { label: "Logística", path: "/logistica" },
            { label: "Instalações", path: "/logistica/instalacoes" },
            { label: "Cronograma" }
          ]} 
          mounted={mounted} 
        />
        <SpaceParticles />
        
        <div className="relative z-10 min-h-screen flex flex-col pt-14">
          <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/logistica/instalacoes')}
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
                  onClick={() => navigate('/logistica/instalacoes')}
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

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Instalações", path: "/logistica/instalacoes" },
          { label: "Cronograma" }
        ]} 
        mounted={mounted} 
      />
      <SpaceParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col pt-14">
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/logistica/instalacoes')}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-white">Cronograma</h1>
                  {equipeNome && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: equipeCor ? `${equipeCor}20` : 'rgba(59, 130, 246, 0.2)',
                        color: equipeCor || '#3B82F6',
                        border: `1px solid ${equipeCor || '#3B82F6'}40`
                      }}
                    >
                      {equipeNome}
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
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Calendário - Modo Somente Visualização */}
              <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  {isMobile ? (
                    <CalendarioSemanalExpedicaoMobile
                      startDate={weekStart}
                      ordens={ordensFromInstalacoes}
                      neoInstalacoes={neoInstalacoes}
                      onPreviousWeek={handlePreviousWeek}
                      onNextWeek={handleNextWeek}
                      onToday={handleToday}
                      onDayClick={() => {}}
                      onOrdemClick={handleOrdemClick}
                    />
                  ) : viewType === 'week' ? (
                    <CalendarioSemanalExpedicaoDesktop
                      startDate={weekStart}
                      ordens={ordensFromInstalacoes}
                      neoInstalacoes={neoInstalacoes}
                      onPreviousWeek={handlePreviousWeek}
                      onNextWeek={handleNextWeek}
                      onToday={handleToday}
                      onOrdemClick={handleOrdemClick}
                      readOnly
                    />
                  ) : (
                    <CalendarioMensalExpedicaoDesktop
                      currentMonth={currentDate}
                      ordens={ordensFromInstalacoes}
                      neoInstalacoes={neoInstalacoes}
                      onMonthChange={handleMonthChange}
                      onOrdemClick={handleOrdemClick}
                      readOnly
                    />
                  )}
                </CardContent>
              </Card>
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
