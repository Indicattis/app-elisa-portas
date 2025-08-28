import { useState } from "react";

interface DraggedItem {
  id: string;
  equipId: string;
  cidade: string;
}

export function useDragAndDrop() {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);

  const handleDragStart = (item: DraggedItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return {
    draggedItem,
    handleDragStart,
    handleDragEnd
  };
}