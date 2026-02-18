import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, Ruler } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { expandirPortasPorQuantidade } from "@/utils/expandirPortas";
import { getLabelProdutoExpandido } from "@/utils/tipoProdutoLabels";

interface MedidasPortasSectionProps {
  produtos: any[];
  onRefresh: () => void;
}

const PortaSVG = ({ largura, altura }: { largura: number; altura: number }) => {
  const svgW = 200;
  const svgH = 180;
  const doorX = 50;
  const doorY = 20;
  const doorW = 100;
  const doorH = 120;
  const slatCount = 8;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[200px] mx-auto" aria-label="Esquema da porta">
      {/* Door rectangle */}
      <rect x={doorX} y={doorY} width={doorW} height={doorH} rx={3}
        fill="none" stroke="currentColor" strokeWidth={2} className="text-blue-400/60" />
      
      {/* Horizontal slats */}
      {Array.from({ length: slatCount }).map((_, i) => {
        const y = doorY + ((i + 1) * doorH) / (slatCount + 1);
        return (
          <line key={i} x1={doorX + 4} y1={y} x2={doorX + doorW - 4} y2={y}
            stroke="currentColor" strokeWidth={0.8} className="text-blue-400/30" />
        );
      })}

      {/* Height arrow (left side) */}
      <line x1={30} y1={doorY} x2={30} y2={doorY + doorH}
        stroke="currentColor" strokeWidth={1.2} className="text-emerald-400/70" />
      <polygon points={`26,${doorY + 6} 34,${doorY + 6} 30,${doorY}`}
        fill="currentColor" className="text-emerald-400/70" />
      <polygon points={`26,${doorY + doorH - 6} 34,${doorY + doorH - 6} 30,${doorY + doorH}`}
        fill="currentColor" className="text-emerald-400/70" />
      <text x={15} y={doorY + doorH / 2} textAnchor="middle"
        className="text-emerald-400 text-[9px] font-medium" fill="currentColor"
        transform={`rotate(-90, 15, ${doorY + doorH / 2})`}>
        {altura > 0 ? `${altura.toFixed(2)}m` : '?'}
      </text>

      {/* Width arrow (bottom) */}
      <line x1={doorX} y1={doorY + doorH + 18} x2={doorX + doorW} y2={doorY + doorH + 18}
        stroke="currentColor" strokeWidth={1.2} className="text-amber-400/70" />
      <polygon points={`${doorX + 6},${doorY + doorH + 14} ${doorX + 6},${doorY + doorH + 22} ${doorX},${doorY + doorH + 18}`}
        fill="currentColor" className="text-amber-400/70" />
      <polygon points={`${doorX + doorW - 6},${doorY + doorH + 14} ${doorX + doorW - 6},${doorY + doorH + 22} ${doorX + doorW},${doorY + doorH + 18}`}
        fill="currentColor" className="text-amber-400/70" />
      <text x={doorX + doorW / 2} y={doorY + doorH + 32} textAnchor="middle"
        className="text-amber-400 text-[9px] font-medium" fill="currentColor">
        {largura > 0 ? `${largura.toFixed(2)}m` : '?'}
      </text>
    </svg>
  );
};

export function MedidasPortasSection({ produtos, onRefresh }: MedidasPortasSectionProps) {
  const queryClient = useQueryClient();
  const todasPortas = produtos.filter((p: any) => 
    p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'porta_social'
  );
  const todasExpandidas = expandirPortasPorQuantidade(todasPortas);
  const portas = todasExpandidas
    .map((p, idx) => ({ ...p, _globalIndex: idx }));

  const [medidas, setMedidas] = useState<Record<string, { largura: number; altura: number }>>(() => {
    const initial: Record<string, { largura: number; altura: number }> = {};
    for (const porta of portas) {
      initial[porta._virtualKey] = {
        largura: porta.largura || 0,
        altura: porta.altura || 0,
      };
    }
    return initial;
  });
  const [salvando, setSalvando] = useState<string | null>(null);

  if (portas.length === 0) return null;

  const handleSalvar = async (porta: typeof portas[0]) => {
    const m = medidas[porta._virtualKey];
    if (!m || m.largura <= 0 || m.altura <= 0) {
      toast.error("Preencha largura e altura com valores válidos");
      return;
    }

    setSalvando(porta._virtualKey);
    try {
      const { error } = await supabase
        .from('produtos_vendas')
        .update({
          largura: m.largura,
          altura: m.altura,
          tamanho: `${m.largura}x${m.altura}`,
        })
        .eq('id', porta._originalId);

      if (error) throw error;
      toast.success("Medidas salvas com sucesso");
      queryClient.invalidateQueries({ queryKey: ['produtos-venda'] });
    } catch (error) {
      console.error('Erro ao salvar medidas:', error);
      toast.error("Erro ao salvar medidas");
    } finally {
      setSalvando(null);
    }
  };

  const updateMedida = (key: string, field: 'largura' | 'altura', value: number) => {
    setMedidas(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  return (
    <Card className="bg-blue-500/5 border-blue-500/20 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Ruler className="w-4 h-4 text-blue-400" />
          Medidas das Portas
          <Badge variant="outline" className="ml-auto text-xs border-blue-500/30 text-blue-400">
            {portas.length} {portas.length === 1 ? 'porta' : 'portas'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {portas.map((porta, idx) => {
            const m = medidas[porta._virtualKey] || { largura: 0, altura: 0 };
            const preenchida = m.largura > 0 && m.altura > 0;
            const isSaving = salvando === porta._virtualKey;
            const label = getLabelProdutoExpandido(porta._globalIndex, porta.tipo_produto, m.largura, m.altura, porta._totalNoGrupo, porta._indicePorta);

            return (
              <div
                key={porta._virtualKey}
                className={`relative p-4 rounded-xl border transition-all ${
                  preenchida
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/90">{label}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      preenchida
                        ? 'border-emerald-500/40 text-emerald-400'
                        : 'border-amber-500/40 text-amber-400'
                    }`}
                  >
                    {preenchida ? '✓ OK' : 'Pendente'}
                  </Badge>
                </div>

                {/* SVG */}
                <PortaSVG largura={m.largura} altura={m.altura} />

                {/* Inputs */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-amber-400 w-12 shrink-0">Largura</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={m.largura || ''}
                      onChange={e => updateMedida(porta._virtualKey, 'largura', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs bg-white/5 border-white/10 text-white"
                      placeholder="metros"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-emerald-400 w-12 shrink-0">Altura</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={m.altura || ''}
                      onChange={e => updateMedida(porta._virtualKey, 'altura', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs bg-white/5 border-white/10 text-white"
                      placeholder="metros"
                    />
                  </div>
                </div>

                {/* Save button */}
                <Button
                  size="sm"
                  onClick={() => handleSalvar(porta)}
                  disabled={isSaving}
                  className="w-full mt-3 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 mr-1" />
                  )}
                  Salvar Medidas
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
