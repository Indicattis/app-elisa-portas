import { Instalacao } from "@/types/instalacao";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InstalacaoCardLegacy } from "./InstalacaoCardLegacy";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DiaCardProps {
  date: Date;
  instalacoes: Instalacao[];
  onDayClick: (date: Date) => void;
  onEdit: (instalacao: Instalacao) => void;
  onRemoverDoCalendario: (id: string) => void;
}

export const DiaCard = ({ date, instalacoes, onDayClick, onEdit, onRemoverDoCalendario }: DiaCardProps) => {
  const navigate = useNavigate();
  
  const diaInstalacoes = instalacoes.filter((inst) =>
    isSameDay(new Date(inst.data), date)
  );

  const isToday = isSameDay(date, new Date());

  const handleAddClick = () => {
    navigate(`/instalacoes/nova?data=${format(date, 'yyyy-MM-dd')}`);
  };

  return (
    <Card className={`w-full ${isToday ? 'border-primary' : ''}`}>
      <CardHeader className="p-3 pb-2 border-b">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase">
              {format(date, "EEEE", { locale: ptBR })}
            </p>
            <p className={`text-lg font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
              {format(date, "dd/MM", { locale: ptBR })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleAddClick}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 space-y-2 min-h-[80px]">
        {diaInstalacoes.length > 0 ? (
          diaInstalacoes.map((instalacao) => (
            <InstalacaoCardLegacy
              key={instalacao.id}
              instalacao={instalacao}
              onEdit={onEdit}
              onRemoverDoCalendario={onRemoverDoCalendario}
            />
          ))
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            Sem instalações
          </div>
        )}
      </CardContent>
    </Card>
  );
};
