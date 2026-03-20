import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { MinimalistLayout } from '@/components/MinimalistLayout';

interface Pedido {
  id: string;
  cliente: string;
  estado: string;
  cidade: string;
  valor_pago: number;
  portas_p: number;
  portas_g: number;
  portas_gg: number;
  descricao: string | null;
  created_at: string;
}

export default function PedidosPagosSemEntrega() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    cliente: '',
    estado: '',
    cidade: '',
    valor_pago: '',
    portas_p: 0,
    portas_g: 0,
    portas_gg: 0,
    descricao: '',
  });

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-pagos-sem-entrega'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_pagos_sem_entrega' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Pedido[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from as any)('pedidos_pagos_sem_entrega').insert({
        cliente: form.cliente.trim(),
        estado: form.estado.trim(),
        cidade: form.cidade.trim(),
        valor_pago: parseFloat(form.valor_pago) || 0,
        portas_p: form.portas_p,
        portas_g: form.portas_g,
        portas_gg: form.portas_gg,
        descricao: form.descricao.trim() || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-pagos-sem-entrega'] });
      toast({ title: 'Pedido cadastrado com sucesso' });
      setOpen(false);
      setForm({ cliente: '', estado: '', cidade: '', valor_pago: '', portas_p: 0, portas_g: 0, portas_gg: 0, descricao: '' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao cadastrar pedido' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)('pedidos_pagos_sem_entrega').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-pagos-sem-entrega'] });
      toast({ title: 'Pedido excluído' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao excluir' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente.trim() || !form.estado.trim() || !form.cidade.trim()) {
      toast({ variant: 'destructive', title: 'Preencha cliente, estado e cidade' });
      return;
    }
    createMutation.mutate();
  };

  return (
    <MinimalistLayout
      title="Pedidos Pagos sem Data de Entrega"
      subtitle="Pedidos pagos aguardando data de entrega"
      backPath="/logistica"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Logística', path: '/logistica' },
        { label: 'Pedidos sem Entrega' },
      ]}
      headerActions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />Novo Cadastro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-black/90 border-white/10 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-white">Novo Pedido</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70">Cliente *</label>
                <Input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} maxLength={200} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-white/70">Estado *</label>
                  <Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} maxLength={2} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70">Cidade *</label>
                  <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} maxLength={100} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">Valor Pago (R$)</label>
                <Input type="number" step="0.01" min="0" value={form.valor_pago} onChange={e => setForm(f => ({ ...f, valor_pago: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-white/70">Portas P</label>
                  <Input type="number" min="0" value={form.portas_p} onChange={e => setForm(f => ({ ...f, portas_p: parseInt(e.target.value) || 0 }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70">Portas G</label>
                  <Input type="number" min="0" value={form.portas_g} onChange={e => setForm(f => ({ ...f, portas_g: parseInt(e.target.value) || 0 }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70">Portas GG</label>
                  <Input type="number" min="0" value={form.portas_gg} onChange={e => setForm(f => ({ ...f, portas_gg: parseInt(e.target.value) || 0 }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">Descrição</label>
                <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} maxLength={500} rows={3} className="bg-white/5 border-white/10 text-white" />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white border-0" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-12 text-white/50">Nenhum pedido cadastrado.</div>
      ) : (
        <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/70">Cliente</TableHead>
                <TableHead className="text-white/70">Local</TableHead>
                <TableHead className="text-white/70">Valor</TableHead>
                <TableHead className="text-center text-white/70">P</TableHead>
                <TableHead className="text-center text-white/70">G</TableHead>
                <TableHead className="text-center text-white/70">GG</TableHead>
                <TableHead className="text-white/70">Descrição</TableHead>
                <TableHead className="text-white/70">Data</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map(p => (
                <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white/90">{p.cliente}</TableCell>
                  <TableCell className="text-white/70">{p.cidade}/{p.estado}</TableCell>
                  <TableCell className="text-white/90">{formatCurrency(Number(p.valor_pago))}</TableCell>
                  <TableCell className="text-center text-white/70">{p.portas_p}</TableCell>
                  <TableCell className="text-center text-white/70">{p.portas_g}</TableCell>
                  <TableCell className="text-center text-white/70">{p.portas_gg}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-white/60">{p.descricao || '-'}</TableCell>
                  <TableCell className="text-white/60">{new Date(p.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} className="hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </MinimalistLayout>
  );
}
