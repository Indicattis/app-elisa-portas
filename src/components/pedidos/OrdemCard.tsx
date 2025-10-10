import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface OrdemCardProps {
  ordem: any;
}

const ORDEM_CONFIG = {
  perfiladeira: {
    label: "Perfiladeira",
    bg: "#0082ee",
    textLight: "#ffffff",
    textDark: "#003d6b",
  },
  separacao: {
    label: "Separação",
    bg: "#ffe699",
    textLight: "#7a5b00",
    textDark: "#7a5b00",
  },
  soldagem: {
    label: "Solda",
    bg: "#c6e0b4",
    textLight: "#2d5016",
    textDark: "#2d5016",
  },
  pintura: {
    label: "Pintura",
    bg: "#ffc000",
    textLight: "#663d00",
    textDark: "#663d00",
  },
  instalacao: {
    label: "Instalação",
    bg: "#9370db",
    textLight: "#ffffff",
    textDark: "#4b0082",
  },
};

const STATUS_CONFIG = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    variant: "secondary" as const,
  },
  em_andamento: {
    label: "Em Andamento",
    icon: AlertCircle,
    variant: "default" as const,
  },
  concluido: {
    label: "Concluído",
    icon: CheckCircle2,
    variant: "default" as const,
  },
};

export const OrdemCard = ({ ordem }: OrdemCardProps) => {
  const config = ORDEM_CONFIG[ordem.tipo as keyof typeof ORDEM_CONFIG] || ORDEM_CONFIG.perfiladeira;
  const statusConfig = STATUS_CONFIG[ordem.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pendente;
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in border-2"
      style={{
        borderColor: config.bg,
        backgroundColor: `${config.bg}15`,
      }}
    >
      <CardHeader
        className="pb-3"
        style={{
          backgroundColor: config.bg,
          color: config.textLight,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-bold text-lg">{config.label}</div>
          </div>
          <Badge
            variant={statusConfig.variant}
            className="bg-white/90 text-gray-900 hover:bg-white"
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Número:</span>
            <span className="font-semibold" style={{ color: config.textDark }}>
              {ordem.numero_ordem}
            </span>
          </div>

          {ordem.data_inicio && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Início:</span>
              <span>{new Date(ordem.data_inicio).toLocaleDateString("pt-BR")}</span>
            </div>
          )}

          {ordem.data_conclusao && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conclusão:</span>
              <span>{new Date(ordem.data_conclusao).toLocaleDateString("pt-BR")}</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              // TODO: Implementar geração de PDF
              console.log("Download PDF", ordem);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
