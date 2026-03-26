import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Search, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';
import { FloatingProfileMenu } from '@/components/FloatingProfileMenu';
import { DelayedParticles } from '@/components/DelayedParticles';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { handleWhatsAppClick } from '@/utils/timeUtils';

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
  atendente_id: string | null;
}

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  em_atendimento: 'Em Atendimento',
  orcamento_enviado: 'Orçamento Enviado',
  venda_realizada: 'Venda Realizada',
  perdido: 'Perdido',
};

const statusColors: Record<string, string> = {
  novo: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  em_atendimento: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  orcamento_enviado: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  venda_realizada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  perdido: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function LeadsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [busca, setBusca] = useState('');
  const [atendentesMap, setAtendentesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('elisaportas_leads')
        .select('id, nome, telefone, email, cidade, novo_status, canal_aquisicao, data_envio, valor_orcamento, atendente_id')
        .order('data_envio', { ascending: false });

      if (error) throw error;
      setLeads(data || []);

      const atendenteIds = [...new Set((data || []).map(l => l.atendente_id).filter(Boolean))] as string[];
      if (atendenteIds.length > 0) {
        const { data: users } = await supabase
          .from('admin_users')
          .select('user_id, nome')
          .in('user_id', atendenteIds);
        const map: Record<string, string> = {};
        (users || []).forEach(u => { map[u.user_id] = u.nome; });
        setAtendentesMap(map);
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    if (!busca) return leads;
    const q = busca.toLowerCase();
    return leads.filter(l =>
      l.nome.toLowerCase().includes(q) ||
      l.telefone.includes(q) ||
      (l.cidade && l.cidade.toLowerCase().includes(q))
    );
  }, [leads, busca]);

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

      <div className="relative z-10 flex-1 flex flex-col pt-20 pb-4 px-4">
        <div
          className="w-full max-w-full mb-4 flex items-center gap-3 px-2"
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
          <Badge className="bg-white/10 text-white/70 border-white/10">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
          </Badge>

          <div className="ml-auto w-72">
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
        </div>

        <div
          className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.5s ease 300ms',
          }}
        >
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">Nome</TableHead>
                  <TableHead className="text-white/50">Telefone</TableHead>
                  <TableHead className="text-white/50">Cidade</TableHead>
                  <TableHead className="text-white/50">Canal</TableHead>
                  <TableHead className="text-white/50">Data</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                  <TableHead className="text-white/50">Valor</TableHead>
                  <TableHead className="text-white/50">Atendente</TableHead>
                  <TableHead className="text-white/50 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={9} className="text-center text-white/30 py-12">
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map(lead => {
                    const status = lead.novo_status || 'novo';
                    return (
                      <TableRow key={lead.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-medium">{lead.nome}</TableCell>
                        <TableCell className="text-white/70">{lead.telefone}</TableCell>
                        <TableCell className="text-white/70">{lead.cidade || '—'}</TableCell>
                        <TableCell className="text-white/70">{lead.canal_aquisicao}</TableCell>
                        <TableCell className="text-white/70">
                          {new Date(lead.data_envio).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColors[status] || statusColors.novo}`}>
                            {statusLabels[status] || status}
                          </span>
                        </TableCell>
                        <TableCell className="text-white/70">
                          {lead.valor_orcamento != null && lead.valor_orcamento > 0
                            ? `R$ ${lead.valor_orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-white/70">
                          {lead.atendente_id ? atendentesMap[lead.atendente_id] || '...' : '—'}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleWhatsAppClick(lead.telefone, lead.nome)}
                            className="p-1.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
