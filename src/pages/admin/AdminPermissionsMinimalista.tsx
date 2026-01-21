import { MinimalistLayout } from "@/components/MinimalistLayout";
import { UserRouteAccessManager } from "@/components/UserRouteAccessManager";

export default function AdminPermissionsMinimalista() {
  return (
    <MinimalistLayout
      title="Permissões"
      subtitle="Gerenciar permissões de acesso por usuário e rota"
      backPath="/admin"
    >
      <div className="space-y-6">
        {/* Wrapper para aplicar tema escuro aos componentes internos */}
        <div className="[&_.card]:bg-primary/5 [&_.card]:border-primary/10 [&_.card]:backdrop-blur-xl [&_h3]:text-white [&_h4]:text-white [&_p]:text-white/60 [&_label]:text-white/80">
          <UserRouteAccessManager />
        </div>
      </div>
    </MinimalistLayout>
  );
}
