import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { leadTags, getTagById } from "@/utils/leadTags";
import { statusConfig } from "@/utils/leadStatus";
import type { Lead } from "@/types/lead";

interface LeadStatsProps {
  leads: Lead[];
}

export function LeadStats({ leads }: LeadStatsProps) {
  const stats = useMemo(() => {
    // Contagem por etiqueta
    const tagCounts = leadTags.reduce((acc, tag) => {
      acc[tag.id] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Contagem por status
    const statusCounts = {
      1: 0, // Aguardando atendente
      2: 0, // Em andamento
      4: 0, // Aguardando aprovação
      5: 0, // Vendido
      6: 0, // Desqualificado
      7: 0, // Venda perdida
    };

    leads.forEach(lead => {
      // Contar etiquetas
      if (lead.tag_id) {
        const tag = getTagById(lead.tag_id.toString());
        if (tag) {
          tagCounts[tag.id]++;
        }
      }
      
      // Contar status
      if (statusCounts.hasOwnProperty(lead.status_atendimento)) {
        statusCounts[lead.status_atendimento as keyof typeof statusCounts]++;
      }
    });

    return { tagCounts, statusCounts };
  }, [leads]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Estatísticas por Etiqueta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leads por Etiqueta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leadTags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between">
                <Badge 
                  style={{ 
                    backgroundColor: tag.bgColor,
                    color: tag.textColor,
                    border: `1px solid ${tag.bgColor}`
                  }}
                  className="text-xs"
                >
                  {tag.name}
                </Badge>
                <span className="font-semibold text-sm">
                  {stats.tagCounts[tag.id] || 0}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Sem etiqueta</span>
              <span className="font-semibold text-sm">
                {leads.filter(lead => !lead.tag_id).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leads por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([statusKey, config]) => {
              const statusNumber = statusKey === 'aguardando_atendente' ? 1 :
                                 statusKey === 'em_andamento' ? 2 :
                                 statusKey === 'aguardando_aprovacao_venda' ? 4 :
                                 statusKey === 'vendido' ? 5 :
                                 statusKey === 'desqualificado' ? 6 :
                                 statusKey === 'venda_perdida' ? 7 : 0;
              
              return (
                <div key={statusKey} className="flex items-center justify-between">
                  <Badge className={`${config.className} text-white text-xs`}>
                    {config.label}
                  </Badge>
                  <span className="font-semibold text-sm">
                    {stats.statusCounts[statusNumber as keyof typeof stats.statusCounts] || 0}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}