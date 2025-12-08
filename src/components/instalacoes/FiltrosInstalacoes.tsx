import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Equipe {
  id: string;
  nome: string;
  cor: string | null;
}

interface FiltrosInstalacoesProps {
  equipeId: string;
  tipoInstalacao: string;
  onEquipeChange: (value: string) => void;
  onTipoInstalacaoChange: (value: string) => void;
}

export const FiltrosInstalacoes = ({
  equipeId,
  tipoInstalacao,
  onEquipeChange,
  onTipoInstalacaoChange,
}: FiltrosInstalacoesProps) => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loadingEquipes, setLoadingEquipes] = useState(true);

  useEffect(() => {
    const loadEquipes = async () => {
      setLoadingEquipes(true);
      try {
        const { data, error } = await supabase
          .from("equipes_instalacao")
          .select("id, nome, cor")
          .eq("ativa", true)
          .order("nome");

        if (error) throw error;
        setEquipes(data || []);
      } catch (error) {
        console.error("Erro ao carregar equipes:", error);
      } finally {
        setLoadingEquipes(false);
      }
    };

    loadEquipes();
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      {/* Filtro de Equipe */}
      <Select value={equipeId} onValueChange={onEquipeChange}>
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder={loadingEquipes ? "Carregando..." : "Todas as Equipes"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Equipes</SelectItem>
          <SelectItem value="sem_equipe">Sem Equipe</SelectItem>
          {equipes.map((equipe) => (
            <SelectItem key={equipe.id} value={equipe.id}>
              <div className="flex items-center gap-2">
                {equipe.cor && (
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: equipe.cor }}
                  />
                )}
                {equipe.nome}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro de Tipo de Instalação */}
      <Select value={tipoInstalacao} onValueChange={onTipoInstalacaoChange}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Tipo de Instalação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          <SelectItem value="elisa">Equipe Elisa</SelectItem>
          <SelectItem value="autorizado">Autorizado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
