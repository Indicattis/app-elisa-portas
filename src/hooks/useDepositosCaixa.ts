import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DepositoCaixa, DepositoCaixaFormData } from "@/types/caixa";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface TotaisAcumulados {
  totalTravesseiro: number;
  totalPrecaucoes: number;
}

export function useDepositosCaixa(currentDate: Date, viewMode: 'week' | 'month' = 'week') {
  const [depositos, setDepositos] = useState<DepositoCaixa[]>([]);
  const [totaisAcumulados, setTotaisAcumulados] = useState<TotaisAcumulados>({ totalTravesseiro: 0, totalPrecaucoes: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDepositos = async () => {
    try {
      setLoading(true);
      
      // Determinar ranges baseado no modo de visualização
      const inicioRange = viewMode === 'month' 
        ? startOfMonth(currentDate)
        : startOfWeek(currentDate, { weekStartsOn: 1 });
      
      const fimRange = viewMode === 'month'
        ? endOfMonth(currentDate)
        : endOfWeek(currentDate, { weekStartsOn: 1 });
      
      const inicioFormatado = format(inicioRange, 'yyyy-MM-dd');
      const fimFormatado = format(fimRange, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('depositos_caixa')
        .select('*')
        .gte('data_deposito', inicioFormatado)
        .lte('data_deposito', fimFormatado)
        .order('data_deposito', { ascending: true });

      if (error) throw error;
      
      setDepositos((data || []) as DepositoCaixa[]);
    } catch (error) {
      console.error('Erro ao buscar depósitos:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar depósitos",
        description: "Não foi possível carregar os depósitos do caixa.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTotaisAcumulados = async () => {
    try {
      const { data, error } = await supabase
        .from('depositos_caixa')
        .select('valor, categoria');

      if (error) throw error;
      
      const totais = (data || []).reduce((acc, dep) => {
        if (dep.categoria === 'travesseiro') {
          acc.totalTravesseiro += Number(dep.valor);
        } else if (dep.categoria === 'precaucoes') {
          acc.totalPrecaucoes += Number(dep.valor);
        }
        return acc;
      }, { totalTravesseiro: 0, totalPrecaucoes: 0 });
      
      setTotaisAcumulados(totais);
    } catch (error) {
      console.error('Erro ao buscar totais acumulados:', error);
    }
  };

  useEffect(() => {
    fetchDepositos();
    fetchTotaisAcumulados();

    // Subscription para atualizações em tempo real
    const channel = supabase
      .channel('depositos_caixa_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'depositos_caixa' },
        () => {
          fetchDepositos();
          fetchTotaisAcumulados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate, viewMode]);

  const createDeposito = async (data: DepositoCaixaFormData) => {
    try {
      const { error } = await supabase
        .from('depositos_caixa')
        .insert({
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Depósito adicionado",
        description: "O depósito foi registrado com sucesso.",
      });

      await fetchDepositos();
      return true;
    } catch (error) {
      console.error('Erro ao criar depósito:', error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar depósito",
        description: "Não foi possível registrar o depósito.",
      });
      return false;
    }
  };

  const updateDeposito = async (id: string, data: Partial<DepositoCaixaFormData>) => {
    try {
      const { error } = await supabase
        .from('depositos_caixa')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Depósito atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      await fetchDepositos();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar depósito:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar depósito",
        description: "Não foi possível salvar as alterações.",
      });
      return false;
    }
  };

  const deleteDeposito = async (id: string) => {
    try {
      const { error } = await supabase
        .from('depositos_caixa')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Depósito excluído",
        description: "O depósito foi removido com sucesso.",
      });

      await fetchDepositos();
      return true;
    } catch (error) {
      console.error('Erro ao excluir depósito:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir depósito",
        description: "Não foi possível remover o depósito.",
      });
      return false;
    }
  };

  return {
    depositos,
    totaisAcumulados,
    loading,
    createDeposito,
    updateDeposito,
    deleteDeposito,
    refetch: fetchDepositos
  };
}
