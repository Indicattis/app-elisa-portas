import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Users, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function MeusClientes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busca, setBusca] = useState('');

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['meus-clientes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          id,
          nome,
          telefone,
          email,
          cidade,
          estado,
          created_at,
          cpf_cnpj
        `)
        .eq('created_by', user.id)
        .eq('ativo', true)
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const clientesFiltrados = clientes?.filter(cliente => 
    cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.cpf_cnpj?.includes(busca) ||
    cliente.telefone?.includes(busca)
  ) || [];

  return (
    <MinimalistLayout 
      title="Meus Clientes" 
      subtitle={`${clientesFiltrados.length} cliente${clientesFiltrados.length !== 1 ? 's' : ''}`}
      headerActions={
        <Button 
          onClick={() => navigate('/dashboard/clientes')}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      }
    >
      {/* Busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input 
          placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-white/5" />
          ))
        ) : clientesFiltrados.length > 0 ? (
          clientesFiltrados.map((cliente) => (
            <div
              key={cliente.id}
              onClick={() => navigate(`/dashboard/clientes`)}
              className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl
                         hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{cliente.nome}</h3>
                  {cliente.cpf_cnpj && (
                    <p className="text-xs text-white/50 font-mono">{cliente.cpf_cnpj}</p>
                  )}
                  
                  <div className="mt-2 space-y-1">
                    {cliente.telefone && (
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{cliente.telefone}</span>
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {(cliente.cidade || cliente.estado) && (
                    <p className="text-xs text-white/40 mt-2">
                      {[cliente.cidade, cliente.estado].filter(Boolean).join(' - ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">
              {busca ? 'Nenhum cliente encontrado' : 'Você ainda não tem clientes'}
            </p>
            <Button 
              onClick={() => navigate('/dashboard/clientes')}
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar cliente
            </Button>
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}
