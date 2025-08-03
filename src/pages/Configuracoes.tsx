import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CanaisAquisicaoManager } from "@/components/CanaisAquisicaoManager";
import { Settings, Palette, Database, Users } from "lucide-react";

export default function Configuracoes() {
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

      <Tabs defaultValue="canais" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="canais" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Canais de Aquisição
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canais" className="space-y-6">
          <CanaisAquisicaoManager />
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
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações avançadas de usuários em breve...
              </p>
            </CardContent>
          </Card>
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
    </div>
  );
}