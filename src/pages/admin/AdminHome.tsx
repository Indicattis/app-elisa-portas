import { UserRouteAccessManager } from "@/components/UserRouteAccessManager";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Permissões</h1>
        <p className="text-muted-foreground mt-2">
          Controle de acesso simplificado por usuário e rota. Administradores têm acesso total automaticamente.
        </p>
      </div>

      <UserRouteAccessManager />
    </div>
  );
}
