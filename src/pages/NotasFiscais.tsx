import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Package, List, Settings } from "lucide-react";
import { EmitirNfseForm } from "@/components/notas-fiscais/EmitirNfseForm";
import { EmitirNfeForm } from "@/components/notas-fiscais/EmitirNfeForm";
import { NotasFiscaisList } from "@/components/notas-fiscais/NotasFiscaisList";
import { ConfiguracoesFiscaisForm } from "@/components/notas-fiscais/ConfiguracoesFiscaisForm";

export default function NotasFiscais() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Emissão e gerenciamento de NF-e e NFS-e via NFe.io
          </p>
        </div>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lista" className="gap-2">
            <List className="w-4 h-4" />
            Minhas Notas
          </TabsTrigger>
          <TabsTrigger value="nfse" className="gap-2">
            <FileText className="w-4 h-4" />
            Emitir NFS-e
          </TabsTrigger>
          <TabsTrigger value="nfe" className="gap-2">
            <Package className="w-4 h-4" />
            Emitir NF-e
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4">
          <NotasFiscaisList />
        </TabsContent>

        <TabsContent value="nfse" className="mt-4">
          <EmitirNfseForm />
        </TabsContent>

        <TabsContent value="nfe" className="mt-4">
          <EmitirNfeForm />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <ConfiguracoesFiscaisForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
