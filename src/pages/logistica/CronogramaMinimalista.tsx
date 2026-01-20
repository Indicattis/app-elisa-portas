import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Download, ChevronLeft, ChevronRight, CalendarDays, Menu, Settings, ArrowLeft, LogOut } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CronogramaInstalacao } from "@/components/cronograma/CronogramaInstalacao";
import { CronogramaInstalacaoMensal } from "@/components/cronograma/CronogramaInstalacaoMensal";
import { GerenciarEquipes } from "@/components/cronograma/GerenciarEquipes";
import { useOrdensInstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { format, addDays, startOfWeek, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { baixarCronogramaPDF } from "@/utils/cronogramaPDFGenerator";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function CronogramaMinimalista() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [equipesModalOpen, setEquipesModalOpen] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [equipesSelecionadas, setEquipesSelecionadas] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [menuOpen, setMenuOpen] = useState(false);

  const { instalacoes, isLoading } = useOrdensInstalacaoCalendario(weekStartDate, viewMode);
  const { equipes, loading: equipesLoading } = useEquipesInstalacao();

  const equipesFiltradas = equipesSelecionadas.length > 0 
    ? equipes.filter(eq => equipesSelecionadas.includes(eq.id))
    : equipes;

  const toggleEquipe = (equipeId: string) => {
    setEquipesSelecionadas(prev =>
      prev.includes(equipeId)
        ? prev.filter(id => id !== equipeId)
        : [...prev, equipeId]
    );
  };

  const limparFiltros = () => {
    setEquipesSelecionadas([]);
  };

  const handleDownloadPDF = () => {
    const toastId = toast.loading("Gerando PDF do cronograma...");
    try {
      baixarCronogramaPDF({
        instalacoes,
        equipes: equipesFiltradas,
        weekStart: weekStartDate
      });
      toast.success("PDF gerado com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF do cronograma", { id: toastId });
    }
  };

  const handlePreviousWeek = () => {
    if (viewMode === 'month') {
      setWeekStartDate(prev => addMonths(prev, -1));
    } else {
      setWeekStartDate(prev => addDays(prev, -7));
    }
  };

  const handleNextWeek = () => {
    if (viewMode === 'month') {
      setWeekStartDate(prev => addMonths(prev, 1));
    } else {
      setWeekStartDate(prev => addDays(prev, 7));
    }
  };

  const handleToday = () => {
    if (viewMode === 'month') {
      setWeekStartDate(startOfMonth(new Date()));
    } else {
      setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    }
  };

  const weekEnd = addDays(weekStartDate, 6);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <SpaceParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col">
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
                <h1 className="text-lg font-semibold text-white">Cronograma</h1>
                <p className="text-xs text-white/60">
                  {viewMode === 'week' 
                    ? `${format(weekStartDate, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`
                    : format(weekStartDate, "MMMM 'de' yyyy", { locale: ptBR })
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Menu Hamburguer */}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-primary/10"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Menu de Opções</SheetTitle>
                    <SheetDescription>
                      Filtros e configurações do cronograma
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* Visualização */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Visualização</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant={viewMode === 'week' ? 'default' : 'outline'} 
                          className="flex-1"
                          onClick={() => {
                            setViewMode('week');
                            setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Semana
                        </Button>
                        <Button 
                          variant={viewMode === 'month' ? 'default' : 'outline'} 
                          className="flex-1"
                          onClick={() => {
                            setViewMode('month');
                            setWeekStartDate(startOfMonth(new Date()));
                          }}
                        >
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Mês
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Filtrar Equipes */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Filtrar por Equipes</Label>
                        {equipesSelecionadas.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={limparFiltros}
                            className="h-auto p-1 text-xs"
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {equipes.map((equipe) => (
                          <div key={equipe.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={equipe.id}
                              checked={equipesSelecionadas.includes(equipe.id)}
                              onCheckedChange={() => toggleEquipe(equipe.id)}
                            />
                            <Label
                              htmlFor={equipe.id}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: equipe.cor || '#888' }}
                              />
                              {equipe.nome}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Ações */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Ações</Label>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          onClick={() => {
                            setEquipesModalOpen(true);
                            setMenuOpen(false);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Gerenciar Equipes
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            handleDownloadPDF();
                            setMenuOpen(false);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

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
          {(isLoading || equipesLoading) ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">
                    {viewMode === 'week' ? 'Visualização Semanal' : 'Visualização Mensal'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative px-12">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousWeek}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  
                  <div key={weekStartDate.toISOString()} className="animate-fade-in">
                    {viewMode === 'week' ? (
                      <CronogramaInstalacao
                        currentWeek={weekStartDate}
                        onEditPonto={() => {}}
                        equipesFiltradas={equipesFiltradas}
                      />
                    ) : (
                      <CronogramaInstalacaoMensal
                        currentMonth={weekStartDate}
                        onEditPonto={() => {}}
                        equipesFiltradas={equipesFiltradas}
                      />
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextWeek}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      <GerenciarEquipes 
        open={equipesModalOpen}
        onOpenChange={setEquipesModalOpen}
      />
    </div>
  );
}
