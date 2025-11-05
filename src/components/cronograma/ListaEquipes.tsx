import { useState } from "react";
import { Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { useEquipesMembros } from "@/hooks/useEquipesMembros";
import { EquipeMembrosList } from "./EquipeMembrosList";
import { GerenciarMembrosEquipe } from "./GerenciarMembrosEquipe";

export function ListaEquipes() {
  const { equipes, loading, deleteEquipe } = useEquipesInstalacao();
  const [equipeSelecionada, setEquipeSelecionada] = useState<{ id: string; nome: string } | null>(null);

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
    <>
      <div className="space-y-3">
        {equipes.map((equipe) => {
          const EquipeMembrosWrapper = () => {
            const { membros } = useEquipesMembros(equipe.id);
            return <EquipeMembrosList membros={membros} compact />;
          };

          return (
            <Card key={equipe.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full mt-1" 
                      style={{ backgroundColor: equipe.cor }}
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-medium">{equipe.nome}</h4>
                        <p className="text-sm text-muted-foreground">
                          Criada em {new Date(equipe.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <EquipeMembrosWrapper />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEquipeSelecionada({ id: equipe.id, nome: equipe.nome })}
                      title="Gerenciar membros"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
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
          );
        })}
      </div>

      {equipeSelecionada && (
        <GerenciarMembrosEquipe
          open={!!equipeSelecionada}
          onOpenChange={(open) => !open && setEquipeSelecionada(null)}
          equipeId={equipeSelecionada.id}
          equipeNome={equipeSelecionada.nome}
        />
      )}
    </>
  );
}