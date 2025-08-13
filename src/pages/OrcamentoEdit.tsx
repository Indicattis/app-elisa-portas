import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NovoOrcamentoForm } from "@/components/orcamentos/NovoOrcamentoForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function OrcamentoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orcamento, setOrcamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrcamento();
    }
  }, [id]);

  const fetchOrcamento = async () => {
    try {
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          elisaportas_leads (nome, telefone, email),
          orcamento_produtos (*),
          admin_users!orcamentos_atendente_id_fkey (nome, foto_perfil_url)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Verificar se pode editar
      const canEdit = ['pendente', 'aprovado'].includes(data.status);
      if (!canEdit) {
        toast({
          variant: "destructive",
          title: "Acesso negado",
          description: "Este orçamento não pode mais ser editado",
        });
        navigate("/dashboard/orcamentos");
        return;
      }

      setOrcamento(data);
    } catch (error) {
      console.error("Erro ao buscar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar orçamento",
      });
      navigate("/dashboard/orcamentos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!orcamento) {
    return <div>Orçamento não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/orcamentos")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Orçamento</h1>
          <p className="text-muted-foreground">
            Cliente: {orcamento.elisaportas_leads?.nome}
          </p>
        </div>
      </div>

      <NovoOrcamentoForm 
        initialData={orcamento}
        isEdit={true}
        onCancel={() => navigate("/dashboard/orcamentos")}
      />
    </div>
  );
}