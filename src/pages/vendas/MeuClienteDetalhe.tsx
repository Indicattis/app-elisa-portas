import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Phone, Mail, MapPin, Edit2, Star, Triangle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateCliente, ClienteFormData } from '@/hooks/useClientes';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ClienteForm } from '@/components/clientes/ClienteForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function MeuClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const { mutate: updateCliente, isPending } = useUpdateCliente();

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['meu-cliente-detalhe', id],
    queryFn: async () => {
      if (!id || !user?.id) return null;
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .eq('created_by', user.id)
        .eq('ativo', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  const { data: vendas, isLoading: vendasLoading } = useQuery({
    queryKey: ['meu-cliente-vendas', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('vendas')
        .select('id, data_venda, valor_venda, cliente_nome, forma_pagamento')
        .eq('cliente_id', id)
        .order('data_venda', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const handleUpdate = (data: ClienteFormData) => {
    if (!id) return;
    updateCliente({ id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['meu-cliente-detalhe', id] });
        queryClient.invalidateQueries({ queryKey: ['meus-clientes'] });
        setEditOpen(false);
      },
    });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (isLoading) {
    return (
      <MinimalistLayout title="Carregando..." breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Meus Clientes", path: "/vendas/meus-clientes" },
        { label: "..." },
      ]}>
        <div className="space-y-4">
          <Skeleton className="h-48 bg-white/5" />
          <Skeleton className="h-64 bg-white/5" />
        </div>
      </MinimalistLayout>
    );
  }

  if (!cliente) {
    return (
      <MinimalistLayout title="Cliente não encontrado" breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Meus Clientes", path: "/vendas/meus-clientes" },
      ]}>
        <div className="text-center py-12">
          <p className="text-white/60">Cliente não encontrado ou sem permissão.</p>
          <Button variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/vendas/meus-clientes')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </MinimalistLayout>
    );
  }

  return (
    <MinimalistLayout
      title={cliente.nome}
      subtitle={cliente.tipo_cliente ? `Cliente ${cliente.tipo_cliente}` : 'Cliente'}
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Meus Clientes", path: "/vendas/meus-clientes" },
        { label: cliente.nome },
      ]}
      headerActions={
        <Button onClick={() => setEditOpen(true)} className="bg-blue-600 hover:bg-blue-700" size="sm">
          <Edit2 className="w-4 h-4 mr-2" /> Editar
        </Button>
      }
    >
      {/* Info Card */}
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 mb-6">
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {cliente.tipo_cliente && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">{cliente.tipo_cliente}</Badge>
            )}
            {cliente.fidelizado && (
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                <Star className="w-3 h-3 mr-1 fill-yellow-500" /> Fidelizado
              </Badge>
            )}
            {cliente.parceiro && (
              <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                <Triangle className="w-3 h-3 mr-1 fill-purple-500" /> Parceiro
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cliente.cpf_cnpj && (
              <div>
                <p className="text-xs text-white/40">CPF/CNPJ</p>
                <p className="text-white font-mono">{cliente.cpf_cnpj}</p>
              </div>
            )}
            {cliente.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Telefone</p>
                  <p className="text-white">{cliente.telefone}</p>
                </div>
              </div>
            )}
            {cliente.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Email</p>
                  <p className="text-white">{cliente.email}</p>
                </div>
              </div>
            )}
            {(cliente.cidade || cliente.estado) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Localização</p>
                  <p className="text-white">{[cliente.endereco, cliente.bairro, cliente.cidade, cliente.estado].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            {cliente.cep && (
              <div>
                <p className="text-xs text-white/40">CEP</p>
                <p className="text-white">{cliente.cep}</p>
              </div>
            )}
          </div>

          {cliente.observacoes && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-white/40 mb-1">Observações</p>
              <p className="text-white/70 text-sm">{cliente.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Vendas */}
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-medium">Vendas ({vendas?.length || 0})</h3>
          </div>

          {vendasLoading ? (
            <Skeleton className="h-32 bg-white/5" />
          ) : vendas && vendas.length > 0 ? (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Data</TableHead>
                    <TableHead className="text-white/50">Valor</TableHead>
                    <TableHead className="text-white/50">Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda) => (
                    <TableRow key={venda.id} className="border-white/10 hover:bg-white/5 cursor-pointer"
                      onClick={() => navigate(`/vendas/minhas-vendas/editar/${venda.id}`)}>
                      <TableCell className="text-white/80">
                        {venda.data_venda ? format(new Date(venda.data_venda), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {formatCurrency(venda.valor_venda || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                          {venda.forma_pagamento || '-'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-white/40 text-center py-8">Nenhuma venda registrada para este cliente.</p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Editar Cliente</DialogTitle>
            <DialogDescription className="text-white/60">Atualize os dados do cliente</DialogDescription>
          </DialogHeader>
          <div className="
            [&_label]:text-white/80
            [&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_input]:placeholder:text-white/40
            [&_input:focus]:border-blue-500/50 [&_input:focus]:ring-blue-500/20
            [&_textarea]:bg-white/5 [&_textarea]:border-white/10 [&_textarea]:text-white [&_textarea]:placeholder:text-white/40
            [&_textarea:focus]:border-blue-500/50 [&_textarea:focus]:ring-blue-500/20
            [&_button[role=combobox]]:bg-white/5 [&_button[role=combobox]]:border-white/10 [&_button[role=combobox]]:text-white
            [&_button[role=combobox]:hover]:bg-white/10
            [&_[data-placeholder]]:text-white/40
            [&_.text-destructive]:text-red-400
            [&_.text-muted-foreground]:text-white/50
            [&_[data-state=checked]]:bg-blue-600 [&_[data-state=checked]]:border-blue-600
          ">
            <ClienteForm
              cliente={cliente as any}
              onSubmit={handleUpdate}
              isLoading={isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </MinimalistLayout>
  );
}
