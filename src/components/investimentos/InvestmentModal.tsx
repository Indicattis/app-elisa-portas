import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Investment, InvestmentFormData } from "@/hooks/useInvestments";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";

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
  const { canais, fetchCanaisPagos } = useCanaisAquisicao();
  const canaisPagos = canais;
  
  useEffect(() => {
    if (open) {
      fetchCanaisPagos();
    }
  }, [open]);
  
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

      // Load regional data only
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
  }, [open, month, year, investments]);

  const handleSave = async () => {
    if (!month) return;

    setSaving(true);
    
    // Save regional data only
    let success = true;
    for (const regiao of REGIOES) {
      const data = regionalData[regiao];
      if (data && (data.investimento_google_ads || data.investimento_meta_ads || 
                   data.investimento_linkedin_ads || data.outros_investimentos)) {
        const result = await onSave({
          mes: formData.mes,
          regiao,
          investimento_google_ads: data.investimento_google_ads || 0,
          investimento_meta_ads: data.investimento_meta_ads || 0,
          investimento_linkedin_ads: data.investimento_linkedin_ads || 0,
          outros_investimentos: data.outros_investimentos || 0,
          observacoes: data.observacoes || "",
        });
        if (!result) success = false;
      }
    }
    
    if (success) onClose();
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
    let total = 0;
    
    REGIOES.forEach(regiao => {
      const data = regionalData[regiao];
      if (data) {
        total += (data.investimento_google_ads || 0) + (data.investimento_meta_ads || 0) +
                 (data.investimento_linkedin_ads || 0) + (data.outros_investimentos || 0);
      }
    });
    
    return total;
  };

  // Mapear campos para labels baseados em canais pagos
  const getCanalLabel = (field: string) => {
    const fieldMap: Record<string, string[]> = {
      investimento_google_ads: ['google', 'google ads'],
      investimento_meta_ads: ['meta', 'facebook', 'instagram', 'meta ads'],
      investimento_linkedin_ads: ['linkedin', 'linkedin ads'],
    };
    
    const keywords = fieldMap[field];
    if (!keywords) return null;
    
    const canal = canaisPagos.find(c => 
      keywords.some(keyword => c.nome.toLowerCase().includes(keyword))
    );
    
    return canal?.nome || null;
  };

  if (!month) return null;

  const hasGoogleAds = getCanalLabel('investimento_google_ads');
  const hasMetaAds = getCanalLabel('investimento_meta_ads');
  const hasLinkedInAds = getCanalLabel('investimento_linkedin_ads');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Investimentos por Região - {MONTH_NAMES[month - 1]} {year}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {REGIOES.map(regiao => (
            <div key={regiao} className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">{regiao}</h3>
              <div className="grid grid-cols-2 gap-3">
                {hasGoogleAds && (
                  <div className="space-y-1">
                    <Label className="text-xs">{hasGoogleAds}</Label>
                    <Input
                      type="number"
                      value={regionalData[regiao]?.investimento_google_ads || 0}
                      onChange={(e) => updateRegionalData(regiao, 'investimento_google_ads', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
                {hasMetaAds && (
                  <div className="space-y-1">
                    <Label className="text-xs">{hasMetaAds}</Label>
                    <Input
                      type="number"
                      value={regionalData[regiao]?.investimento_meta_ads || 0}
                      onChange={(e) => updateRegionalData(regiao, 'investimento_meta_ads', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
                {hasLinkedInAds && (
                  <div className="space-y-1">
                    <Label className="text-xs">{hasLinkedInAds}</Label>
                    <Input
                      type="number"
                      value={regionalData[regiao]?.investimento_linkedin_ads || 0}
                      onChange={(e) => updateRegionalData(regiao, 'investimento_linkedin_ads', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Outros Canais Pagos</Label>
                  <Input
                    type="number"
                    value={regionalData[regiao]?.outros_investimentos || 0}
                    onChange={(e) => updateRegionalData(regiao, 'outros_investimentos', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Observações</Label>
                <Textarea
                  value={regionalData[regiao]?.observacoes || ""}
                  onChange={(e) => updateRegionalData(regiao, 'observacoes', e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          ))}
        </div>

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
