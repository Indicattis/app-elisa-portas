import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SortableCidadeCollapsible, OrfaosCollapsible } from './CidadeCollapsible';
import type { Estado, Cidade, AutorizadoResumo } from '@/hooks/useEstadosCidades';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface EstadoDetalheViewProps {
  estado: Estado;
  cidades: Cidade[];
  autorizadosOrfaos: AutorizadoResumo[];
  loading: boolean;
  onVoltar: () => void;
  onNovaCidade: () => void;
  onEditEstado: () => void;
  onDeleteEstado: () => void;
  onEditCidade: (cidade: Cidade) => void;
  onDeleteCidade: (id: string) => void;
  onEditAutorizado: (id: string) => void;
  onDeleteAutorizado: (id: string) => void;
  onTogglePremium: (id: string, isPremium: boolean) => void;
  onReordenarCidades?: (cidades: Cidade[]) => void;
}

export function EstadoDetalheView({
  estado,
  cidades,
  autorizadosOrfaos,
  loading,
  onVoltar,
  onNovaCidade,
  onEditEstado,
  onDeleteEstado,
  onEditCidade,
  onDeleteCidade,
  onEditAutorizado,
  onDeleteAutorizado,
  onTogglePremium,
  onReordenarCidades,
}: EstadoDetalheViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReordenarCidades) return;

    const oldIndex = cidades.findIndex(c => c.id === active.id);
    const newIndex = cidades.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(cidades, oldIndex, newIndex);
    onReordenarCidades(reordered);
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {cidades.length === 0 && autorizadosOrfaos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 mb-4">Nenhuma cidade cadastrada para este estado</p>
              <Button onClick={onNovaCidade} variant="outline" className="bg-primary/10 border-primary/20">
                <Plus className="h-4 w-4 mr-1" />
                Cadastrar Cidade
              </Button>
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={cidades.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {cidades.map(cidade => (
                    <SortableCidadeCollapsible
                      key={cidade.id}
                      cidade={cidade}
                      onEditAutorizado={onEditAutorizado}
                      onDeleteAutorizado={onDeleteAutorizado}
                      onTogglePremium={onTogglePremium}
                      onEditCidade={onEditCidade}
                      onDeleteCidade={onDeleteCidade}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <OrfaosCollapsible
                autorizados={autorizadosOrfaos}
                onEditAutorizado={onEditAutorizado}
                onDeleteAutorizado={onDeleteAutorizado}
                onTogglePremium={onTogglePremium}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
