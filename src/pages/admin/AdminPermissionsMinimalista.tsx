import { MinimalistLayout } from "@/components/MinimalistLayout";
import { UserRouteAccessManager } from "@/components/UserRouteAccessManager";

export default function AdminPermissionsMinimalista() {
  return (
    <MinimalistLayout
      title="Permissões"
      subtitle="Gerenciar permissões de acesso por usuário e rota"
      backPath="/admin"
    >
      <UserRouteAccessManager />
    </MinimalistLayout>
  );
}
