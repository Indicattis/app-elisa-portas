import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormEquipe } from "./FormEquipe";
import { FormPonto } from "./FormPonto";
import { ListaEquipes } from "./ListaEquipes";

interface GerenciarEquipesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarEquipes({ open, onOpenChange }: GerenciarEquipesProps) {
  const [showFormEquipe, setShowFormEquipe] = useState(false);
  const [showFormPonto, setShowFormPonto] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Instalações</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="equipes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="equipes">Equipes</TabsTrigger>
            <TabsTrigger value="pontos">Pontos de Instalação</TabsTrigger>
          </TabsList>

          <TabsContent value="equipes" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowFormEquipe(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Equipe
              </Button>
            </div>
            <ListaEquipes />
          </TabsContent>

          <TabsContent value="pontos" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowFormPonto(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Ponto
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Pontos criados podem ser arrastados no cronograma para reorganizar as instalações.
            </div>
          </TabsContent>
        </Tabs>

        <FormEquipe 
          open={showFormEquipe} 
          onOpenChange={setShowFormEquipe}
        />

        <FormPonto 
          open={showFormPonto} 
          onOpenChange={setShowFormPonto}
        />
      </DialogContent>
    </Dialog>
  );
}