import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, MapPin, Loader2, FileText, Phone, Mail } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getCurrentEtapa, getEtapasByTipo } from "@/utils/parceiros";
import type { AutorizadoPerformance } from "@/hooks/useAutorizadosPerformance";

interface AutorizadosListProps {
  autorizados: AutorizadoPerformance[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onGeocode?: (autorizado: AutorizadoPerformance) => void;
  geocodingId?: string | null;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function AutorizadosList({
  autorizados,
  onView,
  onEdit,
  onDelete,
  onGeocode,
  geocodingId
}: AutorizadosListProps) {
  const { etapas, colors } = getEtapasByTipo('autorizado');

  if (autorizados.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum autorizado encontrado
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Autorizado</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Atendente</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {autorizados.map((autorizado) => {
            const etapaAtual = getCurrentEtapa(autorizado);
            const etapaLabel = etapaAtual ? etapas[etapaAtual as keyof typeof etapas] : '-';
            const etapaCor = etapaAtual ? colors[etapaAtual as keyof typeof colors] : 'bg-gray-100 text-gray-800';
            const hasGeocode = autorizado.latitude && autorizado.longitude;
            const needsGeocode = !hasGeocode && autorizado.cidade && autorizado.estado;

            return (
              <TableRow 
                key={autorizado.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(autorizado.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={autorizado.logo_url || undefined} alt={autorizado.nome} />
                      <AvatarFallback className="text-xs">{getInitials(autorizado.nome)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{autorizado.nome}</span>
                      <div className="flex items-center gap-1">
                        {hasGeocode && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-green-50 text-green-700 border-green-200">
                            <MapPin className="h-2.5 w-2.5 mr-0.5" />
                            GPS
                          </Badge>
                        )}
                        {autorizado.contrato_url && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                            <FileText className="h-2.5 w-2.5 mr-0.5" />
                            Contrato
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {autorizado.responsavel || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {autorizado.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {autorizado.telefone}
                      </span>
                    )}
                    {autorizado.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {autorizado.email}
                      </span>
                    )}
                    {!autorizado.telefone && !autorizado.email && '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {autorizado.cidade && autorizado.estado 
                      ? `${autorizado.cidade}, ${autorizado.estado}` 
                      : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  {autorizado.vendedor ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={autorizado.vendedor.foto_perfil_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(autorizado.vendedor.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{autorizado.vendedor.nome.split(' ')[0]}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`${etapaCor} text-xs`}>
                    {etapaLabel}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {needsGeocode && onGeocode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onGeocode(autorizado)}
                        disabled={geocodingId === autorizado.id}
                      >
                        {geocodingId === autorizado.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(autorizado.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{autorizado.nome}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(autorizado.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
