
# Plano: Rota de Conferência para Produção

## Objetivo

Criar rota `/producao/conferencia-estoque/:id` para que, ao acessar uma conferência a partir da área de produção, o botão "Voltar" e "Pausar" retornem para `/producao/conferencia-estoque` em vez de `/estoque/conferencia`.

## Alterações Necessárias

### 1. Criar wrapper `ConferenciaExecucaoProducao.tsx`

Novo arquivo que passa o `returnPath` correto:

```tsx
// src/pages/producao/ConferenciaExecucaoProducao.tsx
import ConferenciaExecucao from "@/pages/estoque/ConferenciaExecucao";

export default function ConferenciaExecucaoProducao() {
  return <ConferenciaExecucao returnPath="/producao/conferencia-estoque" />;
}
```

### 2. Modificar `ConferenciaExecucao.tsx`

Adicionar prop `returnPath` com valor padrão `/estoque/conferencia`:

```tsx
interface ConferenciaExecucaoProps {
  returnPath?: string;
}

export default function ConferenciaExecucao({ 
  returnPath = "/estoque/conferencia" 
}: ConferenciaExecucaoProps) {
  // ...
  
  const handlePausar = async () => {
    // ...
    navigate(returnPath);  // Linha 170
  };
}
```

### 3. Modificar `ConferenciaHub.tsx`

Adicionar prop `executionBasePath` para navegação contextual:

```tsx
interface ConferenciaHubProps {
  returnPath?: string;
  executionBasePath?: string;  // Nova prop
}

export default function ConferenciaHub({ 
  returnPath = "/estoque", 
  executionBasePath = "/estoque/conferencia"  // Valor padrão
}: ConferenciaHubProps) {
  
  const handleIniciarNova = async () => {
    const conferencia = await iniciarConferencia();
    if (conferencia) {
      navigate(`${executionBasePath}/${conferencia.id}`);  // Usar base contextual
    }
  };

  const handleRetomar = (conferenciaId: string) => {
    navigate(`${executionBasePath}/${conferenciaId}`);  // Usar base contextual
  };
}
```

### 4. Atualizar `ConferenciaEstoqueProducao.tsx`

Passar a nova prop:

```tsx
export default function ConferenciaEstoqueProducao() {
  return (
    <ConferenciaHub 
      returnPath="/producao/home" 
      executionBasePath="/producao/conferencia-estoque"
    />
  );
}
```

### 5. Adicionar rota em `App.tsx`

```tsx
import ConferenciaExecucaoProducao from "./pages/producao/ConferenciaExecucaoProducao";

// Na seção de rotas:
<Route 
  path="/producao/conferencia-estoque/:id" 
  element={
    <ProtectedRoute routeKey="producao_hub">
      <ConferenciaExecucaoProducao />
    </ProtectedRoute>
  } 
/>
```

## Fluxo Resultante

| Origem | Hub | Execução | Voltar/Pausar |
|--------|-----|----------|---------------|
| Estoque | `/estoque/conferencia` | `/estoque/conferencia/:id` | → `/estoque/conferencia` |
| Produção | `/producao/conferencia-estoque` | `/producao/conferencia-estoque/:id` | → `/producao/conferencia-estoque` |

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/producao/ConferenciaExecucaoProducao.tsx` | **Criar** |
| `src/pages/estoque/ConferenciaExecucao.tsx` | Adicionar prop `returnPath` |
| `src/pages/estoque/ConferenciaHub.tsx` | Adicionar prop `executionBasePath` |
| `src/pages/producao/ConferenciaEstoqueProducao.tsx` | Passar `executionBasePath` |
| `src/App.tsx` | Adicionar rota `/producao/conferencia-estoque/:id` |
