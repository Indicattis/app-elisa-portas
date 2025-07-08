import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { canaisAquisicao } from "@/utils/canaisAquisicao";

export default function LeadNovo() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    canal_aquisicao: "Google",
    mensagem: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .insert([
          {
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            canal_aquisicao: formData.canal_aquisicao,
            mensagem: formData.mensagem,
            data_envio: new Date().toISOString(),
            status_atendimento: 1, // Defina o status inicial
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Lead criado com sucesso",
      });

      navigate("/dashboard/leads");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Lead</h1>
          <p className="text-muted-foreground">Adicionar um novo lead ao sistema</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informações do Lead</CardTitle>
          {/* <CardDescription>Adicione as informações do lead para iniciar o processo.</CardDescription> */}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  placeholder="Nome do lead"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  required
                />
              </div>
              
                <div className="space-y-2">
                  <Label htmlFor="canal_aquisicao">Canal de Aquisição</Label>
                  <Select
                    value={formData.canal_aquisicao}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, canal_aquisicao: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {canaisAquisicao.map((canal) => (
                        <SelectItem key={canal} value={canal}>
                          {canal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                placeholder="Mensagem do lead..."
                value={formData.mensagem}
                onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                rows={3}
              />
            </div>
            <Separator />
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Lead"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
