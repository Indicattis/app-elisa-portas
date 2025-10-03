import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { FormaPagamentoSelect } from "@/components/FormaPagamentoSelect";

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cidade?: string;
  canal_aquisicao: string;
  canal_aquisicao_id?: string;
  novo_status: string;
  canais_aquisicao?: {
    id: string;
    nome: string;
  };
}

export default function VendaVinculacao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [formData, setFormData] = useState({
    publico_alvo: "",
    valor_produto: "",
    custo_produto: "",
    valor_pintura: "",
    custo_pintura: "",
    valor_instalacao: "",
    valor_frete: "",
    forma_pagamento: "",
    observacoes_venda: "",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const filtered = leads.filter(lead =>
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select(`
          id, nome, telefone, email, cidade, canal_aquisicao, canal_aquisicao_id, novo_status,
          canais_aquisicao:canal_aquisicao_id (
            id,
            nome
          )
        `)
        .order("nome");

      if (error) throw error;
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar leads",
      });
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedLead) return;

    setLoading(true);
    try {
      const valorTotal = 
        (parseFloat(formData.valor_produto) || 0) +
        (parseFloat(formData.valor_pintura) || 0) +
        (parseFloat(formData.valor_instalacao) || 0) +
        (parseFloat(formData.valor_frete) || 0);

      const { error } = await supabase
        .from("vendas")
        .insert({
          lead_id: selectedLead.id,
          atendente_id: user.id,
          publico_alvo: formData.publico_alvo || null,
          canal_aquisicao_id: selectedLead.canal_aquisicao_id || null,
          cidade: selectedLead.cidade || null,
          cliente_nome: selectedLead.nome,
          cliente_telefone: selectedLead.telefone,
          cliente_email: selectedLead.email || null,
          valor_produto: parseFloat(formData.valor_produto) || 0,
          custo_produto: parseFloat(formData.custo_produto) || 0,
          valor_pintura: parseFloat(formData.valor_pintura) || 0,
          custo_pintura: parseFloat(formData.custo_pintura) || 0,
          valor_instalacao: parseFloat(formData.valor_instalacao) || 0,
          valor_frete: parseFloat(formData.valor_frete) || 0,
          valor_venda: valorTotal,
          forma_pagamento: formData.forma_pagamento || null,
          observacoes_venda: formData.observacoes_venda || null,
          data_venda: date.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Venda vinculada com sucesso!",
      });

      navigate("/dashboard/faturamento");
    } catch (error) {
      console.error("Erro ao vincular venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao vincular venda. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/faturamento")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Faturamento
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vincular Venda</h1>
          <p className="text-muted-foreground">
            Criar venda vinculada a um lead existente
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seleção de Lead */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Lead</CardTitle>
            <CardDescription>
              Escolha o lead para vincular à venda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedLead && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Lead Selecionado:</h4>
                <p className="text-sm font-semibold">{selectedLead.nome}</p>
                <p className="text-sm text-muted-foreground">{selectedLead.telefone}</p>
                {selectedLead.email && (
                  <p className="text-sm text-muted-foreground">{selectedLead.email}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{selectedLead.novo_status}</Badge>
                  <Badge variant="outline">{selectedLead.canais_aquisicao?.nome || selectedLead.canal_aquisicao}</Badge>
                </div>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto space-y-2">
              {loadingLeads ? (
                <p className="text-center text-muted-foreground">Carregando leads...</p>
              ) : filteredLeads.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum lead encontrado</p>
              ) : (
                filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedLead?.id === lead.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{lead.nome}</p>
                        <p className="text-sm text-muted-foreground">{lead.telefone}</p>
                        {lead.email && (
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{lead.novo_status}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {lead.canais_aquisicao?.nome || lead.canal_aquisicao}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulário da Venda */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Venda</CardTitle>
            <CardDescription>
              Preencha os dados da venda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publico_alvo">Público Alvo *</Label>
                <Select 
                  value={formData.publico_alvo}
                  onValueChange={(value) => setFormData({ ...formData, publico_alvo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o público" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serralheiro">Serralheiro</SelectItem>
                    <SelectItem value="cliente_final">Cliente Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data da Venda *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <h4 className="font-medium text-sm">Valores e Custos</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="valor_produto">Valor Produto *</Label>
                  <Input
                    id="valor_produto"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_produto}
                    onChange={(e) => setFormData({ ...formData, valor_produto: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_produto">Custo Produto *</Label>
                  <Input
                    id="custo_produto"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.custo_produto}
                    onChange={(e) => setFormData({ ...formData, custo_produto: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_pintura">Valor Pintura *</Label>
                  <Input
                    id="valor_pintura"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_pintura}
                    onChange={(e) => setFormData({ ...formData, valor_pintura: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_pintura">Custo Pintura *</Label>
                  <Input
                    id="custo_pintura"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.custo_pintura}
                    onChange={(e) => setFormData({ ...formData, custo_pintura: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_instalacao">Valor Instalação *</Label>
                  <Input
                    id="valor_instalacao"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_instalacao}
                    onChange={(e) => setFormData({ ...formData, valor_instalacao: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_frete">Valor Frete *</Label>
                  <Input
                    id="valor_frete"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_frete}
                    onChange={(e) => setFormData({ ...formData, valor_frete: e.target.value })}
                    required
                  />
                </div>
              </div>

              <FormaPagamentoSelect
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                showLabel={true}
              />

              <div className="space-y-2">
                <Label htmlFor="observacoes_venda">Observações</Label>
                <Textarea
                  id="observacoes_venda"
                  placeholder="Observações sobre a venda..."
                  value={formData.observacoes_venda}
                  onChange={(e) => setFormData({ ...formData, observacoes_venda: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading || !selectedLead}
                  className="flex-1"
                >
                  {loading ? "Vinculando..." : "Vincular Venda"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/faturamento")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}