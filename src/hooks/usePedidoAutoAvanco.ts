import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePedidosEtapas } from "./usePedidosEtapas";
import type { Processo } from "@/components/pedidos/ProcessoAvancoModal";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';

export function usePedidoAutoAvanco() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  const { moverParaProximaEtapa } = usePedidosEtapas();

  const verificarOrdensProducaoConcluidas = async (pedidoId: string): Promise<boolean> => {
    try {
      // Buscar todas as linhas de ordens de produção (solda, perfiladeira, separação)
      const { data: linhas, error } = await supabase
        .from('linhas_ordens')
        .select('concluida')
        .eq('pedido_id', pedidoId)
        .in('tipo_ordem', ['soldagem', 'perfiladeira', 'separacao']);

      if (error) throw error;
      
      // Se não há linhas, considerar como concluída
      if (!linhas || linhas.length === 0) return true;

      // Verificar se todas as linhas estão concluídas
      return linhas.every(linha => linha.concluida === true);
    } catch (error) {
      console.error('Erro ao verificar ordens de produção:', error);
      return false;
    }
  };

  const verificarOrdemQualidadeConcluida = async (pedidoId: string): Promise<boolean> => {
    try {
      const { data: linhas, error } = await supabase
        .from('linhas_ordens')
        .select('concluida')
        .eq('pedido_id', pedidoId)
        .eq('tipo_ordem', 'qualidade');

      if (error) throw error;
      
      // Se não há linhas, considerar como concluída
      if (!linhas || linhas.length === 0) return true;

      return linhas.every(linha => linha.concluida === true);
    } catch (error) {
      console.error('Erro ao verificar ordem de qualidade:', error);
      return false;
    }
  };

  const verificarOrdemPinturaConcluida = async (pedidoId: string): Promise<boolean> => {
    try {
      // Verificar se a ordem de pintura existe e está com status 'pronta'
      const { data: ordemPintura, error: ordemError } = await supabase
        .from('ordens_pintura')
        .select('id, status')
        .eq('pedido_id', pedidoId)
        .maybeSingle();

      if (ordemError) throw ordemError;
      
      // Se não existe ordem de pintura, considerar como concluída (não precisa de pintura)
      if (!ordemPintura) return true;
      
      // Verificar se o status da ordem é 'pronta'
      if (ordemPintura.status === 'pronta') return true;
      
      // Verificar linhas
      const { data: linhas, error } = await supabase
        .from('linhas_ordens')
        .select('concluida')
        .eq('pedido_id', pedidoId)
        .eq('tipo_ordem', 'pintura');

      if (error) throw error;
      
      // Se não há linhas, considerar como concluída
      if (!linhas || linhas.length === 0) return true;

      return linhas.every(linha => linha.concluida === true);
    } catch (error) {
      console.error('Erro ao verificar ordem de pintura:', error);
      return false;
    }
  };

  const buscarEtapaAtual = async (pedidoId: string): Promise<string | null> => {
    try {
      // Buscar o pedido para pegar a etapa atual
      const { data: pedido, error } = await supabase
        .from('pedidos_producao')
        .select('etapa_atual')
        .eq('id', pedidoId)
        .maybeSingle();

      if (error) throw error;
      return pedido?.etapa_atual || null;
    } catch (error) {
      console.error('Erro ao buscar etapa atual:', error);
      return null;
    }
  };

  const tentarAvancoAutomatico = useCallback(async (pedidoId: string, tipoOrdemConcluida: TipoOrdem) => {
    try {
      console.log(`[Auto-Avanço] Iniciando verificação para pedido ${pedidoId} após conclusão de ${tipoOrdemConcluida}`);

      // Buscar etapa atual do pedido
      const etapaAtual = await buscarEtapaAtual(pedidoId);
      if (!etapaAtual) {
        console.log('[Auto-Avanço] Etapa atual não encontrada');
        return;
      }

      console.log(`[Auto-Avanço] Etapa atual: ${etapaAtual}`);

      let deveAvancar = false;

      // Lógica de verificação baseada na etapa atual
      if (etapaAtual === 'em_producao') {
        // Verificar se todas as ordens de produção (solda, perfiladeira, separação) estão concluídas
        if (['soldagem', 'perfiladeira', 'separacao'].includes(tipoOrdemConcluida)) {
          deveAvancar = await verificarOrdensProducaoConcluidas(pedidoId);
          console.log(`[Auto-Avanço] Ordens de produção concluídas: ${deveAvancar}`);
        }
      } else if (etapaAtual === 'inspecao_qualidade') {
        // Verificar se ordem de qualidade está concluída
        if (tipoOrdemConcluida === 'qualidade') {
          deveAvancar = await verificarOrdemQualidadeConcluida(pedidoId);
          console.log(`[Auto-Avanço] Ordem de qualidade concluída: ${deveAvancar}`);
        }
      } else if (etapaAtual === 'aguardando_pintura') {
        // Verificar se ordem de pintura está concluída
        if (tipoOrdemConcluida === 'pintura') {
          deveAvancar = await verificarOrdemPinturaConcluida(pedidoId);
          console.log(`[Auto-Avanço] Ordem de pintura concluída: ${deveAvancar}`);
        }
      } else {
        console.log(`[Auto-Avanço] Etapa ${etapaAtual} não é tratada para tipo ${tipoOrdemConcluida}`);
      }

      console.log(`[Auto-Avanço] deveAvancar: ${deveAvancar}`);

      if (deveAvancar) {
        console.log('[Auto-Avanço] Iniciando avanço automático...');
        
        // Inicializar processos
        const processosIniciais: Processo[] = [
          { id: 'verificacao', label: 'Verificando conclusão de ordens...', status: 'completed' },
          { id: 'avanco', label: 'Avançando pedido automaticamente...', status: 'in_progress' },
        ];

        setProcessos(processosIniciais);
        setModalOpen(true);

        // Aguardar um pouco para o modal aparecer
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          // Chamar moverParaProximaEtapa com skipCheckboxValidation: true
          // e capturar progresso através de um callback
          let progressoCallback: ((processo: Processo) => void) | undefined;
          
          const progressoPromise = moverParaProximaEtapa.mutateAsync({
            pedidoId,
            skipCheckboxValidation: true,
            onProgress: (label: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => {
              const processo: Processo = {
                id: label.toLowerCase().replace(/\s+/g, '_'),
                label,
                status
              };

              setProcessos(prev => {
                const newProcessos = [...prev];
                // Marcar verificação como completa
                const verificacaoIdx = newProcessos.findIndex(p => p.id === 'verificacao');
                if (verificacaoIdx !== -1) {
                  newProcessos[verificacaoIdx].status = 'completed';
                }

                // Adicionar novos processos se não existirem
                const exists = newProcessos.find(p => p.id === processo.id);
                if (!exists) {
                  newProcessos.push(processo);
                } else {
                  // Atualizar status do processo existente
                  const idx = newProcessos.findIndex(p => p.id === processo.id);
                  if (idx !== -1) {
                    newProcessos[idx] = processo;
                  }
                }
                return newProcessos;
              });
            }
          });

          await progressoPromise;

          // Marcar todos como completos
          setProcessos(prev => prev.map(p => ({ ...p, status: 'completed' as const })));

          // Aguardar um pouco antes de fechar
          await new Promise(resolve => setTimeout(resolve, 1000));

          toast({
            title: "Pedido avançado automaticamente",
            description: "O pedido foi movido para a próxima etapa com sucesso.",
          });

          setModalOpen(false);
          setProcessos([]);
        } catch (error) {
          console.error('[Auto-Avanço] Erro ao avançar:', error);
          setProcessos(prev => prev.map(p => ({ ...p, status: 'error' as const })));
          
          toast({
            title: "Erro ao avançar pedido",
            description: "Não foi possível avançar o pedido automaticamente.",
            variant: "destructive",
          });

          // Fechar modal após erro
          setTimeout(() => {
            setModalOpen(false);
            setProcessos([]);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('[Auto-Avanço] Erro geral:', error);
    }
  }, [moverParaProximaEtapa, toast]);

  return {
    tentarAvancoAutomatico,
    processos,
    modalOpen,
    setModalOpen,
  };
}
