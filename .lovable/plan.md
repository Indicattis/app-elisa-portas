
# Plano: Adicionar Conferencia do Almoxarifado

## Resumo

Adicionar o botao "Conferencia do Almoxarifado" em `/producao/home` ao lado do botao de conferencia de estoque, com navegacao para `/producao/conferencia-almox`. O sistema sera uma copia da conferencia de estoque, mas conferindo produtos da tabela `almoxarifado`.

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useConferenciaAlmoxarifado.ts` | Hook para gerenciar conferencia de produtos do almoxarifado |
| `src/pages/producao/ConferenciaAlmoxProducao.tsx` | Hub da conferencia do almoxarifado |
| `src/pages/producao/ConferenciaAlmoxExecucao.tsx` | Pagina de execucao da conferencia |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/ProducaoHome.tsx` | Adicionar botao "Conferencia do Almoxarifado" |
| `src/App.tsx` | Adicionar rotas `/producao/conferencia-almox` e `/producao/conferencia-almox/:id` |

## Detalhes Tecnicos

### 1. Hook useConferenciaAlmoxarifado

Copiar estrutura de `useConferenciaEstoque`, adaptando:

**Mapeamento de campos:**
```
almoxarifado.id -> produto_id
almoxarifado.nome -> nome_produto (para exibicao)
almoxarifado.quantidade_estoque -> quantidade
almoxarifado.unidade -> unidade
```

**Diferencial - Filtro por setor:**
```typescript
// Buscar conferencias em andamento do almoxarifado
const { data } = await supabase
  .from("estoque_conferencias")
  .select("*")
  .eq("conferido_por", userData.user.id)
  .eq("status", "em_andamento")
  .eq("setor", "almoxarifado") // Filtro por setor
  .order("created_at", { ascending: false });
```

**Iniciar conferencia com setor:**
```typescript
const { data: conferencia } = await supabase
  .from("estoque_conferencias")
  .insert({
    conferido_por: userData.user.id,
    status: "em_andamento",
    setor: "almoxarifado", // Identificar como almoxarifado
    total_itens: count || 0,
    // ...
  })
  .select()
  .single();
```

**Buscar produtos do almoxarifado:**
```typescript
const { data: produtosData } = await supabase
  .from("almoxarifado")
  .select("id, nome, quantidade_estoque, unidade")
  .eq("ativo", true);
```

**Atualizar estoque do almoxarifado ao concluir:**
```typescript
await supabase
  .from("almoxarifado")
  .update({ quantidade_estoque: item.quantidade_conferida })
  .eq("id", item.produto_id);
```

### 2. ProducaoHome.tsx - Adicionar Botao

Modificar a secao "Conferencia" para incluir dois cards lado a lado:

```typescript
{/* Secao Conferencia */}
<div className="space-y-3">
  <h2 className="text-xl font-semibold">Conferencia</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
    {/* Card Estoque (existente) */}
    <Card
      className="cursor-pointer hover:shadow-md..."
      onClick={() => navigate('/producao/conferencia-estoque')}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-md bg-primary/10...">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium text-sm">Estoque da Fabrica</span>
        </div>
      </div>
    </Card>
    
    {/* Card Almoxarifado (NOVO) */}
    <Card
      className="cursor-pointer hover:shadow-md..."
      onClick={() => navigate('/producao/conferencia-almox')}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-md bg-primary/10...">
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium text-sm">Almoxarifado</span>
        </div>
      </div>
    </Card>
  </div>
</div>
```

### 3. ConferenciaAlmoxProducao.tsx

Componente simples que usa um Hub generico com props especificas:

```typescript
import ConferenciaHubAlmox from "@/pages/estoque/ConferenciaHubAlmox";

export default function ConferenciaAlmoxProducao() {
  return (
    <ConferenciaHubAlmox 
      returnPath="/producao/home" 
      executionBasePath="/producao/conferencia-almox"
    />
  );
}
```

### 4. ConferenciaHubAlmox.tsx

Copiar `ConferenciaHub.tsx` alterando:
- Importar `useConferenciaAlmoxarifado` ao inves de `useConferenciaEstoque`
- Titulo: "Conferencia do Almoxarifado"
- Descricao: "Gerencie e execute conferencias do almoxarifado"

### 5. ConferenciaExecucaoAlmox.tsx

Copiar `ConferenciaExecucao.tsx` alterando:
- Importar `useConferenciaAlmoxarifado`
- Navegacao ao concluir: `/direcao/estoque/auditoria/almoxarifado`

### 6. App.tsx - Novas Rotas

```typescript
import ConferenciaAlmoxProducao from "./pages/producao/ConferenciaAlmoxProducao";
import ConferenciaAlmoxExecucao from "./pages/producao/ConferenciaAlmoxExecucao";

// Dentro de /producao/*
<Route 
  path="/conferencia-almox" 
  element={
    <ProtectedProducaoRoute>
      <ProducaoLayout>
        <ConferenciaAlmoxProducao />
      </ProducaoLayout>
    </ProtectedProducaoRoute>
  } 
/>
<Route 
  path="/conferencia-almox/:id" 
  element={
    <ProtectedProducaoRoute>
      <ProducaoLayout>
        <ConferenciaAlmoxExecucao />
      </ProducaoLayout>
    </ProtectedProducaoRoute>
  } 
/>
```

## Estrutura de Navegacao

```text
/producao/home
├── [Estoque da Fabrica] -> /producao/conferencia-estoque
│   └── Execucao         -> /producao/conferencia-estoque/:id
└── [Almoxarifado] (NOVO) -> /producao/conferencia-almox
    └── Execucao         -> /producao/conferencia-almox/:id
```

## Tabelas Utilizadas

**Leitura de produtos:**
- `almoxarifado` (em vez de `estoque`)

**Conferencias (compartilhado):**
- `estoque_conferencias` com `setor = 'almoxarifado'`
- `estoque_conferencia_itens`

**Atualizacao ao concluir:**
- `almoxarifado.quantidade_estoque`

## Resultado Esperado

1. Em `/producao/home`, secao "Conferencia" mostra dois cards: "Estoque da Fabrica" e "Almoxarifado"
2. Clicar em "Almoxarifado" abre `/producao/conferencia-almox` com lista de conferencias do almoxarifado
3. Iniciar conferencia lista produtos da tabela `almoxarifado`
4. Conferencias do almoxarifado ficam separadas das da fabrica pelo campo `setor`
5. Ao concluir, atualiza `quantidade_estoque` na tabela `almoxarifado`
