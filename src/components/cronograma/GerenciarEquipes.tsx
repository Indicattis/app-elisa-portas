import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormEquipe } from "./FormEquipe";
import { ListaEquipes } from "./ListaEquipes";

interface GerenciarEquipesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarEquipes({ open, onOpenChange }: GerenciarEquipesProps) {
  const [showFormEquipe, setShowFormEquipe] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Equipes de Instalação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowFormEquipe(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Equipe
            </Button>
          </div>
          <ListaEquipes />
        </div>

        <FormEquipe 
          open={showFormEquipe} 
          onOpenChange={setShowFormEquipe}
        />
      </DialogContent>
    </Dialog>
  );
}