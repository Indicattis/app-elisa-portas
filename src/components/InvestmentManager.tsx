import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InvestmentData {
  id: string;
  mes: string;
  regiao?: string | null;
  investimento_google_ads: number;
  investimento_meta_ads: number;
  investimento_linkedin_ads: number;
  outros_investimentos: number;
  observacoes?: string;
}

interface InvestmentManagerProps {
  selectedYear: number;
}

interface InvestmentFormData {
  mes: string;
  regiao: string;
  investimento_google_ads: number;
  investimento_meta_ads: number;
  investimento_linkedin_ads: number;
  outros_investimentos: number;
  observacoes: string;
}

export default function InvestmentManager({ selectedYear }: InvestmentManagerProps) {
  const { toast } = useToast();
  const [investments, setInvestments] = useState<InvestmentData[]>([]);
  const [regioes, setRegioes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentData | null>(null);
  const [formData, setFormData] = useState<InvestmentFormData>({
    mes: format(new Date(), "yyyy-MM"),
    regiao: "",
    investimento_google_ads: 0,
    investimento_meta_ads: 0,
    investimento_linkedin_ads: 0,
    outros_investimentos: 0,
    observacoes: ""
  });

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInvestments(),
        fetchRegioes()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestments = async () => {
    const { data, error } = await supabase
      .from('marketing_investimentos')
      .select('*')
      .gte('mes', `${selectedYear}-01-01`)
      .lte('mes', `${selectedYear}-12-01`)
      .order('mes', { ascending: true })
      .order('regiao', { ascending: true });

    if (error) throw error;
    setInvestments(data || []);
  };

  const fetchRegioes = async () => {
    const { data, error } = await supabase
      .from("vendas")
      .select("estado")
      .not("estado", "is", null);

    if (error) throw error;
    const regionesUnicas = [...new Set(data?.map(v => v.estado))];
    setRegioes(regionesUnicas);
  };

  const handleSave = async () => {
    try {
      const userData = await supabase.auth.getUser();
      const investmentData = {
        mes: formData.mes + "-01",
        regiao: formData.regiao || null,
        investimento_google_ads: formData.investimento_google_ads,
        investimento_meta_ads: formData.investimento_meta_ads,
        investimento_linkedin_ads: formData.investimento_linkedin_ads,
        outros_investimentos: formData.outros_investimentos,
        observacoes: formData.observacoes,
        created_by: userData.data.user?.id
      };

      let error;
      if (editingInvestment) {
        const { error: updateError } = await supabase
          .from("marketing_investimentos")
          .update(investmentData)
          .eq("id", editingInvestment.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("marketing_investimentos")
          .insert(investmentData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Investimento ${editingInvestment ? 'atualizado' : 'criado'} com sucesso`,
      });

      setDialogOpen(false);
      resetForm();
      fetchInvestments();
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar investimento",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (investment: InvestmentData) => {
    setEditingInvestment(investment);
    setFormData({
      mes: investment.mes.slice(0, 7),
      regiao: investment.regiao || "",
      investimento_google_ads: Number(investment.investimento_google_ads) || 0,
      investimento_meta_ads: Number(investment.investimento_meta_ads) || 0,
      investimento_linkedin_ads: Number(investment.investimento_linkedin_ads) || 0,
      outros_investimentos: Number(investment.outros_investimentos) || 0,
      observacoes: investment.observacoes || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (investment: InvestmentData) => {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) return;

    try {
      const { error } = await supabase
        .from("marketing_investimentos")
        .delete()
        .eq("id", investment.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Investimento excluído com sucesso",
      });

      fetchInvestments();
    } catch (error) {
      console.error("Erro ao excluir investimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir investimento",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      mes: format(new Date(), "yyyy-MM"),
      regiao: "",
      investimento_google_ads: 0,
      investimento_meta_ads: 0,
      investimento_linkedin_ads: 0,
      outros_investimentos: 0,
      observacoes: ""
    });
    setEditingInvestment(null);
  };

  const getTotalInvestment = (investment: InvestmentData) => {
    return (investment.investimento_google_ads || 0) +
           (investment.investimento_meta_ads || 0) +
           (investment.investimento_linkedin_ads || 0) +
           (investment.outros_investimentos || 0);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Investimentos</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Gestão de Investimentos</CardTitle>
          <CardDescription>
            Gerencie os investimentos por região e canal de aquisição para {selectedYear}
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Investimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingInvestment ? 'Editar' : 'Novo'} Investimento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mes">Mês</Label>
                <Input
                  id="mes"
                  type="month"
                  value={formData.mes}
                  onChange={(e) => setFormData({ ...formData, mes: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="regiao">Região</Label>
                <Select 
                  value={formData.regiao} 
                  onValueChange={(value) => setFormData({ ...formData, regiao: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as regiões (consolidado)</SelectItem>
                    {regioes.map((regiao) => (
                      <SelectItem key={regiao} value={regiao}>{regiao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="google-ads">Google Ads (R$)</Label>
                <Input
                  id="google-ads"
                  type="number"
                  step="0.01"
                  value={formData.investimento_google_ads}
                  onChange={(e) => setFormData({ ...formData, investimento_google_ads: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="meta-ads">Meta Ads (R$)</Label>
                <Input
                  id="meta-ads"
                  type="number"
                  step="0.01"
                  value={formData.investimento_meta_ads}
                  onChange={(e) => setFormData({ ...formData, investimento_meta_ads: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="linkedin-ads">LinkedIn Ads (R$)</Label>
                <Input
                  id="linkedin-ads"
                  type="number"
                  step="0.01"
                  value={formData.investimento_linkedin_ads}
                  onChange={(e) => setFormData({ ...formData, investimento_linkedin_ads: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="outros">Outros Investimentos (R$)</Label>
                <Input
                  id="outros"
                  type="number"
                  step="0.01"
                  value={formData.outros_investimentos}
                  onChange={(e) => setFormData({ ...formData, outros_investimentos: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações sobre o investimento..."
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  {editingInvestment ? 'Atualizar' : 'Salvar'} Investimento
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês/Ano</TableHead>
                <TableHead>Região</TableHead>
                <TableHead className="text-right">Google Ads</TableHead>
                <TableHead className="text-right">Meta Ads</TableHead>
                <TableHead className="text-right">LinkedIn Ads</TableHead>
                <TableHead className="text-right">Outros</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.length > 0 ? (
                investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">
                      {format(new Date(investment.mes), "MMMM 'de' yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{investment.regiao || "Todas as regiões"}</TableCell>
                    <TableCell className="text-right">
                      R$ {investment.investimento_google_ads.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {investment.investimento_meta_ads.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {investment.investimento_linkedin_ads.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {investment.outros_investimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {getTotalInvestment(investment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(investment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(investment)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum investimento cadastrado para {selectedYear}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}