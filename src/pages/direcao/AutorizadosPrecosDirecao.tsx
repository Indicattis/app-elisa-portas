import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';
import { useEstadosCidades } from '@/hooks/useEstadosCidades';
import { SortableEstadoCard } from '@/components/autorizados/EstadoCard';
import { NovoEstadoDialog } from '@/components/autorizados/NovoEstadoDialog';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';

export default function AutorizadosPrecosDirecao() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  
  const {
    estados,
    loading,
    criarEstado,
    editarEstado,
    reordenarEstados
  } = useEstadosCidades();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = estados.findIndex(e => e.id === active.id);
      const newIndex = estados.findIndex(e => e.id === over?.id);
      const newOrder = arrayMove(estados, oldIndex, newIndex);
      reordenarEstados(newOrder);
    }
  };

  const [novoEstadoOpen, setNovoEstadoOpen] = useState(false);
  const [estadoParaEditar, setEstadoParaEditar] = useState<typeof estados[0] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleCloseEstadoDialog = (open: boolean) => {
    setNovoEstadoOpen(open);
    if (!open) setEstadoParaEditar(null);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Direção", path: "/direcao" },
          { label: "Autorizados" }
        ]} 
        mounted={mounted} 
      />
      
      <div className="pt-12">
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/direcao')}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Gestão de Autorizados</h1>
                <p className="text-xs text-white/60">{estados.length} estados cadastrados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/direcao/autorizados/novo')}
                className="bg-primary/20 hover:bg-primary/30 border border-primary/30"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Autorizado
              </Button>
              <Button
                onClick={() => setNovoEstadoOpen(true)}
                variant="outline"
                className="border-primary/30 text-white/80"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Estado
              </Button>
            </div>
          </div>
        </header>

        <div className="px-4 py-4 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-medium text-white/70 mb-3">Estados Cadastrados</h2>
              {estados.length === 0 ? (
                <div className="text-center py-8 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-white/60 mb-4">Nenhum estado cadastrado</p>
                  <Button onClick={() => setNovoEstadoOpen(true)} variant="outline" className="bg-primary/10 border-primary/20">
                    <Plus className="h-4 w-4 mr-1" />
                    Cadastrar Estado
                  </Button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={estados.map(e => e.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {estados.map(estado => (
                        <SortableEstadoCard
                          key={estado.id}
                          estado={estado}
                          onClick={() => navigate(`/direcao/autorizados/estado/${estado.id}`)}
                          isSelected={false}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </div>
      </div>

      <NovoEstadoDialog
        open={novoEstadoOpen}
        onOpenChange={handleCloseEstadoDialog}
        onSave={criarEstado}
        estadoParaEditar={estadoParaEditar}
        onUpdate={editarEstado}
        estadosCadastrados={estados.map(e => e.sigla)}
      />
    </div>
  );
}
