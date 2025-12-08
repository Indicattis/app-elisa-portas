import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstalacaoForm } from "@/components/instalacoes/InstalacaoForm";
import { useInstalacoes } from "@/hooks/useInstalacoes";
import { InstalacaoFormData } from "@/types/instalacao";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function InstalacoesEditar() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateInstalacao, isUpdating } = useInstalacoes();
  
  const [initialData, setInitialData] = useState<Partial<InstalacaoFormData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInstalacao(id);
    }
  }, [id]);

  const loadInstalacao = async (instalacaoId: string) => {
    try {
      const { data, error } = await supabase
        .from("instalacoes")
        .select(`
          *,
          equipe:equipes_instalacao(id, nome, cor)
        `)
        .eq("id", instalacaoId)
        .single();

      if (error) throw error;

      if (data) {
        setInitialData({
          id_venda: data.venda_id,
          nome_cliente: data.nome_cliente,
          data: data.data_instalacao || "",
          hora: data.hora || "08:00",
          equipe_id: data.responsavel_instalacao_id || "",
          cep: data.cep || "",
          endereco: data.endereco || "",
          estado: data.estado || "",
          cidade: data.cidade || "",
          telefone_cliente: data.telefone_cliente || "",
          cor_id: data.cor_id || "",
          observacoes: data.observacoes || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar instalação:", error);
      toast.error("Erro ao carregar instalação");
      navigate("/instalacoes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: InstalacaoFormData) => {
    if (!id) return;
    
    try {
      await updateInstalacao({
        id,
        data: {
          id_venda: data.id_venda,
          nome_cliente: data.nome_cliente,
          data: data.data,
          hora: data.hora,
          equipe_id: data.equipe_id,
          cep: data.cep,
          endereco: data.endereco,
          estado: data.estado,
          cidade: data.cidade,
          telefone_cliente: data.telefone_cliente,
          cor_id: data.cor_id,
          observacoes: data.observacoes,
        },
      });
      navigate("/instalacoes");
    } catch (error) {
      console.error("Erro ao atualizar instalação:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Instalação não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/instalacoes")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Editar Instalação</h1>
            <p className="text-sm text-muted-foreground">Atualizar dados da instalação</p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="p-4 pb-8 max-w-2xl mx-auto">
        <InstalacaoForm
          onSubmit={handleSubmit}
          initialData={initialData}
          isLoading={isUpdating}
        />
      </main>
    </div>
  );
}
