import { useState } from 'react';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { useAllUsers } from '@/hooks/useAllUsers';
import { SETOR_LABELS, SETOR_ROLES } from '@/utils/setorMapping';
import { ROLE_LABELS } from '@/types/permissions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2 } from 'lucide-react';

const SETOR_KEYS = Object.keys(SETOR_LABELS);

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function GestaoColaboradoresDirecao() {
  const [selectedSetor, setSelectedSetor] = useState(SETOR_KEYS[0]);
  const { data: allUsers, isLoading } = useAllUsers();

  const rolesForSetor = SETOR_ROLES[selectedSetor] || [];
  
  // Filter users by sector roles
  const filteredUsers = (allUsers || []).filter(u => rolesForSetor.includes(u.role as any));

  // Group by role, maintaining hierarchy order from SETOR_ROLES
  const grouped = rolesForSetor
    .map(role => ({
      role,
      label: ROLE_LABELS[role] || role,
      users: filteredUsers.filter(u => u.role === role),
    }))
    .filter(g => g.users.length > 0);

  return (
    <MinimalistLayout
      title="Organograma RH"
      subtitle="Colaboradores por setor"
      backPath="/direcao"
      fullWidth
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Direção', path: '/direcao' },
        { label: 'Organograma RH' },
      ]}
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Mobile: horizontal chips */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {SETOR_KEYS.map(setor => (
            <button
              key={setor}
              onClick={() => setSelectedSetor(setor)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${selectedSetor === setor
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
            >
              {SETOR_LABELS[setor]}
            </button>
          ))}
        </div>

        {/* Desktop: sidebar */}
        <div className="hidden md:flex flex-col w-56 shrink-0">
          <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="flex flex-col gap-1 p-2">
              {SETOR_KEYS.map(setor => (
                <button
                  key={setor}
                  onClick={() => setSelectedSetor(setor)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${selectedSetor === setor
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {SETOR_LABELS[setor]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40">
              <Users className="w-10 h-10 mb-3" />
              <p className="text-sm">Nenhum colaborador neste setor</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(group => (
                <div key={group.role}>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-sm font-semibold text-white/80">{group.label}</h2>
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px]">
                      {group.users.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.users.map(user => (
                      <div
                        key={user.id}
                        className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/[0.08] transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <Avatar className="h-10 w-10 border border-white/10">
                            {user.foto_perfil_url ? (
                              <AvatarImage src={user.foto_perfil_url} alt={user.nome} />
                            ) : null}
                            <AvatarFallback className="bg-blue-600/20 text-blue-300 text-xs font-medium">
                              {getInitials(user.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{user.nome}</p>
                            <p className="text-xs text-white/40 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MinimalistLayout>
  );
}
