import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Search } from 'lucide-react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';
import { FloatingProfileMenu } from '@/components/FloatingProfileMenu';
import { DelayedParticles } from '@/components/DelayedParticles';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LeadKanbanColumn } from '@/components/vendas/LeadKanbanColumn';
import { LeadKanbanCard } from '@/components/vendas/LeadKanbanCard';
import { toast } from 'sonner';

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

const STATUSES = ['novo', 'em_atendimento', 'orcamento_enviado', 'venda_realizada', 'perdido'];

export default function LeadsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [busca, setBusca] = useState('');
  const [atendentesMap, setAtendentesMap] = useState<Record<string, string>>({});
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

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

  const groupedLeads = useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    STATUSES.forEach(s => { groups[s] = []; });
    filteredLeads.forEach(lead => {
      const status = lead.novo_status || 'novo';
      if (groups[status]) groups[status].push(lead);
      else groups.novo.push(lead);
    });
    return groups;
  }, [filteredLeads]);

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find(l => l.id === event.active.id);
    setActiveLead(lead || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;
    if (!STATUSES.includes(newStatus)) return;

    const lead = leads.find(l => l.id === leadId);
    if (!lead || (lead.novo_status || 'novo') === newStatus) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, novo_status: newStatus } : l));

    const { error } = await (supabase.from('elisaportas_leads') as any)
      .update({ novo_status: newStatus })
      .eq('id', leadId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao mover lead');
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, novo_status: lead.novo_status } : l));
    }
  };

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
      <div className="relative z-10 flex-1 flex flex-col pt-20 pb-4 px-4">
        {/* Header */}
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
            {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
          </Badge>

          {/* Busca */}
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

        {/* Kanban Board */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto flex-1 px-2">
            {STATUSES.map(s => (
              <div key={s} className="min-w-[260px] w-[260px] rounded-xl bg-white/[0.02] border border-white/10 animate-pulse">
                <div className="p-3"><div className="h-4 bg-white/10 rounded w-2/3" /></div>
                <div className="p-2 space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div
              className="flex gap-4 overflow-x-auto flex-1 px-2 pb-2"
              style={{
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.5s ease 300ms',
              }}
            >
              {STATUSES.map(status => (
                <LeadKanbanColumn
                  key={status}
                  status={status}
                  leads={groupedLeads[status]}
                  atendentesMap={atendentesMap}
                />
              ))}
            </div>

            <DragOverlay>
              {activeLead ? (
                <LeadKanbanCard
                  lead={activeLead}
                  atendenteName={activeLead.atendente_id ? atendentesMap[activeLead.atendente_id] || '...' : null}
                  isDragOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
