import { MapPin, Trash2, Clock, User, Pencil } from 'lucide-react';
import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InstalacaoCadastrada, CreateInstalacaoData } from '@/hooks/useInstalacoesCadastradas';
import { CadastroInstalacaoForm } from './CadastroInstalacaoForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InstalacaoListProps {
  instalacoes: InstalacaoCadastrada[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: CreateInstalacaoData) => Promise<boolean>;
}

export const InstalacoesList = ({ instalacoes, onDelete, onUpdate }: InstalacaoListProps) => {
  const [editingInstalacao, setEditingInstalacao] = useState<InstalacaoCadastrada | null>(null);

  const handleEdit = (instalacao: InstalacaoCadastrada) => {
    setEditingInstalacao(instalacao);
  };

  const handleUpdate = async (data: CreateInstalacaoData) => {
    if (editingInstalacao) {
      await onUpdate(editingInstalacao.id, data);
      setEditingInstalacao(null);
    }
  };

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
                  {instalacao.telefone_cliente && (
                    <span className="block text-xs mt-1">📞 {instalacao.telefone_cliente}</span>
                  )}
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
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="outline"
                  className={
                    instalacao.categoria === 'instalacao' 
                      ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                      : instalacao.categoria === 'entrega'
                      ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                  }
                >
                  {instalacao.categoria === 'instalacao' && 'Instalação'}
                  {instalacao.categoria === 'entrega' && 'Entrega'}
                  {instalacao.categoria === 'correcao' && 'Correção'}
                </Badge>
                <Badge 
                  variant="outline"
                  className={
                    instalacao.status === 'pendente_producao' 
                      ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' 
                      : instalacao.status === 'pronta_fabrica'
                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      : 'bg-green-500/10 text-green-600 border-green-500/20'
                  }
                >
                  {instalacao.status === 'pendente_producao' && 'Pendente Produção'}
                  {instalacao.status === 'pronta_fabrica' && 'Pronta Fábrica'}
                  {instalacao.status === 'finalizada' && 'Finalizada'}
                </Badge>
              </div>
              {instalacao.tamanho && (
                <p className="text-sm">
                  <span className="font-medium">Tamanho:</span> {instalacao.tamanho}
                </p>
              )}
              {instalacao.saldo !== null && instalacao.saldo !== undefined && instalacao.saldo > 0 && (
                <p className="text-sm">
                  <span className="font-medium">Saldo:</span>{' '}
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(instalacao.saldo)}
                </p>
              )}
              {instalacao.data_instalacao && (
                <p className="text-sm">
                  <span className="font-medium">Data da Instalação:</span>{' '}
                  {format(new Date(instalacao.data_instalacao), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              )}
              {instalacao.responsavel_instalacao_nome && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Responsável:{' '}
                    <span className="font-medium text-foreground">
                      {instalacao.responsavel_instalacao_nome}
                    </span>
                    {instalacao.tipo_instalacao && (
                      <Badge variant="outline" className="ml-2">
                        {instalacao.tipo_instalacao === 'elisa' ? 'Equipe Elisa' : 'Autorizado'}
                      </Badge>
                    )}
                  </span>
                </div>
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
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(instalacao)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
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

      <Dialog open={!!editingInstalacao} onOpenChange={() => setEditingInstalacao(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Instalação</DialogTitle>
          </DialogHeader>
          {editingInstalacao && (
            <CadastroInstalacaoForm
              onSubmit={handleUpdate}
              initialData={{
                nome_cliente: editingInstalacao.nome_cliente,
                telefone_cliente: editingInstalacao.telefone_cliente || '',
                estado: editingInstalacao.estado,
                cidade: editingInstalacao.cidade,
                tamanho: editingInstalacao.tamanho || '',
                categoria: editingInstalacao.categoria as 'instalacao' | 'entrega' | 'correcao',
                data_instalacao: editingInstalacao.data_instalacao || '',
                status: editingInstalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
                tipo_instalacao: editingInstalacao.tipo_instalacao || undefined,
                responsavel_instalacao_id: editingInstalacao.responsavel_instalacao_id || undefined,
                responsavel_instalacao_nome: editingInstalacao.responsavel_instalacao_nome || undefined,
                saldo: editingInstalacao.saldo || 0,
              }}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
