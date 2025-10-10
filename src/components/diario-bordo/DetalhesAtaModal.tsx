import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, User, Users } from 'lucide-react';
import { formatDuration } from '@/utils/timeFormat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAtaDetails } from '@/hooks/useAtas';

interface DetalhesAtaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ataId: string | null;
}

export function DetalhesAtaModal({ open, onOpenChange, ataId }: DetalhesAtaModalProps) {
  const { data: ata, isLoading } = useAtaDetails(ataId || '');

  if (!ata && !isLoading) {
    return null;
  }

  const getUserInitials = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{ata?.assunto}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : ata ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Informações gerais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {format(new Date(ata.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Horário</p>
                    <p className="font-medium">
                      {format(new Date(ata.data_inicio), 'HH:mm')} - {format(new Date(ata.data_fim), 'HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Duração</p>
                    <p className="font-medium">
                      {formatDuration(ata.duracao_segundos)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Criador */}
              {ata.criador && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Criado por</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={ata.criador.foto_perfil_url || undefined} />
                      <AvatarFallback>
                        {getUserInitials(ata.criador.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{ata.criador.nome}</p>
                      <p className="text-sm text-muted-foreground">{ata.criador.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Participantes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Participantes ({ata.participantes.length})</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {ata.participantes.map((participante) => (
                    <div
                      key={participante.user_id}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-card"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participante.admin_users?.foto_perfil_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(participante.admin_users?.nome || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participante.admin_users?.nome}
                        </p>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {participante.admin_users?.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Conteúdo */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Conteúdo da Ata</h3>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap text-base leading-relaxed">
                    {ata.conteudo}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
