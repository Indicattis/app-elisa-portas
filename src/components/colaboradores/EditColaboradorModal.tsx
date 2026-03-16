import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Colaborador {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: string;
  setor: string | null;
  cpf: string | null;
  salario: number | null;
  foto_perfil_url: string | null;
  ativo: boolean;
  modalidade_pagamento: "mensal" | "diaria" | null;
  em_folha: boolean | null;
}

interface EditColaboradorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: Colaborador | null;
  systemRoles: { key: string; label: string }[];
}

export function EditColaboradorModal({ 
  open, 
  onOpenChange, 
  colaborador,
  systemRoles 
}: EditColaboradorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    role: "",
    setor: "",
    salario: "",
    modalidade_pagamento: "mensal" as "mensal" | "diaria",
    em_folha: true,
  });

  useEffect(() => {
    if (colaborador) {
      setFormData({
        nome: colaborador.nome || "",
        email: colaborador.email || "",
        cpf: colaborador.cpf || "",
        role: colaborador.role || "",
        setor: colaborador.setor || "",
        salario: colaborador.salario ? formatCurrencyInput(colaborador.salario) : "",
        modalidade_pagamento: colaborador.modalidade_pagamento || "mensal",
        em_folha: colaborador.em_folha ?? true,
      });
    }
  }, [colaborador]);

  const formatCurrencyInput = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSalarioChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue) {
      const formatted = (parseInt(numericValue) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setFormData(prev => ({ ...prev, salario: formatted }));
    } else {
      setFormData(prev => ({ ...prev, salario: "" }));
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!colaborador) return;
      
      const salarioNumerico = data.salario 
        ? parseFloat(data.salario.replace(/\./g, "").replace(",", ".")) 
        : null;

      const { error } = await supabase
        .from("admin_users")
        .update({
          nome: data.nome,
          cpf: data.cpf || null,
          role: data.role,
          setor: data.setor || null,
          salario: salarioNumerico,
          modalidade_pagamento: data.modalidade_pagamento,
          em_folha: data.em_folha,
        } as Record<string, unknown>)
        .eq("id", colaborador.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores-minimalista"] });
      toast({ title: "Colaborador atualizado com sucesso" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar colaborador" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Colaborador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {colaborador && (
            <div className="flex justify-center pb-4">
              <AvatarUpload
                userId={colaborador.user_id}
                currentAvatarUrl={colaborador.foto_perfil_url}
                userName={colaborador.nome}
                onAvatarUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: ["colaboradores-minimalista"] });
                }}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nome" className="text-xs">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="h-9"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="h-9 bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="cpf" className="text-xs">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                placeholder="000.000.000-00"
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="salario" className="text-xs">Salário/Valor</Label>
              <Input
                id="salario"
                value={formData.salario}
                onChange={(e) => handleSalarioChange(e.target.value)}
                placeholder="0,00"
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-xs">Função</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {systemRoles.map((role) => (
                    <SelectItem key={role.key} value={role.key}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="setor" className="text-xs">Setor</Label>
              <Select 
                value={formData.setor} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, setor: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="instalacoes">Instalações</SelectItem>
                  <SelectItem value="fabrica">Fábrica</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="modalidade" className="text-xs">Modalidade Pagamento</Label>
              <Select 
                value={formData.modalidade_pagamento} 
                onValueChange={(value: "mensal" | "diaria") => setFormData(prev => ({ ...prev, modalidade_pagamento: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="diaria">Diária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-5">
              <Label htmlFor="em_folha" className="text-xs">Em folha de pagamento</Label>
              <Switch
                id="em_folha"
                checked={formData.em_folha}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, em_folha: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
