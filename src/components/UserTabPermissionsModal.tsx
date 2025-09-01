import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings } from "lucide-react";

interface Tab {
  id: string;
  key: string;
  label: string;
  href: string;
  permission: string | null;
  tab_group: string;
  sort_order: number;
  active: boolean;
  icon: string | null;
}

interface UserTabAccess {
  tab_id: string;
  user_id: string;
  can_access: boolean;
}

interface UserTabPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    user_id: string;
    nome: string;
    email: string;
  };
}

export function UserTabPermissionsModal({ open, onOpenChange, user }: UserTabPermissionsModalProps) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [userTabAccess, setUserTabAccess] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTabsAndPermissions();
    }
  }, [open, user.user_id]);

  const fetchTabsAndPermissions = async () => {
    setLoading(true);
    try {
      // Buscar todas as abas
      const { data: tabsData, error: tabsError } = await supabase
        .from('app_tabs')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (tabsError) throw tabsError;

      setTabs(tabsData || []);

      // Buscar permissões do usuário para essas abas
      const { data: accessData, error: accessError } = await supabase
        .from('user_tab_access')
        .select('*')
        .eq('user_id', user.user_id);

      if (accessError) {
        console.error('Erro ao buscar permissões:', accessError);
        // Se a view não existir ou der erro, criar mapa vazio
        setUserTabAccess(new Map());
      } else {
        const accessMap = new Map<string, boolean>();
        accessData?.forEach(access => {
          accessMap.set(access.tab_id, access.can_access);
        });
        setUserTabAccess(accessMap);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar permissões das abas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (tabId: string, canAccess: boolean) => {
    setUserTabAccess(prev => new Map(prev.set(tabId, canAccess)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Para cada aba, verificar se precisa inserir/atualizar permissão
      for (const tab of tabs) {
        const canAccess = userTabAccess.get(tab.id) ?? true; // Default true para novas abas

        // Verificar se já existe registro
        const { data: existing, error: checkError } = await supabase
          .from('user_tab_permissions')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('tab_id', tab.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = não encontrado, outros erros são problemas
          throw checkError;
        }

        if (existing) {
          // Atualizar registro existente
          const { error: updateError } = await supabase
            .from('user_tab_permissions')
            .update({ can_access: canAccess })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        } else {
          // Criar novo registro
          const { error: insertError } = await supabase
            .from('user_tab_permissions')
            .insert({
              user_id: user.user_id,
              tab_id: tab.id,
              can_access: canAccess
            });

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar permissões",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gerenciar Permissões de Abas
          </DialogTitle>
          <DialogDescription>
            Configure quais abas {user.nome} pode visualizar no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {tabs.map((tab) => (
                <div key={tab.id} className="flex items-center justify-between space-x-3">
                  <Label htmlFor={`tab-${tab.id}`} className="flex-1 text-sm font-medium">
                    {tab.label}
                  </Label>
                  <Switch
                    id={`tab-${tab.id}`}
                    checked={userTabAccess.get(tab.id) ?? true}
                    onCheckedChange={(checked) => handlePermissionToggle(tab.id, checked)}
                    disabled={saving}
                  />
                </div>
              ))}

              {tabs.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma aba encontrada
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}