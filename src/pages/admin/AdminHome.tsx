import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings2, Lock } from "lucide-react";
import PermissoesSidebar from "./PermissoesSidebar";
import PermissoesInterface from "./PermissoesInterface";
import PermissoesCRUD from "./PermissoesCRUD";

export default function AdminHome() {
  return (
    <div className="container mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Administração do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie permissões em 3 níveis: Sidebar (Cargo) → Interface (Setor) → CRUD (Usuário)
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sidebar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sidebar" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Sidebar (Cargo)</span>
            <span className="sm:hidden">Sidebar</span>
          </TabsTrigger>
          <TabsTrigger value="interface" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Interfaces (Setor)</span>
            <span className="sm:hidden">Interfaces</span>
          </TabsTrigger>
          <TabsTrigger value="crud" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">CRUD (Usuário)</span>
            <span className="sm:hidden">CRUD</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sidebar" className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2">Camada 1: Permissões de Sidebar por Cargo</h3>
            <p className="text-sm text-muted-foreground">
              Define quais itens da sidebar cada cargo pode visualizar e acessar.
            </p>
          </div>
          <PermissoesSidebar />
        </TabsContent>

        <TabsContent value="interface" className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2">Camada 2: Acesso às Interfaces por Setor</h3>
            <p className="text-sm text-muted-foreground">
              Define quais setores podem acessar cada interface do sistema (Dashboard, Produção, Admin, etc).
            </p>
          </div>
          <PermissoesInterface />
        </TabsContent>

        <TabsContent value="crud" className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2">Camada 3: Permissões CRUD por Usuário</h3>
            <p className="text-sm text-muted-foreground">
              Configure permissões individuais de Criar, Ler, Atualizar e Excluir para cada usuário em recursos específicos.
            </p>
          </div>
          <PermissoesCRUD />
        </TabsContent>
      </Tabs>
    </div>
  );
}
