import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustoCategoria {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  ordem: number;
}

export interface CustoSubcategoria {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
}

export interface TipoCusto {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string | null;
  subcategoria_id: string | null;
  valor_maximo_mensal: number;
  tipo: 'fixa' | 'variavel';
  ativo: boolean;
  categoria?: CustoCategoria;
  subcategoria?: CustoSubcategoria;
}

export const useTiposCustos = () => {
  const [tiposCustos, setTiposCustos] = useState<TipoCusto[]>([]);
  const [categorias, setCategorias] = useState<CustoCategoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<CustoSubcategoria[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from("custos_categorias" as any)
      .select("*")
      .order("ordem", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar categorias");
      console.error(error);
      return;
    }
    setCategorias((data || []) as unknown as CustoCategoria[]);
  };

  const fetchSubcategorias = async () => {
    const { data, error } = await supabase
      .from("custos_subcategorias" as any)
      .select("*")
      .order("ordem", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar subcategorias");
      console.error(error);
      return;
    }
    setSubcategorias((data || []) as unknown as CustoSubcategoria[]);
  };

  const fetchTiposCustos = async () => {
    const { data, error } = await supabase
      .from("tipos_custos" as any)
      .select("*, categoria:custos_categorias(*), subcategoria:custos_subcategorias(*)")
      .order("nome", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar tipos de custos");
      console.error(error);
      return;
    }
    setTiposCustos((data || []) as unknown as TipoCusto[]);
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchCategorias(), fetchSubcategorias(), fetchTiposCustos()]);
    setLoading(false);
  };

  // Categorias CRUD
  const saveCategoria = async (data: Partial<CustoCategoria>) => {
    try {
      const { error } = await supabase
        .from("custos_categorias" as any)
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id || "",
        }] as any);
      if (error) throw error;
      toast.success("Categoria criada com sucesso!");
      await fetchCategorias();
      return true;
    } catch (error: any) {
      toast.error("Erro ao salvar categoria");
      console.error(error);
      return false;
    }
  };

  const updateCategoria = async (id: string, data: Partial<CustoCategoria>) => {
    try {
      const { error } = await supabase
        .from("custos_categorias" as any)
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Categoria atualizada!");
      await fetchCategorias();
      return true;
    } catch (error: any) {
      toast.error("Erro ao atualizar categoria");
      console.error(error);
      return false;
    }
  };

  const deleteCategoria = async (id: string) => {
    try {
      const { error } = await supabase
        .from("custos_categorias" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Categoria excluída!");
      await fetchCategorias();
      return true;
    } catch (error: any) {
      toast.error("Erro ao excluir categoria");
      console.error(error);
      return false;
    }
  };

  // Subcategorias CRUD
  const saveSubcategoria = async (data: Partial<CustoSubcategoria>) => {
    try {
      const { error } = await supabase
        .from("custos_subcategorias" as any)
        .insert([data] as any);
      if (error) throw error;
      toast.success("Subcategoria criada com sucesso!");
      await fetchSubcategorias();
      return true;
    } catch (error: any) {
      toast.error("Erro ao salvar subcategoria");
      console.error(error);
      return false;
    }
  };

  const updateSubcategoria = async (id: string, data: Partial<CustoSubcategoria>) => {
    try {
      const { error } = await supabase
        .from("custos_subcategorias" as any)
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Subcategoria atualizada!");
      await fetchSubcategorias();
      return true;
    } catch (error: any) {
      toast.error("Erro ao atualizar subcategoria");
      console.error(error);
      return false;
    }
  };

  const deleteSubcategoria = async (id: string) => {
    try {
      const { error } = await supabase
        .from("custos_subcategorias" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Subcategoria excluída!");
      await fetchSubcategorias();
      return true;
    } catch (error: any) {
      toast.error("Erro ao excluir subcategoria");
      console.error(error);
      return false;
    }
  };

  // Tipos de Custos CRUD
  const saveTipoCusto = async (data: Partial<TipoCusto>) => {
    try {
      const { error } = await supabase
        .from("tipos_custos" as any)
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id || "",
        }] as any);
      if (error) throw error;
      toast.success("Tipo de custo criado com sucesso!");
      await fetchTiposCustos();
      return true;
    } catch (error: any) {
      toast.error("Erro ao salvar tipo de custo");
      console.error(error);
      return false;
    }
  };

  const updateTipoCusto = async (id: string, data: Partial<TipoCusto>) => {
    try {
      const { error } = await supabase
        .from("tipos_custos" as any)
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Tipo de custo atualizado!");
      await fetchTiposCustos();
      return true;
    } catch (error: any) {
      toast.error("Erro ao atualizar tipo de custo");
      console.error(error);
      return false;
    }
  };

  const deleteTipoCusto = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tipos_custos" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Tipo de custo excluído!");
      await fetchTiposCustos();
      return true;
    } catch (error: any) {
      toast.error("Erro ao excluir tipo de custo");
      console.error(error);
      return false;
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    tiposCustos,
    categorias,
    subcategorias,
    loading,
    refetch: fetchAll,
    // Categorias
    saveCategoria,
    updateCategoria,
    deleteCategoria,
    // Subcategorias
    saveSubcategoria,
    updateSubcategoria,
    deleteSubcategoria,
    // Tipos de Custos
    saveTipoCusto,
    updateTipoCusto,
    deleteTipoCusto,
  };
};
