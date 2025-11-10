import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageMigration } from "@/components/StorageMigration";
import { Settings, Palette, Users as UsersIcon, Shield, UserCog, Users2 } from "lucide-react";
import { useState } from "react";
import Users from "@/pages/Users";
import { RolePermissionManager } from "@/components/RolePermissionManager";
import { RoleManager } from "@/components/RoleManager";
import { SetoresLideresManager } from "@/components/SetoresLideresManager";
import { ProducaoAuthManager } from "@/components/ProducaoAuthManager";
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
  const [selectedTab, setSelectedTab] = useState("aparencia");

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

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="aparencia" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="cargos" className="flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            Cargos
          </TabsTrigger>
          <TabsTrigger value="lideres" className="flex items-center gap-2">
            <Users2 className="w-4 h-4" />
            Líderes
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

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
          <ProducaoAuthManager />
        </TabsContent>

        <TabsContent value="permissoes" className="space-y-6">
          <RolePermissionManager />
        </TabsContent>

        <TabsContent value="cargos" className="space-y-6">
          <RoleManager />
        </TabsContent>

        <TabsContent value="lideres" className="space-y-6">
          <SetoresLideresManager />
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Configurações gerais do sistema em breve...
              </p>
            </CardContent>
          </Card>

          <StorageMigration />
        </TabsContent>
      </Tabs>
    </div>
  );
}