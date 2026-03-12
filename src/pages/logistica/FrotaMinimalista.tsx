import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Droplet, ClipboardCheck } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useVeiculos, Veiculo } from "@/hooks/useVeiculos";
import { TrocaOleoDialog } from "@/components/frota/TrocaOleoDialog";
import { SortableVeiculoRow } from "@/components/frota/SortableVeiculoRow";
import { useAuth } from "@/hooks/useAuth";
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

export default function FrotaMinimalista() {
  const navigate = useNavigate();
  useAuth();
  const { veiculos, isLoading, deleteVeiculo, updateOrdem } = useVeiculos();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [trocaOleoOpen, setTrocaOleoOpen] = useState(false);
  const [orderedVeiculos, setOrderedVeiculos] = useState<Veiculo[]>([]);

  useEffect(() => {
    if (veiculos) setOrderedVeiculos(veiculos);
  }, [veiculos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedVeiculos.findIndex((v) => v.id === active.id);
    const newIndex = orderedVeiculos.findIndex((v) => v.id === over.id);
    const newOrder = arrayMove(orderedVeiculos, oldIndex, newIndex);
    setOrderedVeiculos(newOrder);

    await updateOrdem(newOrder.map((v, i) => ({ id: v.id, ordem: i })));
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteVeiculo(deleteId);
      setDeleteId(null);
    }
  };

  const headerActions = (
    <>
      <Button
        size="sm"
        onClick={() => navigate('/logistica/frota/conferencia')}
        className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/20 text-white shadow-lg shadow-blue-500/10 hover:from-blue-500/30 hover:to-blue-600/30 hover:scale-[1.02] transition-all duration-300 text-xs gap-1.5"
      >
        <ClipboardCheck className="h-4 w-4" />
        <span className="hidden sm:inline">Conferir</span>
      </Button>
      <Button
        size="sm"
        onClick={() => setTrocaOleoOpen(true)}
        className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/20 text-white shadow-lg shadow-blue-500/10 hover:from-blue-500/30 hover:to-blue-600/30 hover:scale-[1.02] transition-all duration-300 text-xs gap-1.5"
      >
        <Droplet className="h-4 w-4" />
        <span className="hidden sm:inline">Troca Óleo</span>
      </Button>
      <Button
        size="sm"
        onClick={() => navigate('/logistica/frota/novo')}
        className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 border border-blue-400/30 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-300 text-xs gap-1.5"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Novo</span>
      </Button>
    </>
  );

  return (
    <MinimalistLayout
      title="Frota"
      subtitle="Gerencie os veículos da empresa"
      backPath="/logistica"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Logística", path: "/logistica" },
        { label: "Frota" }
      ]}
      headerActions={headerActions}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <TooltipProvider>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="border-blue-500/10 hover:bg-white/5">
                        <TableHead className="w-8 text-xs text-white/70"></TableHead>
                        <TableHead className="text-xs text-white/70">Foto</TableHead>
                        <TableHead className="text-xs text-white/70">Modelo</TableHead>
                        <TableHead className="text-xs text-white/70">Placa</TableHead>
                        <TableHead className="text-xs text-white/70">Ano</TableHead>
                        <TableHead className="text-xs text-white/70">Apelido</TableHead>
                        <TableHead className="text-xs text-white/70">Responsável</TableHead>
                        <TableHead className="text-xs text-white/70">Mecânico</TableHead>
                        <TableHead className="text-xs text-white/70">Km Atual</TableHead>
                        <TableHead className="text-xs text-white/70">Próx. Troca Óleo</TableHead>
                        <TableHead className="text-xs text-white/70">Status</TableHead>
                        <TableHead className="text-xs text-white/70">Aviso</TableHead>
                        <TableHead className="text-xs text-white/70">Últ. Conferência</TableHead>
                        <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <SortableContext items={orderedVeiculos.map(v => v.id)} strategy={verticalListSortingStrategy}>
                      <TableBody>
                        {orderedVeiculos.map((veiculo) => (
                          <SortableVeiculoRow
                            key={veiculo.id}
                            veiculo={veiculo}
                            onDelete={setDeleteId}
                          />
                        ))}
                        {orderedVeiculos.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={13} className="text-center py-8 text-white/50">
                              Nenhum veículo cadastrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </SortableContext>
                  </Table>
                </DndContext>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      )}

      <TrocaOleoDialog
        open={trocaOleoOpen}
        onOpenChange={setTrocaOleoOpen}
        veiculos={veiculos || []}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-black/90 border-white/10 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-white/10 text-white hover:bg-white/15">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500/80 hover:bg-red-500 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
