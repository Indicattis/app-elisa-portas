import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarioSemanalMobile } from "@/components/instalacoes/CalendarioSemanalMobile";
import { CalendarioMensalDesktop } from "@/components/instalacoes/CalendarioMensalDesktop";
import { CalendarioSemanalDesktop } from "@/components/instalacoes/CalendarioSemanalDesktop";
import { EquipesSlider } from "@/components/instalacoes/EquipesSlider";
import { useInstalacoes } from "@/hooks/useInstalacoes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Instalacao } from "@/types/instalacao";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { format } from "date-fns";
import logoInstalacoes from "@/assets/logo-instalacoes.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { InstalacaoForm } from "@/components/instalacoes/InstalacaoForm";
import { useInstalacoesPDFData } from "@/hooks/useInstalacoesPDFData";
import { baixarCronogramaInstalacoesPDF } from "@/utils/instalacoesCronogramaPDF";

export default function InstalacoesMobile() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<string | null>(null);
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'semanal' | 'mensal'>('mensal');
  const { instalacoes, isLoading, deleteInstalacao, updateInstalacao, isUpdating } = useInstalacoes(
    currentDate, 
    tipoVisualizacao === 'mensal' ? 'month' : 'week'
  );
  const { prepararDadosPDF } = useInstalacoesPDFData();
  
  const [instalacaoToDelete, setInstalacaoToDelete] = useState<string | null>(null);
  const [instalacaoToEdit, setInstalacaoToEdit] = useState<Instalacao | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Filtrar instalações por equipe
  const instalacoesFiltradas = equipeSelecionadaId
    ? instalacoes.filter((inst) => inst.equipe_id === equipeSelecionadaId)
    : instalacoes;

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleUpdateInstalacao = async (params: { id: string; data: Partial<Instalacao> }) => {
    await updateInstalacao(params);
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    navigate(`/instalacoes/nova?data=${dateStr}`);
  };

  const handleEdit = (instalacao: Instalacao) => {
    setInstalacaoToEdit(instalacao);
    setEditSheetOpen(true);
  };

  const handleEditSubmit = async (data: any) => {
    if (!instalacaoToEdit) return;
    
    try {
      await updateInstalacao({
        id: instalacaoToEdit.id,
        data,
      });
      setEditSheetOpen(false);
      setInstalacaoToEdit(null);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  const handleDelete = (id: string) => {
    setInstalacaoToDelete(id);
  };

  const confirmDelete = async () => {
    if (!instalacaoToDelete) return;
    
    try {
      await deleteInstalacao(instalacaoToDelete);
      setInstalacaoToDelete(null);
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const handleBaixarPDF = () => {
    if (instalacoesFiltradas.length === 0) {
      toast.info("Não há instalações para gerar o PDF");
      return;
    }

    const dadosPDF = prepararDadosPDF(
      instalacoesFiltradas,
      equipeSelecionadaId,
      currentDate,
      isMobile ? 'semanal' : tipoVisualizacao
    );
    
    baixarCronogramaInstalacoesPDF(dadosPDF);
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img 
              src={logoInstalacoes} 
              alt="Logo" 
              className="h-9 w-9 object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Instalações</h1>
              <p className="text-xs text-muted-foreground">Gerenciar instalações</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isMobile && (
              <div className="flex gap-1 border rounded-md p-1 mr-2">
                <Button
                  variant={tipoVisualizacao === 'semanal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTipoVisualizacao('semanal')}
                  className="h-8 text-xs"
                >
                  Semana
                </Button>
                <Button
                  variant={tipoVisualizacao === 'mensal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTipoVisualizacao('mensal')}
                  className="h-8 text-xs"
                >
                  Mês
                </Button>
              </div>
            )}
            <Button
              onClick={handleBaixarPDF}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              onClick={() => navigate("/instalacoes/nova")}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="p-4 pb-8 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <>
            <EquipesSlider
              equipeSelecionadaId={equipeSelecionadaId}
              onEquipeChange={setEquipeSelecionadaId}
            />
            
            {isMobile ? (
              <CalendarioSemanalMobile
                startDate={currentDate}
                instalacoes={instalacoesFiltradas}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onToday={handleToday}
                onDayClick={handleDayClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <>
                {tipoVisualizacao === 'semanal' ? (
                  <CalendarioSemanalDesktop
                    startDate={currentDate}
                    instalacoes={instalacoesFiltradas}
                    onPreviousWeek={handlePreviousWeek}
                    onNextWeek={handleNextWeek}
                    onToday={handleToday}
                    onUpdateInstalacao={handleUpdateInstalacao}
                    onDayClick={handleDayClick}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ) : (
                  <CalendarioMensalDesktop
                    currentMonth={currentDate}
                    instalacoes={instalacoesFiltradas}
                    onMonthChange={setCurrentDate}
                    onUpdateInstalacao={handleUpdateInstalacao}
                    onDayClick={handleDayClick}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!instalacaoToDelete} onOpenChange={() => setInstalacaoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta instalação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet de Edição */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Instalação</SheetTitle>
            <SheetDescription>
              Atualize as informações da instalação
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {instalacaoToEdit && (
              <InstalacaoForm
                onSubmit={handleEditSubmit}
                initialData={{
                  id_venda: instalacaoToEdit.id_venda,
                  nome_cliente: instalacaoToEdit.nome_cliente,
                  data: instalacaoToEdit.data,
                  hora: instalacaoToEdit.hora,
                  produto: instalacaoToEdit.produto,
                  estado: instalacaoToEdit.estado,
                  cidade: instalacaoToEdit.cidade,
                  endereco: instalacaoToEdit.endereco || "",
                  cep: instalacaoToEdit.cep || "",
                  descricao: instalacaoToEdit.descricao || "",
                  equipe_id: instalacaoToEdit.equipe_id || "",
                }}
                isLoading={isUpdating}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
