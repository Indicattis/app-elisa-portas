import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Plus } from "lucide-react";
import { CronogramaInstalacao } from "@/components/cronograma/CronogramaInstalacao";
import { GerenciarEquipes } from "@/components/cronograma/GerenciarEquipes";
import { useInstalacoesCronograma } from "@/hooks/useInstalacoesCronograma";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { gerarCronogramaPDF } from "@/utils/cronogramaPDFGenerator";
import { toast } from "sonner";

export default function CronogramaInstalacoes() {
  const [equipesModalOpen, setEquipesModalOpen] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { instalacoes, loading } = useInstalacoesCronograma(weekStartDate);
  const { equipes, loading: equipesLoading } = useEquipesInstalacao();

  const handleDownloadPDF = () => {
    try {
      toast.loading("Gerando PDF do cronograma...");
      
      gerarCronogramaPDF({
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

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreviousWeek}>
            Anterior
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" onClick={handleNextWeek}>
            Próxima
          </Button>
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
