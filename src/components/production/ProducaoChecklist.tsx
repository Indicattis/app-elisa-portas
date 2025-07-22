
import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrdemProducao {
  id: string;
  pedido_id: string;
  tipo_ordem: string;
  ordem_perfiladeira_concluida: boolean;
  ordem_soldagem_concluida: boolean;
  ordem_separacao_concluida: boolean;
  ordem_pintura_concluida: boolean;
}

interface ProducaoChecklistProps {
  pedidoId: string;
  onStatusChange: () => void;
}

export function ProducaoChecklist({ pedidoId, onStatusChange }: ProducaoChecklistProps) {
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrdens();
  }, [pedidoId]);

  const fetchOrdens = async () => {
    try {
      const { data, error } = await supabase
        .from("ordens_producao")
        .select("*")
        .eq("pedido_id", pedidoId);

      if (error) throw error;

      setOrdens(data || []);
    } catch (error) {
      console.error("Erro ao buscar ordens:", error);
      toast.error("Erro ao carregar ordens de produção");
    } finally {
      setLoading(false);
    }
  };

  const updateOrdemStatus = async (tipo: string, campo: string, valor: boolean) => {
    try {
      // Primeiro, vamos buscar a ordem específica ou criar se não existir
      let { data: ordemExistente, error: fetchError } = await supabase
        .from("ordens_producao")
        .select("*")
        .eq("pedido_id", pedidoId)
        .eq("tipo_ordem", tipo)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!ordemExistente) {
        // Criar nova ordem se não existir
        const { data: novaOrdem, error: insertError } = await supabase
          .from("ordens_producao")
          .insert({
            pedido_id: pedidoId,
            tipo_ordem: tipo,
            status: 'pendente',
            [campo]: valor,
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (insertError) throw insertError;
        ordemExistente = novaOrdem;
      } else {
        // Atualizar ordem existente
        const { error: updateError } = await supabase
          .from("ordens_producao")
          .update({ [campo]: valor })
          .eq("id", ordemExistente.id);

        if (updateError) throw updateError;
      }

      // Atualizar estado local
      setOrdens(prev => {
        const updated = prev.map(ordem => 
          ordem.id === ordemExistente.id 
            ? { ...ordem, [campo]: valor }
            : ordem
        );
        
        // Se a ordem não estava na lista, adicionar
        if (!prev.find(o => o.id === ordemExistente.id)) {
          updated.push({ ...ordemExistente, [campo]: valor });
        }
        
        return updated;
      });

      onStatusChange();
      toast.success(`${tipo} ${valor ? 'marcada como concluída' : 'desmarcada'}`);
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de produção");
    }
  };

  const getStatusByTipo = (tipo: string, campo: string) => {
    const ordem = ordens.find(o => o.tipo_ordem === tipo);
    return ordem ? ordem[campo as keyof OrdemProducao] as boolean : false;
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando ordens...</div>;
  }

  const ordensConfig = [
    { tipo: 'perfiladeira', label: 'Ordem da Perfiladeira (OP)', campo: 'ordem_perfiladeira_concluida' },
    { tipo: 'soldagem', label: 'Ordem de Soldagem', campo: 'ordem_soldagem_concluida' },
    { tipo: 'separacao', label: 'Ordem de Separação', campo: 'ordem_separacao_concluida' },
    { tipo: 'pintura', label: 'Ordem de Pintura', campo: 'ordem_pintura_concluida' },
  ];

  return (
    <div className="space-y-3">
      <h5 className="font-medium">Ordens de Produção</h5>
      <Separator />
      
      <div className="space-y-3">
        {ordensConfig.map(({ tipo, label, campo }) => (
          <div key={tipo} className="flex items-center space-x-2">
            <Checkbox
              id={`ordem-${tipo}`}
              checked={getStatusByTipo(tipo, campo)}
              onCheckedChange={(checked) => 
                updateOrdemStatus(tipo, campo, checked as boolean)
              }
            />
            <label 
              htmlFor={`ordem-${tipo}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
