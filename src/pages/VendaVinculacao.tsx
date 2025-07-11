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

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cidade?: string;
  canal_aquisicao: string;
  status_atendimento: number;
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
    valor_venda: "",
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
        .select("id, nome, telefone, email, cidade, canal_aquisicao, status_atendimento")
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
      const { error } = await supabase
        .from("vendas")
        .insert({
          lead_id: selectedLead.id,
          atendente_id: user.id,
          valor_venda: parseFloat(formData.valor_venda),
          forma_pagamento: formData.forma_pagamento || null,
          observacoes_venda: formData.observacoes_venda || null,
          data_venda: date.toISOString(),
          canal_aquisicao: selectedLead.canal_aquisicao,
          cidade: selectedLead.cidade || null,
          cliente_nome: selectedLead.nome,
          cliente_telefone: selectedLead.telefone,
          cliente_email: selectedLead.email || null,
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

  const getStatusBadge = (status: number) => {
    const statusMap = {
      1: { label: "Aguardando", variant: "secondary" as const },
      2: { label: "Em andamento", variant: "default" as const },
      3: { label: "Pausado", variant: "outline" as const },
      4: { label: "Perdido", variant: "destructive" as const },
      5: { label: "Vendido", variant: "default" as const },
      6: { label: "Venda Aprovada", variant: "default" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: "Desconhecido", variant: "outline" as const };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
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
                  {getStatusBadge(selectedLead.status_atendimento)}
                  <Badge variant="outline">{selectedLead.canal_aquisicao}</Badge>
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
                        {getStatusBadge(lead.status_atendimento)}
                        <Badge variant="outline" className="text-xs">
                          {lead.canal_aquisicao}
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
                <Label htmlFor="valor_venda">Valor da Venda *</Label>
                <Input
                  id="valor_venda"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor_venda}
                  onChange={(e) => setFormData({ ...formData, valor_venda: e.target.value })}
                  required
                />
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

              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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