
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, List, Grid } from "lucide-react";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { useOrcamentoFiltersAdvanced } from "@/hooks/useOrcamentoFiltersAdvanced";
import { OrcamentoFiltersAdvanced } from "@/components/orcamentos/OrcamentoFiltersAdvanced";
import { OrcamentoTable } from "@/components/orcamentos/OrcamentoTable";
import { OrcamentoListView } from "@/components/orcamentos/OrcamentoListView";
import { OrcamentoStats } from "@/components/orcamentos/OrcamentoStats";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Orcamentos() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const { toast } = useToast();

  const {
    leads,
    orcamentos,
    fetchOrcamentos
  } = useOrcamentos();

  const {
    filters,
    setFilters,
    filteredOrcamentos
  } = useOrcamentoFiltersAdvanced(orcamentos);

  // Extrair atendentes únicos dos orçamentos
  const atendentes = orcamentos
    .filter(orc => orc.admin_users)
    .reduce((acc: any[], orc) => {
      const atendente = orc.admin_users;
      if (!acc.find(a => a.id === atendente.user_id)) {
        acc.push({
          id: atendente.user_id,
          nome: atendente.nome
        });
      }
      return acc;
    }, []);

  const handleEdit = (orcamento: any) => {
    navigate(`/dashboard/orcamentos/editar/${orcamento.id}`);
  };

  const handleDelete = async (orcamento: any) => {
    if (!confirm("Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("orcamentos")
        .delete()
        .eq("id", orcamento.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso",
      });

      fetchOrcamentos();
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir orçamento",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie orçamentos dos leads</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'list' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={() => navigate("/dashboard/orcamentos/novo")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      <OrcamentoStats orcamentos={filteredOrcamentos} />

      <OrcamentoFiltersAdvanced 
        filters={filters}
        setFilters={setFilters}
        atendentes={atendentes}
      />

      {viewMode === 'list' ? (
        <OrcamentoListView
          orcamentos={filteredOrcamentos}
          onEdit={handleEdit}
          onRefresh={fetchOrcamentos}
        />
      ) : (
        <OrcamentoTable
          orcamentos={filteredOrcamentos}
          onEdit={handleEdit}
          onRefresh={fetchOrcamentos}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
