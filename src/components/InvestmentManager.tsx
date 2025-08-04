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
  id?: string;
  mes: string;
  regiao?: string | null;
  investimento_google_ads: number;
  investimento_meta_ads: number;
  investimento_linkedin_ads: number;
  outros_investimentos: number;
}

interface InvestmentManagerProps {
  selectedYear: number;
}

export default function InvestmentManager({ selectedYear }: InvestmentManagerProps) {
  const { toast } = useToast();
  const [investments, setInvestments] = useState<InvestmentData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<InvestmentData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInvestmentMatrix();
  }, [selectedYear]);

  const generateInvestmentMatrix = async () => {
    setLoading(true);
    
    try {
      // Buscar investimentos existentes do ano selecionado (dados consolidados)
      const { data: existingInvestments, error } = await supabase
        .from('marketing_investimentos')
        .select('*')
        .gte('mes', `${selectedYear}-01-01`)
        .lte('mes', `${selectedYear}-12-01`)
        .is('regiao', null); // Buscar apenas dados consolidados

      if (error) throw error;

      // Gerar matriz de 12 meses
      const matriz: InvestmentData[] = [];
      
      for (let month = 1; month <= 12; month++) {
        const mesFormatted = `${selectedYear}-${month.toString().padStart(2, '0')}-01`;
        
        // Verificar se já existe investimento para este mês
        const existing = existingInvestments?.find(
          inv => inv.mes === mesFormatted
        );

        if (existing) {
          matriz.push({
            id: existing.id,
            mes: mesFormatted,
            regiao: null,
            investimento_google_ads: existing.investimento_google_ads || 0,
            investimento_meta_ads: existing.investimento_meta_ads || 0,
            investimento_linkedin_ads: existing.investimento_linkedin_ads || 0,
            outros_investimentos: existing.outros_investimentos || 0,
          });
        } else {
          // Criar linha vazia para preenchimento
          matriz.push({
            mes: mesFormatted,
            regiao: null,
            investimento_google_ads: 0,
            investimento_meta_ads: 0,
            investimento_linkedin_ads: 0,
            outros_investimentos: 0,
          });
        }
      }

      setInvestments(matriz);
    } catch (error) {
      console.error('Erro ao gerar matriz de investimentos:', error);
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
    if (!editingId && !editValues) return;

    try {
      if (editingId && editValues) {
        // Atualizar ou criar registro consolidado
        if (editValues.id) {
          // Atualizar registro existente
          const { error } = await supabase
            .from('marketing_investimentos')
            .update({
              investimento_google_ads: editValues.investimento_google_ads,
              investimento_meta_ads: editValues.investimento_meta_ads,
              investimento_linkedin_ads: editValues.investimento_linkedin_ads,
              outros_investimentos: editValues.outros_investimentos,
              updated_at: new Date().toISOString()
            })
            .eq('id', editValues.id);

          if (error) throw error;
        } else {
          // Criar novo registro consolidado
          const { error } = await supabase
            .from('marketing_investimentos')
            .insert({
              mes: editValues.mes,
              regiao: null, // Dados consolidados não têm região específica
              investimento_google_ads: editValues.investimento_google_ads,
              investimento_meta_ads: editValues.investimento_meta_ads,
              investimento_linkedin_ads: editValues.investimento_linkedin_ads,
              outros_investimentos: editValues.outros_investimentos,
              created_by: (await supabase.auth.getUser()).data.user?.id
            });

          if (error) throw error;
        }

        // Atualizar estado local
        setInvestments(prev => prev.map(inv => 
          inv.id === editingId ? { ...inv, ...editValues } : inv
        ));

        toast({
          title: "Sucesso",
          description: "Investimento salvo com sucesso",
        });

        setEditingId(null);
        setEditValues({});
      }
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
        <CardTitle>Gestão de Investimentos Consolidados</CardTitle>
        <CardDescription>
          Gerencie os investimentos mensais consolidados para {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês/Ano</TableHead>
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
                <TableRow key={investment.id || investment.mes}>
                  <TableCell className="font-medium">
                    {format(new Date(investment.mes), "MMMM 'de' yyyy", { locale: ptBR })}
                  </TableCell>
                  
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