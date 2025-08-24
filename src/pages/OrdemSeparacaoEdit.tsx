import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save } from "lucide-react";

export default function OrdemSeparacaoEdit() {
  const { ordemId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ordem, setOrdem] = useState<any>(null);

  useEffect(() => {
    if (ordemId) {
      fetchOrdem();
    }
  }, [ordemId]);

  const fetchOrdem = async () => {
    try {
      const { data, error } = await supabase
        .from("ordens_producao")
        .select("*")
        .eq("id", ordemId)
        .single();

      if (error) throw error;
      setOrdem(data);
    } catch (error) {
      console.error("Erro ao buscar ordem:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar ordem de separação",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("ordens_producao")
        .update({
          observacoes: ordem.observacoes,
          // Adicionar outros campos específicos da separação aqui
        })
        .eq("id", ordemId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ordem de separação atualizada com sucesso",
      });

      navigate("/dashboard/pedidos");
    } catch (error) {
      console.error("Erro ao salvar ordem:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar ordem de separação",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando ordem...</div>
      </div>
    );
  }

  if (!ordem) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Ordem não encontrada</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/pedidos")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Ordem de Separação</h1>
          <p className="text-muted-foreground">ID: {ordem.id}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Ordem de Separação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={ordem.status || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="tipo_ordem">Tipo de Ordem</Label>
              <Input
                id="tipo_ordem"
                value={ordem.tipo_ordem || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={ordem.observacoes || ''}
              onChange={(e) => setOrdem(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações sobre a ordem de separação..."
              rows={4}
            />
          </div>

          {/* Campos específicos da separação serão adicionados aqui */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Campos específicos da ordem de separação serão implementados conforme necessário.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/pedidos")}
        >
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}