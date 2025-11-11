import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SETOR_LABELS } from "@/utils/setorMapping";
import { INTERFACE_LABELS, InterfaceType } from "@/types/permissions";
import { toast } from "sonner";

export default function PermissoesInterface() {
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['setor-interfaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('setor_interfaces')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ setor, interface: iface, enabled }: {
      setor: string;
      interface: InterfaceType;
      enabled: boolean;
    }) => {
      if (enabled) {
        const { error } = await supabase
          .from('setor_interfaces')
          .insert({ 
            setor: setor as any,
            interface: iface as any
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('setor_interfaces')
          .delete()
          .eq('setor', setor as any)
          .eq('interface', iface as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setor-interfaces'] });
      toast.success('Permissão atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar permissão: ' + error.message);
    }
  });

  const isEnabled = (setor: string, iface: InterfaceType) => {
    return permissions?.some(
      p => p.setor === setor && p.interface === iface
    ) || false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controle de Acesso às Interfaces por Setor</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Define quais setores podem acessar cada interface do sistema
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Setor</TableHead>
                {Object.entries(INTERFACE_LABELS).map(([key, label]) => (
                  <TableHead key={key} className="text-center font-semibold">{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(SETOR_LABELS).map(([setorKey, setorLabel]) => (
                <TableRow key={setorKey}>
                  <TableCell className="font-medium">{setorLabel}</TableCell>
                  {Object.keys(INTERFACE_LABELS).map((ifaceKey) => (
                    <TableCell key={ifaceKey} className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={isEnabled(setorKey, ifaceKey as InterfaceType)}
                          onCheckedChange={(checked) => 
                            updateMutation.mutate({
                              setor: setorKey,
                              interface: ifaceKey as InterfaceType,
                              enabled: checked as boolean
                            })
                          }
                        />
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
