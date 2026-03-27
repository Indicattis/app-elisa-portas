import { useState } from "react";
import { useAjustePontuacaoInstalacao } from "@/hooks/useAjustePontuacaoInstalacao";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  onAtribuir?: () => void;
  periodo?: 'mes' | 'ano' | 'todos';
}

export function AjustePontuacaoSection({ onAtribuir, periodo = 'mes' }: Props) {
  const { pendentes, equipes, loading, saving, atribuirEquipe } = useAjustePontuacaoInstalacao(periodo);
  const [selectedEquipes, setSelectedEquipes] = useState<Record<string, string>>({});

  if (loading) return null;
  if (pendentes.length === 0) return null;

  const handleAtribuir = async (instalacaoId: string) => {
    const equipeId = selectedEquipes[instalacaoId];
    if (!equipeId) return;
    const equipe = equipes.find(e => e.id === equipeId);
    if (!equipe) return;
    await atribuirEquipe(instalacaoId, equipeId, equipe.nome);
    onAtribuir?.();
  };

  return (
    <div className="mt-6">
      <Accordion type="single" collapsible>
        <AccordionItem value="ajuste" className="border-0">
          <div className="p-1.5 rounded-xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/20">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-white font-medium">Ajuste de Pontuação</span>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  {pendentes.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-white/50 text-sm px-4 mb-3">
                Pedidos finalizados sem equipe atribuída. Selecione a equipe responsável para corrigir o ranking.
              </p>
              <div className="space-y-2 px-2">
                {pendentes.map((item) => (
                  <div
                    key={item.instalacao_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.nome_cliente}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                        <span>Pedido {item.pedido_numero}</span>
                        {item.data_pedido && (
                          <>
                            <span>•</span>
                            <span>{format(new Date(item.data_pedido), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Select
                      value={selectedEquipes[item.instalacao_id] || ""}
                      onValueChange={(val) =>
                        setSelectedEquipes(prev => ({ ...prev, [item.instalacao_id]: val }))
                      }
                    >
                      <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white text-sm h-9">
                        <SelectValue placeholder="Equipe..." />
                      </SelectTrigger>
                      <SelectContent>
                        {equipes.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      disabled={!selectedEquipes[item.instalacao_id] || saving === item.instalacao_id}
                      onClick={() => handleAtribuir(item.instalacao_id)}
                      className="bg-emerald-600 hover:bg-emerald-700 h-9 px-3"
                    >
                      {saving === item.instalacao_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
