import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarioSemanalMobile } from "@/components/instalacoes/CalendarioSemanalMobile";
import { EquipesSlider } from "@/components/instalacoes/EquipesSlider";
import { useInstalacoes } from "@/hooks/useInstalacoes";
import { Instalacao } from "@/types/instalacao";
import { addWeeks, subWeeks } from "date-fns";
import { format } from "date-fns";
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

export default function InstalacoesMobile() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<string | null>(null);
  const { instalacoes, isLoading, deleteInstalacao, updateInstalacao, isUpdating } = useInstalacoes(currentDate);
  
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

  const handleToday = () => {
    setCurrentDate(new Date());
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Instalações</h1>
              <p className="text-xs text-muted-foreground">Gerenciar instalações</p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate("/instalacoes/nova")}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova</span>
          </Button>
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
                  equipe_id: instalacaoToEdit.equipe_id || undefined,
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
