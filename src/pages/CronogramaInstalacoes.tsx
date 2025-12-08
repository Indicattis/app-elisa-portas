import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Plus, Filter, ChevronLeft, ChevronRight, CalendarDays, Menu, Settings } from "lucide-react";
import { CronogramaInstalacao } from "@/components/cronograma/CronogramaInstalacao";
import { CronogramaInstalacaoMensal } from "@/components/cronograma/CronogramaInstalacaoMensal";
import { GerenciarEquipes } from "@/components/cronograma/GerenciarEquipes";
import { useOrdensInstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { format, addDays, startOfWeek, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { baixarCronogramaPDF } from "@/utils/cronogramaPDFGenerator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

export default function CronogramaInstalacoes() {
  const [equipesModalOpen, setEquipesModalOpen] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [equipesSelecionadas, setEquipesSelecionadas] = useState<string[]>([]);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
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
    try {
      toast.loading("Gerando PDF do cronograma...");
      
      baixarCronogramaPDF({
        instalacoes,
        equipes: equipesFiltradas,
        weekStart: weekStartDate
      });
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF do cronograma");
    }
  };

  const handlePreviousWeek = () => {
    setSlideDirection('left');
    if (viewMode === 'month') {
      setWeekStartDate(prev => addMonths(prev, -1));
    } else {
      setWeekStartDate(prev => addDays(prev, -7));
    }
  };

  const handleNextWeek = () => {
    setSlideDirection('right');
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

  if (isLoading || equipesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Cronograma de Instalações</h1>
            <p className="text-muted-foreground">
              {viewMode === 'week' ? (
                <>Semana de {format(weekStartDate, "dd/MM/yyyy", { locale: ptBR })} a {format(addDays(weekStartDate, 6), "dd/MM/yyyy", { locale: ptBR })}</>
              ) : (
                <>{format(weekStartDate, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}</>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Menu Hamburguer */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
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

          <Button variant="outline" onClick={handleToday}>
            Hoje
          </Button>
        </div>
      </div>

      <Card className="relative">
        <CardHeader>
          <CardTitle>{viewMode === 'week' ? 'Visualização Semanal' : 'Visualização Mensal'}</CardTitle>
        </CardHeader>
        <CardContent className="relative px-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousWeek}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:scale-110 shadow-lg transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div 
            key={weekStartDate.toISOString()}
            className="animate-fade-in"
          >
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
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:scale-110 shadow-lg transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </CardContent>
      </Card>

      <GerenciarEquipes 
        open={equipesModalOpen}
        onOpenChange={setEquipesModalOpen}
      />
    </div>
  );
}
