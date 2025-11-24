import { MapPin, Trash2, Clock, User, Pencil, Plus } from 'lucide-react';
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
import { DataProducaoModal } from './DataProducaoModal';
import { ResponsavelInstalacaoModal } from './ResponsavelInstalacaoModal';
import { format, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InstalacaoListProps {
  instalacoes: InstalacaoCadastrada[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: CreateInstalacaoData) => Promise<boolean>;
}

export const InstalacoesList = ({ instalacoes, onDelete, onUpdate }: InstalacaoListProps) => {
  const [editingInstalacao, setEditingInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [dataProducaoInstalacao, setDataProducaoInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [responsavelInstalacao, setResponsavelInstalacao] = useState<InstalacaoCadastrada | null>(null);

  const isAtrasado = (instalacao: InstalacaoCadastrada) => {
    if (!instalacao.data_instalacao || instalacao.status === 'finalizada') return false;
    return isPast(startOfDay(new Date(instalacao.data_instalacao))) && startOfDay(new Date(instalacao.data_instalacao)) < startOfDay(new Date());
  };

  const handleEdit = (instalacao: InstalacaoCadastrada) => {
    setEditingInstalacao(instalacao);
  };

  const handleUpdate = async (data: CreateInstalacaoData) => {
    if (editingInstalacao) {
      await onUpdate(editingInstalacao.id, data);
      setEditingInstalacao(null);
    }
  };

  const handleSaveDataProducao = async (instalacaoId: string, dataProducao: string) => {
    try {
      // Data de produção não existe mais na tabela instalacoes
      toast.info('Data de produção é gerenciada pelo pedido');
      
      // Recarregar lista
      const updatedInstalacao = instalacoes.find(i => i.id === instalacaoId);
      if (updatedInstalacao) {
        await onUpdate(instalacaoId, {
          nome_cliente: updatedInstalacao.nome_cliente,
          data_instalacao: updatedInstalacao.data_instalacao || '',
          status: updatedInstalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
          tipo_instalacao: updatedInstalacao.tipo_instalacao || undefined,
          responsavel_instalacao_id: updatedInstalacao.responsavel_instalacao_id || undefined,
          responsavel_instalacao_nome: updatedInstalacao.responsavel_instalacao_nome || undefined,
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar data de produção:', error);
      toast.error('Erro ao atualizar data de produção');
      throw error;
    }
  };

  const handleSaveResponsavel = async (
    instalacaoId: string,
    tipoInstalacao: 'elisa' | 'autorizado',
    responsavelId: string,
    responsavelNome: string
  ) => {
    try {
      // Ajustar o tipo para o formato esperado pelo banco
      const tipoFormatado = tipoInstalacao === 'autorizado' ? 'autorizados' : 'elisa';
      
      const { error } = await supabase
        .from('instalacoes')
        .update({
          tipo_instalacao: tipoFormatado,
          responsavel_instalacao_id: responsavelId,
          responsavel_instalacao_nome: responsavelNome,
        })
        .eq('id', instalacaoId);

      if (error) throw error;

      toast.success('Responsável atualizado com sucesso!');
      
      // Atualizar a lista de instalações
      const updatedInstalacao = instalacoes.find(i => i.id === instalacaoId);
      if (updatedInstalacao) {
        await onUpdate(instalacaoId, {
          nome_cliente: updatedInstalacao.nome_cliente,
          data_instalacao: updatedInstalacao.data_instalacao || '',
          status: updatedInstalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
          tipo_instalacao: tipoFormatado as 'elisa' | 'autorizados',
          responsavel_instalacao_id: responsavelId,
          responsavel_instalacao_nome: responsavelNome,
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
      toast.error('Erro ao atualizar responsável');
      throw error;
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
        <Card 
          key={instalacao.id}
          className={
            instalacao.status === 'finalizada'
              ? 'bg-green-500/5 border-green-500/20'
              : isAtrasado(instalacao)
              ? 'bg-red-500/5 border-red-500/20'
              : ''
          }
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{instalacao.nome_cliente}</CardTitle>
                <CardDescription>
                  {instalacao.venda?.cidade || 'N/A'}, {instalacao.venda?.estado || 'N/A'}
                  {instalacao.venda?.cliente_telefone && (
                    <span className="block text-xs mt-1">📞 {instalacao.venda.cliente_telefone}</span>
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
              {instalacao.data_instalacao && (
                <p className="text-sm">
                  <span className="font-medium">Data da Instalação:</span>{' '}
                  {format(new Date(instalacao.data_instalacao), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              )}
              {instalacao.data_producao ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Data de Produção:</span>
                  <span>
                    {format(new Date(instalacao.data_producao), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDataProducaoInstalacao(instalacao)}
                    title="Editar Data de Produção"
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Data de Produção:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDataProducaoInstalacao(instalacao)}
                    className="gap-1 h-7"
                  >
                    <Plus className="h-3 w-3" />
                    Inserir
                  </Button>
                </div>
              )}
              {instalacao.responsavel_instalacao_nome ? (
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResponsavelInstalacao(instalacao)}
                    title="Editar Responsável"
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Responsável:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResponsavelInstalacao(instalacao)}
                    className="gap-1 h-7"
                  >
                    <Plus className="h-3 w-3" />
                    Inserir
                  </Button>
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
                data_instalacao: editingInstalacao.data_instalacao || '',
                status: editingInstalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
                tipo_instalacao: editingInstalacao.tipo_instalacao || undefined,
                responsavel_instalacao_id: editingInstalacao.responsavel_instalacao_id || undefined,
                responsavel_instalacao_nome: editingInstalacao.responsavel_instalacao_nome || undefined,
              }}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <DataProducaoModal
        open={!!dataProducaoInstalacao}
        onOpenChange={(open) => !open && setDataProducaoInstalacao(null)}
        instalacaoId={dataProducaoInstalacao?.id || ''}
        dataAtual={dataProducaoInstalacao?.pedido?.data_producao}
        onSave={handleSaveDataProducao}
      />

      <ResponsavelInstalacaoModal
        open={!!responsavelInstalacao}
        onOpenChange={(open) => !open && setResponsavelInstalacao(null)}
        instalacaoId={responsavelInstalacao?.id || ''}
        tipoAtual={responsavelInstalacao?.tipo_instalacao}
        responsavelIdAtual={responsavelInstalacao?.responsavel_instalacao_id}
        responsavelNomeAtual={responsavelInstalacao?.responsavel_instalacao_nome}
        onSave={handleSaveResponsavel}
      />
    </div>
  );
};
