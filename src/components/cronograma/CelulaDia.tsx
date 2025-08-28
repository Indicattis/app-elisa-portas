import { useState } from "react";
import { cn } from "@/lib/utils";

interface CelulaDiaProps {
  equipId: string;
  diaSemana: number;
  onDrop: (equipId: string, diaSemana: number) => void;
  draggedItem: { id: string; equipId: string; cidade: string } | null;
  children: React.ReactNode;
}

export function CelulaDia({ 
  equipId, 
  diaSemana, 
  onDrop, 
  draggedItem, 
  children 
}: CelulaDiaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const canDrop = draggedItem && draggedItem.equipId === equipId;

  const handleDragOver = (e: React.DragEvent) => {
    if (canDrop) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (canDrop) {
      onDrop(equipId, diaSemana);
      setIsDragOver(false);
    }
  };

  return (
    <div
      className={cn(
        "p-2 border-r last:border-r-0 min-h-[100px] transition-colors",
        isDragOver && canDrop && "bg-primary/10 border-primary",
        canDrop && "border-dashed"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}