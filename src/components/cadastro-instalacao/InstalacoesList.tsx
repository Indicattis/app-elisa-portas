import { MapPin, Trash2, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InstalacaoCadastrada } from '@/hooks/useInstalacoesCadastradas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InstalacaoListProps {
  instalacoes: InstalacaoCadastrada[];
  onDelete: (id: string) => void;
}

export const InstalacoesList = ({ instalacoes, onDelete }: InstalacaoListProps) => {
  if (instalacoes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhuma instalação cadastrada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {instalacoes.map((instalacao) => (
        <Card key={instalacao.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{instalacao.nome_cliente}</CardTitle>
                <CardDescription>
                  {instalacao.cidade}, {instalacao.estado}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {instalacao.latitude && instalacao.longitude ? (
                  <Badge variant="default" className="bg-green-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    Geocodificado
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Processando
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {instalacao.tamanho && (
                <p className="text-sm">
                  <span className="font-medium">Tamanho:</span> {instalacao.tamanho}
                </p>
              )}
              {instalacao.criador && (
                <div className="flex items-center gap-2 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={instalacao.criador.foto_perfil_url} alt={instalacao.criador.nome} />
                    <AvatarFallback className="text-xs">
                      {instalacao.criador.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">
                    Criado por <span className="font-medium text-foreground">{instalacao.criador.nome}</span>
                  </span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Cadastrado em{' '}
                {format(new Date(instalacao.created_at), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
              {instalacao.geocode_precision && (
                <p className="text-xs text-muted-foreground">
                  Local: {instalacao.geocode_precision}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(instalacao.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
