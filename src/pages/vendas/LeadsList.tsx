import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Phone, MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';
import { FloatingProfileMenu } from '@/components/FloatingProfileMenu';
import { DelayedParticles } from '@/components/DelayedParticles';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cidade: string | null;
  novo_status: string | null;
  canal_aquisicao: string;
  data_envio: string;
  valor_orcamento: number | null;
}

const statusColors: Record<string, string> = {
  novo: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  em_atendimento: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  orcamento_enviado: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  venda_realizada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  perdido: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  em_atendimento: 'Em Atendimento',
  orcamento_enviado: 'Orçamento Enviado',
  venda_realizada: 'Venda Realizada',
  perdido: 'Perdido',
};

export default function LeadsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('elisaportas_leads')
        .select('id, nome, telefone, email, cidade, novo_status, canal_aquisicao, data_envio, valor_orcamento')
        .eq('atendente_id', user!.id)
        .order('data_envio', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const leadsFiltrados = leads.filter(lead =>
    lead.nome.toLowerCase().includes(busca.toLowerCase()) ||
    lead.telefone.includes(busca) ||
    (lead.cidade && lead.cidade.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden relative">
      <DelayedParticles />

      <AnimatedBreadcrumb
        items={[
          { label: 'Home', path: '/home' },
          { label: 'Vendas', path: '/vendas' },
          { label: 'Leads' },
        ]}
        mounted={mounted}
      />

      <FloatingProfileMenu mounted={mounted} />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/vendas')}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                   hover:bg-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms',
        }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      {/* Conteúdo */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-20 pb-10 px-4 md:px-8">
        {/* Header */}
        <div
          className="w-full max-w-3xl mb-6 flex items-center gap-3"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms',
          }}
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <UserPlus className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <Badge className="bg-white/10 text-white/70 border-white/10 ml-auto">
            {leadsFiltrados.length} {leadsFiltrados.length === 1 ? 'lead' : 'leads'}
          </Badge>
        </div>

        {/* Busca */}
        <div
          className="w-full max-w-3xl mb-4"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms',
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Buscar por nome, telefone ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="w-full max-w-3xl flex flex-col gap-3">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse"
              >
                <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            ))
          ) : leadsFiltrados.length === 0 ? (
            <div
              className="text-center py-16 text-white/40"
              style={{
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.5s ease 400ms',
              }}
            >
              <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">Nenhum lead encontrado</p>
            </div>
          ) : (
            leadsFiltrados.map((lead, index) => {
              const delay = 300 + index * 60;
              const status = lead.novo_status || 'novo';

              return (
                <div
                  key={lead.id}
                  className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                             hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{lead.nome}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-white/50">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {lead.telefone}
                        </span>
                        {lead.cidade && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {lead.cidade}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={`text-xs border ${statusColors[status] || 'bg-white/10 text-white/50 border-white/10'}`}
                    >
                      {statusLabels[status] || status}
                    </Badge>
                  </div>
                  {lead.valor_orcamento != null && lead.valor_orcamento > 0 && (
                    <p className="mt-2 text-sm text-blue-400 font-medium">
                      R$ {lead.valor_orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
