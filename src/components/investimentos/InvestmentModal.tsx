import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Investment, InvestmentFormData } from "@/hooks/useInvestments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InvestmentModalProps {
  open: boolean;
  onClose: () => void;
  month: number | null;
  year: number;
  investments: Investment[];
  onSave: (data: InvestmentFormData) => Promise<boolean>;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const REGIOES = ["RS", "SC", "PR", "Nacional"];

export default function InvestmentModal({
  open,
  onClose,
  month,
  year,
  investments,
  onSave,
}: InvestmentModalProps) {
  const [formData, setFormData] = useState<InvestmentFormData>({
    mes: "",
    regiao: null,
    investimento_google_ads: 0,
    investimento_meta_ads: 0,
    investimento_linkedin_ads: 0,
    outros_investimentos: 0,
    observacoes: "",
  });
  
  const [regionalData, setRegionalData] = useState<Record<string, Partial<InvestmentFormData>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && month) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}-01`;
      
      // Load consolidated data (regiao = null)
      const consolidated = investments.find(inv => inv.mes === monthKey && inv.regiao === null);
      if (consolidated) {
        setFormData({
          mes: monthKey,
          regiao: null,
          investimento_google_ads: consolidated.investimento_google_ads || 0,
          investimento_meta_ads: consolidated.investimento_meta_ads || 0,
          investimento_linkedin_ads: consolidated.investimento_linkedin_ads || 0,
          outros_investimentos: consolidated.outros_investimentos || 0,
          observacoes: consolidated.observacoes || "",
        });
      } else {
        setFormData({
          mes: monthKey,
          regiao: null,
          investimento_google_ads: 0,
          investimento_meta_ads: 0,
          investimento_linkedin_ads: 0,
          outros_investimentos: 0,
          observacoes: "",
        });
      }

      // Load regional data
      const regional: Record<string, Partial<InvestmentFormData>> = {};
      REGIOES.forEach(regiao => {
        const data = investments.find(inv => inv.mes === monthKey && inv.regiao === regiao);
        if (data) {
          regional[regiao] = {
            investimento_google_ads: data.investimento_google_ads || 0,
            investimento_meta_ads: data.investimento_meta_ads || 0,
            investimento_linkedin_ads: data.investimento_linkedin_ads || 0,
            outros_investimentos: data.outros_investimentos || 0,
            observacoes: data.observacoes || "",
          };
        } else {
          regional[regiao] = {
            investimento_google_ads: 0,
            investimento_meta_ads: 0,
            investimento_linkedin_ads: 0,
            outros_investimentos: 0,
            observacoes: "",
          };
        }
      });
      setRegionalData(regional);
    }
  }, [open, month, year, investments]);

  const handleSave = async () => {
    if (!month) return;

    setSaving(true);
    
    // Save consolidated data
    const success = await onSave(formData);
    
    // Save regional data
    if (success) {
      for (const regiao of REGIOES) {
        const data = regionalData[regiao];
        if (data && (data.investimento_google_ads || data.investimento_meta_ads || 
                     data.investimento_linkedin_ads || data.outros_investimentos)) {
          await onSave({
            mes: formData.mes,
            regiao,
            investimento_google_ads: data.investimento_google_ads || 0,
            investimento_meta_ads: data.investimento_meta_ads || 0,
            investimento_linkedin_ads: data.investimento_linkedin_ads || 0,
            outros_investimentos: data.outros_investimentos || 0,
            observacoes: data.observacoes || "",
          });
        }
      }
      onClose();
    }
    
    setSaving(false);
  };

  const updateRegionalData = (regiao: string, field: string, value: any) => {
    setRegionalData(prev => ({
      ...prev,
      [regiao]: {
        ...prev[regiao],
        [field]: value,
      }
    }));
  };

  const calculateTotal = () => {
    let total = formData.investimento_google_ads + formData.investimento_meta_ads + 
                formData.investimento_linkedin_ads + formData.outros_investimentos;
    
    REGIOES.forEach(regiao => {
      const data = regionalData[regiao];
      if (data) {
        total += (data.investimento_google_ads || 0) + (data.investimento_meta_ads || 0) +
                 (data.investimento_linkedin_ads || 0) + (data.outros_investimentos || 0);
      }
    });
    
    return total;
  };

  if (!month) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Investimentos - {MONTH_NAMES[month - 1]} {year}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="consolidated" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consolidated">Consolidado</TabsTrigger>
            <TabsTrigger value="regional">Por Região</TabsTrigger>
          </TabsList>

          <TabsContent value="consolidated" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Google Ads (R$)</Label>
                <Input
                  type="number"
                  value={formData.investimento_google_ads}
                  onChange={(e) => setFormData({ ...formData, investimento_google_ads: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Ads (R$)</Label>
                <Input
                  type="number"
                  value={formData.investimento_meta_ads}
                  onChange={(e) => setFormData({ ...formData, investimento_meta_ads: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn Ads (R$)</Label>
                <Input
                  type="number"
                  value={formData.investimento_linkedin_ads}
                  onChange={(e) => setFormData({ ...formData, investimento_linkedin_ads: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Outros Investimentos (R$)</Label>
                <Input
                  type="number"
                  value={formData.outros_investimentos}
                  onChange={(e) => setFormData({ ...formData, outros_investimentos: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="regional" className="space-y-4 mt-4">
            {REGIOES.map(regiao => (
              <div key={regiao} className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">{regiao}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Google Ads</Label>
                    <Input
                      type="number"
                      size={1}
                      value={regionalData[regiao]?.investimento_google_ads || 0}
                      onChange={(e) => updateRegionalData(regiao, 'investimento_google_ads', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Meta Ads</Label>
                    <Input
                      type="number"
                      value={regionalData[regiao]?.investimento_meta_ads || 0}
                      onChange={(e) => updateRegionalData(regiao, 'investimento_meta_ads', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">LinkedIn</Label>
                    <Input
                      type="number"
                      value={regionalData[regiao]?.investimento_linkedin_ads || 0}
                      onChange={(e) => updateRegionalData(regiao, 'investimento_linkedin_ads', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Outros</Label>
                    <Input
                      type="number"
                      value={regionalData[regiao]?.outros_investimentos || 0}
                      onChange={(e) => updateRegionalData(regiao, 'outros_investimentos', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Total do Mês: </span>
            <span className="text-lg font-bold">
              R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
