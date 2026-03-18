import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, Trash2 } from "lucide-react";
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

interface RegionInvestmentData {
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
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [monthlyData, setMonthlyData] = useState<Record<string, RegionInvestmentData>>({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  useEffect(() => {
    loadMonthData();
  }, [selectedMonth, investments]);

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
    const regionesUnicas = [...new Set(data?.map(v => v.estado).filter((e): e is string => typeof e === 'string'))];
    setRegioes(regionesUnicas);
  };

  const loadMonthData = () => {
    const monthKey = selectedMonth + "-01";
    const monthInvestments = investments.filter(inv => inv.mes === monthKey);
    
    const newMonthlyData: Record<string, RegionInvestmentData> = {};
    
    // Incluir consolidado
    const consolidado = monthInvestments.find(inv => !inv.regiao);
    newMonthlyData["TODAS"] = {
      investimento_google_ads: consolidado?.investimento_google_ads || 0,
      investimento_meta_ads: consolidado?.investimento_meta_ads || 0,
      investimento_linkedin_ads: consolidado?.investimento_linkedin_ads || 0,
      outros_investimentos: consolidado?.outros_investimentos || 0,
      observacoes: consolidado?.observacoes || ""
    };

    // Incluir cada região
    regioes.forEach(regiao => {
      const regionInvestment = monthInvestments.find(inv => inv.regiao === regiao);
      newMonthlyData[regiao] = {
        investimento_google_ads: regionInvestment?.investimento_google_ads || 0,
        investimento_meta_ads: regionInvestment?.investimento_meta_ads || 0,
        investimento_linkedin_ads: regionInvestment?.investimento_linkedin_ads || 0,
        outros_investimentos: regionInvestment?.outros_investimentos || 0,
        observacoes: regionInvestment?.observacoes || ""
      };
    });

    setMonthlyData(newMonthlyData);
  };

  const updateRegionData = (regiao: string, field: keyof RegionInvestmentData, value: number | string) => {
    setMonthlyData(prev => ({
      ...prev,
      [regiao]: {
        investimento_google_ads: 0,
        investimento_meta_ads: 0,
        investimento_linkedin_ads: 0,
        outros_investimentos: 0,
        observacoes: "",
        ...prev[regiao],
        [field]: value
      }
    }));
  };

  const handleSaveMonth = async () => {
    try {
      const userData = await supabase.auth.getUser();
      const monthKey = selectedMonth + "-01";
      
      // Deletar dados existentes do mês
      await supabase
        .from("marketing_investimentos")
        .delete()
        .eq("mes", monthKey);

      // Inserir novos dados
      const insertData = Object.entries(monthlyData).map(([regiao, data]) => ({
        mes: monthKey,
        regiao: regiao === "TODAS" ? null : regiao,
        investimento_google_ads: data.investimento_google_ads,
        investimento_meta_ads: data.investimento_meta_ads,
        investimento_linkedin_ads: data.investimento_linkedin_ads,
        outros_investimentos: data.outros_investimentos,
        observacoes: data.observacoes,
        created_by: userData.data.user?.id
      })).filter(item => 
        item.investimento_google_ads > 0 || 
        item.investimento_meta_ads > 0 || 
        item.investimento_linkedin_ads > 0 || 
        item.outros_investimentos > 0 ||
        item.observacoes.trim()
      );

      if (insertData.length > 0) {
        const { error } = await supabase
          .from("marketing_investimentos")
          .insert(insertData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Investimentos salvos com sucesso",
      });

      setEditing(false);
      fetchInvestments();
    } catch (error) {
      console.error("Erro ao salvar investimentos:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar investimentos",
        variant: "destructive"
      });
    }
  };

  const getTotalByRegion = (regiao: string) => {
    const data = monthlyData[regiao];
    if (!data) return 0;
    return (data.investimento_google_ads || 0) +
           (data.investimento_meta_ads || 0) +
           (data.investimento_linkedin_ads || 0) +
           (data.outros_investimentos || 0);
  };

