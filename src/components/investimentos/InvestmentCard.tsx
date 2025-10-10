import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus } from "lucide-react";

interface InvestmentCardProps {
  month: number;
  year: number;
  total: number;
  breakdown: {
    google: number;
    meta: number;
    linkedin: number;
    outros: number;
  };
  hasData: boolean;
  onEdit: () => void;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function InvestmentCard({
  month,
  year,
  total,
  breakdown,
  hasData,
  onEdit,
}: InvestmentCardProps) {
  const monthName = MONTH_NAMES[month - 1];
  const maxValue = Math.max(breakdown.google, breakdown.meta, breakdown.linkedin, breakdown.outros, 1);

  return (
    <Card className={hasData ? "border-primary/20" : "border-muted"}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">{monthName}</h3>
            <p className="text-xs text-muted-foreground">{year}</p>
          </div>
          <Badge variant={hasData ? "default" : "secondary"}>
            {hasData ? "Com dados" : "Vazio"}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-2xl font-bold text-foreground">
            {hasData ? `R$ ${(total / 1000).toFixed(1)}k` : "R$ 0"}
          </p>
          
          {hasData && (
            <div className="space-y-1">
              {breakdown.google > 0 && (
                <div className="flex items-center gap-2">
                  <div 
                    className="h-1.5 rounded-full bg-[#4285F4]" 
                    style={{ width: `${(breakdown.google / maxValue) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">Google</span>
                </div>
              )}
              {breakdown.meta > 0 && (
                <div className="flex items-center gap-2">
                  <div 
                    className="h-1.5 rounded-full bg-[#1877F2]" 
                    style={{ width: `${(breakdown.meta / maxValue) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">Meta</span>
                </div>
              )}
              {breakdown.linkedin > 0 && (
                <div className="flex items-center gap-2">
                  <div 
                    className="h-1.5 rounded-full bg-[#0A66C2]" 
                    style={{ width: `${(breakdown.linkedin / maxValue) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">LinkedIn</span>
                </div>
              )}
              {breakdown.outros > 0 && (
                <div className="flex items-center gap-2">
                  <div 
                    className="h-1.5 rounded-full bg-muted-foreground" 
                    style={{ width: `${(breakdown.outros / maxValue) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">Outros</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Button 
          onClick={onEdit} 
          variant={hasData ? "outline" : "default"}
          size="sm"
          className="w-full"
        >
          {hasData ? (
            <>
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 mr-1" />
              Adicionar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
