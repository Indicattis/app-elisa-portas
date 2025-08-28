import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";

export function ListaEquipes() {
  const { equipes, loading, deleteEquipe } = useEquipesInstalacao();

  if (loading) {
    return <div className="text-center py-4">Carregando equipes...</div>;
  }

  if (equipes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma equipe cadastrada. Clique em "Nova Equipe" para começar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {equipes.map((equipe) => (
        <Card key={equipe.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: equipe.cor }}
                />
                <div>
                  <h4 className="font-medium">{equipe.nome}</h4>
                  <p className="text-sm text-muted-foreground">
                    Criada em {new Date(equipe.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteEquipe(equipe.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}