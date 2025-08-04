import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InvestmentData {
  id: string;
  mes: string;
  regiao: string;
  investimento_google_ads: number;
  investimento_meta_ads: number;
  investimento_linkedin_ads: number;
  outros_investimentos: number;
}

interface InvestmentManagerProps {
  selectedYear: number;
  regioes: string[];
}

export default function InvestmentManager({ selectedYear, regioes }: InvestmentManagerProps) {
  const { toast } = useToast();
  const [investments, setInvestments] = useState<InvestmentData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<InvestmentData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInvestmentMatrix();
  }, [selectedYear, regioes]);

  const generateInvestmentMatrix = async () => {
    setLoading(true);
    try {
      // Buscar investimentos existentes para o ano
      const { data: existingInvestments } = await supabase
        .from("marketing_investimentos")
        .select("*")
        .gte("mes", `${selectedYear}-01-01`)
        .lte("mes", `${selectedYear}-12-01`);

      // Gerar matriz completa de investimentos (12 meses x regiões)
      const investmentMatrix: InvestmentData[] = [];
      
      for (let month = 1; month <= 12; month++) {
        const monthStr = `${selectedYear}-${month.toString().padStart(2, '0')}-01`;
        
        for (const regiao of regioes) {
          // Verificar se já existe um registro
          const existing = existingInvestments?.find(inv => 
            inv.mes === monthStr && 
            inv.regiao === regiao
          );

          investmentMatrix.push({
            id: existing?.id || `${monthStr}_${regiao}`,
            mes: monthStr,
            regiao,
            investimento_google_ads: existing?.investimento_google_ads || 0,
            investimento_meta_ads: existing?.investimento_meta_ads || 0,
            investimento_linkedin_ads: existing?.investimento_linkedin_ads || 0,
            outros_investimentos: existing?.outros_investimentos || 0,
          });
        }
      }

      setInvestments(investmentMatrix);
    } catch (error) {
      console.error("Erro ao gerar matriz de investimentos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar investimentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (investment: InvestmentData) => {
    setEditingId(investment.id);
    setEditValues(investment);
  };

  const handleSave = async () => {
    if (!editingId || !editValues) return;

    try {
      const userData = await supabase.auth.getUser();
      const investmentData = {
        mes: editValues.mes,
        regiao: editValues.regiao,
        investimento_google_ads: editValues.investimento_google_ads || 0,
        investimento_meta_ads: editValues.investimento_meta_ads || 0,
        investimento_linkedin_ads: editValues.investimento_linkedin_ads || 0,
        outros_investimentos: editValues.outros_investimentos || 0,
        created_by: userData.data.user?.id
      };

      // Verificar se é um ID real ou temporário
      const isRealId = !editingId.includes('_');
      
      if (isRealId) {
        // Atualizar registro existente
        const { error } = await supabase
          .from("marketing_investimentos")
          .update(investmentData)
          .eq("id", editingId);
        
        if (error) throw error;
      } else {
        // Criar novo registro
        const { data, error } = await supabase
          .from("marketing_investimentos")
          .insert(investmentData)
          .select()
          .single();
        
        if (error) throw error;
        
        // Atualizar o ID no estado local
        setInvestments(prev => prev.map(inv => 
          inv.id === editingId 
            ? { ...inv, ...investmentData, id: data.id }
            : inv
        ));
      }

      // Atualizar o estado local
      setInvestments(prev => prev.map(inv => 
        inv.id === editingId 
          ? { ...inv, ...editValues }
          : inv
      ));

      toast({
        title: "Sucesso",
        description: "Investimento salvo com sucesso",
      });

      setEditingId(null);
      setEditValues({});
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar investimento",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
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
      <CardHeader>
        <CardTitle>Gestão de Investimentos por Região e Canal</CardTitle>
        <CardDescription>
          Gerencie os investimentos mensais por região e canal de aquisição para {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
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
              {investments.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell>
                    {format(new Date(investment.mes), "MMM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{investment.regiao}</TableCell>
                  
                  {editingId === investment.id ? (
                    <>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={editValues.investimento_google_ads || 0}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            investimento_google_ads: Number(e.target.value)
                          })}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={editValues.investimento_meta_ads || 0}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            investimento_meta_ads: Number(e.target.value)
                          })}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={editValues.investimento_linkedin_ads || 0}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            investimento_linkedin_ads: Number(e.target.value)
                          })}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={editValues.outros_investimentos || 0}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            outros_investimentos: Number(e.target.value)
                          })}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {getTotalInvestment(editValues as InvestmentData).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="ghost" onClick={handleSave}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancel}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
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
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(investment)}
                          disabled={editingId !== null}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}