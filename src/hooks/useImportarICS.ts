import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParsedICSEvent } from "@/utils/icsParser";

interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

interface ImportOptions {
  equipeId: string | null;
  horaDefault: string;
  skipDuplicates: boolean;
}

export function useImportarICS() {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  /**
   * Busca cor do catálogo que corresponde ao nome
   */
  async function findCorId(corNome: string | null): Promise<string | null> {
    if (!corNome) return null;
    
    const { data } = await supabase
      .from('catalogo_cores')
      .select('id, nome')
      .eq('ativa', true);
    
    if (!data) return null;
    
    // Busca exata primeiro
    const exact = data.find(c => 
      c.nome.toLowerCase() === corNome.toLowerCase()
    );
    if (exact) return exact.id;
    
    // Busca parcial
    const partial = data.find(c => 
      c.nome.toLowerCase().includes(corNome.toLowerCase()) ||
      corNome.toLowerCase().includes(c.nome.toLowerCase())
    );
    
    return partial?.id || null;
  }

  /**
   * Verifica se já existe instalação para o mesmo cliente na mesma data
   */
  async function checkDuplicate(nomeCliente: string, data: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('instalacoes')
      .select('id')
      .eq('nome_cliente', nomeCliente)
      .eq('data_instalacao', data)
      .limit(1);
    
    return (existing?.length || 0) > 0;
  }

  /**
   * Importa eventos selecionados para a tabela de instalações
   */
  async function importEvents(
    events: ParsedICSEvent[],
    options: ImportOptions
  ): Promise<ImportResult> {
    setIsImporting(true);
    
    const result: ImportResult = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    };

    try {
      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const event of events) {
        try {
          // Verificar duplicata
          if (options.skipDuplicates) {
            const isDuplicate = await checkDuplicate(
              event.nomeCliente, 
              event.dataInstalacao
            );
            if (isDuplicate) {
              result.duplicates++;
              continue;
            }
          }
          
          // Buscar cor
          const corId = await findCorId(event.corPorta);
          
          // Inserir instalação
          const { error } = await supabase
            .from('instalacoes')
            .insert({
              nome_cliente: event.nomeCliente,
              data_instalacao: event.dataInstalacao,
              hora: options.horaDefault,
              cidade: event.cidade,
              estado: event.estado,
              endereco: event.endereco,
              telefone_cliente: event.telefone,
              cor_id: corId,
              observacoes: event.observacoes,
              responsavel_instalacao_id: options.equipeId,
              tipo_instalacao: 'elisa',
              status: 'pendente_producao',
              created_by: user?.id
            });
          
          if (error) {
            result.failed++;
            result.errors.push(`${event.nomeCliente}: ${error.message}`);
          } else {
            result.success++;
          }
        } catch (err) {
          result.failed++;
          result.errors.push(`${event.nomeCliente}: ${err}`);
        }
      }
      
      // Toast com resultado
      if (result.success > 0) {
        toast({
          title: "Importação concluída",
          description: `${result.success} instalação(ões) importada(s)${result.duplicates > 0 ? `, ${result.duplicates} duplicata(s) ignorada(s)` : ''}${result.failed > 0 ? `, ${result.failed} erro(s)` : ''}`
        });
      } else if (result.duplicates > 0) {
        toast({
          title: "Nenhuma instalação importada",
          description: `${result.duplicates} duplicata(s) encontrada(s)`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro na importação",
          description: "Nenhuma instalação foi importada",
          variant: "destructive"
        });
      }
      
    } catch (err) {
      toast({
        title: "Erro na importação",
        description: String(err),
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
    
    return result;
  }

  return {
    importEvents,
    isImporting
  };
}
