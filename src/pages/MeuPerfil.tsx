import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AvatarUpload } from "@/components/AvatarUpload";
import { ArrowLeft, Mail, Shield, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SETOR_LABELS } from "@/utils/setorMapping";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";

export default function MeuPerfil() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  if (!user || !userRole) return null;

  const handleAvatarUpdate = (url: string | null) => {
    // Force re-render by reloading
    window.location.reload();
  };

  const setorLabel = userRole.setor ? SETOR_LABELS[userRole.setor] || userRole.setor : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <FloatingProfileMenu />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-white/60 hover:text-white hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-2xl font-bold mb-8">Meu Perfil</h1>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <AvatarUpload
              userId={user.id}
              currentAvatarUrl={userRole.foto_perfil_url}
              userName={userRole.nome}
              onAvatarUpdate={handleAvatarUpdate}
            />
          </div>

          {/* Info */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Nome</p>
              <p className="text-lg font-medium">{userRole.nome}</p>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-white/40" />
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm">{userRole.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/40" />
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Cargo</p>
                <p className="text-sm capitalize">{userRole.role.replace(/_/g, ' ')}</p>
              </div>
            </div>

            {setorLabel && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Setor</p>
                  <p className="text-sm">{setorLabel}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
