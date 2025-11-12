import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export function ProcessarTarefasButton() {
  const [loading, setLoading] = useState(false);

  const handleProcessar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('processar-tarefas-recorrentes');
      
      if (error) throw error;
      
      toast.success(`Processamento concluído! ${data?.criadas || 0} tarefas criadas.`);
    } catch (error: any) {
      console.error('Erro ao processar tarefas:', error);
      toast.error(error.message || "Erro ao processar tarefas recorrentes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleProcessar}
      disabled={loading}
    >
      <Play className="h-4 w-4 mr-2" />
      {loading ? "Processando..." : "Processar Recorrentes"}
    </Button>
  );
}
