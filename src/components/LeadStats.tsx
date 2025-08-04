import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEAD_TAGS, getLeadTag } from "@/utils/newLeadSystem";
import type { Lead } from "@/types/lead";

interface LeadStatsProps {
  leads: Lead[];
}

export function LeadStats({ leads }: LeadStatsProps) {
  const stats = useMemo(() => {
    // Contagem por etiqueta usando o sistema correto
    const tagCounts = LEAD_TAGS.reduce((acc, tag) => {
      acc[tag.id] = 0;
      return acc;
    }, {} as Record<number, number>);
    
    // Contar leads sem etiqueta
    let leadsWithoutTag = 0;

    leads.forEach(lead => {
      // Contar etiquetas
      if (lead.tag_id) {
        const tag = getLeadTag(lead.tag_id);
        if (tag) {
          tagCounts[tag.id]++;
        }
      } else {
        leadsWithoutTag++;
      }
    });

    return { tagCounts, leadsWithoutTag };
  }, [leads]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Leads por Etiqueta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {LEAD_TAGS.map(tag => (
            <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
              <Badge className={`${tag.color} text-xs`}>
                {tag.name}
              </Badge>
              <span className="font-semibold text-sm">
                {stats.tagCounts[tag.id] || 0}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-xs text-muted-foreground">Sem etiqueta</span>
            <span className="font-semibold text-sm">
              {stats.leadsWithoutTag}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}