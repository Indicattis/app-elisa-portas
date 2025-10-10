import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Plus, Filter } from "lucide-react";
import { CronogramaInstalacao } from "@/components/cronograma/CronogramaInstalacao";
import { GerenciarEquipes } from "@/components/cronograma/GerenciarEquipes";
import { useInstalacoesCronograma } from "@/hooks/useInstalacoesCronograma";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { baixarCronogramaPDF } from "@/utils/cronogramaPDFGenerator";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function CronogramaInstalacoes() {
  const [equipesModalOpen, setEquipesModalOpen] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [equipesSelecionadas, setEquipesSelecionadas] = useState<string[]>([]);

  const { instalacoes, loading } = useInstalacoesCronograma(weekStartDate);
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
        equipes,
        weekStart: weekStartDate
      });
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF do cronograma");
    }
  };

  const handlePreviousWeek = () => {
    setWeekStartDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStartDate(prev => addDays(prev, 7));
  };

  const handleToday = () => {
    setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  if (loading || equipesLoading) {
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
              Semana de {format(weekStartDate, "dd/MM/yyyy", { locale: ptBR })} a {format(addDays(weekStartDate, 6), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" onClick={handlePreviousWeek}>
            Anterior
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" onClick={handleNextWeek}>
            Próxima
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Equipes
                {equipesSelecionadas.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {equipesSelecionadas.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtrar por Equipes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {equipes.map((equipe) => (
                <DropdownMenuCheckboxItem
                  key={equipe.id}
                  checked={equipesSelecionadas.includes(equipe.id)}
                  onCheckedChange={() => toggleEquipe(equipe.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: equipe.cor }}
                    />
                    {equipe.nome}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              {equipesSelecionadas.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={limparFiltros}
                  >
                    Limpar Filtros
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setEquipesModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Gerenciar Equipes
          </Button>
          <Button variant="secondary" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visualização Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <CronogramaInstalacao
            currentWeek={weekStartDate}
            onEditPonto={() => {}}
            equipesFiltradas={equipesFiltradas}
          />
        </CardContent>
      </Card>

      <GerenciarEquipes 
        open={equipesModalOpen}
        onOpenChange={setEquipesModalOpen}
      />
    </div>
  );
}
