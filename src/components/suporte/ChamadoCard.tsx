import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChamadoSuporte } from "@/types/suporte";
import { Mail, Phone, User, Calendar, AlertCircle } from "lucide-react";

interface ChamadoCardProps {
  chamado: ChamadoSuporte;
  onUpdateNotas: (data: { id: string; notas: string }) => void;
  onUpdateStatus: (data: {
    id: string;
    status: "pendente" | "cancelado" | "resolvido";
  }) => void;
}

export function ChamadoCard({
  chamado,
  onUpdateNotas,
  onUpdateStatus,
}: ChamadoCardProps) {
  const [notas, setNotas] = useState(chamado.notas || "");
  const [status, setStatus] = useState(chamado.status);
  const [hasChanges, setHasChanges] = useState(false);

  const handleNotasChange = (value: string) => {
    setNotas(value);
    setHasChanges(true);
  };

  const handleStatusChange = (value: "pendente" | "cancelado" | "resolvido") => {
    setStatus(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (notas !== chamado.notas) {
      onUpdateNotas({ id: chamado.id, notas });
    }
    if (status !== chamado.status) {
      onUpdateStatus({ id: chamado.id, status });
    }
    setHasChanges(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
      case "resolvido":
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Resolvido</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">
            Chamado #{chamado.id.slice(0, 8)}
          </CardTitle>
          {getStatusBadge(status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações do Cliente */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{chamado.nome}</p>
              <p className="text-xs text-muted-foreground">CPF: {chamado.cpf}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{chamado.telefone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{chamado.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                Cadastrado: {format(new Date(chamado.created_at), "dd/MM/yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                Compra: {format(new Date(chamado.data_compra), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* Descrição do Problema */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Descrição do Problema</Label>
          </div>
          <p className="text-sm text-muted-foreground rounded-md bg-muted p-3">
            {chamado.descricao_problema}
          </p>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label htmlFor={`notas-${chamado.id}`}>Notas</Label>
          <Textarea
            id={`notas-${chamado.id}`}
            placeholder="Adicione observações sobre este chamado..."
            value={notas}
            onChange={(e) => handleNotasChange(e.target.value)}
            rows={3}
          />
        </div>

        {/* Status e Ações */}
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor={`status-${chamado.id}`}>Alterar Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger id={`status-${chamado.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={!hasChanges}>
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
