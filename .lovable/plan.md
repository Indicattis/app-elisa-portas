

# Nova Funcionalidade: Multas

## Resumo

Criar um novo botao "Multas" no hub Administrativo e uma pagina completa para cadastro e listagem de multas. Cada multa sera vinculada a um usuario (colaborador), com valor e data de vencimento.

## 1. Criar tabela no banco de dados

Nova tabela `multas`:

```sql
CREATE TABLE public.multas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.multas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage multas"
  ON public.multas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

## 2. Adicionar botao no AdministrativoHub

Arquivo: `src/pages/administrativo/AdministrativoHub.tsx`

- Importar icone `AlertTriangle` do lucide-react
- Adicionar item ao array `menuItems`:
  ```
  { label: "Multas", icon: AlertTriangle, path: "/administrativo/multas", ativo: true }
  ```

## 3. Criar pagina MultasMinimalista

Arquivo: `src/pages/administrativo/MultasMinimalista.tsx`

Seguindo o padrao existente (ex: CobrancasMinimalista), a pagina tera:

- **Layout**: Usar `MinimalistLayout` com breadcrumb (Home > Administrativo > Multas)
- **Listagem**: Cards mostrando nome do usuario, valor formatado em BRL, data de vencimento, status (pendente/paga/vencida), descricao
- **Busca**: Campo de pesquisa por nome do usuario
- **Cadastro**: Dialog/modal com formulario contendo:
  - Select de usuario (busca da tabela `admin_users`)
  - Campo de valor (numerico)
  - Datepicker para data de vencimento
  - Campo de descricao (opcional)
- **Acoes**: Botao para marcar como paga, editar e excluir
- **Indicadores visuais**: Badges de cor para status (vermelho = vencida, amarelo = vence hoje, azul = pendente, verde = paga)

## 4. Criar hook useMultas

Arquivo: `src/hooks/useMultas.ts`

- Query para listar multas com join no `admin_users` para pegar o nome
- Mutations para criar, atualizar status e excluir multas
- Invalidacao automatica do cache apos mutations

## 5. Adicionar rota no App.tsx

```
<Route path="/administrativo/multas" element={
  <ProtectedRoute routeKey="administrativo_hub">
    <MultasMinimalista />
  </ProtectedRoute>
} />
```

## Detalhes tecnicos

- Datas salvas com concatenacao de `T12:00:00.000Z` (padrao do projeto)
- Formatacao de moeda com `Intl.NumberFormat` em BRL
- Componentes: Dialog, Input, Button, Badge, Calendar (shadcn)
- Hook `useAllUsers` ja existente sera reutilizado para o select de usuarios
- Status possíveis: `pendente`, `paga`, `vencida` (vencida calculada no frontend pela data)

