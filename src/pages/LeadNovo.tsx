
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface LeadFormData {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  canal_aquisicao: string;
  tipo_porta: string;
  mensagem: string;
  cor_porta: string;
  largura_porta: string;
  altura_porta: string;
  valor_orcamento: string;
  vendido: boolean;
}

export default function LeadNovo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [leadData, setLeadData] = useState<LeadFormData>({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    canal_aquisicao: "Google",
    tipo_porta: "",
    mensagem: "",
    cor_porta: "",
    largura_porta: "",
    altura_porta: "",
    valor_orcamento: "",
    vendido: false
  });

  const handleLeadChange = (field: keyof LeadFormData, value: string | boolean) => {
    setLeadData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar o lead - removidos campos desabilitados
      const leadInsertData = {
        nome: leadData.nome,
        email: leadData.email || null,
        telefone: leadData.telefone,
        cidade: leadData.cidade || null,
        canal_aquisicao: leadData.canal_aquisicao,
        tipo_porta: leadData.tipo_porta || null,
        mensagem: leadData.mensagem || null,
        cor_porta: leadData.cor_porta || null,
        largura_porta: leadData.largura_porta || null,
        altura_porta: leadData.altura_porta || null,
        valor_orcamento: null, // Não permitir inserir valor manualmente
        status_atendimento: 1, // Sempre aguardando
        atendente_id: null,
        data_inicio_atendimento: null,
        data_conclusao_atendimento: null
      };

      const { data: lead, error: leadError } = await supabase
        .from("elisaportas_leads")
        .insert(leadInsertData)
        .select()
        .single();

      if (leadError) throw leadError;

      toast({
        title: "Sucesso",
        description: "Lead criado com sucesso",
      });

      navigate("/dashboard/leads");
    } catch (error) {
      console.error("Erro ao criar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar lead",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/leads")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Adicionar Lead</h1>
            <p className="text-muted-foreground">Adicione um novo lead ao sistema</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={leadData.nome}
                    onChange={(e) => handleLeadChange("nome", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={leadData.telefone}
                    onChange={(e) => handleLeadChange("telefone", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={leadData.email}
                  onChange={(e) => handleLeadChange("email", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="canal_aquisicao">Canal de Aquisição</Label>
                  <Select value={leadData.canal_aquisicao} onValueChange={(value) => handleLeadChange("canal_aquisicao", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  value={leadData.mensagem}
                  onChange={(e) => handleLeadChange("mensagem", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_porta">Tipo de Porta</Label>
                <Input
                  id="tipo_porta"
                  value={leadData.tipo_porta}
                  onChange={(e) => handleLeadChange("tipo_porta", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cor_porta">Cor da Porta</Label>
                <Input
                  id="cor_porta"
                  value={leadData.cor_porta}
                  onChange={(e) => handleLeadChange("cor_porta", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="largura_porta">Largura</Label>
                  <Input
                    id="largura_porta"
                    value={leadData.largura_porta}
                    onChange={(e) => handleLeadChange("largura_porta", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altura_porta">Altura</Label>
                  <Input
                    id="altura_porta"
                    value={leadData.altura_porta}
                    onChange={(e) => handleLeadChange("altura_porta", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/leads")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Lead"}
          </Button>
        </div>
      </form>
    </div>
  );
}
