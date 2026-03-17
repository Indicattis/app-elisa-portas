

## Plano: Histórico de alterações de KM

### O que será feito
Criar um sistema que registra automaticamente toda alteração no campo `km_atual` do veículo, exibindo o histórico na página de conferências.

### 1. Criar tabela `veiculos_km_historico`

```sql
CREATE TABLE public.veiculos_km_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE CASCADE NOT NULL,
  km_anterior numeric NOT NULL,
  km_novo numeric NOT NULL,
  origem text NOT NULL DEFAULT 'manual', -- 'conferencia', 'troca_oleo', 'manual'
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.veiculos_km_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view km history"
  ON public.veiculos_km_historico FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert km history"
  ON public.veiculos_km_historico FOR INSERT TO authenticated WITH CHECK (true);
```

### 2. Trigger automático no banco

Criar trigger na tabela `veiculos` que registra automaticamente quando `km_atual` muda:

```sql
CREATE OR REPLACE FUNCTION public.log_km_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.km_atual IS DISTINCT FROM NEW.km_atual THEN
    INSERT INTO public.veiculos_km_historico (veiculo_id, km_anterior, km_novo, created_by)
    VALUES (NEW.id, COALESCE(OLD.km_atual, 0), NEW.km_atual, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_km_change
  AFTER UPDATE ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.log_km_change();
```

### 3. Hook `useVeiculoKmHistorico`

Novo hook em `src/hooks/useVeiculoKmHistorico.ts` que busca o histórico de KM por `veiculo_id`, ordenado por data descendente.

### 4. Exibir na página de conferências

Em `FrotaConferenciasHistoricoMinimalista.tsx`:
- Adicionar os registros de KM como um novo tipo na timeline unificada (junto com conferências e arquivos)
- Card com ícone de velocímetro, mostrando km anterior → km novo, data e origem
- Estilo consistente com os cards existentes (glassmorphism escuro)

### Arquivos envolvidos
- **Nova migration SQL** (tabela + trigger)
- **Novo**: `src/hooks/useVeiculoKmHistorico.ts`
- **Editar**: `src/pages/logistica/FrotaConferenciasHistoricoMinimalista.tsx` (adicionar tipo na timeline)