  const getGrandTotal = () => {
    return Object.keys(monthlyData).reduce((total, regiao) => {
      return total + getTotalByRegion(regiao);
    }, 0);
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
        <div className="flex gap-2 items-center">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = String(i + 1).padStart(2, '0');
                const value = `${selectedYear}-${month}`;
                const label = format(new Date(selectedYear, i), "MMMM 'de' yyyy", { locale: ptBR });
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {editing ? (
            <div className="flex gap-2">
              <Button onClick={handleSaveMonth}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Editar Mês
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Região</TableHead>
                <TableHead className="text-right">Google Ads (R$)</TableHead>
                <TableHead className="text-right">Meta Ads (R$)</TableHead>
                <TableHead className="text-right">LinkedIn Ads (R$)</TableHead>
                <TableHead className="text-right">Outros (R$)</TableHead>
                <TableHead className="text-right">Total (R$)</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Linha consolidada */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">Consolidado (Todas as regiões)</TableCell>
                <TableCell>
                  {editing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={monthlyData["TODAS"]?.investimento_google_ads || 0}
                      onChange={(e) => updateRegionData("TODAS", "investimento_google_ads", Number(e.target.value))}
                      className="text-right"
                    />
                  ) : (
                    <span className="text-right block">
                      R$ {(monthlyData["TODAS"]?.investimento_google_ads || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={monthlyData["TODAS"]?.investimento_meta_ads || 0}
                      onChange={(e) => updateRegionData("TODAS", "investimento_meta_ads", Number(e.target.value))}
                      className="text-right"
                    />
                  ) : (
                    <span className="text-right block">
                      R$ {(monthlyData["TODAS"]?.investimento_meta_ads || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={monthlyData["TODAS"]?.investimento_linkedin_ads || 0}
                      onChange={(e) => updateRegionData("TODAS", "investimento_linkedin_ads", Number(e.target.value))}
                      className="text-right"
                    />
                  ) : (
                    <span className="text-right block">
                      R$ {(monthlyData["TODAS"]?.investimento_linkedin_ads || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={monthlyData["TODAS"]?.outros_investimentos || 0}
                      onChange={(e) => updateRegionData("TODAS", "outros_investimentos", Number(e.target.value))}
                      className="text-right"
                    />
                  ) : (
                    <span className="text-right block">
                      R$ {(monthlyData["TODAS"]?.outros_investimentos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {getTotalByRegion("TODAS").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  {editing ? (
                    <Textarea
                      value={monthlyData["TODAS"]?.observacoes || ""}
                      onChange={(e) => updateRegionData("TODAS", "observacoes", e.target.value)}
                      placeholder="Observações..."
                      className="min-h-[60px]"
                    />
                  ) : (
                    <span>{monthlyData["TODAS"]?.observacoes || "-"}</span>
                  )}
                </TableCell>
              </TableRow>

              {/* Linhas por região */}
              {regioes.map((regiao) => (
                <TableRow key={regiao}>
                  <TableCell className="font-medium">{regiao}</TableCell>
                  <TableCell>
                    {editing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={monthlyData[regiao]?.investimento_google_ads || 0}
                        onChange={(e) => updateRegionData(regiao, "investimento_google_ads", Number(e.target.value))}
                        className="text-right"
                      />
                    ) : (
                      <span className="text-right block">
                        R$ {(monthlyData[regiao]?.investimento_google_ads || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={monthlyData[regiao]?.investimento_meta_ads || 0}
                        onChange={(e) => updateRegionData(regiao, "investimento_meta_ads", Number(e.target.value))}
                        className="text-right"
                      />
                    ) : (
                      <span className="text-right block">
                        R$ {(monthlyData[regiao]?.investimento_meta_ads || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={monthlyData[regiao]?.investimento_linkedin_ads || 0}
                        onChange={(e) => updateRegionData(regiao, "investimento_linkedin_ads", Number(e.target.value))}
                        className="text-right"
                      />
                    ) : (
                      <span className="text-right block">
                        R$ {(monthlyData[regiao]?.investimento_linkedin_ads || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={monthlyData[regiao]?.outros_investimentos || 0}
                        onChange={(e) => updateRegionData(regiao, "outros_investimentos", Number(e.target.value))}
                        className="text-right"
                      />
                    ) : (
                      <span className="text-right block">
                        R$ {(monthlyData[regiao]?.outros_investimentos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {getTotalByRegion(regiao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {editing ? (
                      <Textarea
                        value={monthlyData[regiao]?.observacoes || ""}
                        onChange={(e) => updateRegionData(regiao, "observacoes", e.target.value)}
                        placeholder="Observações..."
                        className="min-h-[60px]"
                      />
                    ) : (
                      <span>{monthlyData[regiao]?.observacoes || "-"}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {/* Linha de total geral */}
              <TableRow className="border-t-2 bg-accent/50">
                <TableCell className="font-bold">TOTAL GERAL</TableCell>
                <TableCell className="text-right font-bold">
                  R$ {Object.keys(monthlyData).reduce((total, regiao) => 
                    total + (monthlyData[regiao]?.investimento_google_ads || 0), 0
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right font-bold">
                  R$ {Object.keys(monthlyData).reduce((total, regiao) => 
                    total + (monthlyData[regiao]?.investimento_meta_ads || 0), 0
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right font-bold">
                  R$ {Object.keys(monthlyData).reduce((total, regiao) => 
                    total + (monthlyData[regiao]?.investimento_linkedin_ads || 0), 0
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right font-bold">
                  R$ {Object.keys(monthlyData).reduce((total, regiao) => 
                    total + (monthlyData[regiao]?.outros_investimentos || 0), 0
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right font-bold">
                  R$ {getGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}