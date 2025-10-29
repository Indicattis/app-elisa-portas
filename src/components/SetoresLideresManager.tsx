import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSetoresLideres } from "@/hooks/useSetoresLideres";
import { SETOR_LABELS } from "@/utils/setorMapping";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserCog, X } from "lucide-react";
import { useState } from "react";

export function SetoresLideresManager() {
  const { lideres, isLoading, atribuirLider, removerLider } = useSetoresLideres();
  const [setorSelecionado, setSetorSelecionado] = useState<string>('');
  const [liderSelecionado, setLiderSelecionado] = useState<string>('');

  // Buscar todos os usuários ativos
  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-ativos-todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, nome, email, role, foto_perfil_url')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const setores = Object.keys(SETOR_LABELS);

  const handleAtribuir = () => {
    if (!setorSelecionado || !liderSelecionado) return;
    atribuirLider.mutate({ setor: setorSelecionado, lider_id: liderSelecionado });
    setSetorSelecionado('');
    setLiderSelecionado('');
  };

  if (isLoading) {
    return <div className="animate-pulse">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-primary" />
          <CardTitle>Líderes de Setor</CardTitle>
        </div>
        <CardDescription>
          Atribua responsáveis para cada setor. Eles serão exibidos no Checklist Liderança.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário de Atribuição */}
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <h3 className="font-semibold text-sm">Atribuir Novo Líder</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Setor</label>
              <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map((setor) => (
                    <SelectItem key={setor} value={setor}>
                      {SETOR_LABELS[setor as keyof typeof SETOR_LABELS]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Líder</label>
              <Select value={liderSelecionado} onValueChange={setLiderSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o líder" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.user_id} value={usuario.user_id}>
                      {usuario.nome} - {usuario.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleAtribuir} 
            disabled={!setorSelecionado || !liderSelecionado || atribuirLider.isPending}
            className="w-full"
          >
            Atribuir Líder
          </Button>
        </div>

        {/* Lista de Líderes Atuais */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Líderes Atuais</h3>
          <div className="grid gap-3">
            {setores.map((setor) => {
              const liderAtribuido = lideres.find(l => l.setor === setor);
              
              return (
                <div key={setor} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <Badge variant="outline">{SETOR_LABELS[setor as keyof typeof SETOR_LABELS]}</Badge>
                    </div>

                    {liderAtribuido?.lider ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={liderAtribuido.lider.foto_perfil_url || undefined} />
                          <AvatarFallback>
                            {liderAtribuido.lider.nome.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{liderAtribuido.lider.nome}</p>
                          <p className="text-xs text-muted-foreground">{liderAtribuido.lider.email}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Atribuído
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Usando gerente padrão
                      </p>
                    )}
                  </div>

                  {liderAtribuido && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removerLider.mutate(setor)}
                      disabled={removerLider.isPending}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>ℹ️ Como funciona:</strong> Ao atribuir um líder manualmente, ele será exibido no Checklist Liderança do setor. 
            Se não houver atribuição, o sistema automaticamente mostra o primeiro gerente ativo do setor.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
