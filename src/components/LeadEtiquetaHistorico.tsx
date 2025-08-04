import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { getLeadTag } from "@/utils/newLeadSystem";

interface HistoricoEtiqueta {
  id: string;
  tag_id_anterior: number | null;
  tag_id_novo: number | null;
  usuario_id: string;
  observacoes: string | null;
  created_at: string;
  usuario_nome: string;
}

interface LeadEtiquetaHistoricoProps {
  leadId: string;
}

export function LeadEtiquetaHistorico({ leadId }: LeadEtiquetaHistoricoProps) {
  const [historico, setHistorico] = useState<HistoricoEtiqueta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorico();
  }, [leadId]);

  const fetchHistorico = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_etiqueta_historico')
        .select(`
          id,
          tag_id_anterior,
          tag_id_novo,
          usuario_id,
          observacoes,
          created_at
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos usuários separadamente
      const usuarioIds = [...new Set(data?.map(item => item.usuario_id))];
      const { data: usuarios } = await supabase
        .from('admin_users')
        .select('user_id, nome')
        .in('user_id', usuarioIds);

      const usuariosMap = new Map(usuarios?.map(u => [u.user_id, u.nome]) || []);

      const historicoFormatted = data?.map(item => ({
        ...item,
        usuario_nome: usuariosMap.get(item.usuario_id) || 'Usuário desconhecido'
      })) || [];

      setHistorico(historicoFormatted);
    } catch (error) {
      console.error('Erro ao carregar histórico de etiquetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTagBadge = (tagId: number | null) => {
    if (!tagId) return <span className="text-muted-foreground text-sm">Sem etiqueta</span>;
    
    const tag = getLeadTag(tagId);
    if (!tag) return <span className="text-muted-foreground text-sm">Etiqueta removida</span>;
    
    return <Badge className={`${tag.color} text-xs`}>{tag.name}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Carregando histórico...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (historico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Nenhuma alteração de etiqueta registrada.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Etiquetas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historico.map((item, index) => (
            <div key={item.id}>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">De:</span>
                    {getTagBadge(item.tag_id_anterior)}
                    <span className="text-sm font-medium">Para:</span>
                    {getTagBadge(item.tag_id_novo)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Por: {item.usuario_nome}</span>
                    <span>•</span>
                    <span>{format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                  
                  {item.observacoes && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Observações:</span> {item.observacoes}
                    </div>
                  )}
                </div>
              </div>
              
              {index < historico.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}