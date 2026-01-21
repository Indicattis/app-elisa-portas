import { useState } from 'react';
import { Settings2, GripVertical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnConfig } from '@/hooks/useColumnConfig';
import { cn } from '@/lib/utils';

interface SortableColumnItemProps {
  column: ColumnConfig;
  isVisible: boolean;
  onToggle: () => void;
  isDragging?: boolean;
}

function SortableColumnItem({ column, isVisible, onToggle, isDragging = false }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSorting ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors bg-zinc-900",
        isDragging && "shadow-lg ring-2 ring-blue-500/50",
        !isDragging && "hover:bg-primary/10"
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing text-white/40 hover:text-white/70 p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <Checkbox
        id={column.id}
        checked={isVisible}
        onCheckedChange={onToggle}
        className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
      />
      
      <label
        htmlFor={column.id}
        className="flex-1 text-sm text-white cursor-pointer select-none"
      >
        {column.label}
      </label>
    </div>
  );
}

// Componente separado para o overlay durante o drag
function DragOverlayItem({ column }: { column: ColumnConfig | null }) {
  if (!column) return null;
  
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800 shadow-xl ring-2 ring-blue-500">
      <div className="text-white/70 p-1">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="w-4 h-4 rounded border border-white/30" />
      <span className="flex-1 text-sm text-white">{column.label}</span>
    </div>
  );
}

interface ColumnManagerProps {
  columns: ColumnConfig[];
  visibleIds: Set<string>;
  onToggle: (id: string) => void;
  onReorder: (columns: ColumnConfig[]) => void;
  onReset: () => void;
}

export function ColumnManager({ columns, visibleIds, onToggle, onReorder, onReset }: ColumnManagerProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex(c => c.id === active.id);
      const newIndex = columns.findIndex(c => c.id === over.id);
      const newColumns = arrayMove(columns, oldIndex, newIndex);
      onReorder(newColumns);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeColumn = activeId ? columns.find(c => c.id === activeId) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-primary/5 border-primary/10 text-white hover:bg-primary/10"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Colunas
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0 bg-zinc-900 border-primary/10" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b border-primary/10">
          <h4 className="text-sm font-medium text-white">Configurar Colunas</h4>
          <p className="text-xs text-white/50 mt-1">Arraste para reordenar</p>
        </div>
        
        <div className="p-2 max-h-80 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1">
                {columns.map(column => (
                  <SortableColumnItem
                    key={column.id}
                    column={column}
                    isVisible={visibleIds.has(column.id)}
                    onToggle={() => onToggle(column.id)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              <DragOverlayItem column={activeColumn} />
            </DragOverlay>
          </DndContext>
        </div>

        <div className="p-2 border-t border-primary/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="w-full text-white/60 hover:text-white hover:bg-primary/10"
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            Restaurar Padrão
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
