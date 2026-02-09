
# Botao de criacao, cidades secundarias e coluna na listagem

## Resumo

1. Adicionar botao "Novo Autorizado" no header de `/direcao/autorizados` que redireciona para `/direcao/autorizados/novo`.
2. Criar nova pagina `/direcao/autorizados/novo` -- copia adaptada de `ParceiroNovo.tsx` com tipo fixo "autorizado" e navegacao ajustada para `/direcao/autorizados`.
3. Criar tabela `autorizado_cidades_secundarias` no banco para armazenar cidades secundarias de cada autorizado.
4. Adicionar secao de cidades secundarias no formulario de criacao (multi-select de cidades).
5. Buscar cidades secundarias no hook `useEstadosCidades` e exibi-las como coluna na listagem dentro de cada cidade/estado.

## Detalhes tecnicos

### 1. Botao no header

**Editar `src/pages/direcao/AutorizadosPrecosDirecao.tsx`**:
- No bloco do header (onde ja existe "Novo Estado"), adicionar um botao "Novo Autorizado" que faz `navigate('/direcao/autorizados/novo')`.
- Exibir ambos os botoes quando nenhum estado estiver selecionado.

### 2. Nova pagina de criacao

**Criar `src/pages/direcao/NovoAutorizadoDirecao.tsx`**:
- Copia de `ParceiroNovo.tsx` com ajustes:
  - Tipo fixo `autorizado` (sem parametro de URL).
  - Navegacao de volta para `/direcao/autorizados`.
  - Visual adaptado ao tema escuro da pagina de direcao (com `AnimatedBreadcrumb`).
  - Incluir secao de cidades secundarias (multi-select).

**Editar `src/App.tsx`**:
- Importar `NovoAutorizadoDirecao` e adicionar rota `/direcao/autorizados/novo` com `ProtectedRoute routeKey="direcao_hub"`.

### 3. Tabela de cidades secundarias

**Migration SQL**:
```sql
CREATE TABLE public.autorizado_cidades_secundarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizado_id uuid NOT NULL REFERENCES public.autorizados(id) ON DELETE CASCADE,
  cidade text NOT NULL,
  estado text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(autorizado_id, cidade, estado)
);

ALTER TABLE public.autorizado_cidades_secundarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cidades secundarias"
  ON public.autorizado_cidades_secundarias
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 4. Secao de cidades secundarias no formulario

Na nova pagina de criacao, apos os campos de cidade/estado principal, adicionar:
- Uma area onde o usuario pode adicionar multiplas cidades secundarias (estado + cidade).
- Cada entrada eh salva na tabela `autorizado_cidades_secundarias` apos a insercao do autorizado.
- Interface com botao "Adicionar cidade secundaria" que exibe selects de estado/cidade e permite remover entradas.

### 5. Coluna de cidades secundarias na listagem

**Editar `src/hooks/useEstadosCidades.ts`**:
- Na interface `AutorizadoResumo`, adicionar campo `cidadesSecundarias: string[]`.
- Em `fetchCidadesDoEstado`, buscar registros de `autorizado_cidades_secundarias` para os autorizados carregados e mapear as cidades no array.

**Editar `src/components/autorizados/CidadeCollapsible.tsx`**:
- Adicionar coluna "Cidades Sec." na tabela de autorizados.
- No `AutorizadoRow`, exibir as cidades secundarias como badges ou texto separado por virgula.
- Aplicar o mesmo na `OrfaosCollapsible`.

### Arquivos modificados

1. **SQL**: Criar tabela `autorizado_cidades_secundarias`
2. **Criar**: `src/pages/direcao/NovoAutorizadoDirecao.tsx`
3. **Editar**: `src/App.tsx` -- nova rota
4. **Editar**: `src/pages/direcao/AutorizadosPrecosDirecao.tsx` -- botao no header
5. **Editar**: `src/hooks/useEstadosCidades.ts` -- buscar cidades secundarias
6. **Editar**: `src/components/autorizados/CidadeCollapsible.tsx` -- coluna cidades secundarias
