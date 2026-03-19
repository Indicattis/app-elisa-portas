import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

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
  const navigate = useNavigate();
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
      return (data || []) as Pedido[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pedidos_pagos_sem_entrega').insert({
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
      const { error } = await supabase.from('pedidos_pagos_sem_entrega').delete().eq('id', id);
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate('/logistica')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Pedidos Pagos sem Data de Entrega</h1>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Cadastro</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Pedido</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cliente *</label>
                  <Input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} maxLength={200} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Estado *</label>
                    <Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} maxLength={2} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cidade *</label>
                    <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} maxLength={100} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Pago (R$)</label>
                  <Input type="number" step="0.01" min="0" value={form.valor_pago} onChange={e => setForm(f => ({ ...f, valor_pago: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Portas P</label>
                    <Input type="number" min="0" value={form.portas_p} onChange={e => setForm(f => ({ ...f, portas_p: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Portas G</label>
                    <Input type="number" min="0" value={form.portas_g} onChange={e => setForm(f => ({ ...f, portas_g: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Portas GG</label>
                    <Input type="number" min="0" value={form.portas_gg} onChange={e => setForm(f => ({ ...f, portas_gg: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} maxLength={500} rows={3} />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum pedido cadastrado.</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">G</TableHead>
                  <TableHead className="text-center">GG</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.cliente}</TableCell>
                    <TableCell>{p.cidade}/{p.estado}</TableCell>
                    <TableCell>{formatCurrency(Number(p.valor_pago))}</TableCell>
                    <TableCell className="text-center">{p.portas_p}</TableCell>
                    <TableCell className="text-center">{p.portas_g}</TableCell>
                    <TableCell className="text-center">{p.portas_gg}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.descricao || '-'}</TableCell>
                    <TableCell>{new Date(p.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
