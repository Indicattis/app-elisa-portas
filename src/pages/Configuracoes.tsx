import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CanaisAquisicaoManager } from "@/components/CanaisAquisicaoManager";
import InvestmentManager from "@/components/InvestmentManager";
import { Settings, Palette, Database, Users as UsersIcon, TrendingUp, Shield, Lock } from "lucide-react";
import { useState } from "react";
import Users from "@/pages/Users";
import { PermissionsTab } from "@/components/PermissionsTab";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { AppPermission } from "@/types/permissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Configuracoes() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTab, setSelectedTab] = useState("canais");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const { hasPermission } = useUserPermissions();

  // Definir as permissões necessárias para cada aba
  const tabPermissions: Record<string, AppPermission> = {
    canais: 'configuracoes',
    investimentos: 'marketing',
    aparencia: 'configuracoes',
    usuarios: 'users',
    permissoes: 'users',
    sistema: 'configuracoes'
  };

  const handleTabChange = (value: string) => {
    const requiredPermission = tabPermissions[value];
    if (requiredPermission && !hasPermission(requiredPermission)) {
      setShowPermissionModal(true);
      return;
    }
    setSelectedTab(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger 
            value="canais" 
            className={`flex items-center gap-2 ${!hasPermission('configuracoes') ? 'opacity-50' : ''}`}
          >
            <Database className="w-4 h-4" />
            {!hasPermission('configuracoes') && <Lock className="w-3 h-3" />}
            Canais de Aquisição
          </TabsTrigger>
          <TabsTrigger 
            value="investimentos" 
            className={`flex items-center gap-2 ${!hasPermission('marketing') ? 'opacity-50' : ''}`}
          >
            <TrendingUp className="w-4 h-4" />
            {!hasPermission('marketing') && <Lock className="w-3 h-3" />}
            Investimentos
          </TabsTrigger>
          <TabsTrigger 
            value="aparencia" 
            className={`flex items-center gap-2 ${!hasPermission('configuracoes') ? 'opacity-50' : ''}`}
          >
            <Palette className="w-4 h-4" />
            {!hasPermission('configuracoes') && <Lock className="w-3 h-3" />}
            Aparência
          </TabsTrigger>
          <TabsTrigger 
            value="usuarios" 
            className={`flex items-center gap-2 ${!hasPermission('users') ? 'opacity-50' : ''}`}
          >
            <UsersIcon className="w-4 h-4" />
            {!hasPermission('users') && <Lock className="w-3 h-3" />}
            Usuários
          </TabsTrigger>
          <TabsTrigger 
            value="permissoes" 
            className={`flex items-center gap-2 ${!hasPermission('users') ? 'opacity-50' : ''}`}
          >
            <Shield className="w-4 h-4" />
            {!hasPermission('users') && <Lock className="w-3 h-3" />}
            Permissões
          </TabsTrigger>
          <TabsTrigger 
            value="sistema" 
            className={`flex items-center gap-2 ${!hasPermission('configuracoes') ? 'opacity-50' : ''}`}
          >
            <Settings className="w-4 h-4" />
            {!hasPermission('configuracoes') && <Lock className="w-3 h-3" />}
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canais" className="space-y-6">
          <CanaisAquisicaoManager />
        </TabsContent>

        <TabsContent value="investimentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Investimentos</CardTitle>
              <div className="flex items-center gap-4">
                <label htmlFor="year-select" className="text-sm font-medium">
                  Ano:
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <InvestmentManager selectedYear={selectedYear} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Aparência</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações de tema e personalização visual em breve...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Users />
        </TabsContent>

        <TabsContent value="permissoes" className="space-y-6">
          <PermissionsTab />
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações gerais do sistema em breve...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showPermissionModal} onOpenChange={setShowPermissionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-destructive" />
              Sem Permissão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você não tem permissão para acessar esta seção. Entre em contato com um administrador se precisar de acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowPermissionModal(false)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}