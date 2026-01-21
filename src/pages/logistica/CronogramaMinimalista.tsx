import { useState } from "react";
import { Calendar, Download, ChevronLeft, ChevronRight, CalendarDays, Menu, Settings } from "lucide-react";
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
import { MinimalistLayout } from "@/components/MinimalistLayout";
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

  const periodLabel = viewMode === 'week' 
    ? `${format(weekStartDate, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`
    : format(weekStartDate, "MMMM 'de' yyyy", { locale: ptBR });

  if (isLoading || equipesLoading) {
    return (
      <MinimalistLayout
        title="Cronograma"
        backPath="/logistica/instalacoes"
        breadcrumbItems={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Instalações", path: "/logistica/instalacoes" },
          { label: "Cronograma" }
        ]}
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </MinimalistLayout>
    );
  }

  return (
    <MinimalistLayout
      title="Cronograma"
      subtitle={periodLabel}
      backPath="/logistica/instalacoes"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Logística", path: "/logistica" },
        { label: "Instalações", path: "/logistica/instalacoes" },
        { label: "Cronograma" }
      ]}
    >
      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="bg-primary/5 border-primary/10 text-white hover:bg-primary/10"
          >
            Hoje
          </Button>
          <div className="flex items-center gap-1 bg-primary/5 border border-primary/10 rounded-lg p-1">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('week');
                setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
              }}
              className={viewMode === 'week' 
                ? "bg-blue-500 hover:bg-blue-600 text-white" 
                : "text-white/60 hover:text-white hover:bg-primary/10"}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('month');
                setWeekStartDate(startOfMonth(new Date()));
              }}
              className={viewMode === 'month' 
                ? "bg-blue-500 hover:bg-blue-600 text-white" 
                : "text-white/60 hover:text-white hover:bg-primary/10"}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Mês
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="bg-primary/5 border-primary/10 text-white hover:bg-primary/10"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-primary/5 border-primary/10 text-white hover:bg-primary/10"
              >
                <Menu className="h-4 w-4 mr-2" />
                Filtros
                {equipesSelecionadas.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 rounded-full">
                    {equipesSelecionadas.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-zinc-900 border-primary/10">
              <SheetHeader>
                <SheetTitle className="text-white">Filtros e Opções</SheetTitle>
                <SheetDescription className="text-white/60">
                  Configure a visualização do cronograma
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Filtrar Equipes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-white">Filtrar por Equipes</Label>
                    {equipesSelecionadas.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={limparFiltros}
                        className="h-auto p-1 text-xs text-white/60 hover:text-white"
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
                          className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                        <Label
                          htmlFor={equipe.id}
                          className="flex items-center gap-2 cursor-pointer text-white/80"
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

                <Separator className="bg-white/10" />

                {/* Ações */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-white">Ações</Label>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-primary/5 border-primary/10 text-white hover:bg-primary/10" 
                    onClick={() => {
                      setEquipesModalOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Equipes
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Calendário */}
      <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl relative">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center justify-between">
            <span>{viewMode === 'week' ? 'Visualização Semanal' : 'Visualização Mensal'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative px-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousWeek}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 text-white border border-primary/10"
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
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 text-white border border-primary/10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      <GerenciarEquipes 
        open={equipesModalOpen}
        onOpenChange={setEquipesModalOpen}
      />
    </MinimalistLayout>
  );
}
