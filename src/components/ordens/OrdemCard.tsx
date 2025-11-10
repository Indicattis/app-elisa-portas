import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Hammer, Layers, Package, Paintbrush, CheckCircle, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OrdemBase } from "@/hooks/useOrdensProducao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ORDEM_ICONS = {
  soldagem: Hammer,
  perfiladeira: Layers,
  separacao: Package,
  pintura: Paintbrush,
  qualidade: CheckCircle,
  instalacao: Wrench,
};

const ORDEM_LABELS = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  pintura: 'Pintura',
  qualidade: 'Qualidade',
  instalacao: 'Instalação',
};

const STATUS_VARIANTS = {
  pendente: 'outline',
  em_andamento: 'default',
  concluido: 'secondary',
  cancelado: 'destructive',
} as const;

const STATUS_LABELS = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const ORDEM_ROUTES = {
  soldagem: '/dashboard/ordem-solda-edit',
  perfiladeira: '/dashboard/ordem-perfiladeira-edit',
  separacao: '/dashboard/ordem-separacao-edit',
  pintura: '/dashboard/ordem-pintura-edit',
  qualidade: '/dashboard/ordem-qualidade-edit',
  instalacao: '/dashboard/ordem-instalacao-edit',
};

interface OrdemCardProps {
  ordem: OrdemBase;
}

export function OrdemCard({ ordem }: OrdemCardProps) {
  const navigate = useNavigate();
  const Icon = ORDEM_ICONS[ordem.tipo];

  const handleVerDetalhes = () => {
    const route = ORDEM_ROUTES[ordem.tipo];
    if (route) {
      navigate(`${route}/${ordem.id}`);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">{ordem.numero_ordem}</p>
              <p className="text-xs text-muted-foreground">{ORDEM_LABELS[ordem.tipo]}</p>
            </div>
          </div>
          <Badge variant={STATUS_VARIANTS[ordem.status as keyof typeof STATUS_VARIANTS] || 'outline'}>
            {STATUS_LABELS[ordem.status as keyof typeof STATUS_LABELS] || ordem.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Criado em {format(new Date(ordem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          {ordem.historico && (
            <Badge variant="outline" className="text-xs">
              Histórico
            </Badge>
          )}
          <Button 
            size="sm" 
            className="w-full mt-2"
            onClick={handleVerDetalhes}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
