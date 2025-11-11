import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRouteAccessManager } from "@/components/UserRouteAccessManager";
import PermissoesCRUD from "./PermissoesCRUD";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Permissões</h1>
        <p className="text-muted-foreground mt-2">
          Controle de acesso simplificado por usuário e rota
        </p>
      </div>

      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="routes">
            Acesso às Rotas
          </TabsTrigger>
          <TabsTrigger value="crud">
            Permissões CRUD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Gerenciar Acesso às Rotas</h3>
            <p className="text-sm text-muted-foreground">
              Defina quais rotas cada usuário pode acessar no sistema. 
              Administradores têm acesso total automaticamente.
            </p>
          </div>
          <UserRouteAccessManager />
        </TabsContent>

        <TabsContent value="crud" className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Permissões CRUD por Usuário</h3>
            <p className="text-sm text-muted-foreground">
              Controle granular de operações Create, Read, Update, Delete para recursos específicos.
            </p>
          </div>
          <PermissoesCRUD />
        </TabsContent>
      </Tabs>
    </div>
  );
}
